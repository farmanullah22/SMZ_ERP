const { Sale, Purchase, Product, Customer, Supplier, Transaction, History, CashAccount, BankAccount } = require('../database/db');

const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const today = new Date().toISOString().split('T')[0];
    const filter = {};
    if (startDate && endDate) {
      filter.created_at = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (startDate) {
      filter.created_at = { $gte: new Date(startDate) };
    } else if (endDate) {
      filter.created_at = { $lte: new Date(endDate) };
    }

    const sales = await Sale.find(filter).populate('customer', 'name').sort({ created_at: -1 });
    const result = sales.map(s => ({
      ...s.toJSON(),
      customer_name: s.customer?.name || null
    }));

    const summary = await Sale.aggregate([
      { $match: filter },
      { $group: { _id: null, total_orders: { $sum: 1 }, total_sales: { $sum: '$total_amount' }, total_profit: { $sum: '$total_profit' } } }
    ]);

    res.json({
      sales: result,
      summary: summary[0] || { total_orders: 0, total_sales: 0, total_profit: 0 },
      period: { startDate: startDate || 'all', endDate: endDate || today }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getProfitLossReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const today = new Date().toISOString().split('T')[0];
    const filter = {};
    if (startDate && endDate) {
      filter.created_at = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const salesData = await Sale.aggregate([
      { $match: filter },
      { $group: { _id: null, total_revenue: { $sum: '$total_amount' }, gross_profit: { $sum: '$total_profit' } } }
    ]);

    const purchasesData = await Purchase.aggregate([
      { $match: filter },
      { $group: { _id: null, total_expenses: { $sum: '$total_amount' } } }
    ]);

    const totalRevenue = salesData[0]?.total_revenue || 0;
    const grossProfit = salesData[0]?.gross_profit || 0;
    const totalExpenses = purchasesData[0]?.total_expenses || 0;

    res.json({
      totalRevenue,
      grossProfit,
      totalExpenses,
      netProfit: grossProfit - totalExpenses,
      period: { startDate: startDate || 'all', endDate: endDate || today }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getInventoryReport = async (req, res) => {
  try {
    const products = await Product.find({}).populate('category', 'name').populate('supplier', 'company_name').sort('name');
    const result = products.map(p => ({
      ...p.toJSON(),
      category_name: p.category?.name || null,
      supplier_name: p.supplier?.company_name || null
    }));

    const summary = {
      totalProducts: result.length,
      totalQuantity: result.reduce((sum, p) => sum + p.quantity, 0),
      totalValue: result.reduce((sum, p) => sum + (p.quantity * p.cost_price), 0),
      totalRetail: result.reduce((sum, p) => sum + (p.quantity * p.sale_price), 0),
      lowStockCount: result.filter(p => p.quantity <= p.reorder_level).length,
      outOfStockCount: result.filter(p => p.quantity === 0).length
    };

    res.json({ products: result, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCustomerReport = async (req, res) => {
  try {
    const customers = await Customer.aggregate([
      {
        $lookup: {
          from: 'sales',
          localField: '_id',
          foreignField: 'customer',
          as: 'sales'
        }
      },
      {
        $addFields: {
          purchase_count: { $size: '$sales' },
          total_spent: { $sum: '$sales.total_amount' }
        }
      },
      { $project: { sales: 0 } },
      { $sort: { total_spent: -1 } }
    ]);

    const result = customers.map(c => {
      const { _id, __v, ...rest } = c;
      return { id: _id.toString(), ...rest };
    });

    const summary = {
      totalCustomers: result.length,
      totalRevenue: result.reduce((sum, c) => sum + (c.total_spent || 0), 0)
    };

    res.json({ customers: result, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getSupplierReport = async (req, res) => {
  try {
    const suppliers = await Supplier.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'supplier',
          as: 'products'
        }
      },
      {
        $lookup: {
          from: 'purchases',
          localField: '_id',
          foreignField: 'supplier',
          as: 'purchases'
        }
      },
      {
        $addFields: {
          product_count: { $size: '$products' },
          purchase_count: { $size: '$purchases' },
          total_purchased: { $sum: '$purchases.total_amount' }
        }
      },
      { $project: { products: 0, purchases: 0 } },
      { $sort: { total_purchased: -1 } }
    ]);

    const result = suppliers.map(s => {
      const { _id, __v, ...rest } = s;
      return { id: _id.toString(), ...rest };
    });

    const summary = {
      totalSuppliers: result.length,
      totalPurchased: result.reduce((sum, s) => sum + (s.total_purchased || 0), 0)
    };

    res.json({ suppliers: result, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPurchaseReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const today = new Date().toISOString().split('T')[0];
    const filter = {};
    if (startDate && endDate) {
      filter.created_at = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const purchases = await Purchase.find(filter).populate('supplier', 'company_name').sort({ created_at: -1 });
    const result = purchases.map(p => ({
      ...p.toJSON(),
      supplier_name: p.supplier?.company_name || null
    }));

    const summary = await Purchase.aggregate([
      { $match: filter },
      { $group: { _id: null, total_orders: { $sum: 1 }, total_amount: { $sum: '$total_amount' } } }
    ]);

    res.json({
      purchases: result,
      summary: summary[0] || { total_orders: 0, total_amount: 0 },
      period: { startDate: startDate || 'all', endDate: endDate || today }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAccountsReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const today = new Date().toISOString().split('T')[0];
    const filter = {};
    if (startDate && endDate) {
      filter.created_at = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (startDate) {
      filter.created_at = { $gte: new Date(startDate) };
    } else if (endDate) {
      filter.created_at = { $lte: new Date(endDate) };
    }

    const transactions = await Transaction.find(filter).sort({ created_at: -1 });

    const enriched = await Promise.all(transactions.map(async (t) => {
      let account_name = 'Account';
      if (t.account_type === 'cash') {
        const ca = await CashAccount.findById(t.account_id);
        if (ca) account_name = ca.name;
      } else if (t.account_type === 'bank') {
        const ba = await BankAccount.findById(t.account_id);
        if (ba) account_name = ba.name;
      }
      return { ...t.toJSON(), account_name };
    }));

    const summary = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total_transactions: { $sum: 1 },
          total_credit: { $sum: { $cond: [{ $eq: ['$type', 'credit'] }, '$amount', 0] } },
          total_debit: { $sum: { $cond: [{ $eq: ['$type', 'debit'] }, '$amount', 0] } },
          total_transfer: { $sum: { $cond: [{ $eq: ['$type', 'transfer'] }, '$amount', 0] } },
          total_profit: { $sum: { $cond: [{ $ifNull: ['$profit', false] }, '$profit', 0] } }
        }
      }
    ]);

    res.json({
      transactions: enriched,
      summary: summary[0] || { total_transactions: 0, total_credit: 0, total_debit: 0, total_transfer: 0, total_profit: 0 },
      period: { startDate: startDate || 'all', endDate: endDate || today }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getHistory = async (req, res) => {
  try {
    const { limit = 200, offset = 0, search, startDate, endDate } = req.query;
    const filter = {};
    if (startDate) filter.created_at = { ...filter.created_at, $gte: new Date(startDate) };
    if (endDate) filter.created_at = { ...filter.created_at, $lte: new Date(endDate) };
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { action_type: { $regex: search, $options: 'i' } },
        { entity_type: { $regex: search, $options: 'i' } }
      ];
    }
    const [history, total] = await Promise.all([
      History.find(filter).sort({ created_at: -1 }).skip(parseInt(offset)).limit(parseInt(limit)),
      History.countDocuments(filter)
    ]);
    res.json({ history: history.map(h => h.toJSON()), total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getSalesReport, getProfitLossReport, getInventoryReport, getCustomerReport, getSupplierReport, getPurchaseReport, getAccountsReport, getHistory };
