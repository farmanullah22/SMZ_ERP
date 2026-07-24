const { MobileTransaction, addHistory } = require('../database/db');

const getAll = async (req, res) => {
  try {
    const { search, type, provider, startDate, endDate } = req.query;
    const filter = {};
    if (startDate) filter.transaction_date = { ...filter.transaction_date, $gte: new Date(startDate) };
    if (endDate) filter.transaction_date = { ...filter.transaction_date, $lte: new Date(endDate) };
    if (type) filter.type = type;
    if (provider) filter.provider = provider;
    if (search) {
      filter.$or = [
        { customer_name: { $regex: search, $options: 'i' } },
        { mobile_number: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    const items = await MobileTransaction.find(filter).sort('-transaction_date');
    res.json(items.map(i => i.toJSON()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { type, provider, customer_name, mobile_number, cnic, amount, commission, fee, description } = req.body;
    if (!type || !provider || amount === undefined) {
      return res.status(400).json({ error: 'Type, provider, and amount are required' });
    }
    const parsedAmount = parseFloat(amount);
    const parsedCommission = parseFloat(commission || 0);
    const parsedFee = parseFloat(fee || 0);
    const item = await MobileTransaction.create({
      type, provider, customer_name, mobile_number, cnic,
      amount: parsedAmount,
      commission: parsedCommission,
      net_amount: type === 'cash_out' ? parsedAmount - parsedCommission - parsedFee : parsedAmount,
      fee: parsedFee,
      description
    });
    addHistory('CREATE', 'mobile_transaction', item.id, `Created ${type} (${provider}): ${parsedAmount}`);
    res.status(201).json(item.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await MobileTransaction.findById(id);
    if (!existing) return res.status(404).json({ error: 'Transaction not found' });
    await MobileTransaction.findByIdAndDelete(id);
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};
    if (startDate) filter.transaction_date = { ...filter.transaction_date, $gte: new Date(startDate) };
    if (endDate) filter.transaction_date = { ...filter.transaction_date, $lte: new Date(endDate) };
    const items = await MobileTransaction.find(filter);
    const cashIn = items.filter(i => i.type === 'cash_in').reduce((s, i) => s + i.amount, 0);
    const cashOut = items.filter(i => i.type === 'cash_out').reduce((s, i) => s + i.amount, 0);
    const commission = items.reduce((s, i) => s + (i.commission || 0), 0);
    res.json({ cashIn, cashOut, commission, count: items.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAll, create, deleteTransaction, getStats };
