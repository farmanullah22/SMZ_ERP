const Expenses = {
  data: [],
  isEdit: false,
  editId: null,

  async init() {
    await this.render();
    await this.loadData();
  },

  render() {
    document.getElementById('expensesPage').innerHTML = `
      <div class="page-header">
        <h1 class="page-title"><i class="fas fa-receipt"></i> Expenses</h1>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="Expenses.showAddModal()">
            <i class="fas fa-plus"></i> Add Expense
          </button>
          <button class="btn btn-secondary" onclick="Expenses.exportPDF()">
            <i class="fas fa-file-pdf"></i> PDF
          </button>
        </div>
      </div>

      <div class="analytics-filters expense-filters">
        <div class="filter-group">
          <label>Category</label>
          <select id="expenseCategoryFilter" class="form-input">
            <option value="all">All Categories</option>
            <option value="Utilities">Utilities</option>
            <option value="Rent">Rent</option>
            <option value="Salaries">Salaries</option>
            <option value="Supplies">Supplies</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Marketing">Marketing</option>
            <option value="Travel">Travel</option>
            <option value="Food">Food</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div class="filter-group">
          <label>From</label>
          <input type="date" id="expenseStartDate" class="form-input">
        </div>
        <div class="filter-group">
          <label>To</label>
          <input type="date" id="expenseEndDate" class="form-input">
        </div>
        <div class="filter-group">
          <label>Search</label>
          <input type="text" id="expenseSearch" class="form-input" placeholder="Search description...">
        </div>
        <div class="filter-group" style="align-self:flex-end">
          <button class="btn btn-primary btn-sm" onclick="Expenses.applyFilters()">
            <i class="fas fa-filter"></i> Filter
          </button>
        </div>
      </div>

      <div class="analytics-summary" id="expenseStats"></div>

      <div class="expense-list" id="expenseList"></div>
    `;

    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    document.getElementById('expenseStartDate').value = `${y}-${m}-01`;
    document.getElementById('expenseEndDate').value = `${y}-${m}-${d}`;

    document.getElementById('expenseCategoryFilter').addEventListener('change', () => this.applyFilters());
    document.getElementById('expenseStartDate').addEventListener('change', () => this.applyFilters());
    document.getElementById('expenseEndDate').addEventListener('change', () => this.applyFilters());

    let searchTimer;
    document.getElementById('expenseSearch').addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => this.applyFilters(), 400);
    });
  },

  async loadData() {
    try {
      Modal.loading(true);
      const startDate = document.getElementById('expenseStartDate')?.value;
      const endDate = document.getElementById('expenseEndDate')?.value;
      const category = document.getElementById('expenseCategoryFilter')?.value || 'all';
      const search = document.getElementById('expenseSearch')?.value;

      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (category && category !== 'all') params.category = category;
      if (search) params.search = search;

      const result = await API.expenses.getAll(params);
      this.data = result.expenses || result;
      Modal.loading(false);

      const total = this.data.reduce((s, e) => s + e.amount, 0);
      const categories = new Set(this.data.map(e => e.category));
      const avg = this.data.length ? total / this.data.length : 0;

      document.getElementById('expenseStats').innerHTML = `
        <div class="analytics-stat-card expense-stat-card">
          <div class="stat-icon" style="background:var(--gradient-danger)">
            <i class="fas fa-receipt"></i>
          </div>
          <div class="stat-info">
            <span class="stat-label">Total Expenses</span>
            <span class="stat-value text-danger">${Components.formatCurrency(total)}</span>
          </div>
        </div>
        <div class="analytics-stat-card expense-stat-card">
          <div class="stat-icon" style="background:var(--gradient-warning)">
            <i class="fas fa-list"></i>
          </div>
          <div class="stat-info">
            <span class="stat-label">Categories</span>
            <span class="stat-value">${categories.size}</span>
          </div>
        </div>
        <div class="analytics-stat-card expense-stat-card">
          <div class="stat-icon" style="background:var(--gradient-info)">
            <i class="fas fa-calculator"></i>
          </div>
          <div class="stat-info">
            <span class="stat-label">Avg / Entry</span>
            <span class="stat-value">${Components.formatCurrency(avg)}</span>
          </div>
        </div>
        <div class="analytics-stat-card expense-stat-card">
          <div class="stat-icon" style="background:var(--gradient-primary)">
            <i class="fas fa-hashtag"></i>
          </div>
          <div class="stat-info">
            <span class="stat-label">Entries</span>
            <span class="stat-value">${this.data.length}</span>
          </div>
        </div>
      `;

      this.renderList(this.data);
    } catch (error) {
      console.error(error);
      Modal.loading(false);
      Toast.error('Failed to load expenses');
    }
  },

  renderList(expenses) {
    const container = document.getElementById('expenseList');
    if (!expenses.length) {
      container.innerHTML = `
        <div class="expense-empty">
          <div class="expense-empty-icon"><i class="fas fa-receipt"></i></div>
          <h3>No Expenses Yet</h3>
          <p>Add your first expense to start tracking spending.</p>
          <button class="btn btn-primary" onclick="Expenses.showAddModal()">
            <i class="fas fa-plus"></i> Add Expense
          </button>
        </div>`;
      return;
    }

    const categoryIcons = {
      Utilities: 'bolt', Rent: 'building', Salaries: 'users-cog',
      Supplies: 'box-open', Maintenance: 'tools', Marketing: 'bullhorn',
      Travel: 'plane', Food: 'utensils', Other: 'circle'
    };
    const categoryColors = {
      Utilities: '#f59e0b', Rent: '#6366f1', Salaries: '#10b981',
      Supplies: '#8b5cf6', Maintenance: '#ef4444', Marketing: '#ec4899',
      Travel: '#14b8a6', Food: '#f97316', Other: '#64748b'
    };

    container.innerHTML = `
      <div class="expense-table-wrapper">
        <table class="expense-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th class="text-right">Amount</th>
              <th class="text-center">Payment</th>
              <th class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${expenses.map(e => {
              const icon = categoryIcons[e.category] || 'circle';
              const color = categoryColors[e.category] || '#64748b';
              const date = new Date(e.expense_date || e.created_at);
              const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
              return `
                <tr class="expense-row">
                  <td class="expense-date-cell">
                    <span class="expense-date-num">${String(date.getDate()).padStart(2, '0')}</span>
                    <span class="expense-date-month">${date.toLocaleString('en-GB', { month: 'short' })}</span>
                  </td>
                  <td>
                    <span class="expense-category-badge" style="background:${color}15;color:${color}">
                      <i class="fas fa-${icon}"></i> ${e.category}
                    </span>
                  </td>
                  <td class="expense-desc">${e.description || '<span class="text-muted">—</span>'}</td>
                  <td class="text-right expense-amount">${Components.formatCurrency(e.amount)}</td>
                  <td class="text-center">
                    ${e.payment_method === 'cash'
                      ? `<span class="payment-badge cash"><i class="fas fa-money-bill-wave"></i> Cash</span>`
                      : `<span class="payment-badge bank"><i class="fas fa-university"></i> Bank</span>`}
                  </td>
                  <td class="text-center">
                    <div class="actions">
                      <button class="btn-icon btn-icon-edit" title="Edit" onclick="Expenses.showEditModal('${e.id}')">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn-icon btn-icon-delete" title="Delete" onclick="Expenses.deleteExpense('${e.id}')">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  showAddModal() {
    this.isEdit = false;
    this.editId = null;
    const now = new Date().toISOString().split('T')[0];
    Modal.show(this.expenseFormHTML(null, now), { title: '<i class="fas fa-plus-circle"></i> Add Expense' });
    document.getElementById('expenseForm').addEventListener('submit', (e) => this.saveExpense(e));
  },

  showEditModal(id) {
    const expense = this.data.find(e => e.id === id);
    if (!expense) return;
    this.isEdit = true;
    this.editId = id;
    Modal.show(this.expenseFormHTML(expense, ''), { title: '<i class="fas fa-edit"></i> Edit Expense' });
    document.getElementById('expenseForm').addEventListener('submit', (e) => this.saveExpense(e));
  },

  expenseFormHTML(expense, defaultDate) {
    const cats = ['Utilities', 'Rent', 'Salaries', 'Supplies', 'Maintenance', 'Marketing', 'Travel', 'Food', 'Other'];
    const e = expense;
    return `
      <form id="expenseForm" class="expense-form">
        <div class="expense-form-grid">
          <div class="form-group">
            <label><i class="fas fa-tag"></i> Category</label>
            <select id="expCategory" class="form-input" required>
              ${cats.map(c => `<option value="${c}" ${e && e.category === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label><i class="fas fa-dollar-sign"></i> Amount</label>
            <div class="input-affix">
              <span class="input-prefix">PKR</span>
              <input type="number" id="expAmount" class="form-input" step="0.01" min="0" required placeholder="0.00" value="${e ? e.amount : ''}">
            </div>
          </div>
          <div class="form-group full-width">
            <label><i class="fas fa-align-left"></i> Description</label>
            <input type="text" id="expDescription" class="form-input" placeholder="What is this expense for?" value="${e ? (e.description || '') : ''}">
          </div>
          <div class="form-group">
            <label><i class="fas fa-calendar"></i> Date</label>
            <input type="date" id="expDate" class="form-input" value="${e ? (e.expense_date || e.created_at || '').split('T')[0] : defaultDate}">
          </div>
          <div class="form-group">
            <label><i class="fas fa-credit-card"></i> Payment</label>
            <div class="payment-toggle">
              <label class="toggle-option ${!e || e.payment_method === 'cash' ? 'active' : ''}" data-value="cash" onclick="document.getElementById('expPayment').value='cash';document.querySelectorAll('.toggle-option').forEach(o=>o.classList.toggle('active',o.dataset.value==='cash'))">
                <i class="fas fa-money-bill-wave"></i> Cash
              </label>
              <label class="toggle-option ${e && e.payment_method === 'bank' ? 'active' : ''}" data-value="bank" onclick="document.getElementById('expPayment').value='bank';document.querySelectorAll('.toggle-option').forEach(o=>o.classList.toggle('active',o.dataset.value==='bank'))">
                <i class="fas fa-university"></i> Bank
              </label>
            </div>
            <input type="hidden" id="expPayment" value="${e ? e.payment_method : 'cash'}">
          </div>
        </div>
        <div class="expense-form-actions">
          <button type="button" class="btn btn-secondary" onclick="Modal.close()">
            <i class="fas fa-times"></i> Cancel
          </button>
          <button type="submit" class="btn btn-primary">
            <i class="fas fa-check"></i> ${this.isEdit ? 'Update' : 'Save'} Expense
          </button>
        </div>
      </form>
    `;
  },

  async saveExpense(e) {
    e.preventDefault();
    try {
      const data = {
        category: document.getElementById('expCategory').value,
        amount: parseFloat(document.getElementById('expAmount').value),
        description: document.getElementById('expDescription').value || null,
        expense_date: document.getElementById('expDate').value || null,
        payment_method: document.getElementById('expPayment').value
      };

      if (!data.amount || data.amount <= 0) {
        Toast.error('Please enter a valid amount');
        return;
      }

      if (this.isEdit) {
        await API.expenses.update(this.editId, data);
        Toast.success('Expense updated');
      } else {
        await API.expenses.create(data);
        Toast.success('Expense added');
      }

      Modal.close();
      await this.loadData();
    } catch (error) {
      Toast.error(error.message);
    }
  },

  async deleteExpense(id) {
    Modal.confirm('Are you sure you want to delete this expense? This will restore the amount to your account.', async () => {
      try {
        await API.expenses.delete(id);
        Toast.success('Expense deleted');
        await this.loadData();
      } catch (error) {
        Toast.error(error.message);
      }
    }, { type: 'danger', confirmText: 'Delete', title: 'Delete Expense' });
  },

  applyFilters() {
    this.loadData();
  },

  exportPDF() {
    if (!this.data.length) { Toast.info('No data to export'); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const title = 'Expenses Report';
    doc.setFontSize(16); doc.text(title, 14, 20);
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

    const total = this.data.reduce((s, e) => s + e.amount, 0);
    doc.setFontSize(12); doc.text(`Total: ${Components.formatCurrency(total)}`, 14, 38);

    doc.autoTable({
      startY: 44, head: [['Date', 'Category', 'Description', 'Amount', 'Payment']],
      body: this.data.map(e => [
        Components.formatDate(e.expense_date || e.created_at),
        e.category,
        e.description || '-',
        Components.formatCurrency(e.amount),
        e.payment_method
      ]),
      theme: 'grid'
    });

    doc.save(`Expenses_${new Date().toISOString().split('T')[0]}.pdf`);
    Toast.success('PDF exported');
  },

  async refresh() {
    Modal.loading(true);
    await this.init();
    Modal.loading(false);
    Toast.success('Refreshed');
  }
};

window.Expenses = Expenses;
