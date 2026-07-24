const Services = {
  items: [],
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
      this.items = await API.services.getAll(params);
    } catch { this.items = []; }
  },

  render() {
    const container = document.getElementById('servicesPage');
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title"><i class="fas fa-file-contract"></i> Services</h1>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="Services.showAddModal()"><i class="fas fa-plus"></i> New Service</button>
          <button class="btn btn-secondary" onclick="Services.refresh()"><i class="fas fa-sync-alt"></i> Refresh</button>
        </div>
      </div>
      <div class="filter-bar">
        <div class="filter-group"><label>Search</label><input type="text" id="svcSearch" placeholder="Name, App#, Mobile, CNIC..." value="${this.search}"></div>
        <div class="filter-group"><label>Status</label><select id="svcStatus"><option value="">All</option><option value="pending" ${this.status === 'pending' ? 'selected' : ''}>Pending</option><option value="in_progress" ${this.status === 'in_progress' ? 'selected' : ''}>In Progress</option><option value="completed" ${this.status === 'completed' ? 'selected' : ''}>Completed</option></select></div>
        <div class="filter-group"><label>From</label><input type="date" id="svcStart" value="${this.startDate}"></div>
        <div class="filter-group"><label>To</label><input type="date" id="svcEnd" value="${this.endDate}"></div>
        <button class="btn btn-primary btn-sm" onclick="Services.applyFilter()"><i class="fas fa-filter"></i> Filter</button>
        <button class="btn btn-secondary btn-sm" onclick="Services.clearFilter()"><i class="fas fa-times"></i> Clear</button>
      </div>
      <div class="table-container" id="svcTable">${this.renderTable()}</div>
    `;
    this.bindEvents();
  },

  renderTable() {
    if (!this.items.length) return Components.emptyState('file-contract', 'No Services', 'Add services to get started.');
    return Components.table(
      ['App #', 'Customer', 'Mobile', 'CNIC', 'Service Type', 'Status', 'Fee'],
      this.items.map(i => [
        i.application_number || '-',
        i.customer_name,
        i.mobile || '-',
        i.cnic || '-',
        i.service_type,
        this.statusBadge(i.status),
        Components.formatCurrency(i.fee)
      ]),
      [{ icon: 'edit', action: 'edit', class: '' }, { icon: 'trash', action: 'delete', class: 'danger' }]
    );
  },

  statusBadge(s) {
    const map = { pending: 'warning', in_progress: 'info', completed: 'success' };
    return Components.badge(s.replace('_', ' '), map[s] || 'info');
  },

  bindEvents() {
    document.getElementById('svcSearch')?.addEventListener('keyup', (e) => { if (e.key === 'Enter') this.applyFilter(); });
    this.items.forEach(i => {
      const id = i.id || i._id;
      document.querySelector(`[data-action="edit"][data-id="${id}"]`)?.addEventListener('click', () => this.showEditModal(i));
      document.querySelector(`[data-action="delete"][data-id="${id}"]`)?.addEventListener('click', () => this.confirmDelete(i));
    });
  },

  applyFilter() {
    this.search = document.getElementById('svcSearch').value;
    this.status = document.getElementById('svcStatus').value;
    this.startDate = document.getElementById('svcStart').value;
    this.endDate = document.getElementById('svcEnd').value;
    this.refresh();
  },
  clearFilter() { this.search = ''; this.status = ''; this.startDate = ''; this.endDate = ''; this.refresh(); },

  showAddModal() { this.showFormModal(null); },
  showEditModal(item) { this.showFormModal(item); },

  showFormModal(item) {
    const isEdit = !!item;
    Modal.show(`
      <form id="serviceForm">
        <div class="form-grid">
          <div class="input-group"><label>Application Number</label><input type="text" name="application_number" value="${isEdit ? (item.application_number || '') : `SVC-${Date.now()}`}"></div>
          <div class="input-group"><label>Customer Name *</label><input type="text" name="customer_name" value="${isEdit ? item.customer_name : ''}" required></div>
          <div class="input-group"><label>Mobile</label><input type="text" name="mobile" value="${isEdit ? (item.mobile || '') : ''}"></div>
          <div class="input-group"><label>CNIC</label><input type="text" name="cnic" value="${isEdit ? (item.cnic || '') : ''}"></div>
          <div class="input-group"><label>Service Type</label><select name="service_type"><option value="Birth Certificate" ${isEdit && item.service_type === 'Birth Certificate' ? 'selected' : ''}>Birth Certificate</option><option value="Death Certificate" ${isEdit && item.service_type === 'Death Certificate' ? 'selected' : ''}>Death Certificate</option><option value="NIC" ${isEdit && item.service_type === 'NIC' ? 'selected' : ''}>NIC</option><option value="Passport" ${isEdit && item.service_type === 'Passport' ? 'selected' : ''}>Passport</option><option value="Affidavit" ${isEdit && item.service_type === 'Affidavit' ? 'selected' : ''}>Affidavit</option><option value="Other" ${isEdit && item.service_type === 'Other' ? 'selected' : ''}>Other</option></select></div>
          <div class="input-group"><label>Status</label><select name="status"><option value="pending" ${isEdit && item.status === 'pending' ? 'selected' : ''}>Pending</option><option value="in_progress" ${isEdit && item.status === 'in_progress' ? 'selected' : ''}>In Progress</option><option value="completed" ${isEdit && item.status === 'completed' ? 'selected' : ''}>Completed</option></select></div>
          <div class="input-group"><label>Fee</label><input type="number" name="fee" value="${isEdit ? (item.fee || 0) : 0}"></div>
          <div class="input-group" style="grid-column:1/-1"><label>Notes</label><textarea name="notes">${isEdit ? (item.notes || '') : ''}</textarea></div>
        </div>
      </form>`, {
      title: isEdit ? 'Edit Service' : 'Add New Service',
      footer: `<button class="btn btn-secondary" onclick="Modal.hide()">Cancel</button><button class="btn btn-primary" onclick="Services.save()"><i class="fas fa-save"></i> ${isEdit ? 'Update' : 'Save'}</button>`
    });
    if (isEdit) Modal._editId = item.id || item._id;
    else delete Modal._editId;
  },

  async save() {
    const form = document.getElementById('serviceForm');
    const fd = new FormData(form);
    const data = Object.fromEntries(fd);
    if (!data.customer_name) { Toast.warning('Customer name is required'); return; }
    try {
      Modal.loading(true);
      if (Modal._editId) await API.services.update(Modal._editId, data);
      else await API.services.create(data);
      Modal.loading(false); Modal.hide();
      Toast.success(Modal._editId ? 'Service updated' : 'Service created');
      await this.refresh();
    } catch (error) { Modal.loading(false); Toast.error(error.message); }
  },

  confirmDelete(item) {
    Modal.confirm(`Delete service for "${item.customer_name}"?`, async () => {
      try { await API.services.delete(item.id || item._id); Toast.success('Service deleted'); await this.refresh(); }
      catch (error) { Toast.error(error.message); }
    }, { title: 'Delete Service', type: 'danger' });
  },

  async refresh() {
    Modal.loading(true); await this.loadData(); this.render(); Modal.loading(false);
  }
};
window.Services = Services;
