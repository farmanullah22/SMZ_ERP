const { StampPaper, addHistory } = require('../database/db');

const getStampPapers = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};
    if (search) filter.name = { $regex: search, $options: 'i' };
    const items = await StampPaper.find(filter).sort('name');
    res.json(items.map(i => i.toJSON()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createStampPaper = async (req, res) => {
  try {
    const { name, price, profit } = req.body;
    if (!name || name.trim() === '') return res.status(400).json({ error: 'Stamp paper name is required' });
    if (price === undefined || price === null || price === '') return res.status(400).json({ error: 'Price is required' });

    const parsedPrice = parseFloat(price);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) return res.status(400).json({ error: 'Price must be a valid number' });

    const parsedProfit = profit === undefined || profit === null || profit === '' ? null : parseFloat(profit);
    if (parsedProfit !== null && (Number.isNaN(parsedProfit) || parsedProfit < 0)) {
      return res.status(400).json({ error: 'Profit must be a valid number' });
    }

    const item = await StampPaper.create({ name: name.trim(), price: parsedPrice, profit: parsedProfit });
    addHistory('CREATE', 'stamp_paper', item.id, `Created stamp paper: ${name.trim()}`);
    res.status(201).json(item.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateStampPaper = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await StampPaper.findById(id);
    if (!existing) return res.status(404).json({ error: 'Stamp paper not found' });

    const { name, price, profit } = req.body;
    const nextName = name !== undefined && name !== null && name !== '' ? name.trim() : existing.name;
    const nextPrice = price !== undefined && price !== null && price !== '' ? parseFloat(price) : existing.price;
    const nextProfit = profit === undefined ? existing.profit : (profit === null || profit === '' ? null : parseFloat(profit));

    if (!nextName) return res.status(400).json({ error: 'Stamp paper name is required' });
    if (Number.isNaN(nextPrice) || nextPrice < 0) return res.status(400).json({ error: 'Price must be a valid number' });
    if (nextProfit !== null && (Number.isNaN(nextProfit) || nextProfit < 0)) {
      return res.status(400).json({ error: 'Profit must be a valid number' });
    }

    await StampPaper.findByIdAndUpdate(id, { name: nextName, price: nextPrice, profit: nextProfit });
    addHistory('UPDATE', 'stamp_paper', id, `Updated stamp paper: ${nextName}`);
    const updated = await StampPaper.findById(id);
    res.json(updated.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteStampPaper = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await StampPaper.findById(id);
    if (!existing) return res.status(404).json({ error: 'Stamp paper not found' });
    await StampPaper.findByIdAndDelete(id);
    addHistory('DELETE', 'stamp_paper', id, `Deleted stamp paper: ${existing.name}`);
    res.json({ message: 'Stamp paper deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getStampPapers, createStampPaper, updateStampPaper, deleteStampPaper };
