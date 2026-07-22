const db = require('../database/db');

const generateInvoiceNumber = () => {
  const date = new Date();
  const prefix = `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${random}`;
};

const getAllSales = (req, res) => {
  try {
    const { startDate, endDate, customer, search } = req.query;
    let query = `
      SELECT s.*, c.name as customer_name,
        (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) as items_count
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      query += ' AND DATE(s.created_at) >= DATE(?)';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND DATE(s.created_at) <= DATE(?)';
      params.push(endDate);
    }

    if (customer && customer !== 'all') {
      query += ' AND s.customer_id = ?';
      params.push(parseInt(customer));
    }

    if (search) {
      query += ' AND (s.invoice_number LIKE ? OR c.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY s.created_at DESC';

    const sales = db.all(query, params);
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getSale = (req, res) => {
  try {
    const sale = db.get(`
      SELECT s.*, c.name as customer_name, c.phone as customer_phone
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.id = ?
    `, [parseInt(req.params.id)]);
    
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    const items = db.all('SELECT * FROM sale_items WHERE sale_id = ?', [parseInt(req.params.id)]);
    res.json({ ...sale, items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createSale = (req, res) => {
  try {
    const { customer_id, items, payment_method = 'cash' } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in sale' });
    }

    const invoiceNumber = generateInvoiceNumber();
    let subtotal = 0;
    let totalProfit = 0;
    const processedItems = [];

    for (const item of items) {
      const product = db.get('SELECT * FROM products WHERE id = ?', [item.product_id]);
      if (!product) {
        return res.status(400).json({ error: `Product ${item.product_id} not found` });
      }

      if (product.quantity < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for ${product.name}. Available: ${product.quantity}` 
        });
      }

      const itemSubtotal = item.quantity * item.sale_price;
      const itemProfit = (item.sale_price - product.cost_price) * item.quantity;

      subtotal += itemSubtotal;
      totalProfit += itemProfit;

      processedItems.push({
        product_id: item.product_id,
        product_name: product.name,
        quantity: item.quantity,
        cost_price: product.cost_price,
        sale_price: item.sale_price,
        subtotal: itemSubtotal,
        profit: itemProfit
      });

      db.run('UPDATE products SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
        [item.quantity, item.product_id]);
    }

    const saleResult = db.run(`
      INSERT INTO sales (invoice_number, customer_id, subtotal, total_amount, total_profit, payment_method)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [invoiceNumber, customer_id || null, subtotal, subtotal, totalProfit, payment_method]);

    const saleId = saleResult.lastInsertRowid;

    for (const item of processedItems) {
      db.run(`
        INSERT INTO sale_items (sale_id, product_id, product_name, quantity, cost_price, sale_price, subtotal, profit)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        saleId, item.product_id, item.product_name, item.quantity,
        item.cost_price, item.sale_price, item.subtotal, item.profit
      ]);
    }

    if (customer_id) {
      db.run('UPDATE customers SET total_purchases = total_purchases + 1, total_spent = total_spent + ? WHERE id = ?',
        [subtotal, customer_id]);
    }

    db.run('UPDATE cash_accounts SET current_balance = current_balance + ? WHERE id = 1', [subtotal]);

    db.run(`
      INSERT INTO transactions (type, category, account_type, account_id, amount, description, reference_id, reference_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, ['credit', 'sale', 'cash', 1, subtotal, `Sale Invoice: ${invoiceNumber}`, saleId, 'sale']);

    addHistory('CREATE', 'sale', saleId, `Created sale: ${invoiceNumber} - PKR ${subtotal.toLocaleString()}`);

    const sale = db.get('SELECT * FROM sales WHERE id = ?', [saleId]);
    const saleItems = db.all('SELECT * FROM sale_items WHERE sale_id = ?', [saleId]);

    res.status(201).json({ ...sale, items: saleItems });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteSale = (req, res) => {
  try {
    const { id } = req.params;
    const sale = db.get('SELECT * FROM sales WHERE id = ?', [parseInt(id)]);

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    const items = db.all('SELECT * FROM sale_items WHERE sale_id = ?', [parseInt(id)]);

    for (const item of items) {
      db.run('UPDATE products SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
        [item.quantity, item.product_id]);
    }

    if (sale.customer_id) {
      db.run('UPDATE customers SET total_purchases = total_purchases - 1, total_spent = total_spent - ? WHERE id = ?',
        [sale.total_amount, sale.customer_id]);
    }

    db.run('UPDATE cash_accounts SET current_balance = current_balance - ? WHERE id = 1', [sale.total_amount]);

    db.run('DELETE FROM transactions WHERE reference_id = ? AND reference_type = ?', [parseInt(id), 'sale']);
    db.run('DELETE FROM sale_items WHERE sale_id = ?', [parseInt(id)]);
    db.run('DELETE FROM sales WHERE id = ?', [parseInt(id)]);

    addHistory('DELETE', 'sale', parseInt(id), `Deleted sale: ${sale.invoice_number}`);

    res.json({ message: 'Sale deleted and stock restored' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getSalesStats = (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const totalSales = db.get('SELECT SUM(total_amount) as total FROM sales') || { total: 0 };
    const totalProfit = db.get('SELECT SUM(total_profit) as total FROM sales') || { total: 0 };
    
    const todaySales = db.get("SELECT SUM(total_amount) as total, SUM(total_profit) as profit FROM sales WHERE DATE(created_at) = DATE(?)", [today]) || { total: 0, profit: 0 };
    const monthSales = db.get('SELECT SUM(total_amount) as total, SUM(total_profit) as profit FROM sales WHERE DATE(created_at) >= ?', [startOfMonth]) || { total: 0, profit: 0 };
    
    const totalExpenses = db.get('SELECT SUM(total_amount) as total FROM purchases') || { total: 0 };
    const inventoryValue = db.get('SELECT SUM(quantity * cost_price) as total FROM products') || { total: 0 };
    
    const productCount = db.get('SELECT COUNT(*) as count FROM products') || { count: 0 };
    const lowStockCount = db.get('SELECT COUNT(*) as count FROM products WHERE quantity <= reorder_level') || { count: 0 };

    res.json({
      totalSales: totalSales.total || 0,
      totalProfit: totalProfit.total || 0,
      todaySales: todaySales.total || 0,
      todayProfit: todaySales.profit || 0,
      monthSales: monthSales.total || 0,
      monthProfit: monthSales.profit || 0,
      totalExpenses: totalExpenses.total || 0,
      inventoryValue: inventoryValue.total || 0,
      productCount: productCount.count || 0,
      lowStockCount: lowStockCount.count || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMonthlySalesData = (req, res) => {
  try {
    const { period = 'monthly', months = 12 } = req.query;
    
    let dateFormat, groupBy;
    switch (period) {
      case 'daily':
        dateFormat = '%Y-%m-%d';
        groupBy = "strftime('%Y-%m-%d', created_at)";
        break;
      case 'weekly':
        dateFormat = '%Y-W%W';
        groupBy = "strftime('%Y-W%W', created_at)";
        break;
      default:
        dateFormat = '%Y-%m';
        groupBy = "strftime('%Y-%m', created_at)";
    }

    const data = db.all(`
      SELECT 
        ${groupBy} as period,
        SUM(total_amount) as total_sales,
        SUM(total_profit) as total_profit,
        COUNT(*) as order_count
      FROM sales
      WHERE created_at >= date('now', '-${parseInt(months)} months')
      GROUP BY ${groupBy}
      ORDER BY period ASC
    `);
    res.json(data);
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
  getAllSales,
  getSale,
  createSale,
  deleteSale,
  getSalesStats,
  getMonthlySalesData
};
