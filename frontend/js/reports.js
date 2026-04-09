const Reports = {
  currentReport: 'sales',
  reportData: null,

  async init() {
    await this.loadPage();
  },

  async loadPage() {
    const container = document.getElementById('reportsPage');
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Reports</h1>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="Reports.refresh()"><i class="fas fa-sync-alt"></i> Refresh</button>
        </div>
      </div>

      <div class="filter-bar">
        <button class="btn ${this.currentReport === 'sales' ? 'btn-primary' : 'btn-secondary'}" onclick="Reports.switchReport('sales', this)"><i class="fas fa-chart-line"></i> Sales</button>
        <button class="btn ${this.currentReport === 'profit' ? 'btn-primary' : 'btn-secondary'}" onclick="Reports.switchReport('profit', this)"><i class="fas fa-balance-scale"></i> Profit & Loss</button>
        <button class="btn ${this.currentReport === 'inventory' ? 'btn-primary' : 'btn-secondary'}" onclick="Reports.switchReport('inventory', this)"><i class="fas fa-boxes"></i> Inventory</button>
        <button class="btn ${this.currentReport === 'customers' ? 'btn-primary' : 'btn-secondary'}" onclick="Reports.switchReport('customers', this)"><i class="fas fa-users"></i> Customers</button>
        <button class="btn ${this.currentReport === 'suppliers' ? 'btn-primary' : 'btn-secondary'}" onclick="Reports.switchReport('suppliers', this)"><i class="fas fa-industry"></i> Suppliers</button>
        <button class="btn ${this.currentReport === 'purchases' ? 'btn-primary' : 'btn-secondary'}" onclick="Reports.switchReport('purchases', this)"><i class="fas fa-truck"></i> Purchases</button>
        <button class="btn ${this.currentReport === 'accounts' ? 'btn-primary' : 'btn-secondary'}" onclick="Reports.switchReport('accounts', this)"><i class="fas fa-wallet"></i> Accounts</button>
      </div>

      <div class="report-filters">
        <div class="input-group"><label>Start Date</label><input type="date" id="reportStartDate"></div>
        <div class="input-group"><label>End Date</label><input type="date" id="reportEndDate"></div>
        <button class="btn btn-primary" onclick="Reports.generateReport()"><i class="fas fa-file-alt"></i> Generate</button>
        <button class="btn btn-success" onclick="Reports.exportPDF()" id="exportPdfBtn" disabled><i class="fas fa-file-pdf"></i> PDF</button>
        <button class="btn btn-info" onclick="Reports.exportExcel()" id="exportExcelBtn" disabled><i class="fas fa-file-excel"></i> Excel</button>
      </div>

      <div id="reportContent">
        <div class="text-center text-muted" style="padding: 60px;">
          <i class="fas fa-file-alt" style="font-size: 48px; opacity: 0.3;"></i>
          <p class="mt-4">Select report type and click Generate</p>
        </div>
      </div>`;
  },

  async switchReport(type, btn) {
    this.currentReport = type;
    this.reportData = null;
    document.querySelectorAll('.filter-bar .btn').forEach(b => {
      b.classList.remove('btn-primary');
      b.classList.add('btn-secondary');
    });
    if (btn) {
      btn.classList.remove('btn-secondary');
      btn.classList.add('btn-primary');
    }
    document.getElementById('reportContent').innerHTML = `
      <div class="text-center text-muted" style="padding: 60px;">
        <i class="fas fa-file-alt" style="font-size: 48px; opacity: 0.3;"></i>
        <p class="mt-4">Click Generate to load report</p>
      </div>`;
    document.getElementById('exportPdfBtn').disabled = true;
    document.getElementById('exportExcelBtn').disabled = true;
  },

  async generateReport() {
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    const content = document.getElementById('reportContent');

    try {
      Modal.loading(true);
      let data;

      switch (this.currentReport) {
        case 'sales':
          data = await API.reports.getSales({ startDate, endDate });
          content.innerHTML = this.salesReport(data);
          break;
        case 'profit':
          data = await API.reports.getProfitLoss({ startDate, endDate });
          content.innerHTML = this.profitLossReport(data);
          break;
        case 'inventory':
          data = await API.reports.getInventory();
          content.innerHTML = this.inventoryReport(data);
          break;
        case 'customers':
          data = await API.reports.getCustomers();
          content.innerHTML = this.customersReport(data);
          break;
        case 'suppliers':
          data = await API.reports.getSuppliers();
          content.innerHTML = this.suppliersReport(data);
          break;
        case 'purchases':
          data = await API.reports.getPurchases({ startDate, endDate });
          content.innerHTML = this.purchasesReport(data);
          break;
        case 'accounts':
          data = await API.reports.getAccounts({ startDate, endDate });
          content.innerHTML = this.accountsReport(data);
          break;
      }

      this.reportData = data;
      document.getElementById('exportPdfBtn').disabled = false;
      document.getElementById('exportExcelBtn').disabled = false;
      Modal.loading(false);
      Toast.success('Report generated successfully');
    } catch (error) {
      Modal.loading(false);
      Toast.error('Failed to generate report: ' + error.message);
      console.error(error);
    }
  },

  salesReport(data) {
    return `
      <div class="report-summary">
        <div class="report-card"><div class="report-card-value">${data.summary.total_orders || 0}</div><div class="report-card-label">Total Orders</div></div>
        <div class="report-card"><div class="report-card-value">${Components.formatCurrency(data.summary.total_sales)}</div><div class="report-card-label">Total Sales</div></div>
        <div class="report-card"><div class="report-card-value text-success">${Components.formatCurrency(data.summary.total_profit)}</div><div class="report-card-label">Total Profit</div></div>
      </div>
      ${Components.table(
        ['Invoice', 'Date', 'Customer', 'Total', 'Profit'],
        data.sales.map(s => [
          s.invoice_number || '-', 
          Components.formatDate(s.created_at), 
          s.customer_name || 'Walk-in', 
          Components.formatCurrency(s.total_amount), 
          Components.formatCurrency(s.total_profit)
        ])
      )}`;
  },

  profitLossReport(data) {
    return `
      <div class="report-summary">
        <div class="report-card"><div class="report-card-value">${Components.formatCurrency(data.totalRevenue)}</div><div class="report-card-label">Total Revenue</div></div>
        <div class="report-card"><div class="report-card-value text-success">${Components.formatCurrency(data.grossProfit)}</div><div class="report-card-label">Gross Profit</div></div>
        <div class="report-card"><div class="report-card-value text-danger">${Components.formatCurrency(data.totalExpenses)}</div><div class="report-card-label">Total Expenses</div></div>
        <div class="report-card"><div class="report-card-value ${data.netProfit >= 0 ? 'text-success' : 'text-danger'}">${Components.formatCurrency(data.netProfit)}</div><div class="report-card-label">Net Profit/Loss</div></div>
      </div>`;
  },

  inventoryReport(data) {
    return `
      <div class="report-summary">
        <div class="report-card"><div class="report-card-value">${data.summary.totalProducts}</div><div class="report-card-label">Total Products</div></div>
        <div class="report-card"><div class="report-card-value">${data.summary.totalQuantity}</div><div class="report-card-label">Total Units</div></div>
        <div class="report-card"><div class="report-card-value">${Components.formatCurrency(data.summary.totalValue)}</div><div class="report-card-label">Stock Value</div></div>
        <div class="report-card"><div class="report-card-value text-danger">${data.summary.lowStockCount}</div><div class="report-card-label">Low Stock</div></div>
      </div>
      ${Components.table(
        ['SKU', 'Name', 'Category', 'Qty', 'Cost', 'Price', 'Value', 'Status'],
        data.products.map(p => [
          p.sku || '-', p.name, p.category_name || '-', p.quantity,
          Components.formatCurrency(p.cost_price), Components.formatCurrency(p.sale_price),
          Components.formatCurrency(p.quantity * p.cost_price),
          p.quantity === 0 ? Components.badge('Out', 'danger') : p.quantity <= p.reorder_level ? Components.badge('Low', 'warning') : Components.badge('OK', 'success')
        ])
      )}`;
  },

  customersReport(data) {
    return `
      <div class="report-summary">
        <div class="report-card"><div class="report-card-value">${data.summary.totalCustomers}</div><div class="report-card-label">Total Customers</div></div>
        <div class="report-card"><div class="report-card-value">${Components.formatCurrency(data.summary.totalRevenue)}</div><div class="report-card-label">Total Revenue</div></div>
      </div>
      ${Components.table(
        ['Name', 'Email', 'Phone', 'Purchases', 'Total Spent'],
        data.customers.map(c => [
          c.name, c.email || '-', c.phone || '-', c.total_purchases || 0, Components.formatCurrency(c.total_spent || 0)
        ])
      )}`;
  },

  suppliersReport(data) {
    return `
      <div class="report-summary">
        <div class="report-card"><div class="report-card-value">${data.summary.totalSuppliers}</div><div class="report-card-label">Total Suppliers</div></div>
        <div class="report-card"><div class="report-card-value">${Components.formatCurrency(data.summary.totalPurchased)}</div><div class="report-card-label">Total Purchased</div></div>
      </div>
      ${Components.table(
        ['Company', 'Contact', 'Phone', 'Products', 'Purchases', 'Total'],
        data.suppliers.map(s => [
          s.company_name, s.contact_person || '-', s.phone || '-', s.product_count || 0, s.purchase_count || 0, Components.formatCurrency(s.total_purchased || 0)
        ])
      )}`;
  },

  purchasesReport(data) {
    return `
      <div class="report-summary">
        <div class="report-card"><div class="report-card-value">${data.summary.total_orders || 0}</div><div class="report-card-label">Total Orders</div></div>
        <div class="report-card"><div class="report-card-value">${Components.formatCurrency(data.summary.total_amount)}</div><div class="report-card-label">Total Amount</div></div>
      </div>
      ${Components.table(
        ['Reference', 'Date', 'Supplier', 'Amount', 'Notes'],
        data.purchases.map(p => [
          p.reference_number, Components.formatDate(p.created_at), p.supplier_name, Components.formatCurrency(p.total_amount), p.notes || '-'
        ])
      )}`;
  },

  accountsReport(data) {
    const totalCredit = data.summary.total_credit || 0;
    const totalDebit = data.summary.total_debit || 0;
    const net = totalCredit - totalDebit;

    return `
      <div class="report-summary">
        <div class="report-card"><div class="report-card-value text-success">${Components.formatCurrency(totalCredit)}</div><div class="report-card-label">Total Deposits</div></div>
        <div class="report-card"><div class="report-card-value text-danger">${Components.formatCurrency(totalDebit)}</div><div class="report-card-label">Total Withdrawals</div></div>
        <div class="report-card"><div class="report-card-value">${Components.formatCurrency(data.summary.total_transfer || 0)}</div><div class="report-card-label">Total Transfers</div></div>
        <div class="report-card"><div class="report-card-value ${net >= 0 ? 'text-success' : 'text-danger'}">${Components.formatCurrency(net)}</div><div class="report-card-label">Net</div></div>
      </div>
      ${Components.table(
        ['Date', 'Account', 'Type', 'Amount', 'Profit', 'Description'],
        data.transactions.map(t => {
          const amountText = t.type === 'debit'
            ? `-${Components.formatCurrency(t.amount)}`
            : t.type === 'credit'
              ? `+${Components.formatCurrency(t.amount)}`
              : Components.formatCurrency(t.amount);
          const typeText = t.type === 'credit' ? 'Deposit' : t.type === 'debit' ? 'Withdraw' : 'Transfer';
          return [
            Components.formatDateTime(t.created_at),
            t.account_name || (t.account_type === 'cash' ? 'Cash Account' : 'Bank Account'),
            typeText,
            amountText,
            t.profit === null || t.profit === undefined ? '-' : Components.formatCurrency(t.profit),
            t.description || t.category || '-'
          ];
        })
      )}`;
  },

  exportPDF() {
    if (!this.reportData) {
      Toast.warning('Please generate a report first');
      return;
    }

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      doc.setFontSize(18);
      doc.setTextColor(40);
      doc.text('SMZ - ' + this.currentReport.charAt(0).toUpperCase() + this.currentReport.slice(1) + ' Report', pageWidth / 2, 15, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text('Generated: ' + new Date().toLocaleString(), pageWidth / 2, 22, { align: 'center' });

      let yPos = 35;

      switch (this.currentReport) {
        case 'sales':
          doc.setFontSize(12);
          doc.text('Summary', 14, yPos);
          yPos += 8;
          doc.setFontSize(10);
          doc.text(`Total Orders: ${this.reportData.summary.total_orders || 0}`, 14, yPos); yPos += 6;
          doc.text(`Total Sales: ${Components.formatCurrency(this.reportData.summary.total_sales)}`, 14, yPos); yPos += 6;
          doc.text(`Total Profit: ${Components.formatCurrency(this.reportData.summary.total_profit)}`, 14, yPos); yPos += 12;
          
          if (this.reportData.sales && this.reportData.sales.length > 0) {
            doc.autoTable({
              startY: yPos,
              head: [['Invoice', 'Date', 'Customer', 'Total', 'Profit']],
              body: this.reportData.sales.map(s => [
                s.invoice_number || '-',
                Components.formatDate(s.created_at),
                s.customer_name || 'Walk-in',
                Components.formatCurrency(s.total_amount),
                Components.formatCurrency(s.total_profit)
              ]),
              styles: { fontSize: 8 },
              headStyles: { fillColor: [79, 70, 229] }
            });
          }
          break;

        case 'profit':
          doc.setFontSize(12);
          doc.text('Financial Summary', 14, yPos);
          yPos += 8;
          doc.setFontSize(10);
          doc.text(`Total Revenue: ${Components.formatCurrency(this.reportData.totalRevenue)}`, 14, yPos); yPos += 6;
          doc.text(`Gross Profit: ${Components.formatCurrency(this.reportData.grossProfit)}`, 14, yPos); yPos += 6;
          doc.text(`Total Expenses: ${Components.formatCurrency(this.reportData.totalExpenses)}`, 14, yPos); yPos += 6;
          doc.text(`Net Profit/Loss: ${Components.formatCurrency(this.reportData.netProfit)}`, 14, yPos);
          break;

        case 'inventory':
          doc.setFontSize(12);
          doc.text('Inventory Summary', 14, yPos);
          yPos += 8;
          doc.setFontSize(10);
          doc.text(`Total Products: ${this.reportData.summary.totalProducts}`, 14, yPos); yPos += 6;
          doc.text(`Total Units: ${this.reportData.summary.totalQuantity}`, 14, yPos); yPos += 6;
          doc.text(`Stock Value: ${Components.formatCurrency(this.reportData.summary.totalValue)}`, 14, yPos); yPos += 6;
          doc.text(`Low Stock Items: ${this.reportData.summary.lowStockCount}`, 14, yPos); yPos += 12;
          
          if (this.reportData.products && this.reportData.products.length > 0) {
            doc.autoTable({
              startY: yPos,
              head: [['SKU', 'Name', 'Category', 'Qty', 'Cost', 'Price', 'Value']],
              body: this.reportData.products.map(p => [
                p.sku || '-', p.name, p.category_name || '-', p.quantity,
                Components.formatCurrency(p.cost_price), Components.formatCurrency(p.sale_price),
                Components.formatCurrency(p.quantity * p.cost_price)
              ]),
              styles: { fontSize: 7 },
              headStyles: { fillColor: [79, 70, 229] }
            });
          }
          break;

        case 'customers':
          doc.setFontSize(12);
          doc.text(`Total Customers: ${this.reportData.summary.totalCustomers}`, 14, yPos);
          yPos += 8;
          if (this.reportData.customers && this.reportData.customers.length > 0) {
            doc.autoTable({
              startY: yPos,
              head: [['Name', 'Email', 'Phone', 'Purchases', 'Total Spent']],
              body: this.reportData.customers.map(c => [
                c.name, c.email || '-', c.phone || '-', c.total_purchases || 0, Components.formatCurrency(c.total_spent || 0)
              ]),
              styles: { fontSize: 9 },
              headStyles: { fillColor: [79, 70, 229] }
            });
          }
          break;

        case 'suppliers':
          doc.setFontSize(12);
          doc.text(`Total Suppliers: ${this.reportData.summary.totalSuppliers}`, 14, yPos);
          yPos += 8;
          if (this.reportData.suppliers && this.reportData.suppliers.length > 0) {
            doc.autoTable({
              startY: yPos,
              head: [['Company', 'Contact', 'Phone', 'Products', 'Total Purchased']],
              body: this.reportData.suppliers.map(s => [
                s.company_name, s.contact_person || '-', s.phone || '-', s.product_count || 0, Components.formatCurrency(s.total_purchased || 0)
              ]),
              styles: { fontSize: 9 },
              headStyles: { fillColor: [79, 70, 229] }
            });
          }
          break;

        case 'purchases':
          doc.setFontSize(12);
          doc.text(`Total Purchases: ${this.reportData.summary.total_orders || 0}`, 14, yPos);
          yPos += 8;
          doc.text(`Total Amount: ${Components.formatCurrency(this.reportData.summary.total_amount)}`, 14, yPos);
          yPos += 12;
          if (this.reportData.purchases && this.reportData.purchases.length > 0) {
            doc.autoTable({
              startY: yPos,
              head: [['Reference', 'Date', 'Supplier', 'Amount', 'Notes']],
              body: this.reportData.purchases.map(p => [
                p.reference_number, Components.formatDate(p.created_at), p.supplier_name, Components.formatCurrency(p.total_amount), p.notes || '-'
              ]),
              styles: { fontSize: 9 },
              headStyles: { fillColor: [79, 70, 229] }
            });
          }
          break;

        case 'accounts':
          doc.setFontSize(12);
          doc.text(`Total Deposits: ${Components.formatCurrency(this.reportData.summary.total_credit || 0)}`, 14, yPos);
          yPos += 6;
          doc.text(`Total Withdrawals: ${Components.formatCurrency(this.reportData.summary.total_debit || 0)}`, 14, yPos);
          yPos += 6;
          doc.text(`Total Transfers: ${Components.formatCurrency(this.reportData.summary.total_transfer || 0)}`, 14, yPos);
          yPos += 12;

          if (this.reportData.transactions && this.reportData.transactions.length > 0) {
            doc.autoTable({
              startY: yPos,
              head: [['Date', 'Account', 'Type', 'Amount', 'Profit', 'Description']],
              body: this.reportData.transactions.map(t => {
                const amountText = t.type === 'debit'
                  ? `-${Components.formatCurrency(t.amount)}`
                  : t.type === 'credit'
                    ? `+${Components.formatCurrency(t.amount)}`
                    : Components.formatCurrency(t.amount);
                const typeText = t.type === 'credit' ? 'Deposit' : t.type === 'debit' ? 'Withdraw' : 'Transfer';
                return [
                  Components.formatDate(t.created_at),
                  t.account_name || (t.account_type === 'cash' ? 'Cash Account' : 'Bank Account'),
                  typeText,
                  amountText,
                  t.profit === null || t.profit === undefined ? '-' : Components.formatCurrency(t.profit),
                  t.description || t.category || '-'
                ];
              }),
              styles: { fontSize: 8 },
              headStyles: { fillColor: [79, 70, 229] }
            });
          }
          break;
      }

      doc.save(`smz-${this.currentReport}-report-${new Date().toISOString().split('T')[0]}.pdf`);
      Toast.success('PDF exported successfully');
    } catch (error) {
      console.error('PDF export error:', error);
      Toast.error('Failed to export PDF: ' + error.message);
    }
  },

  exportExcel() {
    if (!this.reportData) {
      Toast.warning('Please generate a report first');
      return;
    }

    try {
      const wb = XLSX.utils.book_new();
      let ws;
      const reportName = this.currentReport.charAt(0).toUpperCase() + this.currentReport.slice(1) + ' Report';

      switch (this.currentReport) {
        case 'sales':
          ws = XLSX.utils.json_to_sheet(this.reportData.sales.map(s => ({
            'Invoice': s.invoice_number || '-',
            'Date': Components.formatDate(s.created_at),
            'Customer': s.customer_name || 'Walk-in',
            'Total': s.total_amount,
            'Profit': s.total_profit
          })));
          break;

        case 'profit':
          ws = XLSX.utils.json_to_sheet([{
            'Metric': 'Total Revenue',
            'Value': this.reportData.totalRevenue
          }, {
            'Metric': 'Gross Profit',
            'Value': this.reportData.grossProfit
          }, {
            'Metric': 'Total Expenses',
            'Value': this.reportData.totalExpenses
          }, {
            'Metric': 'Net Profit/Loss',
            'Value': this.reportData.netProfit
          }]);
          break;

        case 'inventory':
          ws = XLSX.utils.json_to_sheet(this.reportData.products.map(p => ({
            'SKU': p.sku || '-',
            'Name': p.name,
            'Category': p.category_name || '-',
            'Quantity': p.quantity,
            'Cost Price': p.cost_price,
            'Sale Price': p.sale_price,
            'Stock Value': p.quantity * p.cost_price,
            'Status': p.quantity === 0 ? 'Out of Stock' : p.quantity <= p.reorder_level ? 'Low Stock' : 'In Stock'
          })));
          break;

        case 'customers':
          ws = XLSX.utils.json_to_sheet(this.reportData.customers.map(c => ({
            'Name': c.name,
            'Email': c.email || '-',
            'Phone': c.phone || '-',
            'Total Purchases': c.total_purchases || 0,
            'Total Spent': c.total_spent || 0
          })));
          break;

        case 'suppliers':
          ws = XLSX.utils.json_to_sheet(this.reportData.suppliers.map(s => ({
            'Company': s.company_name,
            'Contact Person': s.contact_person || '-',
            'Phone': s.phone || '-',
            'Products': s.product_count || 0,
            'Total Purchased': s.total_purchased || 0
          })));
          break;

        case 'purchases':
          ws = XLSX.utils.json_to_sheet(this.reportData.purchases.map(p => ({
            'Reference': p.reference_number,
            'Date': Components.formatDate(p.created_at),
            'Supplier': p.supplier_name,
            'Amount': p.total_amount,
            'Notes': p.notes || '-'
          })));
          break;

        case 'accounts':
          ws = XLSX.utils.json_to_sheet(this.reportData.transactions.map(t => ({
            'Date': Components.formatDateTime(t.created_at),
            'Account': t.account_name || (t.account_type === 'cash' ? 'Cash Account' : 'Bank Account'),
            'Type': t.type === 'credit' ? 'Deposit' : t.type === 'debit' ? 'Withdraw' : 'Transfer',
            'Amount': t.amount,
            'Profit': t.profit ?? '',
            'Description': t.description || t.category || '-'
          })));
          break;
      }

      XLSX.utils.book_append_sheet(wb, ws, reportName);
      XLSX.writeFile(wb, `smz-${this.currentReport}-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      Toast.success('Excel exported successfully');
    } catch (error) {
      console.error('Excel export error:', error);
      Toast.error('Failed to export Excel: ' + error.message);
    }
  },

  async refresh() {
    await this.generateReport();
  }
};

window.Reports = Reports;
