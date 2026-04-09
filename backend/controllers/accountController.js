const db = require('../database/db');

const getAccounts = (req, res) => {
  try {
    const { type } = req.query;
    
    if (type === 'bank') {
      const accounts = db.all('SELECT * FROM bank_accounts ORDER BY name');
      res.json(accounts);
    } else {
      const accounts = db.all('SELECT * FROM cash_accounts ORDER BY name');
      res.json(accounts);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllAccounts = (req, res) => {
  try {
    const bankAccounts = db.all('SELECT *, "bank" as account_type FROM bank_accounts');
    const cashAccounts = db.all('SELECT *, "cash" as account_type FROM cash_accounts');
    res.json([...cashAccounts, ...bankAccounts]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createBankAccount = (req, res) => {
  try {
    const { name, account_number, balance, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Account name is required' });
    }

    const result = db.run(`
      INSERT INTO bank_accounts (name, account_number, balance, description)
      VALUES (?, ?, ?, ?)
    `, [name, account_number, balance || 0, description]);

    addHistory('CREATE', 'bank_account', result.lastInsertRowid, `Created bank account: ${name}`);
    
    res.status(201).json({ id: result.lastInsertRowid, name, account_number, balance: balance || 0, description });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateBankAccount = (req, res) => {
  try {
    const { id } = req.params;
    const account = db.get('SELECT * FROM bank_accounts WHERE id = ?', [parseInt(id)]);
    
    if (!account) {
      return res.status(404).json({ error: 'Bank account not found' });
    }

    const { name, account_number, description } = req.body;
    
    db.run(`
      UPDATE bank_accounts 
      SET name = COALESCE(?, name),
          account_number = ?,
          description = ?
      WHERE id = ?
    `, [name, account_number, description, parseInt(id)]);

    addHistory('UPDATE', 'bank_account', parseInt(id), `Updated bank account: ${name || account.name}`);
    
    res.json(db.get('SELECT * FROM bank_accounts WHERE id = ?', [parseInt(id)]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteBankAccount = (req, res) => {
  try {
    const { id } = req.params;
    const account = db.get('SELECT * FROM bank_accounts WHERE id = ?', [parseInt(id)]);
    
    if (!account) {
      return res.status(404).json({ error: 'Bank account not found' });
    }

    db.run('DELETE FROM bank_accounts WHERE id = ?', [parseInt(id)]);
    addHistory('DELETE', 'bank_account', parseInt(id), `Deleted bank account: ${account.name}`);
    
    res.json({ message: 'Bank account deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deposit = (req, res) => {
  try {
    const { account_type, account_id, amount, description, payment_method, profit } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    if (account_type === 'cash') {
      db.run('UPDATE cash_accounts SET current_balance = current_balance + ? WHERE id = ?', [amount, account_id || 1]);
    } else {
      db.run('UPDATE bank_accounts SET balance = balance + ? WHERE id = ?', [amount, account_id]);
    }

    const parsedProfit = profit === undefined || profit === null || profit === '' ? null : parseFloat(profit);
    if (parsedProfit !== null && Number.isNaN(parsedProfit)) {
      return res.status(400).json({ error: 'Profit must be a valid number' });
    }

    db.run(`
      INSERT INTO transactions (type, category, account_type, account_id, amount, description, profit)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      'credit',
      payment_method || 'deposit',
      account_type,
      account_id || 1,
      amount,
      description || 'Deposit',
      parsedProfit
    ]);

    addHistory('CREATE', 'transaction', null, `${account_type === 'cash' ? 'Cash' : 'Bank'} deposit: PKR ${amount.toLocaleString()}`);
    
    if (account_type === 'cash') {
      res.json(db.get('SELECT * FROM cash_accounts WHERE id = ?', [account_id || 1]));
    } else {
      res.json(db.get('SELECT * FROM bank_accounts WHERE id = ?', [account_id]));
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const withdraw = (req, res) => {
  try {
    const { account_type, account_id, amount, description, payment_method, profit } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    if (account_type === 'cash') {
      const account = db.get('SELECT * FROM cash_accounts WHERE id = ?', [account_id || 1]);
      if (account.current_balance < amount) {
        return res.status(400).json({ error: 'Insufficient cash balance' });
      }
      db.run('UPDATE cash_accounts SET current_balance = current_balance - ? WHERE id = ?', [amount, account_id || 1]);
    } else {
      const account = db.get('SELECT * FROM bank_accounts WHERE id = ?', [account_id]);
      if (account.balance < amount) {
        return res.status(400).json({ error: 'Insufficient bank balance' });
      }
      db.run('UPDATE bank_accounts SET balance = balance - ? WHERE id = ?', [amount, account_id]);
    }

    const parsedProfit = profit === undefined || profit === null || profit === '' ? null : parseFloat(profit);
    if (parsedProfit !== null && Number.isNaN(parsedProfit)) {
      return res.status(400).json({ error: 'Profit must be a valid number' });
    }

    db.run(`
      INSERT INTO transactions (type, category, account_type, account_id, amount, description, profit)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      'debit',
      payment_method || 'withdrawal',
      account_type,
      account_id || 1,
      amount,
      description || 'Withdrawal',
      parsedProfit
    ]);

    addHistory('CREATE', 'transaction', null, `${account_type === 'cash' ? 'Cash' : 'Bank'} withdrawal: PKR ${amount.toLocaleString()}`);
    
    if (account_type === 'cash') {
      res.json(db.get('SELECT * FROM cash_accounts WHERE id = ?', [account_id || 1]));
    } else {
      res.json(db.get('SELECT * FROM bank_accounts WHERE id = ?', [account_id]));
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const transfer = (req, res) => {
  try {
    const { from_type, from_id, to_type, to_id, amount, description } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    if (from_type === 'cash') {
      const fromAccount = db.get('SELECT * FROM cash_accounts WHERE id = ?', [from_id || 1]);
      if (fromAccount.current_balance < amount) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }
      db.run('UPDATE cash_accounts SET current_balance = current_balance - ? WHERE id = ?', [amount, from_id || 1]);
    } else {
      const fromAccount = db.get('SELECT * FROM bank_accounts WHERE id = ?', [from_id]);
      if (fromAccount.balance < amount) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }
      db.run('UPDATE bank_accounts SET balance = balance - ? WHERE id = ?', [amount, from_id]);
    }

    if (to_type === 'cash') {
      db.run('UPDATE cash_accounts SET current_balance = current_balance + ? WHERE id = ?', [amount, to_id || 1]);
    } else {
      db.run('UPDATE bank_accounts SET balance = balance + ? WHERE id = ?', [amount, to_id]);
    }

    db.run(`
      INSERT INTO transactions (type, category, account_type, account_id, amount, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `, ['transfer', 'transfer', from_type, from_id || 1, amount, `Transfer to ${to_type}: ${description || ''}`]);

    addHistory('CREATE', 'transaction', null, `Transfer: PKR ${amount.toLocaleString()} from ${from_type} to ${to_type}`);
    
    res.json({ message: 'Transfer completed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTransactions = (req, res) => {
  try {
    const { account_type, startDate, endDate, type, limit = 100 } = req.query;
    
    let query = 'SELECT * FROM transactions WHERE 1=1';
    const params = [];

    if (account_type) {
      query += ' AND account_type = ?';
      params.push(account_type);
    }

    if (startDate) {
      query += ' AND DATE(created_at) >= DATE(?)';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND DATE(created_at) <= DATE(?)';
      params.push(endDate);
    }

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const transactions = db.all(query, params);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

function addHistory(actionType, entityType, entityId, description) {
  db.run(`
    INSERT INTO history (action_type, entity_type, entity_id, description)
    VALUES (?, ?, ?, ?)
  `, [actionType, entityType, entityId, description]);
}

module.exports = {
  getAccounts,
  getAllAccounts,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  deposit,
  withdraw,
  transfer,
  getTransactions
};
