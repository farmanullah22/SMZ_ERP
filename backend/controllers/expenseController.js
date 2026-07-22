const db = require('../database/db');

const getExpenses = (req, res) => {
  try {
    const { startDate, endDate, category, search } = req.query;
    let query = 'SELECT * FROM expenses WHERE 1=1';
    const params = [];

    if (startDate) {
      query += ' AND DATE(expense_date) >= DATE(?)';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND DATE(expense_date) <= DATE(?)';
      params.push(endDate);
    }
    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }
    if (search) {
      query += ' AND description LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY expense_date DESC, created_at DESC';
    const expenses = db.all(query, params);

    const totals = db.get(`
      SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total
      FROM expenses WHERE 1=1
    `);

    res.json({ expenses, summary: { count: totals?.count || 0, total: totals?.total || 0 } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCategories = (req, res) => {
  try {
    const rows = db.all('SELECT DISTINCT category FROM expenses ORDER BY category');
    res.json(rows.map(r => r.category));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createExpense = (req, res) => {
  try {
    const { category, amount, description, payment_method, expense_date } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const parsedAmount = parseFloat(amount);
    const cat = category || 'Other';
    const pm = payment_method || 'cash';
    const date = expense_date || new Date().toISOString().split('T')[0];

    const result = db.run(`
      INSERT INTO expenses (category, amount, description, payment_method, expense_date)
      VALUES (?, ?, ?, ?, ?)
    `, [cat, parsedAmount, description || null, pm, date]);

    // Deduct from cash account if payment method is cash
    if (pm === 'cash') {
      db.run('UPDATE cash_accounts SET current_balance = current_balance - ? WHERE id = 1', [parsedAmount]);
      db.run(`
        INSERT INTO transactions (type, category, account_type, account_id, amount, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `, ['debit', 'expense', 'cash', 1, parsedAmount, `Expense: ${description || cat}`]);
    } else if (pm === 'bank') {
      // If bank, deduct from first bank account (or we could add account_id later)
      const bankAcc = db.get('SELECT id FROM bank_accounts ORDER BY id LIMIT 1');
      if (bankAcc) {
        db.run('UPDATE bank_accounts SET balance = balance - ? WHERE id = ?', [parsedAmount, bankAcc.id]);
        db.run(`
          INSERT INTO transactions (type, category, account_type, account_id, amount, description)
          VALUES (?, ?, ?, ?, ?, ?)
        `, ['debit', 'expense', 'bank', bankAcc.id, parsedAmount, `Expense: ${description || cat}`]);
      }
    }

    addHistory('CREATE', 'expense', result.lastInsertRowid, `Expense: ${cat} - PKR ${parsedAmount.toLocaleString()}`);

    const expense = db.get('SELECT * FROM expenses WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateExpense = (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.get('SELECT * FROM expenses WHERE id = ?', [parseInt(id)]);
    if (!existing) return res.status(404).json({ error: 'Expense not found' });

    const { category, amount, description, payment_method, expense_date } = req.body;

    const diff = amount !== undefined ? parseFloat(amount) - existing.amount : 0;

    db.run(`
      UPDATE expenses SET
        category = COALESCE(?, category),
        amount = COALESCE(?, amount),
        description = ?,
        payment_method = COALESCE(?, payment_method),
        expense_date = COALESCE(?, expense_date)
      WHERE id = ?
    `, [
      category || null,
      amount !== undefined ? parseFloat(amount) : null,
      description !== undefined ? description : null,
      payment_method || null,
      expense_date || null,
      parseInt(id)
    ]);

    // Adjust cash/bank if payment method was cash
    if (diff !== 0 && existing.payment_method === 'cash') {
      db.run('UPDATE cash_accounts SET current_balance = current_balance + ? WHERE id = 1', [diff]);
    }

    addHistory('UPDATE', 'expense', parseInt(id), `Updated expense #${id}`);
    res.json(db.get('SELECT * FROM expenses WHERE id = ?', [parseInt(id)]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteExpense = (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.get('SELECT * FROM expenses WHERE id = ?', [parseInt(id)]);
    if (!existing) return res.status(404).json({ error: 'Expense not found' });

    // Restore cash if payment was cash
    if (existing.payment_method === 'cash') {
      db.run('UPDATE cash_accounts SET current_balance = current_balance + ? WHERE id = 1', [existing.amount]);
    }

    db.run('DELETE FROM expenses WHERE id = ?', [parseInt(id)]);
    addHistory('DELETE', 'expense', parseInt(id), `Deleted expense: ${existing.category} - PKR ${existing.amount.toLocaleString()}`);

    res.json({ message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

function addHistory(actionType, entityType, entityId, description) {
  try {
    db.run('INSERT INTO history (action_type, entity_type, entity_id, description) VALUES (?, ?, ?, ?)',
      [actionType, entityType, entityId, description]);
  } catch (e) { console.error('History error:', e); }
}

module.exports = { getExpenses, getCategories, createExpense, updateExpense, deleteExpense };
