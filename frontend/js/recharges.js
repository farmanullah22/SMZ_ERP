const Recharges = {
  items: [], stats: null,
  search: '', network: '', startDate: '', endDate: '',

  async init() {
    this.search = ''; this.network = ''; this.startDate = ''; this.endDate = '';
    await this.loadData();
    this.render();
  },

  async loadData() {
    try {
      const params = {};
      if (this.search) params.search = this.search;
      if (this.network) params.network = this.network;
      if (this.startDate) params.startDate = this.startDate;
      if (this.endDate) params.endDate = this.endDate;
      [this.items, this.stats] = await Promise.all([
        API.recharges.getAll(params),
        API.recharges.getStats(params)
      ]);
    } catch { this.items = []; this.stats = null; }
  },

  render() {
    const s = this.stats || { totalAmount: 0, totalCommission: 0, totalProfit: 0, count: 0, byNetwork: {} };
    const container = document.getElementById('rechargesPage');
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title"><i class="fas fa-sim-card"></i> Mobile Load / Top-Up</h1>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="Recharges.showAddModal()"><i class="fas fa-plus"></i> New Recharge</button>
          <button class="btn btn-secondary" onclick="Recharges.refresh()"><i class="fas fa-sync-alt"></i> Refresh</button>
        </div>
      </div>
      <div class="stats-grid">
        ${Components.statCard('sim-card', 'Total Load', Components.formatCurrency(s.totalAmount), `${s.count} transactions`, 'primary')}
        ${Components.statCard('hand-holding-usd', 'Commission', Components.formatCurrency(s.totalCommission), '', 'success')}
        ${Components.statCard('chart-line', 'Profit', Components.formatCurrency(s.totalProfit), '', 'warning')}
        ${Components.statCard('signal', 'Networks', Object.keys(s.byNetwork).length + ' active', Object.entries(s.byNetwork).map(([k, v]) => `${k}: ${Components.formatCurrency(v)}`).join('<br>') || 'N/A', 'info')}
      </div>
      <div class="filter-bar">
        <div class="filter-group"><label>Search</label><input type="text" id="rcSearch" placeholder="Mobile, Name..." value="${this.search}"></div>
        <div class="filter-group"><label>Network</label><select id="rcNetwork"><option value="">All</option><option value="jazz" ${this.network === 'jazz' ? 'selected' : ''}>Jazz</option><option value="telenor" ${this.network === 'telenor' ? 'selected' : ''}>Telenor</option><option value="zong" ${this.network === 'zong' ? 'selected' : ''}>Zong</option><option value="ufone" ${this.network === 'ufone' ? 'selected' : ''}>Ufone</option></select></div>
        <div class="filter-group"><label>From</label><input type="date" id="rcStart" value="${this.startDate}"></div>
        <div class="filter-group"><label>To</label><input type="date" id="rcEnd" value="${this.endDate}"></div>
        <button class="btn btn-primary btn-sm" onclick="Recharges.applyFilter()"><i class="fas fa-filter"></i> Filter</button>
        <button class="btn btn-secondary btn-sm" onclick="Recharges.clearFilter()"><i class="fas fa-times"></i> Clear</button>
      </div>
      <div class="table-container" id="rcTable">${this.renderTable()}</div>
    `;
    this.bindEvents();
  },

  renderTable() {
    if (!this.items.length) return Components.emptyState('sim-card', 'No Recharges', 'Add mobile load/top-up records.');
    return Components.table(
      ['Date', 'Network', 'Mobile', 'Customer', 'Amount', 'Commission', 'Profit'],
      this.items.map(i => [
        Components.formatDate(i.recharge_date || i.created_at),
        Components.badge(i.network, 'info'),
        i.mobile_number,
        i.customer_name || '-',
        Components.formatCurrency(i.amount),
        Components.formatCurrency(i.commission || 0),
        Components.formatCurrency(i.profit || 0)
      ]),
      [{ icon: 'trash', action: 'delete', class: 'danger' }]
    );
  },

  bindEvents() {
    document.getElementById('rcSearch')?.addEventListener('keyup', (e) => { if (e.key === 'Enter') this.applyFilter(); });
    this.items.forEach(i => {
      const id = i.id || i._id;
      document.querySelector(`[data-action="delete"][data-id="${id}"]`)?.addEventListener('click', () => this.confirmDelete(i));
    });
  },

  applyFilter() {
    this.search = document.getElementById('rcSearch').value;
    this.network = document.getElementById('rcNetwork').value;
    this.startDate = document.getElementById('rcStart').value;
    this.endDate = document.getElementById('rcEnd').value;
    this.refresh();
  },
  clearFilter() { this.search = ''; this.network = ''; this.startDate = ''; this.endDate = ''; this.refresh(); },

  showAddModal() {
    Modal.show(`
      <form id="rcForm">
        <div class="form-grid">
          <div class="input-group"><label>Network *</label><select name="network"><option value="jazz">Jazz</option><option value="telenor">Telenor</option><option value="zong">Zong</option><option value="ufone">Ufone</option><option value="other">Other</option></select></div>
          <div class="input-group"><label>Mobile Number *</label><input type="text" name="mobile_number" required></div>
          <div class="input-group"><label>Amount *</label><input type="number" name="amount" step="0.01" required></div>
          <div class="input-group"><label>Commission</label><input type="number" name="commission" step="0.01" value="0"></div>
          <div class="input-group"><label>Profit</label><input type="number" name="profit" step="0.01" value="0"></div>
          <div class="input-group"><label>Customer Name</label><input type="text" name="customer_name"></div>
          <div class="input-group" style="grid-column:1/-1"><label>Description</label><textarea name="description"></textarea></div>
        </div>
      </form>`, {
      title: 'New Recharge',
      footer: `<button class="btn btn-secondary" onclick="Modal.hide()">Cancel</button><button class="btn btn-primary" onclick="Recharges.save()"><i class="fas fa-save"></i> Save</button>`
    });
  },

  async save() {
    const form = document.getElementById('rcForm');
    const fd = new FormData(form);
    const data = Object.fromEntries(fd);
    if (!data.mobile_number || !data.amount) { Toast.warning('Mobile number and amount are required'); return; }
    try {
      Modal.loading(true);
      await API.recharges.create(data);
      Modal.loading(false); Modal.hide();
      Toast.success('Recharge recorded');
      await this.refresh();
    } catch (error) { Modal.loading(false); Toast.error(error.message); }
  },

  confirmDelete(item) {
    Modal.confirm('Delete this recharge record?', async () => {
      try { await API.recharges.delete(item.id || item._id); Toast.success('Deleted'); await this.refresh(); }
      catch (error) { Toast.error(error.message); }
    }, { title: 'Delete', type: 'danger' });
  },

  async refresh() {
    Modal.loading(true); await this.loadData(); this.render(); Modal.loading(false);
  }
};
window.Recharges = Recharges;
