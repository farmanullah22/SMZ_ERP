const Purchases = {
  filters: { startDate: '', endDate: '', supplier: '', search: '' },
  products: [],

  async init() { await this.loadPage(); },

  async loadPage() {
    const container = document.getElementById('purchasesPage');
    const [purchases, suppliers] = await Promise.all([
      API.purchases.getAll(this.filters),
      API.products.getSuppliers()
    ]);

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Purchases</h1>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="Purchases.showAddModal()">
            <i class="fas fa-plus"></i> Add Purchase
          </button>
        </div>
      </div>

      <div class="filter-bar">
        <input type="date" id="purchaseStartDate" value="${this.filters.startDate}">
        <input type="date" id="purchaseEndDate" value="${this.filters.endDate}">
        <select id="purchaseSupplier">
          <option value="">All Suppliers</option>
          ${suppliers.map(s => `<option value="${s.id}" ${this.filters.supplier == s.id ? 'selected' : ''}>${s.company_name}</option>`).join('')}
        </select>
        <button class="btn btn-sm btn-primary" onclick="Purchases.loadPurchasesList()"><i class="fas fa-search"></i> Filter</button>
      </div>

      <div id="purchasesList">
        ${this.renderTable(purchases)}
      </div>`;

    this.bindFilterEvents();
    this.bindTableEvents(purchases);
  },

  renderTable(purchases) {
    if (purchases.length === 0) {
      return Components.emptyState('truck', 'No Purchases', 'Add purchases to see them here');
    }
    
    return Components.table(
      ['Reference', 'Date', 'Supplier', 'Items', 'Total', 'Actions'],
      purchases.map(p => {
        const row = [
          p.reference_number,
          Components.formatDateTime(p.created_at),
          p.supplier_name || '-',
          Components.formatCurrency(p.total_amount),
          ''
        ];
        row.id = p.id;
        return row;
      }),
      [{ icon: 'eye', action: 'view' }, { icon: 'trash', action: 'delete', class: 'danger' }]
    );
  },

  async loadPurchasesList() {
    this.filters.startDate = document.getElementById('purchaseStartDate').value;
    this.filters.endDate = document.getElementById('purchaseEndDate').value;
    this.filters.supplier = document.getElementById('purchaseSupplier').value;

    try {
      const purchases = await API.purchases.getAll(this.filters);
      document.getElementById('purchasesList').innerHTML = this.renderTable(purchases);
      this.bindTableEvents(purchases);
    } catch (error) {
      Toast.error('Failed to load purchases');
    }
  },

  bindFilterEvents() {
    ['purchaseStartDate', 'purchaseEndDate', 'purchaseSupplier'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', () => {});
    });
  },

  bindTableEvents(purchases) {
    purchases.forEach(p => {
      document.querySelector(`[data-action="view"][data-id="${p.id}"]`)?.addEventListener('click', () => this.viewPurchase(p));
      document.querySelector(`[data-action="delete"][data-id="${p.id}"]`)?.addEventListener('click', () => this.confirmDelete(p));
    });
  },

  async showAddModal() {
    try {
      Modal.loading(true);
      const [suppliers, products] = await Promise.all([
        API.products.getSuppliers(),
        API.products.getAll()
      ]);
      Modal.loading(false);

      this.products = products;

      document.getElementById('modal').classList.add('modal-wide');
      
      Modal.show(`
        <form id="purchaseForm">
          <div class="input-group">
            <label>Supplier *</label>
            <select name="supplier_id" required id="purchaseSupplierSelect">
              <option value="">-- Select Supplier --</option>
              ${suppliers.map(s => `<option value="${s.id}">${s.company_name}</option>`).join('')}
            </select>
          </div>

          <h4 style="margin: 16px 0 12px;">Add Items</h4>
          <div id="purchaseItemsContainer">
            ${this.createItemRow(products)}
          </div>
          
          <button type="button" class="btn btn-sm btn-secondary mb-4" onclick="Purchases.addItemRow()">
            <i class="fas fa-plus"></i> Add Item
          </button>

          <div class="input-group"><label>Notes</label><textarea name="notes" rows="2" placeholder="Optional notes"></textarea></div>

          <div class="pos-cart-summary mt-4">
            <div class="pos-cart-total-row grand-total">
              <span>Total</span>
              <span id="purchaseTotal">PKR 0.00</span>
            </div>
          </div>
        </form>`, {
        title: 'Add Purchase',
        footer: `<button class="btn btn-secondary" onclick="Modal.hide()">Cancel</button><button class="btn btn-primary" onclick="Purchases.savePurchase()"><i class="fas fa-save"></i> Complete Purchase</button>`,
        onOpen: () => {
          document.querySelectorAll('.item-row').forEach(row => this.bindItemRowEvents(row));
        }
      });
    } catch (error) {
      Modal.loading(false);
      Toast.error('Failed to load data');
    }
  },

  createItemRow(products) {
    return `
      <div class="item-row form-grid" style="margin-bottom: 12px; align-items: end;">
        <div class="input-group">
          <label>Product</label>
          <select class="item-product" onchange="Purchases.onProductSelect(this)">
            <option value="">-- Select Product --</option>
            ${products.map(p => `<option value="${p.id}" data-name="${p.name}" data-price="${p.cost_price}">${p.name}</option>`).join('')}
          </select>
        </div>
        <div class="input-group">
          <label>Quantity</label>
          <input type="number" class="item-qty" min="1" value="1" oninput="Purchases.updateSubtotal(this)">
        </div>
        <div class="input-group">
          <label>Cost Price</label>
          <input type="number" class="item-cost" min="0" step="0.01" oninput="Purchases.updateSubtotal(this)">
        </div>
        <div class="input-group">
          <label>Subtotal</label>
          <input type="text" class="item-subtotal" readonly>
        </div>
        <button type="button" class="btn btn-danger btn-icon" onclick="Purchases.removeItemRow(this)" style="margin-bottom: 8px;">
          <i class="fas fa-times"></i>
        </button>
      </div>`;
  },

  addItemRow() {
    const container = document.getElementById('purchaseItemsContainer');
    const div = document.createElement('div');
    div.innerHTML = this.createItemRow(this.products);
    container.appendChild(div.firstElementChild);
    this.bindItemRowEvents(container.lastElementChild);
  },

  removeItemRow(btn) {
    const container = document.getElementById('purchaseItemsContainer');
    if (container.children.length > 1) {
      btn.closest('.item-row').remove();
      this.updateTotal();
    } else {
      Toast.warning('At least one item is required');
    }
  },

  bindItemRowEvents(row) {
    row.querySelector('.item-qty')?.addEventListener('input', () => this.updateSubtotal(row));
    row.querySelector('.item-cost')?.addEventListener('input', () => this.updateSubtotal(row));
  },

  onProductSelect(sel) {
    const row = sel.closest('.item-row');
    const opt = sel.options[sel.selectedIndex];
    if (opt.dataset.price) {
      row.querySelector('.item-cost').value = opt.dataset.price;
    }
    this.updateSubtotal(row);
  },

  updateSubtotal(row) {
    const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
    const cost = parseFloat(row.querySelector('.item-cost').value) || 0;
    row.querySelector('.item-subtotal').value = Components.formatCurrency(qty * cost);
    this.updateTotal();
  },

  updateTotal() {
    let total = 0;
    document.querySelectorAll('.item-row').forEach(row => {
      const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
      const cost = parseFloat(row.querySelector('.item-cost').value) || 0;
      total += qty * cost;
    });
    document.getElementById('purchaseTotal').textContent = Components.formatCurrency(total);
  },

  async savePurchase() {
    const supplierId = document.getElementById('purchaseSupplierSelect').value;
    if (!supplierId) {
      Toast.warning('Please select a supplier');
      return;
    }

    const items = [];
    let valid = false;
    document.querySelectorAll('.item-row').forEach(row => {
      const productId = row.querySelector('.item-product').value;
      const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
      const cost = parseFloat(row.querySelector('.item-cost').value) || 0;
      
      if (productId && qty > 0 && cost > 0) {
        valid = true;
        items.push({
          product_id: parseInt(productId),
          quantity: qty,
          cost_price: cost
        });
      }
    });

    if (!valid) {
      Toast.warning('Please add at least one valid item');
      return;
    }

    const notes = document.querySelector('#purchaseForm textarea[name="notes"]').value;

    try {
      Modal.loading(true);
      await API.purchases.create({
        supplier_id: parseInt(supplierId),
        items: items,
        notes: notes
      });
      Modal.loading(false);
      Modal.hide();
      Toast.success('Purchase recorded successfully');
      await this.loadPage();
    } catch (error) {
      Modal.loading(false);
      Toast.error(error.message || 'Failed to save purchase');
    }
  },

  async viewPurchase(purchase) {
    try {
      const data = await API.purchases.getById(purchase.id);
      Modal.show(`
        <div class="invoice-preview">
          <div class="invoice-header">
            <h2>PURCHASE</h2>
            <p><strong>${data.reference_number}</strong></p>
            <p>${Components.formatDateTime(data.created_at)}</p>
            <p>Supplier: <strong>${data.supplier_name}</strong></p>
          </div>
          <div class="invoice-items">
            <table>
              <thead><tr><th>Product</th><th>Qty</th><th>Cost</th><th>Total</th></tr></thead>
              <tbody>
                ${data.items.map(i => `
                  <tr>
                    <td>${i.product_name}</td>
                    <td>${i.quantity}</td>
                    <td>${Components.formatCurrency(i.cost_price)}</td>
                    <td>${Components.formatCurrency(i.subtotal)}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
          <div class="invoice-total">
            <p><strong>Total:</strong> ${Components.formatCurrency(data.total_amount)}</p>
          </div>
          ${data.notes ? `<div class="invoice-footer"><p>Notes: ${data.notes}</p></div>` : ''}
        </div>`, {
        title: 'Purchase Details',
        footer: `<button class="btn btn-secondary" onclick="Modal.hide()">Close</button>`
      });
    } catch (error) {
      Toast.error('Failed to load purchase details');
    }
  },

  confirmDelete(purchase) {
    Modal.confirm(
      `Delete purchase ${purchase.reference_number}? Stock will be reduced.`,
      async () => {
        try {
          await API.purchases.delete(purchase.id);
          Toast.success('Purchase deleted successfully');
          await this.loadPage();
        } catch (error) {
          Toast.error(error.message || 'Failed to delete');
        }
      },
      { title: 'Delete Purchase', type: 'danger' }
    );
  }
};

window.Purchases = Purchases;
