const db = require('../database/db');

const getAllProducts = (req, res) => {
  try {
    const { search, category, supplier, lowStock, sort } = req.query;
    let query = `
      SELECT p.*, 
             c.name as category_name,
             s.company_name as supplier_name,
             CASE WHEN p.quantity <= p.reorder_level THEN 'low' ELSE 'ok' END as stock_status
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND (p.name LIKE ? OR p.sku LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category && category !== 'all') {
      query += ' AND p.category_id = ?';
      params.push(parseInt(category));
    }

    if (supplier && supplier !== 'all') {
      query += ' AND p.supplier_id = ?';
      params.push(parseInt(supplier));
    }

    if (lowStock === 'true') {
      query += ' AND p.quantity <= p.reorder_level';
    }

    const sortOptions = {
      name_asc: 'p.name ASC',
      name_desc: 'p.name DESC',
      price_asc: 'p.sale_price ASC',
      price_desc: 'p.sale_price DESC',
      quantity_asc: 'p.quantity ASC',
      quantity_desc: 'p.quantity DESC',
      newest: 'p.created_at DESC'
    };
    query += ` ORDER BY ${sortOptions[sort] || 'p.name ASC'}`;

    const products = db.all(query, params);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getProduct = (req, res) => {
  try {
    const product = db.get(`
      SELECT p.*, 
             c.name as category_name,
             s.company_name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = ?
    `, [parseInt(req.params.id)]);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createProduct = (req, res) => {
  try {
    const { sku, name, category_id, supplier_id, cost_price, sale_price, quantity, reorder_level, description } = req.body;
    
    if (!name || cost_price === undefined || sale_price === undefined) {
      return res.status(400).json({ error: 'Name, cost price, and sale price are required' });
    }

    const result = db.run(`
      INSERT INTO products (sku, name, category_id, supplier_id, cost_price, sale_price, quantity, reorder_level, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      sku || `SKU-${Date.now()}`,
      name,
      category_id || null,
      supplier_id || null,
      cost_price,
      sale_price,
      quantity || 0,
      reorder_level || 10,
      description || null
    ]);

    const productId = result.lastInsertRowid;
    const product = db.get('SELECT * FROM products WHERE id = ?', [productId]);
    
    if (!product) {
      return res.status(500).json({ error: 'Failed to retrieve created product', id: productId });
    }
    
    addHistory('CREATE', 'product', productId, `Created product: ${name}`);
    
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateProduct = (req, res) => {
  try {
    const { id } = req.params;
    const oldProduct = db.get('SELECT * FROM products WHERE id = ?', [parseInt(id)]);
    
    if (!oldProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { sku, name, category_id, supplier_id, cost_price, sale_price, quantity, reorder_level, description } = req.body;
    
    db.run(`
      UPDATE products 
      SET sku = COALESCE(?, sku),
          name = COALESCE(?, name),
          category_id = ?,
          supplier_id = ?,
          cost_price = COALESCE(?, cost_price),
          sale_price = COALESCE(?, sale_price),
          quantity = COALESCE(?, quantity),
          reorder_level = COALESCE(?, reorder_level),
          description = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      sku,
      name,
      category_id,
      supplier_id,
      cost_price,
      sale_price,
      quantity,
      reorder_level,
      description,
      parseInt(id)
    ]);

    const updatedProduct = db.get('SELECT * FROM products WHERE id = ?', [parseInt(id)]);
    addHistory('UPDATE', 'product', parseInt(id), `Updated product: ${updatedProduct.name}`);
    
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteProduct = (req, res) => {
  try {
    const { id } = req.params;
    const product = db.get('SELECT * FROM products WHERE id = ?', [parseInt(id)]);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    db.run('DELETE FROM products WHERE id = ?', [parseInt(id)]);
    addHistory('DELETE', 'product', parseInt(id), `Deleted product: ${product.name}`);
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCategories = (req, res) => {
  try {
    const categories = db.all('SELECT * FROM categories ORDER BY name');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createCategory = (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const result = db.run('INSERT INTO categories (name) VALUES (?)', [name]);
    res.status(201).json({ id: result.lastInsertRowid, name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteCategory = (req, res) => {
  try {
    const { id } = req.params;
    const category = db.get('SELECT * FROM categories WHERE id = ?', [parseInt(id)]);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    db.run('UPDATE products SET category_id = NULL WHERE category_id = ?', [parseInt(id)]);
    db.run('DELETE FROM categories WHERE id = ?', [parseInt(id)]);
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getSuppliers = (req, res) => {
  try {
    const suppliers = db.all(`
      SELECT s.*, 
             COUNT(p.id) as product_count
      FROM suppliers s
      LEFT JOIN products p ON s.id = p.supplier_id
      GROUP BY s.id
      ORDER BY s.company_name
    `);
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createSupplier = (req, res) => {
  try {
    const { company_name, contact_person, email, phone, address, notes } = req.body;
    
    if (!company_name) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    const result = db.run(`
      INSERT INTO suppliers (company_name, contact_person, email, phone, address, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [company_name, contact_person, email, phone, address, notes]);
    
    addHistory('CREATE', 'supplier', result.lastInsertRowid, `Created supplier: ${company_name}`);
    
    res.status(201).json({ id: result.lastInsertRowid, company_name, contact_person, email, phone, address, notes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateSupplier = (req, res) => {
  try {
    const { id } = req.params;
    const supplier = db.get('SELECT * FROM suppliers WHERE id = ?', [parseInt(id)]);
    
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const { company_name, contact_person, email, phone, address, notes } = req.body;
    
    db.run(`
      UPDATE suppliers 
      SET company_name = COALESCE(?, company_name),
          contact_person = ?,
          email = ?,
          phone = ?,
          address = ?,
          notes = ?
      WHERE id = ?
    `, [company_name, contact_person, email, phone, address, notes, parseInt(id)]);

    addHistory('UPDATE', 'supplier', parseInt(id), `Updated supplier: ${company_name || supplier.company_name}`);
    
    res.json(db.get('SELECT * FROM suppliers WHERE id = ?', [parseInt(id)]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteSupplier = (req, res) => {
  try {
    const { id } = req.params;
    const supplier = db.get('SELECT * FROM suppliers WHERE id = ?', [parseInt(id)]);
    
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    db.run('DELETE FROM suppliers WHERE id = ?', [parseInt(id)]);
    addHistory('DELETE', 'supplier', parseInt(id), `Deleted supplier: ${supplier.company_name}`);
    
    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getLowStockProducts = (req, res) => {
  try {
    const products = db.all(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.quantity <= p.reorder_level
      ORDER BY p.quantity ASC
    `);
    res.json(products);
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
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  createCategory,
  deleteCategory,
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getLowStockProducts
};
