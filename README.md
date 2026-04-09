# SMZ - Shop Management System

A comprehensive desktop application for managing your shop. Complete offline solution with Bank/Cash accounts, multi-user support, and professional reporting.

## Features

- **Dashboard**: Real-time overview with sales trends, profit/loss charts, and low stock alerts
- **Products**: Full inventory management with SKU, categories, suppliers
- **Sales (POS)**: Quick point-of-sale with cart system and invoice generation
- **Purchases**: Track supplier purchases and update inventory
- **Customers**: Customer database with purchase history
- **Suppliers**: Supplier management with contact info
- **Accounts**: Bank & Cash accounts with deposit/withdraw/transfer
- **Reports**: Sales, Profit/Loss, Inventory, Customer, Supplier, Purchase reports
- **PDF/Excel Export**: Export reports for record keeping
- **User Management**: Admin/Cashier roles with password protection
- **Dark/Light Mode**: Theme customization
- **Data Backup**: Database backup and restore

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: SQLite (sql.js)
- **Charts**: Chart.js
- **PDF Export**: jsPDF
- **Excel Export**: xlsx
- **Desktop**: Electron

## Installation

### Prerequisites
- Node.js (v16 or higher)

### Quick Start

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm run server
```

3. Open browser: `http://localhost:3000`

### Desktop App (Electron)

```bash
npm start
```

## Default Login

- **Username**: `admin`
- **Password**: `admin123`

## Project Structure

```
├── backend/
│   ├── controllers/    # API controllers
│   ├── database/       # SQLite database
│   ├── routes/         # Express routes
│   └── server.js       # Express server
├── frontend/
│   ├── css/           # Stylesheets
│   ├── js/            # JavaScript modules
│   └── index.html     # Main HTML file
├── main.js            # Electron main process
├── package.json
└── README.md
```

## Features Overview

### Dashboard
- Total Sales & Profit tracking
- Total Expenses monitoring
- Inventory Value calculation
- Sales trend charts (Daily/Weekly/Monthly)
- Low stock alerts

### Products Management
- SKU-based product tracking
- Category & Supplier association
- Cost Price & Sale Price
- Reorder level alerts
- Stock quantity tracking

### Sales (POS)
- Quick product selection
- Shopping cart system
- Multiple items per sale
- Automatic inventory deduction
- Invoice generation
- Customer selection (optional)

### Purchases
- Supplier-based purchases
- Product cost price updates
- Automatic inventory increase
- Purchase history tracking

### Bank & Cash Accounts
- Main Cash Account (auto-created)
- Multiple Bank Accounts
- Deposit/Withdraw/Transfer between accounts
- Transaction history
- Balance tracking

### Reports
- **Sales Report**: All sales with filters
- **Profit & Loss**: Financial summary
- **Inventory Report**: Stock levels and values
- **Customer Report**: Customer database
- **Supplier Report**: Supplier database
- **Purchase Report**: Purchase history

### Settings
- Dark/Light theme toggle
- User management (Admin only)
- Password change
- Database backup

## Currency

All values displayed in **PKR (Pakistani Rupees)**

## License

MIT License - Free to use and modify

© 2026 SMZ Team
