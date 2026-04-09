const Customers = {
  async init() { await this.loadPage(); },

  async loadPage() {
    const customers = await API.customers.getAll({});
    const container = document.getElementById('customersPage');

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Customers</h1>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="Customers.showAddModal()">
            <i class="fas fa-plus"></i> Add Customer
          </button>
        </div>
      </div>

      <div class="filter-bar">
        <input type="text" id="customerSearch" placeholder="Search customers...">
      </div>

      <div id="customersList">
        ${this.renderTable(customers)}
      </div>`;

    this.bindTableEvents(customers);

    document.getElementById('customerSearch')?.addEventListener('input', async (e) => {
      const customers = await API.customers.getAll({ search: e.target.value });
      document.getElementById('customersList').innerHTML = this.renderTable(customers);
      this.bindTableEvents(customers);
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
      [{ icon: 'edit', action: 'edit' }, { icon: 'trash', action: 'delete', class: 'danger' }]
    );
  },

  bindTableEvents(customers) {
    customers.forEach(c => {
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
      footer: `<button class="btn btn-secondary" onclick="Modal.hide()">Cancel</button><button class="btn btn-primary" onclick="Customers.saveCustomer(${customer.id})"><i class="fas fa-save"></i> Update</button>`
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
  }
};

window.Customers = Customers;
