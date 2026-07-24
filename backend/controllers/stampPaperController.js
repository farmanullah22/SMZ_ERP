const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { StampPaper, addHistory } = require('../database/db');

const DOC_DIR = path.join(__dirname, '../../frontend/uploads/stamp-docs');
if (!fs.existsSync(DOC_DIR)) fs.mkdirSync(DOC_DIR, { recursive: true });

const docStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, DOC_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + ext);
  }
});
const uploadDoc = multer({ storage: docStorage, limits: { fileSize: 20 * 1024 * 1024 } });

function pickBody(body, existing) {
  const fields = ['name', 'type', 'value', 'stamp_number', 'customer_name', 'mobile', 'purpose', 'documents', 'price', 'profit'];
  const out = {};
  fields.forEach(f => {
    if (body[f] !== undefined && body[f] !== null && body[f] !== '') {
      out[f] = body[f];
    } else if (existing && existing[f] !== undefined) {
      out[f] = existing[f];
    }
  });
  if (body.price !== undefined && body.price !== null && body.price !== '') out.price = parseFloat(body.price);
  if (body.profit !== undefined && body.profit !== null && body.profit !== '') out.profit = parseFloat(body.profit);
  else if (body.profit === '' || body.profit === null) out.profit = null;
  if (body.value !== undefined && body.value !== null && body.value !== '') out.value = parseFloat(body.value);
  if (typeof out.documents === 'string') {
    out.documents = out.documents.split(',').map(s => s.trim()).filter(Boolean);
  }
  return out;
}

const getStampPapers = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};
    if (search) filter.name = { $regex: search, $options: 'i' };
    const items = await StampPaper.find(filter).sort('-created_at');
    res.json(items.map(i => i.toJSON()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createStampPaper = async (req, res) => {
  try {
    const { name, price } = req.body;
    if (!name || name.trim() === '') return res.status(400).json({ error: 'Stamp paper name is required' });
    if (price === undefined || price === null || price === '') return res.status(400).json({ error: 'Price is required' });
    const parsedPrice = parseFloat(price);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) return res.status(400).json({ error: 'Price must be a valid number' });

    const data = pickBody(req.body);
    data.name = name.trim();
    data.price = parsedPrice;
    if (!data.documents) data.documents = [];
    const item = await StampPaper.create(data);
    addHistory('CREATE', 'stamp_paper', item.id, `Created stamp paper: ${name.trim()}`);
    res.status(201).json(item.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateStampPaper = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await StampPaper.findById(id);
    if (!existing) return res.status(404).json({ error: 'Stamp paper not found' });

    const body = req.body;
    if (body.name !== undefined && (body.name === null || body.name.trim() === '')) {
      return res.status(400).json({ error: 'Stamp paper name is required' });
    }

    const data = pickBody(body, existing.toJSON());
    if (data.name) data.name = data.name.trim();
    if (data.price !== undefined && (Number.isNaN(data.price) || data.price < 0)) {
      return res.status(400).json({ error: 'Price must be a valid number' });
    }

    await StampPaper.findByIdAndUpdate(id, data);
    addHistory('UPDATE', 'stamp_paper', id, `Updated stamp paper: ${data.name || existing.name}`);
    const updated = await StampPaper.findById(id);
    res.json(updated.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteStampPaper = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await StampPaper.findById(id);
    if (!existing) return res.status(404).json({ error: 'Stamp paper not found' });
    await StampPaper.findByIdAndDelete(id);
    addHistory('DELETE', 'stamp_paper', id, `Deleted stamp paper: ${existing.name}`);
    res.json({ message: 'Stamp paper deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const uploadDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = '/uploads/stamp-docs/' + req.file.filename;
    res.json({ url, filename: req.file.filename });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { uploadDoc, getStampPapers, createStampPaper, updateStampPaper, deleteStampPaper, uploadDocument };
