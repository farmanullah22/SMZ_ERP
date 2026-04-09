const db = require('../database/db');

const getStampPapers = (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM stamp_papers WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND name LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY name ASC';
    const items = db.all(query, params);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createStampPaper = (req, res) => {
  try {
    const { name, price, profit } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Stamp paper name is required' });
    }

    if (price === undefined || price === null || price === '') {
      return res.status(400).json({ error: 'Price is required' });
    }

    const parsedPrice = parseFloat(price);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ error: 'Price must be a valid number' });
    }

    const parsedProfit = profit === undefined || profit === null || profit === ''
      ? null
      : parseFloat(profit);

    if (parsedProfit !== null && (Number.isNaN(parsedProfit) || parsedProfit < 0)) {
      return res.status(400).json({ error: 'Profit must be a valid number' });
    }

    const result = db.run(
      'INSERT INTO stamp_papers (name, price, profit) VALUES (?, ?, ?)',
      [name.trim(), parsedPrice, parsedProfit]
    );

    addHistory('CREATE', 'stamp_paper', result.lastInsertRowid, `Created stamp paper: ${name.trim()}`);

    const item = db.get('SELECT * FROM stamp_papers WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateStampPaper = (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.get('SELECT * FROM stamp_papers WHERE id = ?', [parseInt(id)]);

    if (!existing) {
      return res.status(404).json({ error: 'Stamp paper not found' });
    }

    const { name, price, profit } = req.body;

    const nextName = name !== undefined && name !== null && name !== '' ? name.trim() : existing.name;
    const nextPrice = price !== undefined && price !== null && price !== '' ? parseFloat(price) : existing.price;
    const nextProfit = profit === undefined
      ? existing.profit
      : (profit === null || profit === '' ? null : parseFloat(profit));

    if (!nextName) {
      return res.status(400).json({ error: 'Stamp paper name is required' });
    }

    if (Number.isNaN(nextPrice) || nextPrice < 0) {
      return res.status(400).json({ error: 'Price must be a valid number' });
    }

    if (nextProfit !== null && (Number.isNaN(nextProfit) || nextProfit < 0)) {
      return res.status(400).json({ error: 'Profit must be a valid number' });
    }

    db.run(
      `UPDATE stamp_papers
       SET name = ?,
           price = ?,
           profit = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [nextName, nextPrice, nextProfit, parseInt(id)]
    );

    addHistory('UPDATE', 'stamp_paper', parseInt(id), `Updated stamp paper: ${nextName}`);
    res.json(db.get('SELECT * FROM stamp_papers WHERE id = ?', [parseInt(id)]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteStampPaper = (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.get('SELECT * FROM stamp_papers WHERE id = ?', [parseInt(id)]);

    if (!existing) {
      return res.status(404).json({ error: 'Stamp paper not found' });
    }

    db.run('DELETE FROM stamp_papers WHERE id = ?', [parseInt(id)]);
    addHistory('DELETE', 'stamp_paper', parseInt(id), `Deleted stamp paper: ${existing.name}`);

    res.json({ message: 'Stamp paper deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

function addHistory(actionType, entityType, entityId, description) {
  try {
    db.run(
      'INSERT INTO history (action_type, entity_type, entity_id, description) VALUES (?, ?, ?, ?)',
      [actionType, entityType, entityId, description]
    );
  } catch (e) {
    console.error('History error:', e);
  }
}

module.exports = {
  getStampPapers,
  createStampPaper,
  updateStampPaper,
  deleteStampPaper
};
