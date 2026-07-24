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
      badge: 'Complete Business Solution',
      heading: 'Manage Your PCO, Mobile Shop & Document Records in One Powerful Software',
      subheading: 'Store customer records, stamp papers, birth certificates, EasyPaisa/JazzCash transactions, mobile load sales, inventory, accounts, and documents securely in one centralized system.',
      description: 'Never lose customer data again. Search any record within seconds using a name, mobile number, CNIC, application number, or stamp paper number—even after many years.',
      button1_text: 'Get Free Demo',
      button1_link: '#contact',
      button2_text: 'Contact Us',
      button2_link: '#contact',
      image: '',
      stats: [
        { number: '10+', label: 'Years Record Storage' },
        { number: 'Instant', label: 'Smart Search' },
        { number: 'Secure', label: 'Cloud Backup' },
        { number: 'Multi', label: 'User Access' }
      ]
    },
    stampSearch: {
      heading: 'Find Any Stamp Paper Instantly',
      description: 'Enter a Stamp Paper Number to quickly locate customer details, documents, issue date, purpose, and complete transaction history.',
      placeholder: 'Enter Stamp Paper Number',
      button_text: 'Search Record',
      hint: 'Search records from years of stored data within seconds.'
    },
    about: {
      tag: 'About Software',
      heading: 'Complete Business Management Solution',
      text: 'Our software is specially designed for PCOs, Mobile Shops, EasyPaisa/JazzCash Retailers, and Document Service Providers. It helps businesses manage customer records, documents, inventory, financial transactions, and daily operations from a single dashboard.'
    },
    features: {
      tag: 'Everything You Need',
      heading: 'Everything You Need to Run Your Business',
      items: [
        { icon: 'users', title: 'Customer Management', text: 'Store customer details, CNIC information, contact numbers, and complete service history.', color: '#eef2ff' },
        { icon: 'file-signature', title: 'Stamp Paper Management', text: 'Manage stamp paper records with document uploads, advanced search, and long-term storage.', color: '#fef3c7' },
        { icon: 'file-contract', title: 'Birth Certificate & Services', text: 'Track applications, monitor status, and manage service requests efficiently.', color: '#dbeafe' },
        { icon: 'mobile-alt', title: 'EasyPaisa & JazzCash', text: 'Record transactions, calculate commissions, and generate detailed reports.', color: '#d1fae5' },
        { icon: 'sim-card', title: 'Mobile Load Management', text: 'Track all network top-ups and recharge transactions with sales reports.', color: '#fce7f3' },
        { icon: 'boxes', title: 'Inventory Management', text: 'Manage mobile phones, accessories, stock levels, purchases, sales, and profits.', color: '#e0e7ff' },
        { icon: 'wallet', title: 'Accounting System', text: 'Track income, expenses, cash flow, profits, and customer dues.', color: '#ffedd5' },
        { icon: 'chart-bar', title: 'Reports & Analytics', text: 'Generate daily, weekly, monthly, and yearly business reports.', color: '#ede9fe' }
      ]
    },
    whyChoose: {
      tag: 'Why Choose Us',
      heading: 'Why Businesses Trust Our Software',
      items: [
        { icon: 'bolt', title: 'Lightning Fast Search', text: 'Find any customer, document, or transaction in seconds.' },
        { icon: 'shield-alt', title: 'Secure Data Storage', text: 'Keep records protected with automatic backups and secure access controls.' },
        { icon: 'smile', title: 'Easy to Use', text: 'Simple interface designed for shop owners and staff.' },
        { icon: 'chart-line', title: 'Business Insights', text: 'Monitor sales, profits, expenses, and performance through detailed reports.' },
        { icon: 'user-friends', title: 'Multi-User Support', text: 'Separate accounts and permissions for owners and employees.' },
        { icon: 'database', title: 'Long-Term Record Keeping', text: 'Access records and documents even after 5-10 years.' }
      ]
    },
    process: {
      tag: 'Simple Process',
      heading: 'How It Works',
      steps: [
        { number: 1, title: 'Create Customer Record', text: 'Add customer information and service details.' },
        { number: 2, title: 'Upload Documents', text: 'Attach PDFs, scanned copies, images, and certificates.' },
        { number: 3, title: 'Manage Transactions', text: 'Record payments, services, sales, and financial activities.' },
        { number: 4, title: 'Search Anytime', text: 'Retrieve records instantly whenever needed.' }
      ]
    },
    testimonials: {
      tag: 'Testimonials',
      heading: 'Trusted by Shop Owners',
      items: [
        { name: 'Ahmed R.', role: 'Shop Owner, Lahore', text: 'This software has completely changed how we manage customer records and stamp papers. Everything is organized and easy to find.', rating: 5 },
        { name: 'Saima K.', role: 'Retailer, Karachi', text: 'We can now track EasyPaisa transactions, mobile loads, and inventory from one dashboard.', rating: 5 },
        { name: 'Muhammad A.', role: 'PCO Operator, Islamabad', text: 'The search feature saves us hours every week. Finding old customer records is now effortless.', rating: 5 }
      ]
    },
    cta: {
      heading: 'Ready to Digitize Your Business?',
      text: 'Stop managing records manually. Upgrade to a complete business management system designed for PCOs, Mobile Shops, and Document Service Centers.',
      button1_text: 'Request Free Demo',
      button1_link: '#contact',
      button2_text: 'Contact Sales',
      button2_link: '#contact'
    },
    contact: {
      tag: 'Get in Touch',
      heading: 'Contact Us',
      text: 'Have questions about our software? Contact our team to schedule a demo, discuss your requirements, or get pricing information.',
      phone: '+92 300 1234567',
      email: 'info@smz.com',
      address: 'Lahore, Pakistan'
    }
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
    const allowedSections = ['site', 'hero', 'stampSearch', 'about', 'features', 'whyChoose', 'process', 'testimonials', 'cta', 'contact'];
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
    const papers = await StampPaper.find({
      $or: [
        { stamp_number: { $regex: number, $options: 'i' } },
        { name: { $regex: number, $options: 'i' } }
      ]
    }).limit(20);
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
