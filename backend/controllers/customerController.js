const { Customer, Sale, SaleItem, addHistory } = require('../database/db');

const getAllCustomers = async (req, res) => {
  try {
    const { search, startDate, endDate } = req.query;
    const filter = {};
    if (startDate) filter.created_at = { ...filter.created_at, $gte: new Date(startDate) };
    if (endDate) filter.created_at = { ...filter.created_at, $lte: new Date(endDate) };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    const customers = await Customer.find(filter).sort('name');
    res.json(customers.map(c => c.toJSON()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const sales = await Sale.aggregate([
      { $match: { customer: customer._id } },
      {
        $lookup: {
          from: 'saleitems',
          localField: '_id',
          foreignField: 'sale',
          as: 'items'
        }
      },
      {
        $addFields: {
          item_count: { $size: '$items' }
        }
      },
      { $project: { items: 0 } },
      { $sort: { created_at: -1 } },
      { $limit: 10 }
    ]);

    const result = sales.map(s => {
      const { _id, __v, ...rest } = s;
      return { id: _id.toString(), ...rest };
    });

    res.json({ ...customer.toJSON(), recent_sales: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createCustomer = async (req, res) => {
  try {
    const { name, email, phone, address, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Customer name is required' });
    const customer = await Customer.create({
      name,
      email: email || null,
      phone: phone || null,
      address: address || null,
      notes: notes || null
    });
    res.status(201).json(customer.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const { name, email, phone, address, notes } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (email !== undefined) update.email = email;
    if (phone !== undefined) update.phone = phone;
    if (address !== undefined) update.address = address;
    if (notes !== undefined) update.notes = notes;

    await Customer.findByIdAndUpdate(id, update);
    addHistory('UPDATE', 'customer', id, `Updated customer: ${name || customer.name}`);
    const updated = await Customer.findById(id);
    res.json(updated.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    await Customer.findByIdAndDelete(id);
    addHistory('DELETE', 'customer', id, `Deleted customer: ${customer.name}`);
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAllCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer };
