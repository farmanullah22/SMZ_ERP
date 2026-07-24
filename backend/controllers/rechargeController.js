const { Recharge, addHistory } = require('../database/db');

const getAll = async (req, res) => {
  try {
    const { search, network, startDate, endDate } = req.query;
    const filter = {};
    if (startDate) filter.recharge_date = { ...filter.recharge_date, $gte: new Date(startDate) };
    if (endDate) filter.recharge_date = { ...filter.recharge_date, $lte: new Date(endDate) };
    if (network) filter.network = network;
    if (search) {
      filter.$or = [
        { mobile_number: { $regex: search, $options: 'i' } },
        { customer_name: { $regex: search, $options: 'i' } }
      ];
    }
    const items = await Recharge.find(filter).sort('-recharge_date');
    res.json(items.map(i => i.toJSON()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { network, mobile_number, amount, commission, profit, customer_name, description } = req.body;
    if (!network || !mobile_number || amount === undefined) {
      return res.status(400).json({ error: 'Network, mobile number, and amount are required' });
    }
    const parsedAmount = parseFloat(amount);
    const parsedCommission = parseFloat(commission || 0);
    const parsedProfit = profit !== undefined ? parseFloat(profit) : parsedCommission;
    const item = await Recharge.create({
      network, mobile_number, amount: parsedAmount,
      commission: parsedCommission, profit: parsedProfit,
      customer_name, description
    });
    addHistory('CREATE', 'recharge', item.id, `Recharge ${network}: ${mobile_number} - ${parsedAmount}`);
    res.status(201).json(item.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteRecharge = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Recharge.findById(id);
    if (!existing) return res.status(404).json({ error: 'Recharge not found' });
    await Recharge.findByIdAndDelete(id);
    res.json({ message: 'Recharge deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};
    if (startDate) filter.recharge_date = { ...filter.recharge_date, $gte: new Date(startDate) };
    if (endDate) filter.recharge_date = { ...filter.recharge_date, $lte: new Date(endDate) };
    const items = await Recharge.find(filter);
    const totalAmount = items.reduce((s, i) => s + i.amount, 0);
    const totalCommission = items.reduce((s, i) => s + (i.commission || 0), 0);
    const totalProfit = items.reduce((s, i) => s + (i.profit || 0), 0);
    const byNetwork = {};
    items.forEach(i => { byNetwork[i.network] = (byNetwork[i.network] || 0) + i.amount; });
    res.json({ totalAmount, totalCommission, totalProfit, count: items.length, byNetwork });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAll, create, deleteRecharge, getStats };
