const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { WebsiteContent, StampPaper, addHistory } = require('../database/db');

const UPLOAD_DIR = path.join(__dirname, '../../frontend/uploads/website');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const contentStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
    cb(null, name);
  }
});
const upload = multer({ storage: contentStorage, limits: { fileSize: 10 * 1024 * 1024 } });

async function getDoc() {
  let doc = await WebsiteContent.findOne();
  if (!doc) {
    doc = await WebsiteContent.create(getDefaultContent());
  }
  return doc;
}

function getDefaultContent() {
  return {
    site: { site_name: 'SMZ ERP', logo: '' },
    hero: {
      badge: 'All-in-One Shop Management',
      heading: 'Manage Your Shop Records, Documents & Finances in One Place',
      subheading: 'Keep customer records, stamp papers, birth certificates, EasyPaisa/JazzCash transactions, mobile load sales, inventory, and accounts organized — all from a single dashboard.',
      description: 'Never lose track of customer data again. Search any record instantly by name, mobile number, CNIC, or stamp paper number — even years later.',
      button1_text: 'Get Started',
      button1_link: '#contact',
      button2_text: 'Contact Us',
      button2_link: '#contact',
      image: ''
    },
    stampSearch: {
      heading: 'Find Any Stamp Paper Instantly',
      description: 'Enter a Stamp Paper Number to quickly find customer details, documents, issue date, purpose, and complete transaction history.',
      placeholder: 'Enter Stamp Paper Number',
      button_text: 'Search Record',
      hint: 'Search records from years of stored data within seconds.'
    },
    about: {
      tag: 'About the Software',
      heading: 'Built for Your Shop, Your Way',
      text: 'This software is designed specifically for your shop — whether you run a PCO, mobile shop, document center, or EasyPaisa/JazzCash service. It helps you manage customer records, documents, inventory, and daily transactions from one easy-to-use dashboard.'
    },
    features: {
      tag: 'Everything You Need',
      heading: 'Everything You Need to Run Your Shop',
      items: [
        { icon: 'users', title: 'Customer Management', text: 'Store customer details, CNIC information, contact numbers, and complete service history.', color: '#eef2ff' },
        { icon: 'file-signature', title: 'Stamp Paper Management', text: 'Manage stamp paper records with document uploads, advanced search, and long-term storage.', color: '#fef3c7' },
        { icon: 'file-contract', title: 'Birth Certificate & Services', text: 'Track applications, monitor status, and manage service requests efficiently.', color: '#dbeafe' },
        { icon: 'mobile-alt', title: 'EasyPaisa & JazzCash', text: 'Record transactions, calculate commissions, and generate detailed reports.', color: '#d1fae5' },
        { icon: 'sim-card', title: 'Mobile Load Management', text: 'Track all network top-ups and recharge transactions with sales reports.', color: '#fce7f3' },
        { icon: 'boxes', title: 'Inventory Management', text: 'Manage stock levels, purchases, sales, and track profits on phones and accessories.', color: '#e0e7ff' },
        { icon: 'wallet', title: 'Accounting System', text: 'Track income, expenses, cash flow, profits, and customer dues.', color: '#ffedd5' },
        { icon: 'chart-bar', title: 'Reports & Analytics', text: 'Generate daily, weekly, monthly, and yearly business reports.', color: '#ede9fe' }
      ]
    },
    whyChoose: {
      tag: 'Why Choose Us',
      heading: 'Why Shop Owners Trust This Software',
      items: [
        { icon: 'bolt', title: 'Lightning Fast Search', text: 'Find any customer, document, or transaction in seconds.' },
        { icon: 'shield-alt', title: 'Secure Data Storage', text: 'Keep your records protected with automatic backups and secure access.' },
        { icon: 'smile', title: 'Easy to Use', text: 'Simple interface designed for shop owners — no technical skills needed.' },
        { icon: 'chart-line', title: 'Business Insights', text: 'Monitor sales, profits, expenses, and performance through detailed reports.' },
        { icon: 'dollar-sign', title: 'Save Time & Money', text: 'No more searching through papers or notebooks — everything is digital.' },
        { icon: 'database', title: 'Long-Term Record Keeping', text: 'Access records and documents even after 5-10 years.' }
      ]
    },
    cta: {
      heading: 'Ready to Organize Your Shop?',
      text: 'Stop managing records manually. Switch to a complete shop management system designed to make your daily work easier and faster.',
      button1_text: 'Get Started',
      button1_link: '#contact',
      button2_text: 'Contact Us',
      button2_link: '#contact'
    },
    contact: {
      tag: 'Get in Touch',
      heading: 'Contact Us',
      text: 'Have questions about the software? Reach out to schedule a demo, discuss your requirements, or learn more about how it can help your shop.',
      phone: '+92 300 1234567',
      email: 'info@smz.com',
      address: 'Lahore, Pakistan'
    },
    heroSlider: { images: [] }
  };
}

const getContent = async (req, res) => {
  const doc = await getDoc();
  res.json(doc);
};

const getManageContent = async (req, res) => {
  const doc = await getDoc();
  res.json(doc);
};

const updateSection = async (req, res) => {
  try {
    const { section } = req.params;
    const allowedSections = ['site', 'hero', 'stampSearch', 'about', 'features', 'whyChoose', 'cta', 'contact', 'heroSlider'];
    if (!allowedSections.includes(section)) {
      return res.status(400).json({ error: 'Invalid section' });
    }
    const doc = await getDoc();
    doc.set(section, req.body);
    await doc.save();
    addHistory('UPDATE', 'website_content', doc._id, `Updated website ${section} section`);
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = '/uploads/website/' + req.file.filename;
    res.json({ url, filename: req.file.filename });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const searchStampPaper = async (req, res) => {
  try {
    const { number } = req.query;
    if (!number) return res.status(400).json({ error: 'Stamp paper number is required' });
    const papers = await StampPaper.find({ stamp_number: number }).limit(20);
    res.json({ results: papers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const resetContent = async (req, res) => {
  try {
    const doc = await getDoc();
    const defaults = getDefaultContent();
    Object.keys(defaults).forEach(key => doc.set(key, defaults[key]));
    await doc.save();
    addHistory('UPDATE', 'website_content', doc._id, 'Reset website content to defaults');
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { upload, getContent, getManageContent, updateSection, uploadImage, searchStampPaper, resetContent };
