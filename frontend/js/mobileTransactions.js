const MobileTransactions = {
  items: [], stats: null,
  search: '', type: '', provider: '', startDate: '', endDate: '',

  async init() {
    this.search = ''; this.type = ''; this.provider = ''; this.startDate = ''; this.endDate = '';
    await this.loadData();
    this.render();
  },

  async loadData() {
    try {
      const params = {};
      if (this.search) params.search = this.search;
      if (this.type) params.type = this.type;
      if (this.provider) params.provider = this.provider;
      if (this.startDate) params.startDate = this.startDate;
      if (this.endDate) params.endDate = this.endDate;
      [this.items, this.stats] = await Promise.all([
        API.mobileTransactions.getAll(params),
        API.mobileTransactions.getStats(params)
      ]);
    } catch { this.items = []; this.stats = null; }
  },

  render() {
    const s = this.stats || { cashIn: 0, cashOut: 0, commission: 0, count: 0 };
    const container = document.getElementById('mobileTransactionsPage');
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title"><i class="fas fa-mobile-alt"></i> EasyPaisa / JazzCash</h1>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="MobileTransactions.showAddModal()"><i class="fas fa-plus"></i> New Transaction</button>
          <button class="btn btn-secondary" onclick="MobileTransactions.refresh()"><i class="fas fa-sync-alt"></i> Refresh</button>
        </div>
      </div>
      <div class="stats-grid">
        ${Components.statCard('arrow-down', 'Cash In', Components.formatCurrency(s.cashIn), `${s.count} transactions`, 'success')}
        ${Components.statCard('arrow-up', 'Cash Out', Components.formatCurrency(s.cashOut), `Commission: ${Components.formatCurrency(s.commission)}`, 'danger')}
        ${Components.statCard('hand-holding-usd', 'Commission', Components.formatCurrency(s.commission), '', 'warning')}
        ${Components.statCard('exchange-alt', 'Net', Components.formatCurrency(s.cashIn - s.cashOut), '', 'info')}
      </div>
      <div class="filter-bar">
        <div class="filter-group"><label>Search</label><input type="text" id="mtSearch" placeholder="Name, Mobile..." value="${this.search}"></div>
        <div class="filter-group"><label>Type</label><select id="mtType"><option value="">All</option><option value="cash_in" ${this.type === 'cash_in' ? 'selected' : ''}>Cash In</option><option value="cash_out" ${this.type === 'cash_out' ? 'selected' : ''}>Cash Out</option></select></div>
        <div class="filter-group"><label>Provider</label><select id="mtProvider"><option value="">All</option><option value="easypaisa" ${this.provider === 'easypaisa' ? 'selected' : ''}>EasyPaisa</option><option value="jazzcash" ${this.provider === 'jazzcash' ? 'selected' : ''}>JazzCash</option><option value="other" ${this.provider === 'other' ? 'selected' : ''}>Other</option></select></div>
        <div class="filter-group"><label>From</label><input type="date" id="mtStart" value="${this.startDate}"></div>
        <div class="filter-group"><label>To</label><input type="date" id="mtEnd" value="${this.endDate}"></div>
        <button class="btn btn-primary btn-sm" onclick="MobileTransactions.applyFilter()"><i class="fas fa-filter"></i> Filter</button>
        <button class="btn btn-secondary btn-sm" onclick="MobileTransactions.clearFilter()"><i class="fas fa-times"></i> Clear</button>
      </div>
      <div class="table-container" id="mtTable">${this.renderTable()}</div>
    `;
    this.bindEvents();
  },

  renderTable() {
    if (!this.items.length) return Components.emptyState('mobile-alt', 'No Transactions', 'Add EasyPaisa/JazzCash transactions.');
    return Components.table(
      ['Date', 'Type', 'Provider', 'Customer', 'Mobile', 'Amount', 'Commission', 'Fee'],
      this.items.map(i => [
        Components.formatDate(i.transaction_date || i.created_at),
        Components.badge(i.type === 'cash_in' ? 'Cash In' : 'Cash Out', i.type === 'cash_in' ? 'success' : 'danger'),
        i.provider,
        i.customer_name || '-',
        i.mobile_number || '-',
        Components.formatCurrency(i.amount),
        Components.formatCurrency(i.commission || 0),
        Components.formatCurrency(i.fee || 0)
      ]),
      [{ icon: 'trash', action: 'delete', class: 'danger' }]
    );
  },

  bindEvents() {
    document.getElementById('mtSearch')?.addEventListener('keyup', (e) => { if (e.key === 'Enter') this.applyFilter(); });
    this.items.forEach(i => {
      const id = i.id || i._id;
      document.querySelector(`[data-action="delete"][data-id="${id}"]`)?.addEventListener('click', () => this.confirmDelete(i));
    });
  },

  applyFilter() {
    this.search = document.getElementById('mtSearch').value;
    this.type = document.getElementById('mtType').value;
    this.provider = document.getElementById('mtProvider').value;
    this.startDate = document.getElementById('mtStart').value;
    this.endDate = document.getElementById('mtEnd').value;
    this.refresh();
  },
  clearFilter() { this.search = ''; this.type = ''; this.provider = ''; this.startDate = ''; this.endDate = ''; this.refresh(); },

  showAddModal() {
    Modal.show(`
      <form id="mtForm">
        <div class="form-grid">
          <div class="input-group"><label>Type *</label><select name="type" id="mtFormType"><option value="cash_in">Cash In</option><option value="cash_out">Cash Out</option></select></div>
          <div class="input-group"><label>Provider *</label><select name="provider"><option value="easypaisa">EasyPaisa</option><option value="jazzcash">JazzCash</option><option value="other">Other</option></select></div>
          <div class="input-group"><label>Customer Name</label><input type="text" name="customer_name"></div>
          <div class="input-group"><label>Mobile Number</label><input type="text" name="mobile_number"></div>
          <div class="input-group"><label>CNIC</label><input type="text" name="cnic"></div>
          <div class="input-group"><label>Amount *</label><input type="number" name="amount" step="0.01" required></div>
          <div class="input-group"><label>Commission</label><input type="number" name="commission" step="0.01" value="0"></div>
          <div class="input-group"><label>Fee</label><input type="number" name="fee" step="0.01" value="0"></div>
          <div class="input-group" style="grid-column:1/-1"><label>Description</label><textarea name="description"></textarea></div>
        </div>
        <div id="mtNetCalc" style="text-align:center;padding:12px;background:var(--bg-tertiary);border-radius:var(--radius-md);font-weight:600;">Net Amount: <span id="mtNetValue">0.00</span></div>
      </form>`, {
      title: 'New Transaction',
      footer: `<button class="btn btn-secondary" onclick="Modal.hide()">Cancel</button><button class="btn btn-primary" onclick="MobileTransactions.save()"><i class="fas fa-save"></i> Save</button>`,
      onOpen: () => {
        const inputs = ['amount', 'commission', 'fee'];
        inputs.forEach(k => document.querySelector(`[name="${k}"]`)?.addEventListener('input', () => MobileTransactions.calcNet()));
        document.getElementById('mtFormType')?.addEventListener('change', () => MobileTransactions.calcNet());
        MobileTransactions.calcNet();
      }
    });
  },

  calcNet() {
    const type = document.getElementById('mtFormType')?.value;
    const amount = parseFloat(document.querySelector('[name="amount"]')?.value || 0);
    const commission = parseFloat(document.querySelector('[name="commission"]')?.value || 0);
    const fee = parseFloat(document.querySelector('[name="fee"]')?.value || 0);
    const net = type === 'cash_out' ? amount - commission - fee : amount;
    document.getElementById('mtNetValue').textContent = net.toFixed(2);
  },

  async save() {
    const form = document.getElementById('mtForm');
    const fd = new FormData(form);
    const data = Object.fromEntries(fd);
    if (!data.amount) { Toast.warning('Amount is required'); return; }
    try {
      Modal.loading(true);
      await API.mobileTransactions.create(data);
      Modal.loading(false); Modal.hide();
      Toast.success('Transaction created');
      await this.refresh();
    } catch (error) { Modal.loading(false); Toast.error(error.message); }
  },

  confirmDelete(item) {
    Modal.confirm('Delete this transaction?', async () => {
      try { await API.mobileTransactions.delete(item.id || item._id); Toast.success('Deleted'); await this.refresh(); }
      catch (error) { Toast.error(error.message); }
    }, { title: 'Delete', type: 'danger' });
  },

  async refresh() {
    Modal.loading(true); await this.loadData(); this.render(); Modal.loading(false);
  }
};
window.MobileTransactions = MobileTransactions;
