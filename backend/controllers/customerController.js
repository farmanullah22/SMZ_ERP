const db = require('../database/db');

const getAllCustomers = (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM customers WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY name ASC';

    const customers = db.all(query, params);
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCustomer = (req, res) => {
  try {
    const customer = db.get('SELECT * FROM customers WHERE id = ?', [parseInt(req.params.id)]);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const sales = db.all(`
      SELECT s.*, COUNT(si.id) as item_count
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      WHERE s.customer_id = ?
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT 10
    `, [parseInt(req.params.id)]);

    res.json({ ...customer, recent_sales: sales });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createCustomer = (req, res) => {
  console.log('Request body:', req.body);
  try {
    const { name, email, phone, address, notes } = req.body;
    console.log('Parsed:', { name, email, phone, address, notes });
    
    if (!name) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    const result = db.run(`
      INSERT INTO customers (name, email, phone, address, notes)
      VALUES (?, ?, ?, ?, ?)
    `, [name, email || null, phone || null, address || null, notes || null]);
    console.log('Result:', result);

    const customerId = result.lastInsertRowid;
    console.log('Customer ID:', customerId);

    if (!customerId) {
      return res.status(500).json({ error: 'Failed to get customer ID' });
    }

    res.status(201).json({ id: customerId, name, email, phone, address, notes });
  } catch (error) {
    console.error('Customer error:', error);
    res.status(500).json({ error: error.message });
  }
};

const updateCustomer = (req, res) => {
  try {
    const { id } = req.params;
    const customer = db.get('SELECT * FROM customers WHERE id = ?', [parseInt(id)]);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const { name, email, phone, address, notes } = req.body;
    
    db.run(`
      UPDATE customers 
      SET name = COALESCE(?, name),
          email = ?,
          phone = ?,
          address = ?,
          notes = ?
      WHERE id = ?
    `, [name, email, phone, address, notes, parseInt(id)]);

    addHistory('UPDATE', 'customer', parseInt(id), `Updated customer: ${name || customer.name}`);
    
    res.json(db.get('SELECT * FROM customers WHERE id = ?', [parseInt(id)]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteCustomer = (req, res) => {
  try {
    const { id } = req.params;
    const customer = db.get('SELECT * FROM customers WHERE id = ?', [parseInt(id)]);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    db.run('DELETE FROM customers WHERE id = ?', [parseInt(id)]);
    addHistory('DELETE', 'customer', parseInt(id), `Deleted customer: ${customer.name}`);
    
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

function addHistory(actionType, entityType, entityId, description) {
  try {
    db.run(`
      INSERT INTO history (action_type, entity_type, entity_id, description)
      VALUES (?, ?, ?, ?)
    `, [actionType, entityType, entityId, description]);
  } catch (e) {
    console.error('History error:', e);
  }
}

module.exports = {
  getAllCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer
};
