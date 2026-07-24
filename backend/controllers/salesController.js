const mongoose = require('mongoose');
const { Sale, SaleItem, Product, Customer, CashAccount, Transaction, addHistory } = require('../database/db');

const generateInvoiceNumber = () => {
  const date = new Date();
  const prefix = `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${random}`;
};

const getAllSales = async (req, res) => {
  try {
    const { startDate, endDate, customer, search } = req.query;
    const match = {};
    if (startDate) match.created_at = { ...match.created_at, $gte: new Date(startDate) };
    if (endDate) match.created_at = { ...match.created_at, $lte: new Date(endDate) };
    if (customer && customer !== 'all') match.customer = new mongoose.Types.ObjectId(customer);
    if (search) {
      match.$or = [
        { invoice_number: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } }
      ];
    }
    const sales = await Sale.aggregate([
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer'
        }
      },
      { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
      { $match: match },
      {
        $lookup: {
          from: 'saleitems',
          localField: '_id',
          foreignField: 'sale',
          as: 'items'
        }
      },
      {
        $addFields: {
          items_count: { $size: '$items' },
          customer_name: '$customer.name'
        }
      },
      { $project: { items: 0, customer: 0, __v: 0 } },
      { $sort: { created_at: -1 } }
    ]);
    const result = sales.map(s => {
      const { _id, ...rest } = s;
      return { id: _id.toString(), ...rest };
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).populate('customer', 'name phone');
    if (!sale) return res.status(404).json({ error: 'Sale not found' });
    const items = await SaleItem.find({ sale: sale._id });
    res.json({
      ...sale.toJSON(),
      customer_name: sale.customer?.name || null,
      customer_phone: sale.customer?.phone || null,
      items
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createSale = async (req, res) => {
  try {
    const { customer_id, items, payment_method = 'cash' } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ error: 'No items in sale' });

    const invoiceNumber = generateInvoiceNumber();
    let subtotal = 0;
    let totalProfit = 0;
    const processedItems = [];
    const productUpdates = [];

    for (const item of items) {
      const product = await Product.findById(item.product_id);
      if (!product) return res.status(400).json({ error: `Product ${item.product_id} not found` });
      if (product.quantity < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}. Available: ${product.quantity}` });
      }

      const itemSubtotal = item.quantity * item.sale_price;
      const itemProfit = (item.sale_price - product.cost_price) * item.quantity;
      subtotal += itemSubtotal;
      totalProfit += itemProfit;

      processedItems.push({
        product: product._id,
        product_name: product.name,
        quantity: item.quantity,
        cost_price: product.cost_price,
        sale_price: item.sale_price,
        subtotal: itemSubtotal,
        profit: itemProfit
      });

      productUpdates.push(
        Product.findByIdAndUpdate(product._id, { $inc: { quantity: -item.quantity } })
      );
    }

    const sale = await Sale.create({
      invoice_number: invoiceNumber,
      customer: customer_id || null,
      subtotal,
      total_amount: subtotal,
      total_profit: totalProfit,
      payment_method
    });

    const saleId = sale._id;
    for (const item of processedItems) {
      await SaleItem.create({ sale: saleId, ...item });
    }

    await Promise.all(productUpdates);

    if (customer_id) {
      await Customer.findByIdAndUpdate(customer_id, {
        $inc: { total_purchases: 1, total_spent: subtotal }
      });
    }

    await CashAccount.findByIdAndUpdate('000000000000000000000000', { $inc: { current_balance: subtotal } });
    const cashAccount = await CashAccount.findOne({});
    if (cashAccount) {
      await CashAccount.findByIdAndUpdate(cashAccount._id, { $inc: { current_balance: subtotal } });
    }

    await Transaction.create({
      type: 'credit', category: 'sale', account_type: 'cash',
      account_id: cashAccount?._id || null, amount: subtotal,
      description: `Sale Invoice: ${invoiceNumber}`,
      reference_id: saleId, reference_type: 'sale'
    });

    addHistory('CREATE', 'sale', saleId, `Created sale: ${invoiceNumber} - PKR ${subtotal.toLocaleString()}`);

    const saleItems = await SaleItem.find({ sale: saleId });
    res.status(201).json({ ...sale.toJSON(), items: saleItems });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteSale = async (req, res) => {
  try {
    const { id } = req.params;
    const sale = await Sale.findById(id);
    if (!sale) return res.status(404).json({ error: 'Sale not found' });

    const items = await SaleItem.find({ sale: sale._id });

    for (const item of items) {
      if (item.product) {
        await Product.findByIdAndUpdate(item.product, { $inc: { quantity: item.quantity } });
      }
    }

    if (sale.customer) {
      await Customer.findByIdAndUpdate(sale.customer, {
        $inc: { total_purchases: -1, total_spent: -sale.total_amount }
      });
    }

    const cashAccount = await CashAccount.findOne({});
    if (cashAccount) {
      await CashAccount.findByIdAndUpdate(cashAccount._id, { $inc: { current_balance: -sale.total_amount } });
    }

    await Transaction.deleteMany({ reference_id: sale._id, reference_type: 'sale' });
    await SaleItem.deleteMany({ sale: sale._id });
    await Sale.findByIdAndDelete(id);

    addHistory('DELETE', 'sale', id, `Deleted sale: ${sale.invoice_number}`);
    res.json({ message: 'Sale deleted and stock restored' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getSalesStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const dateFilter = {};
    if (startDate) dateFilter.created_at = { ...dateFilter.created_at, $gte: new Date(startDate) };
    if (endDate) dateFilter.created_at = { ...dateFilter.created_at, $lte: new Date(endDate) };

    const hasDateRange = startDate || endDate;

    const totalSales = await Sale.aggregate(
      hasDateRange ? [{ $match: dateFilter }, { $group: { _id: null, total: { $sum: '$total_amount' } } }]
                   : [{ $group: { _id: null, total: { $sum: '$total_amount' } } }]
    );
    const totalProfit = await Sale.aggregate(
      hasDateRange ? [{ $match: dateFilter }, { $group: { _id: null, total: { $sum: '$total_profit' } } }]
                   : [{ $group: { _id: null, total: { $sum: '$total_profit' } } }]
    );
    const todaySales = await Sale.aggregate([
      { $match: { created_at: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$total_amount' }, profit: { $sum: '$total_profit' } } }
    ]);
    const monthSales = await Sale.aggregate([
      { $match: { created_at: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$total_amount' }, profit: { $sum: '$total_profit' } } }
    ]);
    const totalExpenses = await mongoose.model('Purchase').aggregate(
      hasDateRange ? [{ $match: dateFilter }, { $group: { _id: null, total: { $sum: '$total_amount' } } }]
                   : [{ $group: { _id: null, total: { $sum: '$total_amount' } } }]
    );
    const inventoryValue = await Product.aggregate([
      { $group: { _id: null, total: { $sum: { $multiply: ['$quantity', '$cost_price'] } } } }
    ]);
    const productCount = await Product.countDocuments();
    const lowStockCount = await Product.countDocuments({ $expr: { $lte: ['$quantity', '$reorder_level'] } });

    res.json({
      totalSales: totalSales[0]?.total || 0,
      totalProfit: totalProfit[0]?.total || 0,
      todaySales: todaySales[0]?.total || 0,
      todayProfit: todaySales[0]?.profit || 0,
      monthSales: monthSales[0]?.total || 0,
      monthProfit: monthSales[0]?.profit || 0,
      totalExpenses: totalExpenses[0]?.total || 0,
      inventoryValue: inventoryValue[0]?.total || 0,
      productCount,
      lowStockCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMonthlySalesData = async (req, res) => {
  try {
    const { period = 'monthly', months = 12 } = req.query;
    const numMonths = parseInt(months);
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - numMonths);

    let groupFormat;
    switch (period) {
      case 'daily':
        groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } };
        break;
      case 'weekly':
        groupFormat = { $dateToString: { format: '%Y-W%V', date: '$created_at' } };
        break;
      default:
        groupFormat = { $dateToString: { format: '%Y-%m', date: '$created_at' } };
    }

    const data = await Sale.aggregate([
      { $match: { created_at: { $gte: startDate } } },
      {
        $group: {
          _id: groupFormat,
          total_sales: { $sum: '$total_amount' },
          total_profit: { $sum: '$total_profit' },
          order_count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { period: '$_id', total_sales: 1, total_profit: 1, order_count: 1, _id: 0 } }
    ]);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAllSales, getSale, createSale, deleteSale, getSalesStats, getMonthlySalesData };
