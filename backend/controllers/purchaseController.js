const db = require('../database/db');

const generateReferenceNumber = () => {
  const date = new Date();
  const prefix = `PUR-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${random}`;
};

const getAllPurchases = (req, res) => {
  try {
    const { startDate, endDate, supplier, search } = req.query;
    let query = `
      SELECT p.*, s.company_name as supplier_name
      FROM purchases p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      query += ' AND DATE(p.created_at) >= DATE(?)';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND DATE(p.created_at) <= DATE(?)';
      params.push(endDate);
    }

    if (supplier && supplier !== 'all') {
      query += ' AND p.supplier_id = ?';
      params.push(parseInt(supplier));
    }

    if (search) {
      query += ' AND p.reference_number LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY p.created_at DESC';

    const purchases = db.all(query, params);
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPurchase = (req, res) => {
  try {
    const purchase = db.get(`
      SELECT p.*, s.company_name as supplier_name, s.contact_person, s.phone
      FROM purchases p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = ?
    `, [parseInt(req.params.id)]);
    
    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    const items = db.all('SELECT * FROM purchase_items WHERE purchase_id = ?', [parseInt(req.params.id)]);
    res.json({ ...purchase, items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createPurchase = (req, res) => {
  try {
    const { supplier_id, items, notes, payment_method = 'cash' } = req.body;

    if (!supplier_id) {
      return res.status(400).json({ error: 'Supplier is required' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in purchase' });
    }

    const referenceNumber = generateReferenceNumber();
    let totalAmount = 0;
    const processedItems = [];

    for (const item of items) {
      const product = db.get('SELECT * FROM products WHERE id = ?', [item.product_id]);
      
      let productName = item.product_name || 'Unknown';
      let costPrice = item.cost_price;

      if (product) {
        productName = product.name;
        db.run('UPDATE products SET quantity = quantity + ?, cost_price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
          [item.quantity, item.cost_price, item.product_id]);
      }

      const subtotal = item.quantity * item.cost_price;
      totalAmount += subtotal;

      processedItems.push({
        product_id: item.product_id || null,
        product_name: productName,
        quantity: item.quantity,
        cost_price: costPrice,
        subtotal
      });
    }

    const purchaseResult = db.run(`
      INSERT INTO purchases (reference_number, supplier_id, total_amount, notes)
      VALUES (?, ?, ?, ?)
    `, [referenceNumber, supplier_id, totalAmount, notes]);

    const purchaseId = purchaseResult.lastInsertRowid;

    for (const item of processedItems) {
      db.run(`
        INSERT INTO purchase_items (purchase_id, product_id, product_name, quantity, cost_price, subtotal)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        purchaseId, item.product_id, item.product_name, item.quantity, item.cost_price, item.subtotal
      ]);
    }

    if (payment_method === 'cash') {
      db.run('UPDATE cash_accounts SET current_balance = current_balance - ? WHERE id = 1', [totalAmount]);
      
      db.run(`
        INSERT INTO transactions (type, category, account_type, account_id, amount, description, reference_id, reference_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, ['debit', 'purchase', 'cash', 1, totalAmount, `Purchase: ${referenceNumber}`, purchaseId, 'purchase']);
    }

    addHistory('CREATE', 'purchase', purchaseId, `Created purchase: ${referenceNumber} - PKR ${totalAmount.toLocaleString()}`);

    const purchase = db.get('SELECT * FROM purchases WHERE id = ?', [purchaseId]);
    const purchaseItems = db.all('SELECT * FROM purchase_items WHERE purchase_id = ?', [purchaseId]);

    res.status(201).json({ ...purchase, items: purchaseItems });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deletePurchase = (req, res) => {
  try {
    const { id } = req.params;
    const purchase = db.get('SELECT * FROM purchases WHERE id = ?', [parseInt(id)]);

    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    const items = db.all('SELECT * FROM purchase_items WHERE purchase_id = ?', [parseInt(id)]);

    for (const item of items) {
      if (item.product_id) {
        db.run('UPDATE products SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
          [item.quantity, item.product_id]);
      }
    }

    db.run('UPDATE cash_accounts SET current_balance = current_balance + ? WHERE id = 1', [purchase.total_amount]);
    db.run('DELETE FROM transactions WHERE reference_id = ? AND reference_type = ?', [parseInt(id), 'purchase']);
    db.run('DELETE FROM purchase_items WHERE purchase_id = ?', [parseInt(id)]);
    db.run('DELETE FROM purchases WHERE id = ?', [parseInt(id)]);

    addHistory('DELETE', 'purchase', parseInt(id), `Deleted purchase: ${purchase.reference_number}`);

    res.json({ message: 'Purchase deleted and stock adjusted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPurchaseStats = (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const totalPurchases = db.get('SELECT SUM(total_amount) as total FROM purchases') || { total: 0 };
    const todayPurchases = db.get('SELECT SUM(total_amount) as total FROM purchases WHERE DATE(created_at) = DATE(?)', [today]) || { total: 0 };
    const monthPurchases = db.get('SELECT SUM(total_amount) as total FROM purchases WHERE DATE(created_at) >= ?', [startOfMonth]) || { total: 0 };

    res.json({
      totalPurchases: totalPurchases.total || 0,
      todayPurchases: todayPurchases.total || 0,
      monthPurchases: monthPurchases.total || 0
    });
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
  getAllPurchases,
  getPurchase,
  createPurchase,
  deletePurchase,
  getPurchaseStats
};
