const mongoose = require('mongoose');
const { Purchase, PurchaseItem, Product, CashAccount, Transaction, addHistory } = require('../database/db');

const generateReferenceNumber = () => {
  const date = new Date();
  const prefix = `PUR-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${random}`;
};

const getAllPurchases = async (req, res) => {
  try {
    const { startDate, endDate, supplier, search } = req.query;
    const match = {};
    if (startDate) match.created_at = { ...match.created_at, $gte: new Date(startDate) };
    if (endDate) match.created_at = { ...match.created_at, $lte: new Date(endDate) };
    if (supplier && supplier !== 'all') match.supplier = new mongoose.Types.ObjectId(supplier);
    if (search) {
      match.$or = [
        { reference_number: { $regex: search, $options: 'i' } },
        { 'supplier.company_name': { $regex: search, $options: 'i' } }
      ];
    }
    const purchases = await Purchase.aggregate([
      {
        $lookup: {
          from: 'suppliers',
          localField: 'supplier',
          foreignField: '_id',
          as: 'supplier'
        }
      },
      { $unwind: { path: '$supplier', preserveNullAndEmptyArrays: true } },
      { $match: match },
      {
        $lookup: {
          from: 'purchaseitems',
          localField: '_id',
          foreignField: 'purchase',
          as: 'items'
        }
      },
      {
        $addFields: {
          items_count: { $size: '$items' },
          supplier_name: '$supplier.company_name'
        }
      },
      { $project: { items: 0, supplier: 0, __v: 0 } },
      { $sort: { created_at: -1 } }
    ]);
    const result = purchases.map(p => {
      const { _id, ...rest } = p;
      return { id: _id.toString(), ...rest };
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id).populate('supplier', 'company_name contact_person phone');
    if (!purchase) return res.status(404).json({ error: 'Purchase not found' });
    const items = await PurchaseItem.find({ purchase: purchase._id });
    res.json({
      ...purchase.toJSON(),
      supplier_name: purchase.supplier?.company_name || null,
      contact_person: purchase.supplier?.contact_person || null,
      phone: purchase.supplier?.phone || null,
      items
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createPurchase = async (req, res) => {
  try {
    const { supplier_id, items, notes, payment_method = 'cash' } = req.body;
    if (!supplier_id) return res.status(400).json({ error: 'Supplier is required' });
    if (!items || items.length === 0) return res.status(400).json({ error: 'No items in purchase' });

    const referenceNumber = generateReferenceNumber();
    let totalAmount = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product_id);
      let productName = item.product_name || 'Unknown';

      if (product) {
        productName = product.name;
        product.quantity += item.quantity;
        product.cost_price = item.cost_price;
        await product.save();
      }

      const subtotal = item.quantity * item.cost_price;
      totalAmount += subtotal;

      processedItems.push({
        product: item.product_id || null,
        product_name: productName,
        quantity: item.quantity,
        cost_price: item.cost_price,
        subtotal
      });
    }

    const purchase = await Purchase.create({
      reference_number: referenceNumber,
      supplier: supplier_id,
      total_amount: totalAmount,
      notes
    });

    const purchaseId = purchase._id;
    for (const item of processedItems) {
      await PurchaseItem.create({ purchase: purchaseId, ...item });
    }

    if (payment_method === 'cash') {
      const cashAccount = await CashAccount.findOne({});
      if (cashAccount) {
        await CashAccount.findByIdAndUpdate(cashAccount._id, { $inc: { current_balance: -totalAmount } });
        await Transaction.create({
          type: 'debit', category: 'purchase', account_type: 'cash',
          account_id: cashAccount._id, amount: totalAmount,
          description: `Purchase: ${referenceNumber}`,
          reference_id: purchaseId, reference_type: 'purchase'
        });
      }
    }

    addHistory('CREATE', 'purchase', purchaseId, `Created purchase: ${referenceNumber} - PKR ${totalAmount.toLocaleString()}`);

    const purchaseItems = await PurchaseItem.find({ purchase: purchaseId });
    res.status(201).json({ ...purchase.toJSON(), items: purchaseItems });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deletePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const purchase = await Purchase.findById(id);
    if (!purchase) return res.status(404).json({ error: 'Purchase not found' });

    const items = await PurchaseItem.find({ purchase: purchase._id });

    for (const item of items) {
      if (item.product) {
        await Product.findByIdAndUpdate(item.product, { $inc: { quantity: -item.quantity } });
      }
    }

    const cashAccount = await CashAccount.findOne({});
    if (cashAccount) {
      await CashAccount.findByIdAndUpdate(cashAccount._id, { $inc: { current_balance: purchase.total_amount } });
    }

    await Transaction.deleteMany({ reference_id: purchase._id, reference_type: 'purchase' });
    await PurchaseItem.deleteMany({ purchase: purchase._id });
    await Purchase.findByIdAndDelete(id);

    addHistory('DELETE', 'purchase', id, `Deleted purchase: ${purchase.reference_number}`);
    res.json({ message: 'Purchase deleted and stock adjusted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPurchaseStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const total = await Purchase.aggregate([{ $group: { _id: null, total: { $sum: '$total_amount' } } }]);
    const todayTotal = await Purchase.aggregate([
      { $match: { created_at: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$total_amount' } } }
    ]);
    const monthTotal = await Purchase.aggregate([
      { $match: { created_at: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$total_amount' } } }
    ]);

    res.json({
      totalPurchases: total[0]?.total || 0,
      todayPurchases: todayTotal[0]?.total || 0,
      monthPurchases: monthTotal[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAllPurchases, getPurchase, createPurchase, deletePurchase, getPurchaseStats };
