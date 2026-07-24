const { Credit, addHistory } = require('../database/db');

const getAll = async (req, res) => {
  try {
    const { search, status, startDate, endDate } = req.query;
    const filter = {};
    if (startDate) filter.created_at = { ...filter.created_at, $gte: new Date(startDate) };
    if (endDate) filter.created_at = { ...filter.created_at, $lte: new Date(endDate) };
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { customer_name: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }
    const items = await Credit.find(filter).sort('-created_at');
    res.json(items.map(i => i.toJSON()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { customer, customer_name, mobile, total_amount, paid_amount, due_date, notes } = req.body;
    if (!customer_name || total_amount === undefined) {
      return res.status(400).json({ error: 'Customer name and total amount are required' });
    }
    const paid = parseFloat(paid_amount || 0);
    const total = parseFloat(total_amount);
    let status = 'active';
    if (paid >= total) status = 'paid';
    else if (paid > 0) status = 'partial';
    const item = await Credit.create({
      customer: customer || null, customer_name, mobile,
      total_amount: total, paid_amount: paid,
      due_date: due_date || null, status, notes
    });
    addHistory('CREATE', 'credit', item.id, `Created credit: ${customer_name} - ${total}`);
    res.status(201).json(item.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const addPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Credit.findById(id);
    if (!existing) return res.status(404).json({ error: 'Credit not found' });
    const { amount, method, notes } = req.body;
    if (!amount || parseFloat(amount) <= 0) return res.status(400).json({ error: 'Valid amount required' });
    const payment = { amount: parseFloat(amount), method: method || 'cash', notes, date: new Date() };
    existing.payments.push(payment);
    existing.paid_amount = (existing.paid_amount || 0) + parseFloat(amount);
    existing.status = existing.paid_amount >= existing.total_amount ? 'paid' : 'partial';
    await existing.save();
    addHistory('UPDATE', 'credit', id, `Payment received: ${amount} from ${existing.customer_name}`);
    res.json(existing.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateCredit = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Credit.findById(id);
    if (!existing) return res.status(404).json({ error: 'Credit not found' });
    const update = {};
    ['customer_name', 'mobile', 'total_amount', 'due_date', 'status', 'notes'].forEach(k => {
      if (req.body[k] !== undefined) update[k] = req.body[k];
    });
    await Credit.findByIdAndUpdate(id, update);
    addHistory('UPDATE', 'credit', id, `Updated credit: ${existing.customer_name}`);
    const updated = await Credit.findById(id);
    res.json(updated.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteCredit = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Credit.findById(id);
    if (!existing) return res.status(404).json({ error: 'Credit not found' });
    await Credit.findByIdAndDelete(id);
    res.json({ message: 'Credit deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getStats = async (req, res) => {
  try {
    const items = await Credit.find();
    const totalDue = items.reduce((s, i) => s + (i.total_amount - i.paid_amount), 0);
    const totalCredit = items.reduce((s, i) => s + i.total_amount, 0);
    const totalPaid = items.reduce((s, i) => s + i.paid_amount, 0);
    const active = items.filter(i => i.status === 'active' || i.status === 'partial' || i.status === 'overdue').length;
    res.json({ totalDue, totalCredit, totalPaid, activeCount: active, totalCount: items.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAll, create, addPayment, updateCredit, deleteCredit, getStats };
