const Products = {
  filters: { search: '', category: '', supplier: '', sort: 'name_asc' },

  async init() {
    await this.loadPage();
  },

  async loadPage() {
    try {
      const [products, categories, suppliers] = await Promise.all([
        API.products.getAll(this.filters),
        API.products.getCategories(),
        API.products.getSuppliers()
      ]);

      const container = document.getElementById('productsPage');
      container.innerHTML = `
        <div class="page-header">
          <h1 class="page-title">Services & Products</h1>
          <div class="page-actions">
            <button class="btn btn-secondary btn-sm" onclick="Products.showCategoryModal()">
              <i class="fas fa-tags"></i> Manage Categories
            </button>
            <button class="btn btn-info btn-sm" onclick="Products.exportPDF()">
              <i class="fas fa-file-pdf"></i> PDF
            </button>
            <button class="btn btn-primary" onclick="Products.showAddModal()">
              <i class="fas fa-plus"></i> Add Service
            </button>
          </div>
        </div>

        <div class="filter-bar">
          <input type="text" id="productSearch" placeholder="Search by name or SKU..." value="${this.filters.search}">
          <select id="productCategory">
            <option value="">All Categories</option>
            ${categories.map(c => `<option value="${c.id}" ${this.filters.category == c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
          </select>
          <select id="productSupplier">
            <option value="">All Suppliers</option>
            ${suppliers.map(s => `<option value="${s.id}" ${this.filters.supplier == s.id ? 'selected' : ''}>${s.company_name}</option>`).join('')}
          </select>
          <select id="productSort">
            <option value="name_asc" ${this.filters.sort === 'name_asc' ? 'selected' : ''}>Name (A-Z)</option>
            <option value="name_desc" ${this.filters.sort === 'name_desc' ? 'selected' : ''}>Name (Z-A)</option>
            <option value="quantity_asc" ${this.filters.sort === 'quantity_asc' ? 'selected' : ''}>Stock (Low-High)</option>
            <option value="price_asc" ${this.filters.sort === 'price_asc' ? 'selected' : ''}>Price (Low-High)</option>
          </select>
        </div>

        <div id="productsTable">
          ${this.renderTable(products, categories)}
        </div>`;

      this.bindEvents();
      this.bindTableEvents(products);
    } catch (error) {
      Toast.error('Failed to load products');
      console.error(error);
    }
  },

  renderTable(products, categories) {
    if (products.length === 0) {
      return Components.emptyState('box', 'No Products', 'Add products to see them here');
    }
    
    const headers = ['SKU', 'Name', 'Category', 'Qty', 'Cost', 'Sale Price', 'Supplier', 'Status'];
    const rows = products.map(p => {
      const row = [
        p.sku || '-',
        p.name,
        p.category_name || '-',
        p.quantity,
        Components.formatCurrency(p.cost_price),
        Components.formatCurrency(p.sale_price),
        p.supplier_name || '-',
        p.quantity === 0 ? Components.badge('Out of Stock', 'danger') :
        p.stock_status === 'low' ? Components.badge('Low Stock', 'warning') :
        Components.badge('In Stock', 'success')
      ];
      row.id = p.id;
      return row;
    });
    
    return Components.table(headers, rows, [{ icon: 'edit', action: 'edit' }, { icon: 'trash', action: 'delete', class: 'danger' }]);
  },

  bindEvents() {
    const debounce = (fn, delay) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), delay); }; };
    const update = debounce(() => {
      this.filters.search = document.getElementById('productSearch').value;
      this.filters.category = document.getElementById('productCategory').value;
      this.filters.supplier = document.getElementById('productSupplier').value;
      this.filters.sort = document.getElementById('productSort').value;
      this.loadPage();
    }, 300);

    ['productSearch', 'productCategory', 'productSupplier', 'productSort'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', update);
      document.getElementById(id)?.addEventListener('change', update);
    });
  },

  bindTableEvents(products) {
    document.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        this.showEditModal(id);
      });
    });
    document.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        this.confirmDelete(id);
      });
    });
  },

  async showCategoryModal() {
    const categories = await API.products.getCategories();
    
    Modal.show(`
      <div class="mb-4">
        <h4 style="margin-bottom: 12px;">Add New Category</h4>
        <div style="display: flex; gap: 8px;">
          <input type="text" id="newCategoryName" placeholder="Category name" style="flex: 1;">
          <button class="btn btn-primary" onclick="Products.addCategory()"><i class="fas fa-plus"></i> Add</button>
        </div>
      </div>
      
      <h4 style="margin-bottom: 12px;">Existing Categories</h4>
      <div id="categoriesList">
        ${categories.length === 0 ? '<p class="text-muted">No categories yet</p>' : 
          categories.map(c => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid var(--border-color);">
              <span>${c.name}</span>
              <button class="action-btn danger" onclick="Products.deleteCategory(${c.id})"><i class="fas fa-trash"></i></button>
            </div>
          `).join('')
        }
      </div>
    `, {
      title: 'Manage Categories',
      footer: `<button class="btn btn-secondary" onclick="Modal.hide()">Close</button>`
    });
  },

  async addCategory() {
    const name = document.getElementById('newCategoryName').value.trim();
    if (!name) {
      Toast.warning('Please enter category name');
      return;
    }
    
    try {
      await API.products.createCategory({ name });
      Toast.success('Category added');
      await this.showCategoryModal();
    } catch (error) {
      Toast.error(error.message || 'Failed to add category');
    }
  },

  async deleteCategory(id) {
    Modal.confirm('Delete this category?', async () => {
      try {
        await API.products.deleteCategory(id);
        Toast.success('Category deleted');
        await this.showCategoryModal();
      } catch (error) {
        Toast.error(error.message || 'Failed to delete category');
      }
    }, { title: 'Delete Category', type: 'danger' });
  },

  async showAddModal() {
    const [categories, suppliers] = await Promise.all([
      API.products.getCategories(),
      API.products.getSuppliers()
    ]);

    document.getElementById('modal').classList.add('modal-wide');
    Modal.show(`
      <form id="productForm">
        <div class="form-grid">
          <div class="input-group"><label>SKU</label><input type="text" name="sku" placeholder="Auto if empty"></div>
          <div class="input-group"><label>Service Name *</label><input type="text" name="name" required placeholder="Enter service name"></div>
        </div>
        <div class="form-grid">
          <div class="input-group">
            <label>Category</label>
            <select name="category_id">
              <option value="">-- Select Category --</option>
              ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
          </div>
          <div class="input-group">
            <label>Supplier</label>
            <select name="supplier_id">
              <option value="">-- Select Supplier --</option>
              ${suppliers.map(s => `<option value="${s.id}">${s.company_name}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-grid">
          <div class="input-group"><label>Cost Price *</label><input type="number" name="cost_price" required min="0" step="0.01" value="0" placeholder="0.00"></div>
          <div class="input-group"><label>Sale Price *</label><input type="number" name="sale_price" required min="0" step="0.01" value="0" placeholder="0.00"></div>
        </div>
        <div class="form-grid">
          <div class="input-group"><label>Quantity</label><input type="number" name="quantity" min="0" step="1" value="0" placeholder="0"></div>
          <div class="input-group"><label>Reorder Level</label><input type="number" name="reorder_level" min="0" step="1" value="10" placeholder="10"></div>
        </div>
        <div class="input-group"><label>Description</label><textarea name="description" rows="2" placeholder="Optional description"></textarea></div>
      </form>`, {
      title: 'Add New Service',
      footer: `<button class="btn btn-secondary" onclick="Modal.hide()">Cancel</button><button class="btn btn-primary" onclick="Products.saveProduct()"><i class="fas fa-save"></i> Save Service</button>`
    });
  },

  async showEditModal(id) {
    Modal.loading(true);
    try {
      const [product, categories, suppliers] = await Promise.all([
        API.products.getById(id),
        API.products.getCategories(),
        API.products.getSuppliers()
      ]);
      Modal.loading(false);

      document.getElementById('modal').classList.add('modal-wide');
      Modal.show(`
        <form id="productForm">
          <div class="form-grid">
            <div class="input-group"><label>SKU</label><input type="text" name="sku" value="${product.sku || ''}"></div>
            <div class="input-group"><label>Service Name *</label><input type="text" name="name" required value="${product.name}"></div>
          </div>
          <div class="form-grid">
            <div class="input-group">
              <label>Category</label>
              <select name="category_id">
                <option value="">-- Select Category --</option>
                ${categories.map(c => `<option value="${c.id}" ${product.category_id == c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
              </select>
            </div>
            <div class="input-group">
              <label>Supplier</label>
              <select name="supplier_id">
                <option value="">-- Select Supplier --</option>
                ${suppliers.map(s => `<option value="${s.id}" ${product.supplier_id == s.id ? 'selected' : ''}>${s.company_name}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-grid">
            <div class="input-group"><label>Cost Price *</label><input type="number" name="cost_price" required min="0" step="0.01" value="${product.cost_price}"></div>
            <div class="input-group"><label>Sale Price *</label><input type="number" name="sale_price" required min="0" step="0.01" value="${product.sale_price}"></div>
          </div>
          <div class="form-grid">
            <div class="input-group"><label>Quantity</label><input type="number" name="quantity" min="0" step="1" value="${product.quantity}"></div>
            <div class="input-group"><label>Reorder Level</label><input type="number" name="reorder_level" min="0" step="1" value="${product.reorder_level}"></div>
          </div>
          <div class="input-group"><label>Description</label><textarea name="description" rows="2">${product.description || ''}</textarea></div>
        </form>`, {
        title: 'Edit Service',
        footer: `<button class="btn btn-secondary" onclick="Modal.hide()">Cancel</button><button class="btn btn-primary" onclick="Products.saveProduct(${id})"><i class="fas fa-save"></i> Update Service</button>`
      });
    } catch (error) {
      Modal.loading(false);
      Toast.error('Failed to load product');
    }
  },

  async saveProduct(id = null) {
    const form = document.getElementById('productForm');
    const fd = new FormData(form);
    const data = Object.fromEntries(fd);
    
    data.cost_price = parseFloat(data.cost_price) || 0;
    data.sale_price = parseFloat(data.sale_price) || 0;
    data.quantity = parseFloat(data.quantity) || 0;
    data.reorder_level = parseFloat(data.reorder_level) || 10;
    data.category_id = data.category_id ? parseInt(data.category_id) : null;
    data.supplier_id = data.supplier_id ? parseInt(data.supplier_id) : null;

    if (!data.name || data.name.trim() === '') {
      Toast.warning('Product name is required');
      return;
    }

    try {
      Modal.loading(true);
      if (id) {
        await API.products.update(id, data);
        Toast.success('Product updated successfully');
      } else {
        await API.products.create(data);
        Toast.success('Product added successfully');
      }
      Modal.loading(false);
      Modal.hide();
      await this.loadPage();
    } catch (error) {
      Modal.loading(false);
      Toast.error(error.message || 'Failed to save product');
    }
  },

  confirmDelete(id) {
    Modal.confirm('Are you sure you want to delete this product? This action cannot be undone.', async () => {
      try {
        await API.products.delete(id);
        Toast.success('Product deleted successfully');
        await this.loadPage();
      } catch (error) {
        Toast.error(error.message || 'Failed to delete product');
      }
    }, { title: 'Delete Product', type: 'danger' });
  },

  async exportPDF() {
    const products = await API.products.getAll(this.filters);
    if (!products.length) { Toast.warning('No data to export'); return; }
    const ok = Components.exportPDF(
      'SMZ - Products Report',
      ['SKU', 'Name', 'Category', 'Qty', 'Cost', 'Sale Price', 'Supplier'],
      products.map(p => [
        p.sku || '-', p.name, p.category_name || '-', String(p.quantity),
        Components.formatCurrency(p.cost_price), Components.formatCurrency(p.sale_price),
        p.supplier_name || '-'
      ]),
      'smz-products'
    );
    if (ok) Toast.success('PDF exported successfully');
    else Toast.error('Failed to export PDF');
  }
};

window.Products = Products;
