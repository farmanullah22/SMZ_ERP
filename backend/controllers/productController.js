const { Product, Category, Supplier, addHistory } = require('../database/db');

const getAllProducts = async (req, res) => {
  try {
    const { search, category, supplier, lowStock, sort, startDate, endDate } = req.query;
    const filter = {};
    if (startDate) filter.created_at = { ...filter.created_at, $gte: new Date(startDate) };
    if (endDate) filter.created_at = { ...filter.created_at, $lte: new Date(endDate) };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }
    if (category && category !== 'all') filter.category = category;
    if (supplier && supplier !== 'all') filter.supplier = supplier;
    if (lowStock === 'true') filter.$expr = { $lte: ['$quantity', '$reorder_level'] };
    const sortMap = {
      name_asc: 'name', name_desc: '-name',
      price_asc: 'sale_price', price_desc: '-sale_price',
      quantity_asc: 'quantity', quantity_desc: '-quantity',
      newest: '-created_at'
    };
    const products = await Product.find(filter)
      .populate('category', 'name')
      .populate('supplier', 'company_name')
      .sort(sortMap[sort] || 'name');
    const result = products.map(p => ({
      ...p.toJSON(),
      category_name: p.category?.name || null,
      supplier_name: p.supplier?.company_name || null,
      stock_status: p.quantity <= p.reorder_level ? 'low' : 'ok'
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name')
      .populate('supplier', 'company_name');
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({
      ...product.toJSON(),
      category_name: product.category?.name || null,
      supplier_name: product.supplier?.company_name || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const { sku, name, category_id, supplier_id, cost_price, sale_price, quantity, reorder_level, description, imei, barcode } = req.body;
    if (!name || cost_price === undefined || sale_price === undefined) {
      return res.status(400).json({ error: 'Name, cost price, and sale price are required' });
    }
    const product = await Product.create({
      sku: sku || `SKU-${Date.now()}`,
      name,
      category: category_id || null,
      supplier: supplier_id || null,
      cost_price,
      sale_price,
      quantity: quantity || 0,
      reorder_level: reorder_level || 10,
      description: description || null,
      imei: imei || null,
      barcode: barcode || null
    });
    addHistory('CREATE', 'product', product.id, `Created product: ${name}`);
    res.status(201).json(product.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const oldProduct = await Product.findById(id);
    if (!oldProduct) return res.status(404).json({ error: 'Product not found' });
    const { sku, name, category_id, supplier_id, cost_price, sale_price, quantity, reorder_level, description, imei, barcode } = req.body;
    const update = {};
    if (sku !== undefined) update.sku = sku;
    if (name !== undefined) update.name = name;
    if (category_id !== undefined) update.category = category_id || null;
    if (supplier_id !== undefined) update.supplier = supplier_id || null;
    if (cost_price !== undefined) update.cost_price = cost_price;
    if (sale_price !== undefined) update.sale_price = sale_price;
    if (quantity !== undefined) update.quantity = quantity;
    if (reorder_level !== undefined) update.reorder_level = reorder_level;
    if (description !== undefined) update.description = description || null;
    if (imei !== undefined) update.imei = imei || null;
    if (barcode !== undefined) update.barcode = barcode || null;
    await Product.findByIdAndUpdate(id, update);
    const updated = await Product.findById(id);
    addHistory('UPDATE', 'product', id, `Updated product: ${updated.name}`);
    res.json(updated.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    await Product.findByIdAndDelete(id);
    addHistory('DELETE', 'product', id, `Deleted product: ${product.name}`);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort('name');
    res.json(categories.map(c => c.toJSON()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required' });
    const category = await Category.create({ name });
    res.status(201).json(category.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    await Product.updateMany({ category: id }, { $set: { category: null } });
    await Category.findByIdAndDelete(id);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getSuppliers = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = {};
    if (startDate) match.created_at = { ...match.created_at, $gte: new Date(startDate) };
    if (endDate) match.created_at = { ...match.created_at, $lte: new Date(endDate) };
    const pipeline = [];
    if (startDate || endDate) pipeline.push({ $match: match });
    pipeline.push(
      { $lookup: { from: 'products', localField: '_id', foreignField: 'supplier', as: 'products' } },
      { $addFields: { product_count: { $size: '$products' } } },
      { $project: { products: 0 } },
      { $sort: { company_name: 1 } }
    );
    const suppliers = await Supplier.aggregate(pipeline);
    const result = suppliers.map(s => {
      const { _id, __v, products, ...rest } = s;
      return { id: _id.toString(), ...rest };
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createSupplier = async (req, res) => {
  try {
    const { company_name, contact_person, email, phone, address, notes } = req.body;
    if (!company_name) return res.status(400).json({ error: 'Company name is required' });
    const supplier = await Supplier.create({ company_name, contact_person, email, phone, address, notes });
    addHistory('CREATE', 'supplier', supplier.id, `Created supplier: ${company_name}`);
    res.status(201).json(supplier.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await Supplier.findById(id);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    const { company_name, contact_person, email, phone, address, notes } = req.body;
    const update = {};
    if (company_name !== undefined) update.company_name = company_name;
    if (contact_person !== undefined) update.contact_person = contact_person;
    if (email !== undefined) update.email = email;
    if (phone !== undefined) update.phone = phone;
    if (address !== undefined) update.address = address;
    if (notes !== undefined) update.notes = notes;
    await Supplier.findByIdAndUpdate(id, update);
    const updated = await Supplier.findById(id);
    addHistory('UPDATE', 'supplier', id, `Updated supplier: ${company_name || supplier.company_name}`);
    res.json(updated.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await Supplier.findById(id);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    await Supplier.findByIdAndDelete(id);
    addHistory('DELETE', 'supplier', id, `Deleted supplier: ${supplier.company_name}`);
    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({ $expr: { $lte: ['$quantity', '$reorder_level'] } })
      .populate('category', 'name')
      .sort('quantity');
    const result = products.map(p => ({
      ...p.toJSON(),
      category_name: p.category?.name || null
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllProducts, getProduct, createProduct, updateProduct, deleteProduct,
  getCategories, createCategory, deleteCategory,
  getSuppliers, createSupplier, updateSupplier, deleteSupplier, getLowStockProducts
};
