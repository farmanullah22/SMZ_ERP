const Customers = {
  async init() { await this.loadPage(); },

  getFilterParams() {
    const s = document.getElementById('custStartDate')?.value || '';
    const e = document.getElementById('custEndDate')?.value || '';
    const search = document.getElementById('customerSearch')?.value || '';
    const params = {};
    if (s) params.startDate = s;
    if (e) params.endDate = e;
    if (search) params.search = search;
    return params;
  },

  async applyFilter() {
    const customers = await API.customers.getAll(this.getFilterParams());
    document.getElementById('customersList').innerHTML = this.renderTable(customers);
    this.bindTableEvents(customers);
    Toast.success('Filter applied');
  },

  async clearFilter() {
    const sd = document.getElementById('custStartDate');
    const ed = document.getElementById('custEndDate');
    const sb = document.getElementById('customerSearch');
    if (sd) sd.value = '';
    if (ed) ed.value = '';
    if (sb) sb.value = '';
    const customers = await API.customers.getAll({});
    document.getElementById('customersList').innerHTML = this.renderTable(customers);
    this.bindTableEvents(customers);
    Toast.success('Filter cleared');
  },

  async loadPage() {
    const customers = await API.customers.getAll({});
    const container = document.getElementById('customersPage');

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Customers</h1>
        <div class="page-actions">
          <button class="btn btn-info btn-sm" onclick="Customers.exportPDF()">
            <i class="fas fa-file-pdf"></i> PDF
          </button>
          <button class="btn btn-primary" onclick="Customers.showAddModal()">
            <i class="fas fa-plus"></i> Add Customer
          </button>
        </div>
      </div>

      <div class="filter-bar">
        <div class="filter-group">
          <label>From</label>
          <input type="date" id="custStartDate">
        </div>
        <div class="filter-group">
          <label>To</label>
          <input type="date" id="custEndDate">
        </div>
        <button class="btn btn-primary btn-sm" onclick="Customers.applyFilter()">
          <i class="fas fa-filter"></i> Apply
        </button>
        <button class="btn btn-secondary btn-sm" onclick="Customers.clearFilter()">
          <i class="fas fa-times"></i> Clear
        </button>
        <input type="text" id="customerSearch" placeholder="Search customers..." style="min-width:200px;">
      </div>

      <div id="customersList">
        ${this.renderTable(customers)}
      </div>`;

    this.bindTableEvents(customers);

    document.getElementById('customerSearch')?.addEventListener('input', (e) => {
      this.searchTimeout && clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(async () => {
        const params = this.getFilterParams();
        params.search = e.target.value;
        const customers = await API.customers.getAll(params);
        document.getElementById('customersList').innerHTML = this.renderTable(customers);
        this.bindTableEvents(customers);
      }, 300);
    });
  },

  renderTable(customers) {
    if (customers.length === 0) return Components.emptyState('users', 'No Customers', 'Add customers to see them here');
    return Components.table(
      ['Name', 'Email', 'Phone', 'Address', 'Total Purchases', 'Total Spent', 'Actions'],
      customers.map(c => {
        const row = [
          c.name,
          c.email || '-',
          c.phone || '-',
          c.address || '-',
          c.total_purchases || 0,
          Components.formatCurrency(c.total_spent || 0),
          ''
        ];
        row.id = c.id;
        return row;
      }),
      [{ icon: 'user', action: 'view' }, { icon: 'edit', action: 'edit' }, { icon: 'trash', action: 'delete', class: 'danger' }]
    );
  },

  bindTableEvents(customers) {
    customers.forEach(c => {
      document.querySelector(`[data-action="view"][data-id="${c.id}"]`)?.addEventListener('click', () => this.showProfile(c.id));
      document.querySelector(`[data-action="edit"][data-id="${c.id}"]`)?.addEventListener('click', () => this.showEditModal(c));
      document.querySelector(`[data-action="delete"][data-id="${c.id}"]`)?.addEventListener('click', () => this.confirmDelete(c));
    });
  },

  showAddModal() {
    document.getElementById('modal').classList.add('modal-wide');
    Modal.show(`
      <form id="customerForm">
        <div class="input-group"><label>Name *</label><input type="text" name="name" required placeholder="Customer name"></div>
        <div class="form-grid">
          <div class="input-group"><label>Email</label><input type="email" name="email" placeholder="email@example.com"></div>
          <div class="input-group"><label>Phone</label><input type="tel" name="phone" placeholder="03XX-XXXXXXX"></div>
        </div>
        <div class="input-group"><label>Address</label><textarea name="address" rows="2"></textarea></div>
        <div class="input-group"><label>Notes</label><textarea name="notes" rows="2"></textarea></div>
      </form>`, {
      title: 'Add Customer',
      footer: `<button class="btn btn-secondary" onclick="Modal.hide()">Cancel</button><button class="btn btn-primary" onclick="Customers.saveCustomer()"><i class="fas fa-save"></i> Save</button>`
    });
  },

  showEditModal(customer) {
    document.getElementById('modal').classList.add('modal-wide');
    Modal.show(`
      <form id="customerForm">
        <div class="input-group"><label>Name *</label><input type="text" name="name" required value="${customer.name}"></div>
        <div class="form-grid">
          <div class="input-group"><label>Email</label><input type="email" name="email" value="${customer.email || ''}"></div>
          <div class="input-group"><label>Phone</label><input type="tel" name="phone" value="${customer.phone || ''}"></div>
        </div>
        <div class="input-group"><label>Address</label><textarea name="address" rows="2">${customer.address || ''}</textarea></div>
        <div class="input-group"><label>Notes</label><textarea name="notes" rows="2">${customer.notes || ''}</textarea></div>
      </form>`, {
      title: 'Edit Customer',
      footer: `<button class="btn btn-secondary" onclick="Modal.hide()">Cancel</button><button class="btn btn-primary" onclick="Customers.saveCustomer('${customer.id}')"><i class="fas fa-save"></i> Update</button>`
    });
  },

  async saveCustomer(id = null) {
    const form = document.getElementById('customerForm');
    const fd = new FormData(form);
    const data = Object.fromEntries(fd);
    if (!data.name) { Toast.warning('Name is required'); return; }

    try {
      Modal.loading(true);
      if (id) { await API.customers.update(id, data); Toast.success('Customer updated'); }
      else { await API.customers.create(data); Toast.success('Customer added'); }
      Modal.loading(false);
      Modal.hide();
      await this.loadPage();
    } catch (error) { Modal.loading(false); Toast.error(error.message); }
  },

  confirmDelete(customer) {
    Modal.confirm(`Delete customer "${customer.name}"?`, async () => {
      try { await API.customers.delete(customer.id); Toast.success('Deleted'); await this.loadPage(); }
      catch (error) { Toast.error('Failed to delete'); }
    }, { title: 'Delete Customer', type: 'danger' });
  },

  async showProfile(id) {
    try {
      Modal.loading(true);
      const customer = await API.customers.getById(id);
      Modal.loading(false);
      Modal.show(`
        <div style="text-align: center; padding: 20px 0;">
          <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), #8b5cf6); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
            <i class="fas fa-user" style="font-size: 36px; color: white;"></i>
          </div>
          <h3 style="font-size: 22px; font-weight: 700; margin-bottom: 4px;">${customer.name}</h3>
          <p class="text-muted" style="margin-bottom: 20px;">Customer Profile</p>
          <div class="form-grid" style="text-align: left; max-width: 500px; margin: 0 auto;">
            <div><label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Email</label><p>${customer.email || '-'}</p></div>
            <div><label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Phone</label><p>${customer.phone || '-'}</p></div>
            <div><label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Address</label><p>${customer.address || '-'}</p></div>
            <div><label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Total Purchases</label><p>${customer.total_purchases || 0}</p></div>
            <div><label style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">Total Spent</label><p>${Components.formatCurrency(customer.total_spent || 0)}</p></div>
          </div>
        </div>`, {
        title: 'Customer Profile',
        footer: `<button class="btn btn-secondary" onclick="Customers.showEditModal(${JSON.stringify(customer).replace(/"/g, '&quot;')}); Modal.hide();"><i class="fas fa-edit"></i> Edit</button><button class="btn btn-secondary" onclick="Modal.hide()">Close</button>`
      });
    } catch (error) {
      Modal.loading(false);
      Toast.error('Failed to load profile');
    }
  },

  async exportPDF() {
    try {
      const customers = await API.customers.getAll({});
      if (!customers.length) { Toast.warning('No data to export'); return; }
      const ok = Components.exportPDF(
        'SMZ - Customers Report',
        ['Name', 'Email', 'Phone', 'Address', 'Purchases', 'Total Spent'],
        customers.map(c => [
          c.name, c.email || '-', c.phone || '-', c.address || '-',
          String(c.total_purchases || 0), Components.formatCurrency(c.total_spent || 0)
        ]),
        'smz-customers'
      );
      if (ok) Toast.success('PDF exported successfully');
      else Toast.error('Failed to export PDF');
    } catch (e) { Toast.error('Failed to export PDF'); }
  }
};

window.Customers = Customers;
