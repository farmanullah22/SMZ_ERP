const Sales = {
  products: [],
  cart: [],
  filters: { startDate: '', endDate: '', search: '' },

  async init() {
    await this.loadPage();
  },

  async loadPage() {
    const container = document.getElementById('salesPage');
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Sales</h1>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="Sales.showNewSaleModal()">
            <i class="fas fa-plus"></i> New Sale
          </button>
        </div>
      </div>

      <div class="filter-bar">
        <input type="date" id="salesStartDate" value="${this.filters.startDate}">
        <input type="date" id="salesEndDate" value="${this.filters.endDate}">
        <input type="text" id="salesSearch" placeholder="Search invoice..." value="${this.filters.search}">
        <button class="btn btn-sm btn-primary" onclick="Sales.loadSalesList()"><i class="fas fa-search"></i> Filter</button>
      </div>

      <div id="salesList">
        <div class="text-center text-muted" style="padding: 40px;"><i class="fas fa-spinner fa-spin"></i> Loading...</div>
      </div>`;

    this.bindFilterEvents();
    await this.loadSalesList();
  },

  async loadSalesList() {
    try {
      this.filters.startDate = document.getElementById('salesStartDate').value;
      this.filters.endDate = document.getElementById('salesEndDate').value;
      this.filters.search = document.getElementById('salesSearch').value;

      const sales = await API.sales.getAll(this.filters);
      const container = document.getElementById('salesList');

      if (sales.length === 0) {
        container.innerHTML = Components.emptyState('shopping-cart', 'No Sales Yet', 'Start making sales to see them here');
        return;
      }

      container.innerHTML = Components.table(
        ['Invoice', 'Date', 'Items', 'Total', 'Profit', 'Payment', 'Actions'],
        sales.map(s => {
          const row = [
            s.invoice_number,
            Components.formatDateTime(s.created_at),
            s.items_count || 0,
            Components.formatCurrency(s.total_amount),
            Components.formatCurrency(s.total_profit),
            Components.badge(s.payment_method || 'cash', 'info'),
            ''
          ];
          row.id = s.id;
          return row;
        }),
        [{ icon: 'eye', action: 'view' }, { icon: 'trash', action: 'delete', class: 'danger' }]
      );

      sales.forEach(s => {
        document.querySelector(`[data-action="view"][data-id="${s.id}"]`)?.addEventListener('click', () => this.viewSale(s));
        document.querySelector(`[data-action="delete"][data-id="${s.id}"]`)?.addEventListener('click', () => this.confirmDelete(s));
      });
    } catch (error) {
      Toast.error('Failed to load sales: ' + error.message);
      console.error(error);
    }
  },

  bindFilterEvents() {
    ['salesStartDate', 'salesEndDate', 'salesSearch'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', () => {});
    });
  },

  async showNewSaleModal() {
    try {
      Modal.loading(true);
      const [products, customers] = await Promise.all([
        API.products.getAll(),
        API.customers.getAll()
      ]);
      Modal.loading(false);

      this.products = products;
      this.cart = [];

      document.getElementById('modal').classList.add('modal-wide');
      
      Modal.show(`
        <div style="display: grid; grid-template-columns: 1fr 380px; gap: 24px;">
          <div>
            <h4 style="margin-bottom: 16px;">Select Products</h4>
            <div class="pos-search mb-4">
              <i class="fas fa-search"></i>
              <input type="text" id="posSearch" placeholder="Search products..." oninput="Sales.filterProducts(this.value)">
            </div>
            <div class="pos-products-grid" id="posProductsGrid" style="max-height: 450px; overflow-y: auto;">
              ${products.length === 0 ? 
                '<p class="text-muted text-center">No products available. Add products first.</p>' :
                products.map(p => `
                  <div class="pos-product-card" onclick="Sales.addToCart(${p.id})" data-id="${p.id}" data-name="${p.name}" data-price="${p.sale_price}" data-stock="${p.quantity}">
                    <div class="product-name">${p.name}</div>
                    <div class="product-price">${Components.formatCurrency(p.sale_price)}</div>
                    <div class="product-stock ${p.quantity <= (p.reorder_level || 10) ? 'text-danger' : ''}">Stock: ${p.quantity}</div>
                  </div>
                `).join('')
              }
            </div>
          </div>
          
          <div style="border-left: 1px solid var(--border-color); padding-left: 20px;">
            <div class="input-group">
              <label>Customer (Optional)</label>
              <select id="saleCustomer">
                <option value="">Walk-in Customer</option>
                ${customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
              </select>
            </div>

            <h4 style="margin: 16px 0 12px;">Cart Items</h4>
            <div id="posCartItems" style="max-height: 250px; overflow-y: auto;">
              ${Components.emptyState('shopping-cart', 'Cart Empty', 'Select products')}
            </div>

            <div class="pos-cart-summary">
              <div class="pos-cart-total-row"><span>Items</span><span id="cartItems">0</span></div>
              <div class="pos-cart-total-row"><span>Subtotal</span><span id="cartSubtotal">PKR 0.00</span></div>
              <div class="pos-cart-total-row"><span>Profit</span><span id="cartProfit" class="text-success">PKR 0.00</span></div>
              <div class="pos-cart-total-row grand-total"><span>Total</span><span id="cartTotal">PKR 0.00</span></div>
            </div>
          </div>
        </div>`, {
        title: 'New Sale',
        footer: `<button class="btn btn-secondary" onclick="Modal.hide()">Cancel</button><button class="btn btn-success" onclick="Sales.completeSale()" id="completeSaleBtn" disabled><i class="fas fa-check"></i> Complete Sale</button>`,
        onOpen: () => {}
      });
    } catch (error) {
      Modal.loading(false);
      Toast.error('Failed to load data: ' + error.message);
    }
  },

  filterProducts(query) {
    const cards = document.querySelectorAll('.pos-product-card');
    cards.forEach(card => {
      const name = card.dataset.name.toLowerCase();
      card.style.display = name.includes(query.toLowerCase()) ? 'block' : 'none';
    });
  },

  addToCart(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;
    
    if (product.quantity <= 0) {
      Toast.warning('Product out of stock');
      return;
    }

    const existing = this.cart.find(i => i.product_id === productId);
    if (existing) {
      if (existing.quantity >= product.quantity) {
        Toast.warning('Cannot add more. Stock limit reached.');
        return;
      }
      existing.quantity++;
      existing.subtotal = existing.quantity * existing.sale_price;
    } else {
      this.cart.push({
        product_id: product.id,
        name: product.name,
        quantity: 1,
        sale_price: product.sale_price,
        cost_price: product.cost_price,
        subtotal: product.sale_price
      });
    }
    
    this.renderCart();
    Toast.success(`Added ${product.name}`);
  },

  updateQuantity(productId, change) {
    const item = this.cart.find(i => i.product_id === productId);
    if (!item) return;
    
    const product = this.products.find(p => p.id === productId);
    const newQty = item.quantity + change;

    if (newQty <= 0) {
      this.removeFromCart(productId);
      return;
    }
    if (newQty > product.quantity) {
      Toast.warning('Cannot exceed available stock');
      return;
    }

    item.quantity = newQty;
    item.subtotal = item.quantity * item.sale_price;
    this.renderCart();
  },

  removeFromCart(productId) {
    this.cart = this.cart.filter(i => i.product_id !== productId);
    this.renderCart();
  },

  renderCart() {
    const container = document.getElementById('posCartItems');
    const totalEl = document.getElementById('cartTotal');
    const subtotalEl = document.getElementById('cartSubtotal');
    const profitEl = document.getElementById('cartProfit');
    const itemsEl = document.getElementById('cartItems');
    const btn = document.getElementById('completeSaleBtn');

    if (this.cart.length === 0) {
      container.innerHTML = Components.emptyState('shopping-cart', 'Cart Empty', 'Select products');
      totalEl.textContent = 'PKR 0.00';
      subtotalEl.textContent = 'PKR 0.00';
      profitEl.textContent = 'PKR 0.00';
      itemsEl.textContent = '0';
      btn.disabled = true;
      return;
    }

    btn.disabled = false;

    container.innerHTML = this.cart.map(item => `
      <div class="pos-cart-item">
        <div class="pos-cart-item-info">
          <div class="pos-cart-item-name">${item.name}</div>
          <div class="pos-cart-item-price">${Components.formatCurrency(item.sale_price)}</div>
        </div>
        <div class="pos-cart-item-qty">
          <button onclick="Sales.updateQuantity(${item.product_id}, -1)"><i class="fas fa-minus"></i></button>
          <span>${item.quantity}</span>
          <button onclick="Sales.updateQuantity(${item.product_id}, 1)"><i class="fas fa-plus"></i></button>
        </div>
        <div class="pos-cart-item-total">${Components.formatCurrency(item.subtotal)}</div>
        <button class="pos-cart-item-remove" onclick="Sales.removeFromCart(${item.product_id})"><i class="fas fa-trash"></i></button>
      </div>`).join('');

    const total = this.cart.reduce((s, i) => s + i.subtotal, 0);
    const profit = this.cart.reduce((s, i) => s + ((i.sale_price - i.cost_price) * i.quantity), 0);
    const itemCount = this.cart.reduce((s, i) => s + i.quantity, 0);

    totalEl.textContent = Components.formatCurrency(total);
    subtotalEl.textContent = Components.formatCurrency(total);
    profitEl.textContent = Components.formatCurrency(profit);
    itemsEl.textContent = itemCount;
  },

  async completeSale() {
    if (this.cart.length === 0) {
      Toast.warning('Cart is empty');
      return;
    }

    const customerId = document.getElementById('saleCustomer').value;
    const items = this.cart.map(i => ({
      product_id: i.product_id,
      quantity: i.quantity,
      sale_price: i.sale_price
    }));

    try {
      Modal.loading(true);
      const sale = await API.sales.create({
        customer_id: customerId ? parseInt(customerId) : null,
        items: items
      });
      Modal.loading(false);
      Modal.hide();
      Toast.success(`Sale completed! Invoice: ${sale.invoice_number}`);
      await this.loadSalesList();
    } catch (error) {
      Modal.loading(false);
      Toast.error(error.message || 'Failed to complete sale');
    }
  },

  async viewSale(sale) {
    try {
      const data = await API.sales.getById(sale.id);
      Modal.show(`
        <div class="invoice-preview">
          <div class="invoice-header">
            <h2>INVOICE</h2>
            <p><strong>${data.invoice_number}</strong></p>
            <p>${Components.formatDateTime(data.created_at)}</p>
            ${data.customer_name ? `<p>Customer: <strong>${data.customer_name}</strong></p>` : ''}
          </div>
          <div class="invoice-items">
            <table>
              <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
              <tbody>
                ${data.items.map(i => `
                  <tr>
                    <td>${i.product_name}</td>
                    <td>${i.quantity}</td>
                    <td>${Components.formatCurrency(i.sale_price)}</td>
                    <td>${Components.formatCurrency(i.subtotal)}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
          <div class="invoice-total">
            <p><strong>Total:</strong> ${Components.formatCurrency(data.total_amount)}</p>
            <p class="text-success"><strong>Profit:</strong> ${Components.formatCurrency(data.total_profit)}</p>
          </div>
          <div class="invoice-footer"><p>Thank you for your business!</p></div>
        </div>`, {
        title: 'Sale Details - ' + data.invoice_number,
        footer: `<button class="btn btn-secondary" onclick="Modal.hide()">Close</button>`
      });
    } catch (error) {
      Toast.error('Failed to load sale details');
    }
  },

  confirmDelete(sale) {
    Modal.confirm(
      `Delete sale ${sale.invoice_number}? Stock will be restored.`,
      async () => {
        try {
          await API.sales.delete(sale.id);
          Toast.success('Sale deleted successfully');
          await this.loadSalesList();
        } catch (error) {
          Toast.error(error.message || 'Failed to delete sale');
        }
      },
      { title: 'Delete Sale', type: 'danger' }
    );
  }
};

window.Sales = Sales;
