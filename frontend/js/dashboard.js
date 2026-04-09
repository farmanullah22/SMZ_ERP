const Dashboard = {
  salesChart: null,
  profitChart: null,
  currentPeriod: 'monthly',

  async init() {
    await this.loadStats();
    await this.loadCharts();
    await this.loadLowStock();
    this.updateDateTime();
    setInterval(() => this.updateDateTime(), 1000);
  },

  async loadStats() {
    try {
      const stats = await API.sales.getStats();
      const container = document.getElementById('dashboardPage');
      
      container.innerHTML = `
        <div class="page-header">
          <h1 class="page-title">Dashboard</h1>
          <div class="page-actions">
            <button class="btn btn-secondary" onclick="Dashboard.refresh()">
              <i class="fas fa-sync-alt"></i> Refresh
            </button>
          </div>
        </div>

        <div class="stats-grid">
          ${Components.statCard('shopping-cart', 'Total Sales', Components.formatCurrency(stats.totalSales), `Today: ${Components.formatCurrency(stats.todaySales)}`, 'primary')}
          ${Components.statCard('chart-line', 'Total Profit', Components.formatCurrency(stats.totalProfit), `This Month: ${Components.formatCurrency(stats.monthProfit)}`, 'success')}
          ${Components.statCard('truck', 'Total Expenses', Components.formatCurrency(stats.totalExpenses), 'Purchases & Costs', 'warning')}
          ${Components.statCard('boxes', 'Services Value', Components.formatCurrency(stats.inventoryValue), `${stats.productCount} Items`, 'info')}
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
    } catch (error) {
      console.error('Charts error:', error);
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
    event.target.classList.add('active');
  },

  updateDateTime() {
    const el = document.querySelector('#currentDateTime span');
    if (el) {
      el.textContent = new Date().toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    }
  },

  async refresh() {
    Modal.loading(true);
    await this.init();
    Modal.loading(false);
    Toast.success('Dashboard refreshed');
  }
};

window.Dashboard = Dashboard;
