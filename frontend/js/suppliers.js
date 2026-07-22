const Suppliers = {
  async init() { await this.loadPage(); },

  async loadPage() {
    const suppliers = await API.products.getSuppliers();
    const container = document.getElementById('suppliersPage');

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Suppliers</h1>
        <div class="page-actions">
          <button class="btn btn-info btn-sm" onclick="Suppliers.exportPDF()">
            <i class="fas fa-file-pdf"></i> PDF
          </button>
          <button class="btn btn-primary" onclick="Suppliers.showAddModal()">
            <i class="fas fa-plus"></i> Add Supplier
          </button>
        </div>
      </div>

      <div class="filter-bar">
        <input type="text" id="supplierSearch" placeholder="Search suppliers...">
      </div>

      <div id="suppliersList">
        ${this.renderTable(suppliers)}
      </div>`;

    this.bindTableEvents(suppliers);

    document.getElementById('supplierSearch')?.addEventListener('input', async (e) => {
      const suppliers = await API.products.getSuppliers();
      const filtered = suppliers.filter(s => s.company_name.toLowerCase().includes(e.target.value.toLowerCase()));
      document.getElementById('suppliersList').innerHTML = this.renderTable(filtered);
      this.bindTableEvents(filtered);
    });
  },

  renderTable(suppliers) {
    if (suppliers.length === 0) return Components.emptyState('industry', 'No Suppliers', 'Add suppliers to see them here');
    return Components.table(
      ['Company', 'Contact', 'Email', 'Phone', 'Products'],
      suppliers.map(s => {
        const row = [
          s.company_name,
          s.contact_person || '-',
          s.email || '-',
          s.phone || '-',
          s.product_count || 0
        ];
        row.id = s.id;
        return row;
      }),
      [{ icon: 'edit', action: 'edit' }, { icon: 'trash', action: 'delete', class: 'danger' }]
    );
  },

  bindTableEvents(suppliers) {
    suppliers.forEach(s => {
      document.querySelector(`[data-action="edit"][data-id="${s.id}"]`)?.addEventListener('click', () => this.showEditModal(s));
      document.querySelector(`[data-action="delete"][data-id="${s.id}"]`)?.addEventListener('click', () => this.confirmDelete(s));
    });
  },

  showAddModal() {
    document.getElementById('modal').classList.add('modal-wide');
    Modal.show(`
      <form id="supplierForm">
        <div class="input-group"><label>Company Name *</label><input type="text" name="company_name" required placeholder="Company name"></div>
        <div class="input-group"><label>Contact Person</label><input type="text" name="contact_person" placeholder="Contact person name"></div>
        <div class="form-grid">
          <div class="input-group"><label>Email</label><input type="email" name="email" placeholder="email@example.com"></div>
          <div class="input-group"><label>Phone</label><input type="tel" name="phone" placeholder="03XX-XXXXXXX"></div>
        </div>
        <div class="input-group"><label>Address</label><textarea name="address" rows="2"></textarea></div>
        <div class="input-group"><label>Notes</label><textarea name="notes" rows="2"></textarea></div>
      </form>`, {
      title: 'Add Supplier',
      footer: `<button class="btn btn-secondary" onclick="Modal.hide()">Cancel</button><button class="btn btn-primary" onclick="Suppliers.saveSupplier()"><i class="fas fa-save"></i> Save</button>`
    });
  },

  showEditModal(supplier) {
    document.getElementById('modal').classList.add('modal-wide');
    Modal.show(`
      <form id="supplierForm">
        <div class="input-group"><label>Company Name *</label><input type="text" name="company_name" required value="${supplier.company_name}"></div>
        <div class="input-group"><label>Contact Person</label><input type="text" name="contact_person" value="${supplier.contact_person || ''}"></div>
        <div class="form-grid">
          <div class="input-group"><label>Email</label><input type="email" name="email" value="${supplier.email || ''}"></div>
          <div class="input-group"><label>Phone</label><input type="tel" name="phone" value="${supplier.phone || ''}"></div>
        </div>
        <div class="input-group"><label>Address</label><textarea name="address" rows="2">${supplier.address || ''}</textarea></div>
        <div class="input-group"><label>Notes</label><textarea name="notes" rows="2">${supplier.notes || ''}</textarea></div>
      </form>`, {
      title: 'Edit Supplier',
      footer: `<button class="btn btn-secondary" onclick="Modal.hide()">Cancel</button><button class="btn btn-primary" onclick="Suppliers.saveSupplier(${supplier.id})"><i class="fas fa-save"></i> Update</button>`
    });
  },

  async saveSupplier(id = null) {
    const form = document.getElementById('supplierForm');
    const fd = new FormData(form);
    const data = Object.fromEntries(fd);
    if (!data.company_name) { Toast.warning('Company name is required'); return; }

    try {
      Modal.loading(true);
      if (id) { await API.products.updateSupplier(id, data); Toast.success('Supplier updated'); }
      else { await API.products.createSupplier(data); Toast.success('Supplier added'); }
      Modal.loading(false);
      Modal.hide();
      await this.loadPage();
    } catch (error) { Modal.loading(false); Toast.error(error.message); }
  },

  confirmDelete(supplier) {
    Modal.confirm(`Delete supplier "${supplier.company_name}"?`, async () => {
      try { await API.products.deleteSupplier(supplier.id); Toast.success('Deleted'); await this.loadPage(); }
      catch (error) { Toast.error('Failed to delete'); }
    }, { title: 'Delete Supplier', type: 'danger' });
  },

  async exportPDF() {
    try {
      const suppliers = await API.products.getSuppliers();
      if (!suppliers.length) { Toast.warning('No data to export'); return; }
      const ok = Components.exportPDF(
        'SMZ - Suppliers Report',
        ['Company', 'Contact', 'Email', 'Phone', 'Products'],
        suppliers.map(s => [
          s.company_name, s.contact_person || '-', s.email || '-',
          s.phone || '-', String(s.product_count || 0)
        ]),
        'smz-suppliers'
      );
      if (ok) Toast.success('PDF exported successfully');
      else Toast.error('Failed to export PDF');
    } catch (e) { Toast.error('Failed to export PDF'); }
  }
};

window.Suppliers = Suppliers;
