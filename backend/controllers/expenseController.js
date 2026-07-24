const { Expense, CashAccount, BankAccount, Transaction, addHistory } = require('../database/db');

const getExpenses = async (req, res) => {
  try {
    const { startDate, endDate, category, search } = req.query;
    const filter = {};
    if (startDate) filter.expense_date = { ...filter.expense_date, $gte: new Date(startDate) };
    if (endDate) filter.expense_date = { ...filter.expense_date, $lte: new Date(endDate) };
    if (category && category !== 'all') filter.category = category;
    if (search) filter.description = { $regex: search, $options: 'i' };

    const expenses = await Expense.find(filter).sort({ expense_date: -1, created_at: -1 });
    const totals = await Expense.aggregate([
      { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$amount' } } }
    ]);

    res.json({
      expenses: expenses.map(e => e.toJSON()),
      summary: { count: totals[0]?.count || 0, total: totals[0]?.total || 0 }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCategories = async (req, res) => {
  try {
    const result = await Expense.distinct('category');
    res.json(result.sort());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createExpense = async (req, res) => {
  try {
    const { category, amount, description, payment_method, expense_date } = req.body;
    if (!amount || parseFloat(amount) <= 0) return res.status(400).json({ error: 'Valid amount is required' });

    const parsedAmount = parseFloat(amount);
    const cat = category || 'Other';
    const pm = payment_method || 'cash';
    const date = expense_date || new Date().toISOString().split('T')[0];

    const expense = await Expense.create({
      category: cat, amount: parsedAmount,
      description: description || null,
      payment_method: pm, expense_date: date
    });

    if (pm === 'cash') {
      const cashAccount = await CashAccount.findOne({});
      if (cashAccount) {
        await CashAccount.findByIdAndUpdate(cashAccount._id, { $inc: { current_balance: -parsedAmount } });
        await Transaction.create({
          type: 'debit', category: 'expense', account_type: 'cash',
          account_id: cashAccount._id, amount: parsedAmount,
          description: `Expense: ${description || cat}`
        });
      }
    } else if (pm === 'bank') {
      const bankAcc = await BankAccount.findOne({}).sort({ _id: 1 });
      if (bankAcc) {
        await BankAccount.findByIdAndUpdate(bankAcc._id, { $inc: { balance: -parsedAmount } });
        await Transaction.create({
          type: 'debit', category: 'expense', account_type: 'bank',
          account_id: bankAcc._id, amount: parsedAmount,
          description: `Expense: ${description || cat}`
        });
      }
    }

    addHistory('CREATE', 'expense', expense.id, `Expense: ${cat} - PKR ${parsedAmount.toLocaleString()}`);
    res.status(201).json(expense.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Expense.findById(id);
    if (!existing) return res.status(404).json({ error: 'Expense not found' });

    const { category, amount, description, payment_method, expense_date } = req.body;
    const diff = amount !== undefined ? parseFloat(amount) - existing.amount : 0;

    const update = {};
    if (category !== undefined) update.category = category;
    if (amount !== undefined) update.amount = parseFloat(amount);
    if (description !== undefined) update.description = description;
    if (payment_method !== undefined) update.payment_method = payment_method;
    if (expense_date !== undefined) update.expense_date = expense_date;

    await Expense.findByIdAndUpdate(id, update);

    if (diff !== 0 && existing.payment_method === 'cash') {
      const cashAccount = await CashAccount.findOne({});
      if (cashAccount) {
        await CashAccount.findByIdAndUpdate(cashAccount._id, { $inc: { current_balance: diff } });
      }
    }

    addHistory('UPDATE', 'expense', id, `Updated expense #${id}`);
    const updated = await Expense.findById(id);
    res.json(updated.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Expense.findById(id);
    if (!existing) return res.status(404).json({ error: 'Expense not found' });

    if (existing.payment_method === 'cash') {
      const cashAccount = await CashAccount.findOne({});
      if (cashAccount) {
        await CashAccount.findByIdAndUpdate(cashAccount._id, { $inc: { current_balance: existing.amount } });
      }
    }

    await Expense.findByIdAndDelete(id);
    addHistory('DELETE', 'expense', id, `Deleted expense: ${existing.category} - PKR ${existing.amount.toLocaleString()}`);
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getExpenses, getCategories, createExpense, updateExpense, deleteExpense };
