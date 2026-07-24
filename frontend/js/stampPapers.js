const StampPapers = {
  tempDocs: [],
  editDocs: [],

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
      ['Stamp #', 'Name', 'Type', 'Value', 'Price', 'Profit', 'Docs'],
      items.map(item => {
        const row = [
          item.stamp_number || '-',
          item.name,
          item.type || '-',
          item.value || '-',
          Components.formatCurrency(item.price),
          item.profit === null || item.profit === undefined ? '-' : Components.formatCurrency(item.profit),
          (item.documents && item.documents.length) ? `<i class="fas fa-paperclip"></i> ${item.documents.length}` : '-'
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

  docForm() {
    return `
      <div class="input-group">
        <label>Documents</label>
        <div id="docList" style="display:flex;flex-direction:column;gap:6px;margin-bottom:8px;"></div>
        <div style="display:flex;gap:8px;align-items:center;">
          <input type="file" id="docUploadInput" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style="display:none">
          <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('docUploadInput').click()"><i class="fas fa-upload"></i> Upload Document</button>
          <span id="docUploadStatus" style="font-size:13px;color:var(--text-muted);"></span>
        </div>
      </div>`;
  },

  renderDocList(docs) {
    const list = document.getElementById('docList');
    if (!list) return;
    if (!docs.length) { list.innerHTML = '<span style="font-size:13px;color:var(--text-muted);">No documents uploaded.</span>'; return; }
    list.innerHTML = docs.map((url, i) => `
      <div style="display:flex;align-items:center;justify-content:space-between;background:var(--bg-tertiary);padding:6px 10px;border-radius:var(--radius-md);">
        <span style="font-size:13px;"><i class="fas fa-file"></i> ${url.split('/').pop()}</span>
        <button type="button" class="action-btn danger btn-sm" onclick="StampPapers.removeDoc(${i})" style="padding:2px 6px;"><i class="fas fa-times"></i></button>
      </div>
    `).join('');
  },

  removeDoc(index) {
    if (this.editDocs.length) {
      this.editDocs.splice(index, 1);
      this.renderDocList(this.editDocs);
    } else {
      this.tempDocs.splice(index, 1);
      this.renderDocList(this.tempDocs);
    }
  },

  showAddModal() {
    this.tempDocs = [];
    Modal.show(`
      <form id="stampPaperForm" style="max-height:70vh;overflow-y:auto;">
        <div class="form-grid">
          <div class="input-group"><label>Stamp Number *</label><input type="text" name="stamp_number" required placeholder="Unique stamp number"></div>
          <div class="input-group"><label>Name *</label><input type="text" name="name" required placeholder="Stamp paper name"></div>
        </div>
        <div class="form-grid">
          <div class="input-group"><label>Type</label><input type="text" name="type" placeholder="e.g. Judicial, Non-Judicial"></div>
          <div class="input-group"><label>Value (PKR)</label><input type="number" name="value" min="0" step="0.01" placeholder="Face value"></div>
        </div>
        <div class="form-grid">
          <div class="input-group"><label>Customer Name</label><input type="text" name="customer_name" placeholder="Buyer name"></div>
          <div class="input-group"><label>Mobile</label><input type="text" name="mobile" placeholder="03XX-XXXXXXX"></div>
        </div>
        <div class="input-group"><label>Purpose</label><input type="text" name="purpose" placeholder="e.g. Sale Deed, Affidavit"></div>
        <div class="form-grid">
          <div class="input-group"><label>Price (PKR) *</label><input type="number" name="price" required min="0" step="0.01" placeholder="0.00"></div>
          <div class="input-group"><label>Profit (Optional)</label><input type="number" name="profit" min="0" step="0.01" placeholder="0.00"></div>
        </div>
        ${this.docForm()}
      </form>`, {
      title: 'Add Stamp Paper',
      footer: `<button class="btn btn-secondary" onclick="Modal.hide()">Cancel</button><button class="btn btn-primary" onclick="StampPapers.saveStampPaper()"><i class="fas fa-save"></i> Save</button>`
    });
    this.renderDocList(this.tempDocs);
    document.getElementById('docUploadInput')?.addEventListener('change', (e) => this.handleDocUpload(e));
  },

  showEditModal(item) {
    this.editDocs = Array.isArray(item.documents) ? [...item.documents] : [];
    Modal.show(`
      <form id="stampPaperForm" style="max-height:70vh;overflow-y:auto;">
        <div class="form-grid">
          <div class="input-group"><label>Stamp Number *</label><input type="text" name="stamp_number" required value="${item.stamp_number || ''}"></div>
          <div class="input-group"><label>Name *</label><input type="text" name="name" required value="${item.name}"></div>
        </div>
        <div class="form-grid">
          <div class="input-group"><label>Type</label><input type="text" name="type" value="${item.type || ''}"></div>
          <div class="input-group"><label>Value (PKR)</label><input type="number" name="value" min="0" step="0.01" value="${item.value || ''}"></div>
        </div>
        <div class="form-grid">
          <div class="input-group"><label>Customer Name</label><input type="text" name="customer_name" value="${item.customer_name || ''}"></div>
          <div class="input-group"><label>Mobile</label><input type="text" name="mobile" value="${item.mobile || ''}"></div>
        </div>
        <div class="input-group"><label>Purpose</label><input type="text" name="purpose" value="${item.purpose || ''}"></div>
        <div class="form-grid">
          <div class="input-group"><label>Price (PKR) *</label><input type="number" name="price" required min="0" step="0.01" value="${item.price}"></div>
          <div class="input-group"><label>Profit (Optional)</label><input type="number" name="profit" min="0" step="0.01" value="${item.profit ?? ''}"></div>
        </div>
        ${this.docForm()}
      </form>`, {
      title: 'Edit Stamp Paper',
      footer: `<button class="btn btn-secondary" onclick="Modal.hide()">Cancel</button><button class="btn btn-primary" onclick="StampPapers.saveStampPaper('${item.id}')"><i class="fas fa-save"></i> Update</button>`
    });
    this.renderDocList(this.editDocs);
    document.getElementById('docUploadInput')?.addEventListener('change', (e) => this.handleDocUpload(e));
  },

  async handleDocUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const status = document.getElementById('docUploadStatus');
    try {
      status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
      const res = await API.stampPapers.uploadDoc(file);
      if (res.url) {
        if (this.editDocs.length) {
          this.editDocs.push(res.url);
          this.renderDocList(this.editDocs);
        } else {
          this.tempDocs.push(res.url);
          this.renderDocList(this.tempDocs);
        }
        status.textContent = 'Uploaded!';
      }
    } catch (err) {
      status.textContent = 'Upload failed';
    }
    e.target.value = '';
  },

  async saveStampPaper(id = null) {
    const form = document.getElementById('stampPaperForm');
    const fd = new FormData(form);
    const data = Object.fromEntries(fd);

    if (!data.name || data.name.trim() === '') { Toast.warning('Name is required'); return; }
    if (!data.stamp_number || data.stamp_number.trim() === '') { Toast.warning('Stamp number is required'); return; }
    if (data.price === '') { Toast.warning('Price is required'); return; }

    data.name = data.name.trim();
    data.stamp_number = data.stamp_number.trim();
    data.price = parseFloat(data.price);
    data.profit = data.profit === '' ? null : parseFloat(data.profit);
    data.value = data.value === '' ? null : parseFloat(data.value);

    if (Number.isNaN(data.price) || data.price < 0) { Toast.warning('Price must be a valid number'); return; }
    if (data.profit !== null && (Number.isNaN(data.profit) || data.profit < 0)) { Toast.warning('Profit must be a valid number'); return; }

    data.documents = this.editDocs.length ? this.editDocs : this.tempDocs;

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
        ['Stamp #', 'Name', 'Type', 'Value', 'Price', 'Profit'],
        items.map(i => [
          i.stamp_number || '-', i.name, i.type || '-', i.value || '-',
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
