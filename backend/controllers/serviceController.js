const { Service, addHistory } = require('../database/db');

const getAllServices = async (req, res) => {
  try {
    const { search, status, startDate, endDate } = req.query;
    const filter = {};
    if (startDate) filter.created_at = { ...filter.created_at, $gte: new Date(startDate) };
    if (endDate) filter.created_at = { ...filter.created_at, $lte: new Date(endDate) };
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { customer_name: { $regex: search, $options: 'i' } },
        { application_number: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { cnic: { $regex: search, $options: 'i' } }
      ];
    }
    const items = await Service.find(filter).sort('-created_at');
    res.json(items.map(i => i.toJSON()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getService = async (req, res) => {
  try {
    const item = await Service.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Service not found' });
    res.json(item.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createService = async (req, res) => {
  try {
    const { application_number, customer_name, mobile, cnic, service_type, status, fee, notes } = req.body;
    if (!customer_name) return res.status(400).json({ error: 'Customer name is required' });
    const item = await Service.create({
      application_number: application_number || `SVC-${Date.now()}`,
      customer_name, mobile, cnic,
      service_type: service_type || 'Birth Certificate',
      status: status || 'pending',
      fee: fee || 0,
      notes
    });
    addHistory('CREATE', 'service', item.id, `Created service: ${item.application_number} - ${customer_name}`);
    res.status(201).json(item.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Service.findById(id);
    if (!existing) return res.status(404).json({ error: 'Service not found' });
    const update = {};
    ['application_number', 'customer_name', 'mobile', 'cnic', 'service_type', 'status', 'fee', 'notes'].forEach(k => {
      if (req.body[k] !== undefined) update[k] = req.body[k];
    });
    await Service.findByIdAndUpdate(id, update);
    addHistory('UPDATE', 'service', id, `Updated service: ${existing.application_number}`);
    const updated = await Service.findById(id);
    res.json(updated.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Service.findById(id);
    if (!existing) return res.status(404).json({ error: 'Service not found' });
    await Service.findByIdAndDelete(id);
    addHistory('DELETE', 'service', id, `Deleted service: ${existing.application_number}`);
    res.json({ message: 'Service deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAllServices, getService, createService, updateService, deleteService };
