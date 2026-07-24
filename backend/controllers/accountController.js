const mongoose = require('mongoose');
const { BankAccount, CashAccount, Transaction, addHistory } = require('../database/db');

const getAccounts = async (req, res) => {
  try {
    const { type } = req.query;
    if (type === 'bank') {
      const accounts = await BankAccount.find({}).sort('name');
      res.json(accounts.map(a => a.toJSON()));
    } else {
      const accounts = await CashAccount.find({}).sort('name');
      res.json(accounts.map(a => a.toJSON()));
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllAccounts = async (req, res) => {
  try {
    const bankAccounts = await BankAccount.find({});
    const cashAccounts = await CashAccount.find({});
    const cash = cashAccounts.map(a => ({ ...a.toJSON(), account_type: 'cash' }));
    const bank = bankAccounts.map(a => ({ ...a.toJSON(), account_type: 'bank' }));
    res.json([...cash, ...bank]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createBankAccount = async (req, res) => {
  try {
    const { name, account_number, balance, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Account name is required' });
    const account = await BankAccount.create({ name, account_number, balance: balance || 0, description });
    addHistory('CREATE', 'bank_account', account.id, `Created bank account: ${name}`);
    res.status(201).json(account.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateBankAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const account = await BankAccount.findById(id);
    if (!account) return res.status(404).json({ error: 'Bank account not found' });
    const { name, account_number, description } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (account_number !== undefined) update.account_number = account_number;
    if (description !== undefined) update.description = description;
    await BankAccount.findByIdAndUpdate(id, update);
    addHistory('UPDATE', 'bank_account', id, `Updated bank account: ${name || account.name}`);
    const updated = await BankAccount.findById(id);
    res.json(updated.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteBankAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const account = await BankAccount.findById(id);
    if (!account) return res.status(404).json({ error: 'Bank account not found' });
    await BankAccount.findByIdAndDelete(id);
    addHistory('DELETE', 'bank_account', id, `Deleted bank account: ${account.name}`);
    res.json({ message: 'Bank account deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

async function findCashAccount(id) {
  if (id && mongoose.Types.ObjectId.isValid(id)) {
    const acct = await CashAccount.findById(id);
    if (acct) return acct;
  }
  return await CashAccount.findOne({});
}

const deposit = async (req, res) => {
  try {
    const { account_type, account_id, amount, description, payment_method, profit } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount is required' });

    const parsedProfit = profit === undefined || profit === null || profit === '' ? null : parseFloat(profit);
    if (parsedProfit !== null && Number.isNaN(parsedProfit)) {
      return res.status(400).json({ error: 'Profit must be a valid number' });
    }

    let result;
    if (account_type === 'cash') {
      const cashAccount = await findCashAccount(account_id);
      if (!cashAccount) return res.status(404).json({ error: 'Cash account not found' });
      cashAccount.current_balance += amount;
      await cashAccount.save();
      result = cashAccount;
    } else {
      const bankAccount = await BankAccount.findById(account_id);
      if (!bankAccount) return res.status(404).json({ error: 'Bank account not found' });
      bankAccount.balance += amount;
      await bankAccount.save();
      result = bankAccount;
    }

    await Transaction.create({
      type: 'credit', category: payment_method || 'deposit',
      account_type, account_id: result._id, amount,
      description: description || 'Deposit', profit: parsedProfit
    });

    addHistory('CREATE', 'transaction', null, `${account_type === 'cash' ? 'Cash' : 'Bank'} deposit: PKR ${Number(amount).toLocaleString()}`);
    res.json(result.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const withdraw = async (req, res) => {
  try {
    const { account_type, account_id, amount, description, payment_method, profit } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount is required' });

    const parsedProfit = profit === undefined || profit === null || profit === '' ? null : parseFloat(profit);
    if (parsedProfit !== null && Number.isNaN(parsedProfit)) {
      return res.status(400).json({ error: 'Profit must be a valid number' });
    }

    let result;
    if (account_type === 'cash') {
      const cashAccount = await findCashAccount(account_id);
      if (!cashAccount) return res.status(404).json({ error: 'Cash account not found' });
      if (cashAccount.current_balance < amount) return res.status(400).json({ error: 'Insufficient cash balance' });
      cashAccount.current_balance -= amount;
      await cashAccount.save();
      result = cashAccount;
    } else {
      const bankAccount = await BankAccount.findById(account_id);
      if (!bankAccount) return res.status(404).json({ error: 'Bank account not found' });
      if (bankAccount.balance < amount) return res.status(400).json({ error: 'Insufficient bank balance' });
      bankAccount.balance -= amount;
      await bankAccount.save();
      result = bankAccount;
    }

    await Transaction.create({
      type: 'debit', category: payment_method || 'withdrawal',
      account_type, account_id: result._id, amount,
      description: description || 'Withdrawal', profit: parsedProfit
    });

    addHistory('CREATE', 'transaction', null, `${account_type === 'cash' ? 'Cash' : 'Bank'} withdrawal: PKR ${Number(amount).toLocaleString()}`);
    res.json(result.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const transfer = async (req, res) => {
  try {
    const { from_type, from_id, to_type, to_id, amount, description } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount is required' });

    let fromAccount, toAccount;

    if (from_type === 'cash') {
      fromAccount = await findCashAccount(from_id);
      if (!fromAccount) return res.status(404).json({ error: 'Source cash account not found' });
      if (fromAccount.current_balance < amount) return res.status(400).json({ error: 'Insufficient balance' });
      fromAccount.current_balance -= amount;
      await fromAccount.save();
    } else {
      fromAccount = await BankAccount.findById(from_id);
      if (!fromAccount) return res.status(404).json({ error: 'Source bank account not found' });
      if (fromAccount.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });
      fromAccount.balance -= amount;
      await fromAccount.save();
    }

    if (to_type === 'cash') {
      toAccount = await findCashAccount(to_id);
      if (!toAccount) return res.status(404).json({ error: 'Destination cash account not found' });
      toAccount.current_balance += amount;
      await toAccount.save();
    } else {
      toAccount = await BankAccount.findById(to_id);
      if (!toAccount) return res.status(404).json({ error: 'Destination bank account not found' });
      toAccount.balance += amount;
      await toAccount.save();
    }

    await Transaction.create({
      type: 'transfer', category: 'transfer',
      account_type: from_type, account_id: fromAccount._id, amount,
      description: `Transfer to ${to_type}: ${description || ''}`
    });

    addHistory('CREATE', 'transaction', null, `Transfer: PKR ${Number(amount).toLocaleString()} from ${from_type} to ${to_type}`);
    res.json({ message: 'Transfer completed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTransactions = async (req, res) => {
  try {
    const { account_type, startDate, endDate, type, limit = 100 } = req.query;
    const filter = {};
    if (account_type) filter.account_type = account_type;
    if (startDate) filter.created_at = { ...filter.created_at, $gte: new Date(startDate) };
    if (endDate) filter.created_at = { ...filter.created_at, $lte: new Date(endDate) };
    if (type) filter.type = type;

    const transactions = await Transaction.find(filter).sort({ created_at: -1 }).limit(parseInt(limit));
    res.json(transactions.map(t => t.toJSON()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAccounts, getAllAccounts, createBankAccount, updateBankAccount, deleteBankAccount, deposit, withdraw, transfer, getTransactions };
