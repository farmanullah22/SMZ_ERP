const Credits = {
  items: [], stats: null,
  search: '', status: '', startDate: '', endDate: '',

  async init() {
    this.search = ''; this.status = ''; this.startDate = ''; this.endDate = '';
    await this.loadData();
    this.render();
  },

  async loadData() {
    try {
      const params = {};
      if (this.search) params.search = this.search;
      if (this.status) params.status = this.status;
      if (this.startDate) params.startDate = this.startDate;
      if (this.endDate) params.endDate = this.endDate;
      [this.items, this.stats] = await Promise.all([
        API.credits.getAll(params),
        API.credits.getStats()
      ]);
    } catch { this.items = []; this.stats = null; }
  },

  render() {
    const s = this.stats || { totalDue: 0, totalCredit: 0, totalPaid: 0, activeCount: 0, totalCount: 0 };
    const container = document.getElementById('creditsPage');
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title"><i class="fas fa-hand-holding-usd"></i> Credit / Due Management</h1>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="Credits.showAddModal()"><i class="fas fa-plus"></i> New Credit</button>
          <button class="btn btn-success" onclick="Credits.exportPDF()"><i class="fas fa-file-pdf"></i> Export</button>
          <button class="btn btn-secondary" onclick="Credits.refresh()"><i class="fas fa-sync-alt"></i> Refresh</button>
        </div>
      </div>
      <div class="stats-grid">
        ${Components.statCard('hand-holding-usd', 'Total Credit', Components.formatCurrency(s.totalCredit), `Active: ${s.activeCount}`, 'primary')}
        ${Components.statCard('check-circle', 'Total Paid', Components.formatCurrency(s.totalPaid), '', 'success')}
        ${Components.statCard('exclamation-triangle', 'Total Due', Components.formatCurrency(s.totalDue), `${s.totalCount} records`, 'danger')}
        ${Components.statCard('users', 'Active Credits', String(s.activeCount), 'Require attention', 'warning')}
      </div>
      <div class="filter-bar">
        <div class="filter-group"><label>Search</label><input type="text" id="crSearch" placeholder="Name, Mobile..." value="${this.search}"></div>
        <div class="filter-group"><label>Status</label><select id="crStatus"><option value="">All</option><option value="active" ${this.status === 'active' ? 'selected' : ''}>Active</option><option value="partial" ${this.status === 'partial' ? 'selected' : ''}>Partial</option><option value="paid" ${this.status === 'paid' ? 'selected' : ''}>Paid</option><option value="overdue" ${this.status === 'overdue' ? 'selected' : ''}>Overdue</option></select></div>
        <div class="filter-group"><label>From</label><input type="date" id="crStart" value="${this.startDate}"></div>
        <div class="filter-group"><label>To</label><input type="date" id="crEnd" value="${this.endDate}"></div>
        <button class="btn btn-primary btn-sm" onclick="Credits.applyFilter()"><i class="fas fa-filter"></i> Filter</button>
        <button class="btn btn-secondary btn-sm" onclick="Credits.clearFilter()"><i class="fas fa-times"></i> Clear</button>
      </div>
      <div class="table-container" id="crTable">${this.renderTable()}</div>
    `;
    this.bindEvents();
  },

  renderTable() {
    if (!this.items.length) return Components.emptyState('hand-holding-usd', 'No Credits', 'Add credit/due records.');
    return Components.table(
      ['Customer', 'Mobile', 'Total', 'Paid', 'Due', 'Status', 'Due Date'],
      this.items.map(i => {
        const due = i.total_amount - i.paid_amount;
        const isOverdue = i.due_date && new Date(i.due_date) < new Date() && due > 0;
        const status = isOverdue ? 'overdue' : i.status;
        return [
          i.customer_name,
          i.mobile || '-',
          Components.formatCurrency(i.total_amount),
          Components.formatCurrency(i.paid_amount),
          `<span style="color:${due > 0 ? 'var(--danger)' : 'var(--secondary)'};font-weight:700;">${Components.formatCurrency(due)}</span>`,
          this.statusBadge(status),
          i.due_date ? Components.formatDate(i.due_date) : '-'
        ];
      }),
      [{ icon: 'plus-circle', action: 'payment', class: 'success' }, { icon: 'edit', action: 'edit', class: '' }, { icon: 'trash', action: 'delete', class: 'danger' }]
    );
  },

  statusBadge(s) {
    const map = { active: 'warning', partial: 'info', paid: 'success', overdue: 'danger' };
    return Components.badge(s, map[s] || 'info');
  },

  bindEvents() {
    document.getElementById('crSearch')?.addEventListener('keyup', (e) => { if (e.key === 'Enter') this.applyFilter(); });
    this.items.forEach(i => {
      const id = i.id || i._id;
      document.querySelector(`[data-action="payment"][data-id="${id}"]`)?.addEventListener('click', () => this.showPaymentModal(i));
      document.querySelector(`[data-action="edit"][data-id="${id}"]`)?.addEventListener('click', () => this.showEditModal(i));
      document.querySelector(`[data-action="delete"][data-id="${id}"]`)?.addEventListener('click', () => this.confirmDelete(i));
    });
  },

  applyFilter() {
    this.search = document.getElementById('crSearch').value;
    this.status = document.getElementById('crStatus').value;
    this.startDate = document.getElementById('crStart').value;
    this.endDate = document.getElementById('crEnd').value;
    this.refresh();
  },
  clearFilter() { this.search = ''; this.status = ''; this.startDate = ''; this.endDate = ''; this.refresh(); },

  showAddModal() { this.showFormModal(null); },
  showEditModal(item) { this.showFormModal(item); },

  showFormModal(item) {
    const isEdit = !!item;
    Modal.show(`
      <form id="crForm">
        <div class="form-grid">
          <div class="input-group"><label>Customer Name *</label><input type="text" name="customer_name" value="${isEdit ? item.customer_name : ''}" required></div>
          <div class="input-group"><label>Mobile</label><input type="text" name="mobile" value="${isEdit ? (item.mobile || '') : ''}"></div>
          <div class="input-group"><label>Total Amount *</label><input type="number" name="total_amount" step="0.01" value="${isEdit ? item.total_amount : ''}" required></div>
          <div class="input-group"><label>Paid Amount</label><input type="number" name="paid_amount" step="0.01" value="${isEdit ? item.paid_amount : 0}"></div>
          <div class="input-group"><label>Due Date</label><input type="date" name="due_date" value="${isEdit && item.due_date ? item.due_date.split('T')[0] : ''}"></div>
          <div class="input-group"><label>Status</label><select name="status"><option value="active" ${isEdit && item.status === 'active' ? 'selected' : ''}>Active</option><option value="partial" ${isEdit && item.status === 'partial' ? 'selected' : ''}>Partial</option><option value="paid" ${isEdit && item.status === 'paid' ? 'selected' : ''}>Paid</option></select></div>
          <div class="input-group" style="grid-column:1/-1"><label>Notes</label><textarea name="notes">${isEdit ? (item.notes || '') : ''}</textarea></div>
        </div>
      </form>`, {
      title: isEdit ? 'Edit Credit' : 'New Credit',
      footer: `<button class="btn btn-secondary" onclick="Modal.hide()">Cancel</button><button class="btn btn-primary" onclick="Credits.save()"><i class="fas fa-save"></i> ${isEdit ? 'Update' : 'Save'}</button>`
    });
    if (isEdit) Modal._editId = item.id || item._id;
    else delete Modal._editId;
  },

  async save() {
    const form = document.getElementById('crForm');
    const fd = new FormData(form);
    const data = Object.fromEntries(fd);
    if (!data.customer_name || !data.total_amount) { Toast.warning('Customer name and total amount required'); return; }
    try {
      Modal.loading(true);
      if (Modal._editId) await API.credits.update(Modal._editId, data);
      else await API.credits.create(data);
      Modal.loading(false); Modal.hide();
      Toast.success(Modal._editId ? 'Credit updated' : 'Credit created');
      await this.refresh();
    } catch (error) { Modal.loading(false); Toast.error(error.message); }
  },

  showPaymentModal(item) {
    const due = item.total_amount - item.paid_amount;
    Modal.show(`
      <div style="text-align:center;padding:16px;background:var(--bg-tertiary);border-radius:var(--radius-md);margin-bottom:20px;">
        <h3>${item.customer_name}</h3>
        <p style="color:var(--text-muted);">Total: ${Components.formatCurrency(item.total_amount)} | Paid: ${Components.formatCurrency(item.paid_amount)} | Due: <strong style="color:var(--danger);">${Components.formatCurrency(due)}</strong></p>
      </div>
      <form id="paymentForm">
        <div class="form-grid">
          <div class="input-group"><label>Amount *</label><input type="number" name="amount" step="0.01" max="${due}" required></div>
          <div class="input-group"><label>Method</label><select name="method"><option value="cash">Cash</option><option value="bank">Bank</option><option value="easypaisa">EasyPaisa</option><option value="jazzcash">JazzCash</option></select></div>
          <div class="input-group" style="grid-column:1/-1"><label>Notes</label><textarea name="notes"></textarea></div>
        </div>
      </form>`, {
      title: 'Receive Payment',
      footer: `<button class="btn btn-secondary" onclick="Modal.hide()">Cancel</button><button class="btn btn-success" onclick="Credits.savePayment('${item.id || item._id}')"><i class="fas fa-check"></i> Receive Payment</button>`
    });
  },

  async savePayment(id) {
    const form = document.getElementById('paymentForm');
    const fd = new FormData(form);
    const data = Object.fromEntries(fd);
    if (!data.amount || parseFloat(data.amount) <= 0) { Toast.warning('Valid amount required'); return; }
    try {
      Modal.loading(true);
      await API.credits.addPayment(id, data);
      Modal.loading(false); Modal.hide();
      Toast.success('Payment recorded');
      await this.refresh();
    } catch (error) { Modal.loading(false); Toast.error(error.message); }
  },

  confirmDelete(item) {
    Modal.confirm(`Delete credit for "${item.customer_name}"?`, async () => {
      try { await API.credits.delete(item.id || item._id); Toast.success('Deleted'); await this.refresh(); }
      catch (error) { Toast.error(error.message); }
    }, { title: 'Delete Credit', type: 'danger' });
  },

  exportPDF() {
    if (!this.items.length) { Toast.info('No data to export'); return; }
    const headers = ['Customer', 'Mobile', 'Total', 'Paid', 'Due', 'Status'];
    const rows = this.items.map(i => [i.customer_name, i.mobile || '-', Components.formatCurrency(i.total_amount), Components.formatCurrency(i.paid_amount), Components.formatCurrency(i.total_amount - i.paid_amount), i.status]);
    Components.exportPDF('Credit Report', headers, rows, 'credit-report');
  },

  async refresh() {
    Modal.loading(true); await this.loadData(); this.render(); Modal.loading(false);
  }
};
window.Credits = Credits;
