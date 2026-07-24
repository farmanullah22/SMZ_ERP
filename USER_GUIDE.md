# SMZ ERP System — User Guide

## Table of Contents
1. [What is SMZ ERP?](#1-what-is-smz-erp)
2. [How to Access](#2-how-to-access)
3. [Login & User Roles](#3-login--user-roles)
4. [Navigation Overview](#4-navigation-overview)
5. [Dashboard (Home Screen)](#5-dashboard-home-screen)
6. [Products & Services](#6-products--services)
7. [Sales (Checkout / Billing)](#7-sales-checkout--billing)
8. [Purchases (Stock In)](#8-purchases-stock-in)
9. [Customers](#9-customers)
10. [Suppliers](#10-suppliers)
11. [Stamp Paper](#11-stamp-paper)
12. [Services (Govt / Other Applications)](#12-services-govt--other-applications)
13. [EasyPaisa / JazzCash](#13-easypaisa--jazzcash)
14. [Mobile Load / Top-Up](#14-mobile-load--top-up)
15. [Credit / Due Management](#15-credit--due-management)
16. [Accounts (Cash & Bank)](#16-accounts-cash--bank)
17. [Expenses](#17-expenses)
18. [Analytics](#18-analytics)
19. [Reports](#19-reports)
20. [Activity Logs](#20-activity-logs)
21. [Website Manage](#21-website-manage)
22. [Settings](#22-settings)
23. [Common Workflows](#23-common-workflows)

---

## 1. What is SMZ ERP?

SMZ ERP is a complete **Shop Management System** built for mobile/electronics shops. It manages:

- **Sales** — Billing customers at the counter
- **Inventory** — Products, stock levels, barcodes, IMEI tracking
- **Purchases** — Buying stock from suppliers
- **Customers & Suppliers** — Contact records with purchase history
- **Accounts** — Cash in hand, bank accounts, transfers
- **Expenses** — Daily operational costs
- **Mobile Financial Services** — EasyPaisa / JazzCash cash in/out
- **Mobile Recharges** — Load/top-up for all networks (Jazz, Telenor, Zong, Ufone)
- **Credit/Due Tracking** — Money owed by/to customers
- **Service Requests** — Birth certificates, document applications, etc.
- **Stamp Paper** — Record stamp paper inventory & sales
- **Reports & Analytics** — Visual charts, PDF/Excel exports
- **Activity Logs** — Full audit trail of everything
- **Public Website** — Manage the shop's live website content

**Default Currency:** Pakistani Rupee (PKR)

---

## 2. How to Access

Open a web browser and go to:

```
http://localhost:3000
```

*(If hosted on a server, replace `localhost` with the server's IP or domain name.)*

---

## 3. Login & User Roles

### Login Screen

- Enter **Username** and **Password**
- Click **Sign In**

### Default Credentials

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | Admin (full access) |

### User Roles

| Role | Access |
|------|--------|
| **Admin** | Full access to everything, including Settings & user management |
| **Cashier** | All daily operations except Settings |

### Changing Password

1. Go to **Settings** (sidebar)
2. Click **Change Password**
3. Enter old password, new password, confirm

### Adding New Users

1. Go to **Settings** → **User Management** section
2. Enter username, password, select role
3. Click **Add User**

---

## 4. Navigation Overview

The sidebar on the left contains **18 menu items**:

```
┌─────────────────────────────┐
│  📊  Dashboard              │ ← Home page
│  📦  Products               │ ← Inventory & services
│  🛒  Sales                  │ ← Billing / checkout
│  🚚  Purchases              │ ← Stock in
│  👥  Customers              │ ← Customer records
│  🏭  Suppliers              │ ← Supplier records
│  📄  Stamp Paper            │ ← Stamp paper stock
│  📋  Services               │ ← Govt applications
│  📱  EasyPaisa/JazzCash     │ ← Mobile financial transactions
│  📞  Mobile Load/Top-Up     │ ← Recharge transactions
│  💳  Credit / Due           │ ← Money tracking
│  👛  Accounts               │ ← Cash & bank management
│  🧾  Expenses               │ ← Operational costs
│  📈  Analytics              │ ← Charts & insights
│  📑  Reports                │ ← Printable reports
│  📜  Activity Logs          │ ← Audit trail
│  🌐  Website Manage         │ ← Public website editor
│  ⚙️  Settings               │ ← Admin only
└─────────────────────────────┘
```

To navigate, **click any item** in the sidebar. The page loads in the main area.

---

## 5. Dashboard (Home Screen)

The Dashboard is the first screen you see after login. It shows a **real-time business snapshot**.

### Top Stats Cards

| Card | Shows |
|------|-------|
| **Total Sales** | Total revenue + Today's sales |
| **Total Profit** | Overall profit + This month's profit |
| **Cash in Hand** | Cash balance + Bank total |
| **Purchases** | Total purchase value + Product count |
| **Stamp Papers** | Total stamp value + Stamp profit |
| **Op. Expenses** | Total expenses + Expense count |
| **Stock Value** | Total inventory value + Item count |
| **Net Balance** | Cash + Bank combined |

### Charts

| Chart | What it shows |
|-------|--------------|
| **Sales Trends** | Daily / Weekly / Monthly sales (toggle with buttons) |
| **Profit & Loss** | Profit over time (line chart) |
| **Sales by Category** | Which product categories sell most (doughnut) |
| **Payment Methods** | Cash vs JazzCash vs Other breakdown (pie) |

### Low Stock Alerts

A table at the bottom lists **products below reorder level** — shows name, quantity, and status badge (🔴 Out of Stock / 🟡 Low Stock).

### Date Filter

Use **From / To** date pickers to filter dashboard data by date range.

---

## 6. Products & Services

This is your **inventory master list**. Every item you sell is stored here.

### Product Fields

| Field | Description |
|-------|-------------|
| SKU | Stock Keeping Unit (auto-generated if empty) |
| Name | Product or service name |
| Category | Grouping (e.g., Mobile, Accessory, Documents) |
| Supplier | Who supplies this product |
| Cost Price | Your purchase cost |
| Sale Price | Your selling price |
| Quantity | Current stock count |
| Reorder Level | Minimum stock alert threshold |
| IMEI | Device IMEI number (for phones) |
| Barcode | Product barcode |
| Description | Optional notes |

### How To

**Add a Product:**
1. Go to **Products**
2. Click **Add Service**
3. Fill in the form (Name is required)
4. Click **Save Service**

**Edit a Product:**
1. Click the ✏️ **edit icon** next to any product
2. Update the fields
3. Click **Update Service**

**Delete a Product:**
1. Click the 🗑️ **delete icon** next to any product
2. Confirm deletion

**Filter Products:**
- Use **From/To** dates
- Type in the **search box** (searches name or SKU)
- Select a **Category** or **Supplier** dropdown
- Choose **Sort** order

**Export to PDF:** Click the **PDF** button

### Categories Management

1. Click **Manage Categories** button
2. Add new categories or delete existing ones

---

## 7. Sales (Checkout / Billing)

Process customer purchases here.

### Sales List

Shows all sales with: Invoice#, Customer, Items, Amount, Profit, Payment Method, Status, Date.

**Filters:** Search, date range.

### Creating a New Sale

1. Click **New Sale**
2. Enter **Customer Name** (or select existing)
3. **Add Items:**
   - In the product search box, type to find a product
   - Click the product to add it to the cart
   - Adjust quantity if needed
4. The cart auto-calculates subtotal
5. Choose **Payment Method** (Cash / JazzCash / EasyPaisa / Other)
6. Click **Complete Sale**

The system:
- Generates an **invoice number** (INV-YYYYMMDD-XXXX)
- Deducts product quantities from inventory
- Records profit automatically
- Updates customer's total spent
- Logs the transaction in Activity Logs

### Viewing a Sale

Click the 👁️ **view icon** to see sale details (items, amounts, customer info).

### Deleting a Sale

Click the 🗑️ **delete icon** — this restores product quantities to inventory.

### Export to PDF

Click the **PDF** button.

---

## 8. Purchases (Stock In)

Record when you buy stock from suppliers.

### Purchase List

Shows: Reference#, Supplier, Items, Amount, Status, Date.

### Creating a Purchase

1. Click **New Purchase**
2. Select **Supplier** (or skip)
3. **Add Products:**
   - Search and select products
   - Enter the quantity being purchased
   - The system updates cost price if it changed
4. Click **Complete Purchase**

This **adds quantity** to your inventory.

### Export to PDF

Click the **PDF** button.

---

## 9. Customers

Manage your customer database.

### Customer Fields

| Field | Description |
|-------|-------------|
| Name | Customer name (required) |
| Email | Email address |
| Phone | Contact number |
| CNIC | National ID number |
| Address | Residential/business address |
| Notes | Any notes |
| Total Purchases | Auto-tracked (number of orders) |
| Total Spent | Auto-tracked (total amount) |

### How To

**Add Customer:**
1. Go to **Customers**
2. Click **Add Customer**
3. Fill in details
4. Click **Save**

**View Profile:** Click the 👁️ **view icon** — shows a profile card.

**Edit / Delete:** Use the ✏️ or 🗑️ icons.

**Search:** Type in the search box (searches name, phone, CNIC, email).

**Export to PDF:** Click **PDF** button.

> **Tip:** You can also create customers on-the-fly during a sale.

---

## 10. Suppliers

Manage companies/vendors you buy from.

### Supplier Fields

| Field | Description |
|-------|-------------|
| Company Name | Business name |
| Contact Person | Individual to contact |
| Email | Email address |
| Phone | Contact number |
| Address | Business address |
| Notes | Any notes |

### How To

**Add / Edit / Delete / Search:** Same pattern as Customers.

**Export to PDF:** Click **PDF** button.

---

## 11. Stamp Paper

Track stamp paper inventory and sales.

### Stamp Paper Fields

| Field | Description |
|-------|-------------|
| Name | Stamp paper description |
| Type | e.g., Judicial, Non-Judicial |
| Value | Face value of the stamp |
| Price | Selling price |
| Profit | Profit per unit |
| Documents | Associated document names (comma separated) |

### How To

**Add Stamp Paper:**
1. Go to **Stamp Paper**
2. Click **Add Stamp Paper**
3. Fill in name, price, profit
4. Click **Save**

**Export to PDF:** Click **PDF** button.

---

## 12. Services (Govt / Other Applications)

Track service requests like **Birth Certificates**, **ID applications**, or any customer service you process.

### Service Fields

| Field | Description |
|-------|-------------|
| Application # | Unique application number (auto-assigned if empty) |
| Customer Name | Person requesting the service |
| Mobile | Contact number |
| CNIC | National ID |
| Service Type | e.g., Birth Certificate, Passport, etc. |
| Status | Pending → In Progress → Completed |
| Fee | Service fee charged |
| Notes | Internal notes |
| Documents | Uploaded document URLs (comma separated) |

### Status Tracking

The status badge shows at a glance:
- 🟡 **Pending** — Just received
- 🔵 **In Progress** — Being processed
- 🟢 **Completed** — Done, ready for delivery

### How To

**Add a Service Request:**
1. Go to **Services**
2. Click **Add Service**
3. Fill customer details, service type, and fee
4. Click **Save Service**

**Update Status:**
1. Click the ✏️ **edit icon**
2. Change the **Status** dropdown
3. Click **Update Service**

**Search:** by name, application number, mobile, or CNIC.

**Stats Cards:** Shows total services, pending count, and completed count.

---

## 13. EasyPaisa / JazzCash

Record mobile wallet transactions (cash in / cash out) that you process for customers.

### Transaction Types

| Type | Description |
|------|-------------|
| **Cash In** | Customer gives you cash, you transfer to their EasyPaisa/JazzCash account |
| **Cash Out** | Customer receives cash from you against their mobile wallet balance |

### Fields

| Field | Description |
|-------|-------------|
| Type | Cash In or Cash Out |
| Provider | EasyPaisa / JazzCash / Other |
| Customer Name | Person requesting the transaction |
| Mobile Number | Their mobile number |
| CNIC | National ID |
| Amount | Transaction amount |
| Commission | Your service commission |
| Net Amount | Amount after commission (auto-calculated) |
| Fee | Any additional fee |
| Description | Optional notes |

### How To

**Add Transaction:**
1. Go to **EasyPaisa/JazzCash**
2. Click **Add Transaction**
3. Select type (Cash In / Cash Out) and provider
4. Fill amount, commission, customer details
5. Click **Save**

**Stats Cards:** Total Cash In, Cash Out, Commission earned, Transaction count.

**Search:** by customer name, mobile number, or CNIC.

**Delete:** Click 🗑️ icon if a transaction was entered by mistake.

---

## 14. Mobile Load / Top-Up

Record prepaid mobile recharges for customers across all networks.

### Networks Supported

| Network | Logo |
|---------|------|
| Jazz | 📡 |
| Telenor | 📡 |
| Zong | 📡 |
| Ufone | 📡 |
| Other | 📡 |

### Fields

| Field | Description |
|-------|-------------|
| Network | Mobile network (Jazz/Telenor/Zong/Ufone/Other) |
| Mobile Number | Customer's number being recharged |
| Amount | Recharge amount |
| Commission | Your commission for the transaction |
| Profit | Profit = Amount - Commission (auto-calculated) |
| Customer Name | Person requesting the recharge |
| Description | Optional notes |

### How To

**Add Recharge:**
1. Go to **Mobile Load/Top-Up**
2. Click **Add Recharge**
3. Select network, enter mobile number and amount
4. Enter commission (what the customer paid extra)
5. Click **Save**

**Stats Cards:** Total Amount, Commission, Profit, Transaction Count, and **breakdown by network**.

**Search:** by customer name or mobile number.

**Delete:** Click 🗑️ icon.

---

## 15. Credit / Due Management

Track money that **customers owe you** (credits) or you owe to others.

### Statuses

| Status | Meaning |
|--------|---------|
| 🔵 Active | Credit is being tracked, payments ongoing |
| 🟡 Partial | Partially paid |
| 🟢 Paid | Fully paid |
| 🔴 Overdue | Past the due date |

### Fields

| Field | Description |
|-------|-------------|
| Customer | Select from customer list (or enter name) |
| Mobile | Contact number |
| Total Amount | Full amount of credit |
| Paid Amount | How much has been paid (auto-tracked) |
| Due Amount | Remaining balance (auto-calculated) |
| Due Date | Expected payment date |
| Status | Active / Partial / Paid / Overdue |
| Notes | Any notes |

### Payments (Sub-records)

Each credit has a **payments list** — every payment against that credit is recorded:

| Payment Field | Description |
|---------------|-------------|
| Amount | Payment amount |
| Date | When payment was received |
| Method | Cash / JazzCash / EasyPaisa / Other |
| Notes | Optional note |

### How To

**Create a Credit:**
1. Go to **Credit / Due**
2. Click **Add Credit**
3. Select customer or type name, enter total amount and due date
4. Click **Save**

**Record a Payment:**
1. Click ➕ **Add Payment** on a credit
2. Enter amount, date, payment method
3. Click **Save Payment**

The system auto-updates: Paid Amount, Due Amount, and Status (changes to **Paid** when fully cleared).

**Edit / Delete:** Use the ✏️ or 🗑️ icons.

**Stats Cards:** Total Due, Total Credit, Total Paid, Active Credits, All Credits.

**Search:** by customer name or mobile.

**Export to PDF:** Click **PDF** button.

---

## 16. Accounts (Cash & Bank)

Manage your money — cash register and bank accounts.

### Account Types

| Type | Description |
|------|-------------|
| **Cash Account** | Physical cash in the shop (e.g., Main Cash, Petty Cash) |
| **Bank Account** | Bank accounts (e.g., HBL Current, Meezan Savings) |

### Cash Account Details

| Field | Description |
|-------|-------------|
| Name | Account label (e.g., Main Cash) |
| Opening Balance | Starting balance |
| Current Balance | Auto-tracked |
| Description | Notes |

### Bank Account Details

| Field | Description |
|-------|-------------|
| Name | Bank name / label (e.g., HBL) |
| Account Number | Bank account number |
| Balance | Auto-tracked |
| Description | Notes |

### Transactions

Every deposit, withdrawal, and transfer is recorded.

### How To

**Deposit Money:**
1. Go to **Accounts**
2. Click **Deposit** on the target account
3. Enter amount, description
4. Click **Deposit**

**Withdraw Money:**
1. Click **Withdraw** on the source account
2. Enter amount, description
3. Click **Withdraw**

**Transfer Between Accounts:**
1. Click **Transfer**
2. Select **From** account and **To** account
3. Enter amount, description
4. Click **Transfer**

**View All Transactions:** Scrolling down on the Accounts page shows the full transaction history.

**Store Profile:** Click **Store Profile** to view/edit store name, address, phone, email.

**Export to PDF:** Click **PDF** button.

> **Note:** Sales and Purchases automatically update cash/bank balances. You don't need to manually record those.

---

## 17. Expenses

Record all business expenses (rent, electricity, salaries, etc.).

### Expense Categories

Default categories come pre-loaded. You can add more inline.

### Fields

| Field | Description |
|-------|-------------|
| Category | Type of expense |
| Amount | How much |
| Description | What it was for |
| Payment Method | Cash / Bank / JazzCash / EasyPaisa |
| Date | When it was incurred |

### How To

**Add Expense:**
1. Go to **Expenses**
2. Click **Add Expense**
3. Select category, enter amount and description
4. Click **Save**

**Stats Cards:** Total expenses, count, and total for the current month.

**Filter:** By date range, category, or search description.

**Export to PDF:** Click **PDF** button.

---

## 18. Analytics

Visual insights about your business performance.

### What You See

| Section | Description |
|---------|-------------|
| **Sales by Category** | Doughnut chart — which categories drive revenue |
| **Payment Methods** | Pie chart — how customers pay |
| **Sales Trends** | Line chart — sales over time |
| **Summary Cards** | Total revenue, profit, orders, average order value |
| **Category Breakdown** | Table with sales and profit per category |

**Date Filter:** From / To date pickers to view analytics for a specific period.

---

## 19. Reports

Generate printable and exportable reports.

### Report Types (7)

| Report | Contents |
|--------|----------|
| **Sales Report** | All sales with customer, items, amount, profit, payment method |
| **Profit & Loss** | Revenue vs expenses summary, net profit calculation |
| **Inventory Report** | Current stock levels, values, supplier info |
| **Customer Report** | Customer list with purchase history |
| **Supplier Report** | Supplier list with supplied products |
| **Purchase Report** | Purchase orders with supplier, items, amounts |
| **Accounts Report** | Account balances and transaction summaries |

### How To

1. Go to **Reports**
2. Select a **Report Type** from the tabs
3. Use **date filter** if needed
4. View the data table
5. Click **Export PDF** or **Export Excel** to download

---

## 20. Activity Logs

A complete **audit trail** of everything that happens in the system.

### What Gets Logged

Every **Create**, **Update**, and **Delete** action is recorded with:
- **Action Type:** CREATE / UPDATE / DELETE
- **Entity Type:** sale, product, customer, service, etc.
- **Description:** What was done
- **Timestamp:** When it happened

### How To Use

1. Go to **Activity Logs**
2. Browse the list (newest first)
3. **Search** by keyword (searches description, action type, or entity type)
4. Use **From/To date** filters to narrow down
5. Click **Refresh** to reload

---

## 21. Website Manage

Manage your **public-facing website** content (if you have a live site at `http://localhost:3000/website/`).

### Features

| Feature | Description |
|---------|-------------|
| **Upload File** | Upload a single file (image, document, etc.) |
| **Upload Multiple** | Upload up to 10 files at once |
| **Upload Hero** | Upload/set the hero banner background image |
| **File Manager** | View and delete uploaded files |

### How To

1. Go to **Website Manage**
2. Choose upload type (Single / Multiple / Hero)
3. Select file(s) from your computer
4. Click **Upload**
5. Files appear in the file manager below

> **Note:** The website files are served live at `http://localhost:3000/website/`.

---

## 22. Settings

**Admin-only page.** Manage system configuration and users.

### Sections

| Section | Description |
|---------|-------------|
| **Theme** | Toggle between Light and Dark mode |
| **Change Password** | Update your login password |
| **Store Settings** | Edit store name, address, phone, email |
| **User Management** | Add/edit/delete system users |
| **Database Backup** | Download a JSON backup of all data |

### Dark Mode

Click **🌙 Dark Mode** toggle in Settings to switch the entire interface to dark theme (also accessible via the moon icon in the top-right corner of the header).

---

## 23. Common Workflows

### Daily Closing Workflow

1. **Dashboard** → Check today's sales and profit
2. **Sales** → Review any pending or unusual transactions
3. **Expenses** → Record any expenses incurred today
4. **EasyPaisa/JazzCash** → Record any mobile transactions done today
5. **Mobile Load/Top-Up** → Record any recharges done today
6. **Accounts** → Verify cash and bank balances match physical cash
7. **Reports** → Run a daily sales report for your records (PDF/Excel)

### New Stock Arrival Workflow

1. **Purchases** → Click **New Purchase**
2. Select supplier, add products and quantities
3. Complete purchase (stock is added automatically)
4. **Products** → Verify new stock levels appear correctly
5. If prices changed, edit products to update cost/sale price

### Customer Service Workflow (Service Requests)

1. **Services** → Click **Add Service**
2. Enter customer details and service type
3. Save (status = Pending)
4. When work starts → Edit → Change status to **In Progress**
5. When work finishes → Edit → Change status to **Completed**
6. Hand over to customer and collect fee

### Credit Recovery Workflow

1. **Credit/Due** → View all active credits
2. Click **Add Payment** on a credit when customer pays
3. Enter the payment amount and method
4. System auto-updates the balance
5. Once fully paid, status changes to **Paid** automatically

### Stock Reordering Workflow

1. **Dashboard** → Check **Low Stock** table at the bottom
2. Note which products are low
3. **Purchases** → Create purchase orders for those products
4. **Suppliers** → Contact suppliers if needed
5. After stock arrives, complete the purchase

### End of Month Workflow

1. **Analytics** → Review monthly trends
2. **Reports** → Generate Profit & Loss report
3. **Reports** → Generate Inventory report for stocktake
4. **Reports** → Generate Accounts report for reconciliation
5. **Settings** → Download Database Backup for safekeeping
6. **Activity Logs** → Review all changes made during the month

---

*SMZ ERP — Built for SMZ Mobile Zone*
