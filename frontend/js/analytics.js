const Analytics = {
  charts: {},
  currentPeriod: 'monthly',
  currentStartDate: '',
  currentEndDate: '',

  async init() {
    this.render();
    await this.loadData();
  },

  render() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const firstOfMonth = `${y}-${m}-01`;
    const today = `${y}-${m}-${d}`;
    this.currentStartDate = firstOfMonth;
    this.currentEndDate = today;

    document.getElementById('analyticsPage').innerHTML = `
      <div class="page-header">
        <h1 class="page-title"><i class="fas fa-chart-bar"></i> Analytics</h1>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="Analytics.exportPDF()">
            <i class="fas fa-file-pdf"></i> Export PDF
          </button>
          <button class="btn btn-secondary" onclick="Analytics.refresh()">
            <i class="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      <div class="analytics-filters">
        <div class="filter-group">
          <label>Period</label>
          <div class="btn-group" id="periodBtnGroup">
            <button class="btn btn-sm ${this.currentPeriod === 'daily' ? 'btn-primary' : 'btn-secondary'}" data-period="daily">Daily</button>
            <button class="btn btn-sm ${this.currentPeriod === 'weekly' ? 'btn-primary' : 'btn-secondary'}" data-period="weekly">Weekly</button>
            <button class="btn btn-sm ${this.currentPeriod === 'monthly' ? 'btn-primary' : 'btn-secondary'}" data-period="monthly">Monthly</button>
          </div>
        </div>
        <div class="filter-group">
          <label>From</label>
          <input type="date" id="analyticsStartDate" class="form-input" value="${firstOfMonth}">
        </div>
        <div class="filter-group">
          <label>To</label>
          <input type="date" id="analyticsEndDate" class="form-input" value="${today}">
        </div>
        <div class="filter-group">
          <label>&nbsp;</label>
          <button class="btn btn-primary btn-sm" onclick="Analytics.applyDateFilter()">
            <i class="fas fa-filter"></i> Apply
          </button>
        </div>
      </div>

      <div class="analytics-summary" id="analyticsSummary"></div>

      <div class="analytics-grid">
        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title"><i class="fas fa-chart-pie" style="color:var(--primary)"></i> Sales by Category</h3>
          </div>
          <div class="chart-container"><canvas id="aDonutChart"></canvas></div>
        </div>
        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title"><i class="fas fa-circle" style="color:var(--secondary)"></i> Payment Methods</h3>
          </div>
          <div class="chart-container"><canvas id="aPieChart"></canvas></div>
        </div>
        <div class="chart-card full-width">
          <div class="chart-header">
            <h3 class="chart-title"><i class="fas fa-wave-square" style="color:var(--primary)"></i> Revenue & Profit Trends</h3>
            <span class="badge badge-primary">${this.currentPeriod}</span>
          </div>
          <div class="chart-container tall"><canvas id="aLineChart"></canvas></div>
        </div>
        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title"><i class="fas fa-calendar-week" style="color:var(--warning)"></i> Orders by Day of Week</h3>
          </div>
          <div class="chart-container"><canvas id="aBarChart"></canvas></div>
        </div>
        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title"><i class="fas fa-trophy" style="color:var(--warning)"></i> Top Products</h3>
          </div>
          <div class="table-responsive" id="topProductsTable" style="max-height:300px;overflow-y:auto"></div>
        </div>
      </div>
    `;

    document.getElementById('periodBtnGroup').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-period]');
      if (!btn) return;
      this.setPeriod(btn.dataset.period);
    });

    document.getElementById('analyticsStartDate').addEventListener('change', () => this.applyDateFilter());
    document.getElementById('analyticsEndDate').addEventListener('change', () => this.applyDateFilter());
  },

  setPeriod(period) {
    this.currentPeriod = period;
    document.querySelectorAll('#periodBtnGroup .btn').forEach(b => {
      b.className = `btn btn-sm ${b.dataset.period === period ? 'btn-primary' : 'btn-secondary'}`;
    });
    this.loadData();
  },

  applyDateFilter() {
    this.currentStartDate = document.getElementById('analyticsStartDate').value;
    this.currentEndDate = document.getElementById('analyticsEndDate').value;
    this.loadData();
  },

  async loadData() {
    try {
      Modal.loading(true);
      const params = { period: this.currentPeriod };
      if (this.currentStartDate) params.startDate = this.currentStartDate;
      if (this.currentEndDate) params.endDate = this.currentEndDate;
      const data = await API.analytics.getData(params);
      this.data = data;
      Modal.loading(false);
      this.renderSummary(data);
      this.renderDonutChart(data.salesByCategory);
      this.renderPieChart(data.paymentMethods);
      this.renderLineChart(data.timeSeries);
      this.renderBarChart(data.dayOfWeek);
      this.renderTopProducts(data.topProducts);
    } catch (error) {
      console.error('Analytics load error:', error);
      Modal.loading(false);
      Toast.error('Failed to load analytics');
    }
  },

  renderSummary(data) {
    const s = data.summary;
    document.getElementById('analyticsSummary').innerHTML = `
      <div class="analytics-stat-card">
        <div class="stat-icon" style="background:var(--gradient-primary)">
          <i class="fas fa-shopping-cart"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Total Orders</span>
          <span class="stat-value">${s.totalOrders}</span>
        </div>
      </div>
      <div class="analytics-stat-card">
        <div class="stat-icon" style="background:var(--gradient-success)">
          <i class="fas fa-dollar-sign"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Total Revenue</span>
          <span class="stat-value">${Components.formatCurrency(s.totalSales)}</span>
        </div>
      </div>
      <div class="analytics-stat-card">
        <div class="stat-icon" style="background:var(--gradient-warning)">
          <i class="fas fa-chart-line"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Total Profit</span>
          <span class="stat-value">${Components.formatCurrency(s.totalProfit)}</span>
        </div>
      </div>
      <div class="analytics-stat-card">
        <div class="stat-icon" style="background:var(--gradient-info)">
          <i class="fas fa-truck"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Expenses</span>
          <span class="stat-value">${Components.formatCurrency(s.totalExpenses)}</span>
        </div>
      </div>
    `;
  },

  renderDonutChart(data) {
    if (this.charts.donut) { this.charts.donut.destroy(); this.charts.donut = null; }
    const colors = ['#f43f5e', '#fb923c', '#fbbf24', '#22d3ee', '#a78bfa', '#34d399', '#f472b6', '#f97316'];
    const labels = data.map(d => d.label);
    const values = data.map(d => d.value);
    const bgColors = data.map((_, i) => colors[i % colors.length]);

    if (!values.length || values.every(v => v === 0)) {
      document.getElementById('aDonutChart').parentElement.innerHTML = `
        <div class="empty-chart"><i class="fas fa-chart-pie"></i><p>No category data</p></div>`;
      return;
    }

    this.charts.donut = new Chart(document.getElementById('aDonutChart'), {
      type: 'doughnut',
      data: { labels, datasets: [{ data: values, backgroundColor: bgColors, borderWidth: 3, borderColor: 'transparent' }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { padding: 14, usePointStyle: true, font: { size: 12 } } },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                const pct = ((ctx.parsed / total) * 100).toFixed(1);
                return ` ${ctx.label}: ${Components.formatCurrency(ctx.parsed)} (${pct}%)`;
              }
            }
          }
        },
        cutout: '68%',
        plugins: [{
          id: 'centerText',
          beforeDraw(chart) {
            const { width, height, ctx } = chart;
            ctx.save();
            const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
            ctx.font = '600 22px Inter, sans-serif';
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#0f172a';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(Components.formatCurrency(total), width / 2, height / 2 - 6);
            ctx.font = '400 11px Inter, sans-serif';
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#94a3b8';
            ctx.fillText('Total Revenue', width / 2, height / 2 + 18);
            ctx.restore();
          }
        }]
      }
    });
  },

  renderPieChart(data) {
    if (this.charts.pie) { this.charts.pie.destroy(); this.charts.pie = null; }
    const colors = ['#06b6d4', '#f97316', '#8b5cf6', '#10b981', '#ef4444', '#eab308', '#3b82f6', '#ec4899'];
    const labels = data.map(d => d.label.charAt(0).toUpperCase() + d.label.slice(1));
    const values = data.map(d => d.value);
    const bgColors = data.map((_, i) => colors[i % colors.length]);

    if (!values.length || values.every(v => v === 0)) {
      document.getElementById('aPieChart').parentElement.innerHTML = `
        <div class="empty-chart"><i class="fas fa-circle"></i><p>No payment data</p></div>`;
      return;
    }

    this.charts.pie = new Chart(document.getElementById('aPieChart'), {
      type: 'pie',
      data: { labels, datasets: [{ data: values, backgroundColor: bgColors, borderWidth: 3, borderColor: 'transparent' }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { padding: 14, usePointStyle: true, font: { size: 12 } } },
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
  },

  renderLineChart(data) {
    if (this.charts.line) { this.charts.line.destroy(); this.charts.line = null; }
    const labels = data.map(d => d.period);
    const sales = data.map(d => d.sales);
    const profit = data.map(d => d.profit);

    if (!labels.length) {
      document.getElementById('aLineChart').parentElement.innerHTML = `
        <div class="empty-chart"><i class="fas fa-wave-square"></i><p>No trend data</p></div>`;
      return;
    }

    this.charts.line = new Chart(document.getElementById('aLineChart'), {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Revenue', data: sales, borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.08)', fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#6366f1', pointBorderColor: '#fff', pointBorderWidth: 2 },
          { label: 'Profit', data: profit, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)', fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#10b981', pointBorderColor: '#fff', pointBorderWidth: 2 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16 } } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { callback: (v) => Components.formatCurrency(v) } },
          x: { grid: { display: false } }
        }
      }
    });
  },

  renderBarChart(data) {
    if (this.charts.bar) { this.charts.bar.destroy(); this.charts.bar = null; }
    const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const colors = ['#ef4444','#6366f1','#10b981','#f59e0b','#8b5cf6','#ec4899','#14b8a6'];
    const values = dayOrder.map(d => {
      const idx = data.labels.indexOf(d);
      return idx >= 0 ? data.data[idx] : 0;
    });

    if (values.every(v => v === 0)) {
      document.getElementById('aBarChart').parentElement.innerHTML = `
        <div class="empty-chart"><i class="fas fa-chart-bar"></i><p>No day-wise data</p></div>`;
      return;
    }

    this.charts.bar = new Chart(document.getElementById('aBarChart'), {
      type: 'bar',
      data: {
        labels: dayOrder.map(d => d.slice(0, 3)),
        datasets: [{
          label: 'Revenue',
          data: values,
          backgroundColor: values.map((v, i) => {
            const c = colors[i % colors.length];
            return v ? c.replace(')', ',0.85)').replace('rgb', 'rgba') : c;
          }),
          borderRadius: 8,
          borderSkipped: false,
          hoverBackgroundColor: colors.map(c => c)
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { callback: (v) => Components.formatCurrency(v) } },
          x: { grid: { display: false } }
        }
      }
    });
  },

  renderTopProducts(products) {
    const container = document.getElementById('topProductsTable');
    if (!products.length) {
      container.innerHTML = `<div class="empty-chart"><i class="fas fa-box-open"></i><p>No product sales in this period.</p></div>`;
      return;
    }
    const maxTotal = Math.max(...products.map(p => p.total));
    container.innerHTML = `
      <table>
        <thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Revenue</th><th>%</th></tr></thead>
        <tbody>
          ${products.map((p, i) => {
            const pct = ((p.total / maxTotal) * 100).toFixed(1);
            return `<tr>
              <td><span class="rank-badge">${i + 1}</span></td>
              <td><strong>${p.name}</strong></td>
              <td>${p.quantity}</td>
              <td>${Components.formatCurrency(p.total)}</td>
              <td><div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div><span>${pct}%</span></div></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    `;
  },

  exportPDF() {
    const data = this.data;
    if (!data) { Toast.info('No data to export'); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const title = `Analytics Report (${data.period.startDate} to ${data.period.endDate})`;
    doc.setFontSize(16); doc.text(title, 14, 20);
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

    const s = data.summary;
    doc.setFontSize(12); doc.text('Summary', 14, 38);
    doc.setFontSize(10);
    const sumRows = [
      ['Total Orders', String(s.totalOrders)],
      ['Total Revenue', Components.formatCurrency(s.totalSales)],
      ['Total Profit', Components.formatCurrency(s.totalProfit)],
      ['Total Expenses', Components.formatCurrency(s.totalExpenses)]
    ];
    doc.autoTable({ startY: 42, head: [['Metric', 'Value']], body: sumRows, theme: 'grid' });

    let y = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12); doc.text('Sales by Category', 14, y);
    doc.autoTable({
      startY: y + 4, head: [['Category', 'Revenue']],
      body: data.salesByCategory.map(d => [d.label, Components.formatCurrency(d.value)]),
      theme: 'grid'
    });

    y = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12); doc.text('Payment Methods', 14, y);
    doc.autoTable({
      startY: y + 4, head: [['Method', 'Orders', 'Revenue']],
      body: data.paymentMethods.map(d => [d.label, String(d.count), Components.formatCurrency(d.value)]),
      theme: 'grid'
    });

    y = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12); doc.text('Time Series', 14, y);
    doc.autoTable({
      startY: y + 4, head: [['Period', 'Orders', 'Revenue', 'Profit']],
      body: data.timeSeries.map(d => [d.period, String(d.orders), Components.formatCurrency(d.sales), Components.formatCurrency(d.profit)]),
      theme: 'grid'
    });

    y = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12); doc.text('Top Products', 14, y);
    doc.autoTable({
      startY: y + 4, head: [['Product', 'Qty Sold', 'Revenue']],
      body: data.topProducts.map(d => [d.name, String(d.quantity), Components.formatCurrency(d.total)]),
      theme: 'grid'
    });

    doc.save(`Analytics_${data.period.startDate}_to_${data.period.endDate}.pdf`);
    Toast.success('PDF exported');
  },

  async refresh() {
    Modal.loading(true);
    await this.init();
    Modal.loading(false);
    Toast.success('Analytics refreshed');
  }
};

window.Analytics = Analytics;
