const StampPapers = {
  async init() { await this.loadPage(); },

  async loadPage() {
    try {
      const items = await API.stampPapers.getAll();
      const container = document.getElementById('stampPapersPage');

      container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Stamp Paper</h1>
        <div class="page-actions">
          <button class="btn btn-info btn-sm" onclick="StampPapers.exportPDF()">
            <i class="fas fa-file-pdf"></i> PDF
          </button>
          <button class="btn btn-primary" onclick="StampPapers.showAddModal()">
            <i class="fas fa-plus"></i> Add Stamp Paper
          </button>
        </div>
      </div>

        <div id="stampPapersList">
          ${this.renderTable(items)}
        </div>`;

      this.bindTableEvents(items);
    } catch (error) {
      Toast.error('Failed to load stamp papers');
      console.error(error);
    }
  },

  renderTable(items) {
    if (items.length === 0) {
      return Components.emptyState('file-signature', 'No Stamp Papers', 'Add stamp papers to see them here');
    }

    return Components.table(
      ['Name', 'Type', 'Value', 'Price', 'Profit'],
      items.map(item => {
        const row = [
          item.name,
          item.type || '-',
          item.value || '-',
          Components.formatCurrency(item.price),
          item.profit === null || item.profit === undefined ? '-' : Components.formatCurrency(item.profit)
        ];
        row.id = item.id;
        return row;
      }),
      [{ icon: 'edit', action: 'edit' }, { icon: 'trash', action: 'delete', class: 'danger' }]
    );
  },

  bindTableEvents(items) {
    items.forEach(item => {
      document.querySelector(`[data-action="edit"][data-id="${item.id}"]`)
        ?.addEventListener('click', () => this.showEditModal(item));
      document.querySelector(`[data-action="delete"][data-id="${item.id}"]`)
        ?.addEventListener('click', () => this.confirmDelete(item));
    });
  },

  showAddModal() {
    Modal.show(`
      <form id="stampPaperForm">
        <div class="input-group"><label>Name *</label><input type="text" name="name" required placeholder="Stamp paper name"></div>
        <div class="form-grid">
          <div class="input-group"><label>Type</label><input type="text" name="type" placeholder="e.g. Judicial, Non-Judicial"></div>
          <div class="input-group"><label>Value (PKR)</label><input type="number" name="value" min="0" step="0.01" placeholder="Face value"></div>
        </div>
        <div class="input-group"><label>Price (PKR) *</label><input type="number" name="price" required min="0" step="0.01" placeholder="0.00"></div>
        <div class="input-group"><label>Profit (Optional)</label><input type="number" name="profit" min="0" step="0.01" placeholder="0.00"></div>
        <div class="input-group"><label>Documents</label><textarea name="documents" rows="2" placeholder="Associated documents (comma separated)"></textarea></div>
      </form>`, {
      title: 'Add Stamp Paper',
      footer: `<button class="btn btn-secondary" onclick="Modal.hide()">Cancel</button><button class="btn btn-primary" onclick="StampPapers.saveStampPaper()"><i class="fas fa-save"></i> Save</button>`
    });
  },

  showEditModal(item) {
    Modal.show(`
      <form id="stampPaperForm">
        <div class="input-group"><label>Name *</label><input type="text" name="name" required value="${item.name}"></div>
        <div class="form-grid">
          <div class="input-group"><label>Type</label><input type="text" name="type" value="${item.type || ''}"></div>
          <div class="input-group"><label>Value (PKR)</label><input type="number" name="value" min="0" step="0.01" value="${item.value || ''}"></div>
        </div>
        <div class="input-group"><label>Price (PKR) *</label><input type="number" name="price" required min="0" step="0.01" value="${item.price}"></div>
        <div class="input-group"><label>Profit (Optional)</label><input type="number" name="profit" min="0" step="0.01" value="${item.profit ?? ''}"></div>
        <div class="input-group"><label>Documents</label><textarea name="documents" rows="2">${item.documents || ''}</textarea></div>
      </form>`, {
      title: 'Edit Stamp Paper',
      footer: `<button class="btn btn-secondary" onclick="Modal.hide()">Cancel</button><button class="btn btn-primary" onclick="StampPapers.saveStampPaper('${item.id}')"><i class="fas fa-save"></i> Update</button>`
    });
  },

  async saveStampPaper(id = null) {
    const form = document.getElementById('stampPaperForm');
    const fd = new FormData(form);
    const data = Object.fromEntries(fd);

    if (!data.name || data.name.trim() === '') {
      Toast.warning('Name is required');
      return;
    }

    if (data.price === '') {
      Toast.warning('Price is required');
      return;
    }

    data.name = data.name.trim();
    data.price = parseFloat(data.price);
    data.profit = data.profit === '' ? null : parseFloat(data.profit);
    data.value = data.value === '' ? null : parseFloat(data.value);

    if (Number.isNaN(data.price) || data.price < 0) {
      Toast.warning('Price must be a valid number');
      return;
    }

    if (data.profit !== null && (Number.isNaN(data.profit) || data.profit < 0)) {
      Toast.warning('Profit must be a valid number');
      return;
    }

    try {
      Modal.loading(true);
      if (id) {
        await API.stampPapers.update(id, data);
        Toast.success('Stamp paper updated');
      } else {
        await API.stampPapers.create(data);
        Toast.success('Stamp paper added');
      }
      Modal.loading(false);
      Modal.hide();
      await this.loadPage();
    } catch (error) {
      Modal.loading(false);
      Toast.error(error.message || 'Failed to save stamp paper');
    }
  },

  confirmDelete(item) {
    Modal.confirm(`Delete stamp paper "${item.name}"?`, async () => {
      try {
        await API.stampPapers.delete(item.id);
        Toast.success('Stamp paper deleted');
        await this.loadPage();
      } catch (error) {
        Toast.error(error.message || 'Failed to delete');
      }
    }, { title: 'Delete Stamp Paper', type: 'danger' });
  },

  async exportPDF() {
    try {
      const items = await API.stampPapers.getAll();
      if (!items.length) { Toast.warning('No data to export'); return; }
      const ok = Components.exportPDF(
        'SMZ - Stamp Papers Report',
        ['Name', 'Type', 'Value', 'Price', 'Profit'],
        items.map(i => [
          i.name, i.type || '-', i.value || '-',
          Components.formatCurrency(i.price),
          i.profit === null || i.profit === undefined ? '-' : Components.formatCurrency(i.profit)
        ]),
        'smz-stamp-papers'
      );
      if (ok) Toast.success('PDF exported successfully');
      else Toast.error('Failed to export PDF');
    } catch (e) { Toast.error('Failed to export PDF'); }
  }
};

window.StampPapers = StampPapers;
