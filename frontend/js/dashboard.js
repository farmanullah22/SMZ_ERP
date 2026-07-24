const Dashboard = {
  salesChart: null,
  profitChart: null,
  donutChart: null,
  pieChart: null,
  currentPeriod: 'monthly',
  dateStart: '',
  dateEnd: '',

  async init() {
    await this.loadStats();
    await this.loadCharts();
    await this.loadLowStock();
    this.updateDateTime();
    setInterval(() => this.updateDateTime(), 1000);
  },

  getDateParams() {
    const s = document.getElementById('dashStartDate')?.value || '';
    const e = document.getElementById('dashEndDate')?.value || '';
    this.dateStart = s;
    this.dateEnd = e;
    const params = {};
    if (s) params.startDate = s;
    if (e) params.endDate = e;
    return params;
  },

  async loadStats() {
    try {
      const dateParams = this.getDateParams();
      const [stats, accounts, stampPapers, expenses] = await Promise.all([
        API.sales.getStats(dateParams),
        API.accounts.getAll().catch(() => []),
        API.stampPapers.getAll().catch(() => []),
        API.expenses.getAll({}).catch(() => ({ expenses: [], summary: { total: 0 } }))
      ]);

      const totalCash = accounts.filter(a => a.account_type === 'cash').reduce((s, a) => s + (a.current_balance || 0), 0);
      const totalBank = accounts.filter(a => a.account_type === 'bank').reduce((s, a) => s + (a.balance || 0), 0);
      const totalBalance = totalCash + totalBank;

      const stampTotal = stampPapers.reduce((s, p) => s + (p.price || 0), 0);
      const stampProfit = stampPapers.reduce((s, p) => s + (p.profit || 0), 0);

      const expenseList = expenses.expenses || expenses;
      const totalExpensesOp = expenseList.reduce ? expenseList.reduce((s, e) => s + (e.amount || 0), 0) : (expenses.summary?.total || 0);
      const expenseCount = expenseList.length || expenses.summary?.count || 0;

      const container = document.getElementById('dashboardPage');
      
      container.innerHTML = `
        <div class="page-header">
          <h1 class="page-title">Dashboard</h1>
          <div class="page-actions">
            <button class="btn btn-primary" onclick="App.navigateTo('analytics')">
              <i class="fas fa-chart-bar"></i> View Analytics
            </button>
            <button class="btn btn-secondary" onclick="Dashboard.refresh()">
              <i class="fas fa-sync-alt"></i> Refresh
            </button>
          </div>
        </div>

        <div class="filter-bar">
          <div class="filter-group">
            <label>From</label>
            <input type="date" id="dashStartDate" value="${this.dateStart}">
          </div>
          <div class="filter-group">
            <label>To</label>
            <input type="date" id="dashEndDate" value="${this.dateEnd}">
          </div>
          <button class="btn btn-primary btn-sm" onclick="Dashboard.applyDateFilter()">
            <i class="fas fa-filter"></i> Apply
          </button>
          <button class="btn btn-secondary btn-sm" onclick="Dashboard.clearDateFilter()">
            <i class="fas fa-times"></i> Clear
          </button>
        </div>

        <div class="stats-grid">
          ${Components.statCard('shopping-cart', 'Total Sales', Components.formatCurrency(stats.totalSales), `Today: ${Components.formatCurrency(stats.todaySales)}`, 'primary')}
          ${Components.statCard('chart-line', 'Total Profit', Components.formatCurrency(stats.totalProfit), `This Month: ${Components.formatCurrency(stats.monthProfit)}`, 'success')}
          ${Components.statCard('wallet', 'Cash in Hand', Components.formatCurrency(totalCash), `Bank: ${Components.formatCurrency(totalBank)}`, 'info')}
          ${Components.statCard('truck', 'Purchases', Components.formatCurrency(stats.totalExpenses), `${stats.productCount} Products`, 'warning')}
        </div>

        <div class="stats-grid">
          ${Components.statCard('file-signature', 'Stamp Papers', Components.formatCurrency(stampTotal), `Profit: ${Components.formatCurrency(stampProfit)}`, 'secondary')}
          ${Components.statCard('receipt', 'Op. Expenses', Components.formatCurrency(totalExpensesOp), `${expenseCount} Entries`, 'danger')}
          ${Components.statCard('boxes', 'Stock Value', Components.formatCurrency(stats.inventoryValue), `${stats.productCount} Items`, 'info')}
          ${Components.statCard('balance-scale', 'Net Balance', Components.formatCurrency(totalBalance), 'Cash + Bank', 'primary')}
        </div>

        <div class="charts-grid">
          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">Sales Trends</h3>
              <div class="chart-controls">
                <button class="${this.currentPeriod === 'daily' ? 'active' : ''}" onclick="Dashboard.changePeriod('daily')">Daily</button>
                <button class="${this.currentPeriod === 'weekly' ? 'active' : ''}" onclick="Dashboard.changePeriod('weekly')">Weekly</button>
                <button class="${this.currentPeriod === 'monthly' ? 'active' : ''}" onclick="Dashboard.changePeriod('monthly')">Monthly</button>
              </div>
            </div>
            <div class="chart-container"><canvas id="salesChart"></canvas></div>
          </div>
          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">Profit & Loss</h3>
            </div>
            <div class="chart-container"><canvas id="profitChart"></canvas></div>
          </div>
          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">Sales by Category</h3>
            </div>
            <div class="chart-container"><canvas id="donutChart"></canvas></div>
          </div>
          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">Payment Methods</h3>
            </div>
            <div class="chart-container"><canvas id="pieChart"></canvas></div>
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title">Low Stock / Alerts</h3>
            <button class="btn btn-sm btn-secondary" onclick="App.navigateTo('products')">View All</button>
          </div>
          <div id="lowStockList">
            <div class="text-center text-muted" style="padding: 40px;"><i class="fas fa-spinner fa-spin"></i> Loading...</div>
          </div>
        </div>
      `;
    } catch (error) {
      Toast.error('Failed to load dashboard');
    }
  },

  async loadCharts() {
    try {
      const data = await API.sales.getMonthly(this.currentPeriod, 12);
      
      const labels = data.map(d => d.period);
      const salesData = data.map(d => d.total_sales || 0);
      const profitData = data.map(d => d.total_profit || 0);

      const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: true, position: 'bottom' } },
        scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } }, x: { grid: { display: false } } }
      };

      if (this.salesChart) this.salesChart.destroy();
      if (this.profitChart) this.profitChart.destroy();

      this.salesChart = new Chart(document.getElementById('salesChart'), {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Sales', data: salesData, backgroundColor: 'rgba(79, 70, 229, 0.8)', borderRadius: 6 }] },
        options: chartOptions
      });

      this.profitChart = new Chart(document.getElementById('profitChart'), {
        type: 'line',
        data: { labels, datasets: [{ label: 'Profit', data: profitData, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true, tension: 0.4 }] },
        options: chartOptions
      });

      await this.loadDonutPieCharts();
    } catch (error) {
      console.error('Charts error:', error);
    }
  },

  async loadDonutPieCharts() {
    try {
      const params = { period: this.currentPeriod };
      const data = await API.analytics.getData(params);

      const donutColors = ['#f43f5e', '#fb923c', '#fbbf24', '#22d3ee', '#a78bfa', '#34d399', '#f472b6', '#f97316'];
      const pieColors   = ['#06b6d4', '#f97316', '#8b5cf6', '#10b981', '#ef4444', '#eab308', '#3b82f6', '#ec4899'];

      if (this.donutChart) this.donutChart.destroy();
      if (this.pieChart) this.pieChart.destroy();

      const catLabels = data.salesByCategory.map(d => d.label);
      const catValues = data.salesByCategory.map(d => d.value);
      const catFillColors = catLabels.map((_, i) => donutColors[i % donutColors.length]);
      const catBorderColors = catLabels.map((_, i) => {
        const c = donutColors[i % donutColors.length];
        return c.replace(')', ',0.6)').replace('rgb', 'rgba');
      });

      this.donutChart = new Chart(document.getElementById('donutChart'), {
        type: 'doughnut',
        data: { labels: catLabels, datasets: [{ data: catValues, backgroundColor: catFillColors, borderWidth: 3, borderColor: catBorderColors, hoverOffset: 8 }] },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { padding: 10, usePointStyle: true } } },
          cutout: '60%'
        }
      });

      const pmLabels = data.paymentMethods.map(d => d.label.charAt(0).toUpperCase() + d.label.slice(1));
      const pmValues = data.paymentMethods.map(d => d.value);
      const pmFillColors = pmLabels.map((_, i) => pieColors[i % pieColors.length]);
      const pmBorderColors = pmLabels.map((_, i) => {
        const c = pieColors[i % pieColors.length];
        return c.replace(')', ',0.6)').replace('rgb', 'rgba');
      });

      this.pieChart = new Chart(document.getElementById('pieChart'), {
        type: 'pie',
        data: { labels: pmLabels, datasets: [{ data: pmValues, backgroundColor: pmFillColors, borderWidth: 3, borderColor: pmBorderColors, hoverOffset: 10 }] },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { padding: 10, usePointStyle: true } },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                  const pct = ((ctx.parsed / total) * 100).toFixed(1);
                  return ` ${ctx.label}: ${Components.formatCurrency(ctx.parsed)} (${pct}%)`;
                }
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Donut/Pie charts error:', error);
    }
  },

  async loadLowStock() {
    try {
      const products = await API.products.getLowStock();
      const container = document.getElementById('lowStockList');

      if (products.length === 0) {
        container.innerHTML = Components.emptyState('check-circle', 'All Good!', 'No products are running low on stock.');
        return;
      }

      container.innerHTML = `
        <table>
          <thead><tr><th>SKU</th><th>Product</th><th>Category</th><th>Stock</th><th>Reorder Level</th><th>Status</th></tr></thead>
          <tbody>
            ${products.slice(0, 10).map(p => `
              <tr>
                <td>${p.sku || '-'}</td>
                <td>${p.name}</td>
                <td>${p.category_name || '-'}</td>
                <td>${p.quantity}</td>
                <td>${p.reorder_level}</td>
                <td>${p.quantity === 0 ? Components.badge('Out of Stock', 'danger') : Components.badge('Low Stock', 'warning')}</td>
              </tr>`).join('')}
          </tbody>
        </table>`;
    } catch (error) {
      console.error('Low stock error:', error);
    }
  },

  async changePeriod(period) {
    this.currentPeriod = period;
    await this.loadCharts();
    document.querySelectorAll('.chart-controls button').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
  },

  updateDateTime() {
    const el = document.querySelector('#currentDateTime span');
    if (el) {
      el.textContent = new Date().toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    }
  },

  async applyDateFilter() {
    Modal.loading(true);
    await this.init();
    Modal.loading(false);
    Toast.success('Filter applied');
  },

  async clearDateFilter() {
    this.dateStart = '';
    this.dateEnd = '';
    Modal.loading(true);
    await this.init();
    Modal.loading(false);
    Toast.success('Filter cleared');
  },

  async refresh() {
    Modal.loading(true);
    await this.init();
    Modal.loading(false);
    Toast.success('Dashboard refreshed');
  }
};

window.Dashboard = Dashboard;
