const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://engfarmanullah00_db_user:VWeuxxo4vCtupD4X@cluster0.abig4i0.mongodb.net/smz_erp';

const toJSON = {
  virtuals: true,
  transform(doc, ret) {
    ret.id = ret._id.toString();
    if (ret._id) delete ret._id;
    if (ret.__v != null) delete ret.__v;
  }
};

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'cashier' }
}, { timestamps: { createdAt: 'created_at' }, toJSON });

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }
}, { timestamps: { createdAt: 'created_at' }, toJSON });

const supplierSchema = new mongoose.Schema({
  company_name: { type: String, required: true },
  contact_person: String,
  email: String,
  phone: String,
  address: String,
  notes: String
}, { timestamps: { createdAt: 'created_at' }, toJSON });

const productSchema = new mongoose.Schema({
  sku: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', default: null },
  cost_price: { type: Number, required: true, default: 0 },
  sale_price: { type: Number, required: true, default: 0 },
  quantity: { type: Number, default: 0 },
  reorder_level: { type: Number, default: 10 },
  description: String
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, toJSON });

const stampPaperSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  profit: { type: Number, default: null }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, toJSON });

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  phone: String,
  address: String,
  notes: String,
  total_purchases: { type: Number, default: 0 },
  total_spent: { type: Number, default: 0 }
}, { timestamps: { createdAt: 'created_at' }, toJSON });

const saleSchema = new mongoose.Schema({
  invoice_number: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
  subtotal: { type: Number, default: 0 },
  total_amount: { type: Number, default: 0 },
  total_profit: { type: Number, default: 0 },
  payment_method: { type: String, default: 'cash' },
  status: { type: String, default: 'completed' }
}, { timestamps: { createdAt: 'created_at' }, toJSON });

const saleItemSchema = new mongoose.Schema({
  sale: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  product_name: { type: String, required: true },
  quantity: { type: Number, required: true },
  cost_price: { type: Number, required: true },
  sale_price: { type: Number, required: true },
  subtotal: { type: Number, required: true },
  profit: { type: Number, required: true }
}, { toJSON });

const purchaseSchema = new mongoose.Schema({
  reference_number: { type: String, unique: true, sparse: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  total_amount: { type: Number, default: 0 },
  notes: String,
  status: { type: String, default: 'completed' }
}, { timestamps: { createdAt: 'created_at' }, toJSON });

const purchaseItemSchema = new mongoose.Schema({
  purchase: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  product_name: { type: String, required: true },
  quantity: { type: Number, required: true },
  cost_price: { type: Number, required: true },
  subtotal: { type: Number, required: true }
}, { toJSON });

const bankAccountSchema = new mongoose.Schema({
  name: { type: String, required: true },
  account_number: String,
  balance: { type: Number, default: 0 },
  description: String
}, { timestamps: { createdAt: 'created_at' }, toJSON });

const cashAccountSchema = new mongoose.Schema({
  name: { type: String, default: 'Main Cash' },
  opening_balance: { type: Number, default: 0 },
  current_balance: { type: Number, default: 0 },
  description: String
}, { timestamps: { createdAt: 'created_at' }, toJSON });

const transactionSchema = new mongoose.Schema({
  type: { type: String, required: true },
  category: { type: String, required: true },
  account_type: { type: String, required: true },
  account_id: { type: mongoose.Schema.Types.ObjectId, default: null },
  amount: { type: Number, required: true },
  description: String,
  profit: { type: Number, default: null },
  reference_id: { type: mongoose.Schema.Types.ObjectId, default: null },
  reference_type: String
}, { timestamps: { createdAt: 'created_at' }, toJSON });

const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true }
}, { toJSON });

const historySchema = new mongoose.Schema({
  action_type: { type: String, required: true },
  entity_type: { type: String, required: true },
  entity_id: String,
  description: { type: String, required: true },
  user_id: String
}, { timestamps: { createdAt: 'created_at' }, toJSON });

const expenseSchema = new mongoose.Schema({
  category: { type: String, default: 'Other' },
  amount: { type: Number, required: true },
  description: String,
  payment_method: { type: String, default: 'cash' },
  expense_date: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at' }, toJSON });

const User = mongoose.model('User', userSchema);
const Category = mongoose.model('Category', categorySchema);
const Supplier = mongoose.model('Supplier', supplierSchema);
const Product = mongoose.model('Product', productSchema);
const StampPaper = mongoose.model('StampPaper', stampPaperSchema);
const Customer = mongoose.model('Customer', customerSchema);
const Sale = mongoose.model('Sale', saleSchema);
const SaleItem = mongoose.model('SaleItem', saleItemSchema);
const Purchase = mongoose.model('Purchase', purchaseSchema);
const PurchaseItem = mongoose.model('PurchaseItem', purchaseItemSchema);
const BankAccount = mongoose.model('BankAccount', bankAccountSchema);
const CashAccount = mongoose.model('CashAccount', cashAccountSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const Setting = mongoose.model('Setting', settingSchema);
const History = mongoose.model('History', historySchema);
const Expense = mongoose.model('Expense', expenseSchema);

async function initDatabase() {
  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'MongoDB connection error:'));
  db.once('open', () => console.log('Connected to MongoDB'));

  await mongoose.connect(MONGO_URI);

  const userCount = await User.countDocuments();
  if (userCount === 0) {
    await User.create({ username: 'admin', password: 'admin123', role: 'admin' });
  }

  const cashCount = await CashAccount.countDocuments();
  if (cashCount === 0) {
    await CashAccount.create({ name: 'Main Cash', opening_balance: 0, current_balance: 0 });
  }

  const settingCount = await Setting.countDocuments();
  if (settingCount === 0) {
    await Setting.insertMany([
      { key: 'theme', value: 'light' },
      { key: 'currency', value: 'PKR' },
      { key: 'store_name', value: 'SMZ Mobile Zone' }
    ]);
  }

  const catCount = await Category.countDocuments();
  if (catCount === 0) {
    await Category.insertMany(['Financial', 'Printing', 'Documents', 'Other'].map(name => ({ name })));
  }

  return db;
}

function addHistory(actionType, entityType, entityId, description) {
  History.create({ action_type: actionType, entity_type: entityType, entity_id: String(entityId), description })
    .catch(e => console.error('History error:', e));
}

module.exports = {
  initDatabase,
  addHistory,
  User,
  Category,
  Supplier,
  Product,
  StampPaper,
  Customer,
  Sale,
  SaleItem,
  Purchase,
  PurchaseItem,
  BankAccount,
  CashAccount,
  Transaction,
  Setting,
  History,
  Expense
};
