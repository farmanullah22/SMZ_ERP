const db = require('../database/db');

const getSalesReport = (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const today = new Date().toISOString().split('T')[0];
    
    let dateFilter = "1=1";
    const params = [];

    if (startDate && endDate) {
      dateFilter = "DATE(s.created_at) BETWEEN DATE(?) AND DATE(?)";
      params.push(startDate, endDate);
    } else if (startDate) {
      dateFilter = "DATE(s.created_at) >= DATE(?)";
      params.push(startDate);
    } else if (endDate) {
      dateFilter = "DATE(s.created_at) <= DATE(?)";
      params.push(endDate);
    }

    const sales = db.all(`
      SELECT s.*, c.name as customer_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE ${dateFilter}
      ORDER BY s.created_at DESC
    `, params);

    const summary = db.get(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_sales,
        SUM(total_profit) as total_profit
      FROM sales
      WHERE ${dateFilter}
    `, params);

    res.json({
      sales,
      summary: summary || { total_orders: 0, total_sales: 0, total_profit: 0 },
      period: { startDate: startDate || 'all', endDate: endDate || today }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getProfitLossReport = (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const today = new Date().toISOString().split('T')[0];
    
    let dateFilter = "1=1";
    const params = [];

    if (startDate && endDate) {
      dateFilter = "DATE(created_at) BETWEEN DATE(?) AND DATE(?)";
      params.push(startDate, endDate);
    }

    const salesData = db.get(`
      SELECT 
        SUM(total_amount) as total_revenue,
        SUM(total_profit) as gross_profit
      FROM sales
      WHERE ${dateFilter}
    `, params);

    const purchasesData = db.get(`
      SELECT SUM(total_amount) as total_expenses
      FROM purchases
      WHERE ${dateFilter}
    `, params);

    res.json({
      totalRevenue: salesData?.total_revenue || 0,
      grossProfit: salesData?.gross_profit || 0,
      totalExpenses: purchasesData?.total_expenses || 0,
      netProfit: (salesData?.gross_profit || 0) - (purchasesData?.total_expenses || 0),
      period: { startDate: startDate || 'all', endDate: endDate || today }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getInventoryReport = (req, res) => {
  try {
    const products = db.all(`
      SELECT p.*, 
             c.name as category_name,
             s.company_name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      ORDER BY p.name ASC
    `);

    const summary = {
      totalProducts: products.length,
      totalQuantity: products.reduce((sum, p) => sum + p.quantity, 0),
      totalValue: products.reduce((sum, p) => sum + (p.quantity * p.cost_price), 0),
      totalRetail: products.reduce((sum, p) => sum + (p.quantity * p.sale_price), 0),
      lowStockCount: products.filter(p => p.quantity <= p.reorder_level).length,
      outOfStockCount: products.filter(p => p.quantity === 0).length
    };

    res.json({ products, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCustomerReport = (req, res) => {
  try {
    const customers = db.all(`
      SELECT c.*, 
             COUNT(s.id) as purchase_count,
             SUM(s.total_amount) as total_spent
      FROM customers c
      LEFT JOIN sales s ON c.id = s.customer_id
      GROUP BY c.id
      ORDER BY total_spent DESC
    `);

    const summary = {
      totalCustomers: customers.length,
      totalRevenue: customers.reduce((sum, c) => sum + (c.total_spent || 0), 0)
    };

    res.json({ customers, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getSupplierReport = (req, res) => {
  try {
    const suppliers = db.all(`
      SELECT s.*, 
             COUNT(p.id) as product_count,
             COUNT(pur.id) as purchase_count,
             SUM(pur.total_amount) as total_purchased
      FROM suppliers s
      LEFT JOIN products p ON s.id = p.supplier_id
      LEFT JOIN purchases pur ON s.id = pur.supplier_id
      GROUP BY s.id
      ORDER BY total_purchased DESC
    `);

    const summary = {
      totalSuppliers: suppliers.length,
      totalPurchased: suppliers.reduce((sum, s) => sum + (s.total_purchased || 0), 0)
    };

    res.json({ suppliers, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPurchaseReport = (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const today = new Date().toISOString().split('T')[0];
    
    let dateFilter = "1=1";
    const params = [];

    if (startDate && endDate) {
      dateFilter = "DATE(p.created_at) BETWEEN DATE(?) AND DATE(?)";
      params.push(startDate, endDate);
    }

    const purchases = db.all(`
      SELECT p.*, s.company_name as supplier_name
      FROM purchases p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE ${dateFilter}
      ORDER BY p.created_at DESC
    `, params);

    const summary = db.get(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_amount
      FROM purchases
      WHERE ${dateFilter}
    `, params);

    res.json({
      purchases,
      summary: summary || { total_orders: 0, total_amount: 0 },
      period: { startDate: startDate || 'all', endDate: endDate || today }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAccountsReport = (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const today = new Date().toISOString().split('T')[0];

    let dateFilter = '1=1';
    const params = [];

    if (startDate && endDate) {
      dateFilter = 'DATE(t.created_at) BETWEEN DATE(?) AND DATE(?)';
      params.push(startDate, endDate);
    } else if (startDate) {
      dateFilter = 'DATE(t.created_at) >= DATE(?)';
      params.push(startDate);
    } else if (endDate) {
      dateFilter = 'DATE(t.created_at) <= DATE(?)';
      params.push(endDate);
    }

    const transactions = db.all(`
      SELECT t.*,
        CASE
          WHEN t.account_type = 'cash' THEN ca.name
          WHEN t.account_type = 'bank' THEN ba.name
          ELSE 'Account'
        END as account_name
      FROM transactions t
      LEFT JOIN cash_accounts ca ON t.account_type = 'cash' AND t.account_id = ca.id
      LEFT JOIN bank_accounts ba ON t.account_type = 'bank' AND t.account_id = ba.id
      WHERE ${dateFilter}
      ORDER BY t.created_at DESC
    `, params);

    const summary = db.get(`
      SELECT
        COUNT(*) as total_transactions,
        SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) as total_credit,
        SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) as total_debit,
        SUM(CASE WHEN type = 'transfer' THEN amount ELSE 0 END) as total_transfer,
        SUM(CASE WHEN profit IS NOT NULL THEN profit ELSE 0 END) as total_profit
      FROM transactions t
      WHERE ${dateFilter}
    `, params);

    res.json({
      transactions,
      summary: summary || {
        total_transactions: 0,
        total_credit: 0,
        total_debit: 0,
        total_transfer: 0,
        total_profit: 0
      },
      period: { startDate: startDate || 'all', endDate: endDate || today }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getHistory = (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    
    const history = db.all(`
      SELECT * FROM history
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [parseInt(limit), parseInt(offset)]);

    const total = db.get('SELECT COUNT(*) as count FROM history');

    res.json({ history, total: total?.count || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getSalesReport,
  getProfitLossReport,
  getInventoryReport,
  getCustomerReport,
  getSupplierReport,
  getPurchaseReport,
  getAccountsReport,
  getHistory
};
