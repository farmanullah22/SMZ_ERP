const Accounts = {
  async init() { await this.loadPage(); },

  async loadPage() {
    Modal.loading(true);
    try {
      const [accounts, transactions, settings] = await Promise.all([
        API.accounts.getAll(),
        API.accounts.getTransactions({ limit: 50 }),
        API.settings.getAll().catch(() => ({}))
      ]);
      Modal.loading(false);

      const cashAccount = accounts.find(a => a.account_type === 'cash');
      const bankAccounts = accounts.filter(a => a.account_type === 'bank');
      const totalCash = cashAccount?.current_balance || 0;
      const totalBank = bankAccounts.reduce((sum, b) => sum + (b.balance || 0), 0);
      const totalBalance = totalCash + totalBank;
      const storeName = settings.store_name || 'SMZ Mobile Zone';

      const container = document.getElementById('accountsPage');

      container.innerHTML = `
        <div class="page-header">
          <h1 class="page-title">Accounts</h1>
          <div class="page-actions">
            <button class="btn btn-info btn-sm" onclick="Accounts.exportPDF()">
              <i class="fas fa-file-pdf"></i> PDF
            </button>
            <button class="btn btn-primary" onclick="Accounts.showAddBankModal()">
              <i class="fas fa-plus"></i> Add Bank Account
            </button>
          </div>
        </div>

        <!-- Store Profile -->
        <div class="store-profile">
          <div class="profile-avatar">
            <i class="fas fa-store"></i>
          </div>
          <div class="profile-info">
            <h2>${storeName}</h2>
            <p class="profile-meta"><i class="fas fa-wallet"></i> Total Balance: ${Components.formatCurrency(totalBalance)}</p>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="Accounts.editProfile()">
            <i class="fas fa-edit"></i> Edit Profile
          </button>
        </div>

        <div class="accounts-summary">
          <div class="summary-card total">
            <div class="summary-icon"><i class="fas fa-wallet"></i></div>
            <div class="summary-info">
              <span class="summary-label">Total Balance</span>
              <span class="summary-value currency">${Components.formatCurrency(totalBalance)}</span>
            </div>
          </div>
          <div class="summary-card cash">
            <div class="summary-icon"><i class="fas fa-money-bill-wave"></i></div>
            <div class="summary-info">
              <span class="summary-label">Cash Account</span>
              <span class="summary-value currency">${Components.formatCurrency(totalCash)}</span>
            </div>
          </div>
          <div class="summary-card bank">
            <div class="summary-icon"><i class="fas fa-university"></i></div>
            <div class="summary-info">
              <span class="summary-label">Bank Accounts</span>
              <span class="summary-value currency">${Components.formatCurrency(totalBank)}</span>
            </div>
          </div>
        </div>

        <div class="accounts-section">
          <h2 class="section-title"><i class="fas fa-money-bill-wave"></i> Cash Account</h2>
          ${this.renderCashAccount(cashAccount)}
        </div>

        <div class="accounts-section">
          <div class="section-header">
            <h2 class="section-title"><i class="fas fa-university"></i> Bank Accounts</h2>
          </div>
          <div class="bank-accounts-grid">
            ${bankAccounts.length === 0 ? `
              <div class="empty-state">
                <i class="fas fa-university"></i>
                <h3>No Bank Accounts</h3>
                <p>Add a bank account to get started</p>
              </div>
            ` : bankAccounts.map(b => this.renderBankAccount(b)).join('')}
          </div>
        </div>

        <div class="transactions-section">
          <div class="section-header">
            <h2 class="section-title"><i class="fas fa-history"></i> Recent Transactions</h2>
            <button class="btn btn-sm btn-secondary" onclick="Accounts.showAllTransactions()">
              View All
            </button>
          </div>
          ${this.renderTransactions(transactions)}
        </div>`;

      this.bindAccountEvents();
    } catch (error) {
      Modal.loading(false);
      Toast.error('Failed to load accounts');
    }
  },

  renderCashAccount(account) {
    if (!account) return '<p class="text-muted">Cash account not found</p>';
    return `
      <div class="account-card-main cash">
        <div class="account-header">
          <div class="account-icon cash"><i class="fas fa-money-bill-wave"></i></div>
          <div class="account-info">
            <h3>${account.name}</h3>
            <span class="account-type">Cash Account</span>
          </div>
          <div class="account-menu">
            <button class="action-btn" onclick="Accounts.editCashAccount(${account.id})" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
          </div>
        </div>
        <div class="account-balance-display">
          <span class="balance-label">Available Balance</span>
          <span class="balance-amount currency">${Components.formatCurrency(account.current_balance)}</span>
        </div>
        <div class="account-actions-grid">
          <button class="action-btn-main deposit" onclick="Accounts.showDepositModal('cash', ${account.id})">
            <i class="fas fa-arrow-down"></i>
            <span>Deposit</span>
          </button>
          <button class="action-btn-main withdraw" onclick="Accounts.showWithdrawModal('cash', ${account.id})">
            <i class="fas fa-arrow-up"></i>
            <span>Withdraw</span>
          </button>
          <button class="action-btn-main transfer" onclick="Accounts.showTransferModal('cash', ${account.id})">
            <i class="fas fa-exchange-alt"></i>
            <span>Transfer</span>
          </button>
          <button class="action-btn-main statement" onclick="Accounts.showAccountStatement('cash', ${account.id})">
            <i class="fas fa-file-invoice"></i>
            <span>Statement</span>
          </button>
        </div>
      </div>`;
  },

  renderBankAccount(account) {
    return `
      <div class="account-card-main bank" id="bankAccount${account.id}">
        <div class="account-header">
          <div class="account-icon bank"><i class="fas fa-university"></i></div>
          <div class="account-info">
            <h3>${account.name}</h3>
            <span class="account-type">${account.account_number || 'Bank Account'}</span>
          </div>
          <div class="account-menu">
            <button class="action-btn" onclick="Accounts.showEditBankModal(${account.id})" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn" onclick="Accounts.deleteBank(${account.id})" title="Delete" style="color: rgba(255,255,255,0.7);">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="account-balance-display">
          <span class="balance-label">Available Balance</span>
          <span class="balance-amount currency">${Components.formatCurrency(account.balance || 0)}</span>
        </div>
        <div class="account-actions-grid">
          <button class="action-btn-main deposit" onclick="Accounts.showDepositModal('bank', ${account.id})">
            <i class="fas fa-arrow-down"></i>
            <span>Deposit</span>
          </button>
          <button class="action-btn-main withdraw" onclick="Accounts.showWithdrawModal('bank', ${account.id})">
            <i class="fas fa-arrow-up"></i>
            <span>Withdraw</span>
          </button>
          <button class="action-btn-main transfer" onclick="Accounts.showTransferModal('bank', ${account.id})">
            <i class="fas fa-exchange-alt"></i>
            <span>Transfer</span>
          </button>
          <button class="action-btn-main statement" onclick="Accounts.showAccountStatement('bank', ${account.id})">
            <i class="fas fa-file-invoice"></i>
            <span>Statement</span>
          </button>
        </div>
      </div>`;
  },

  renderTransactions(transactions) {
    if (transactions.length === 0) {
      return `
        <div class="empty-state">
          <i class="fas fa-exchange-alt"></i>
          <h3>No Transactions</h3>
          <p>Transactions will appear here when you deposit, withdraw, or transfer money</p>
        </div>`;
    }

    return `
      <div class="transactions-list">
        ${transactions.slice(0, 20).map(t => `
          <div class="transaction-item">
            <div class="transaction-icon ${t.type}">
              <i class="fas fa-${t.type === 'credit' ? 'arrow-down' : t.type === 'debit' ? 'arrow-up' : 'exchange-alt'}"></i>
            </div>
            <div class="transaction-details">
              <span class="transaction-desc">${t.description || t.category}</span>
              <span class="transaction-meta">
                ${t.account_type === 'cash' ? 'Cash' : 'Bank'} • ${Components.formatDateTime(t.created_at)}
              </span>
            </div>
            <div class="transaction-amount ${t.type}">
              ${t.type === 'credit' ? '+' : t.type === 'debit' ? '-' : ''}${Components.formatCurrency(t.amount)}
            </div>
          </div>`).join('')}
      </div>`;
  },

  bindAccountEvents() {
    document.querySelectorAll('.action-btn-main').forEach(btn => {
      btn.addEventListener('click', function() {
        this.classList.add('clicked');
        setTimeout(() => this.classList.remove('clicked'), 200);
      });
    });
  },

  editProfile() {
    Modal.show(`
      <form id="profileForm">
        <div class="input-group"><label>Store Name</label><input type="text" name="store_name" id="profileStoreName" placeholder="Store name"></div>
        <div class="input-group"><label>Currency</label><input type="text" name="currency" id="profileCurrency" placeholder="PKR" value="PKR"></div>
      </form>`, {
      title: 'Edit Store Profile',
      footer: `<button class="btn btn-secondary" onclick="Modal.hide()">Cancel</button><button class="btn btn-primary" onclick="Accounts.saveProfile()"><i class="fas fa-save"></i> Save</button>`,
      onOpen: async () => {
        try {
          const settings = await API.settings.getAll();
          document.getElementById('profileStoreName').value = settings.store_name || 'SMZ Mobile Zone';
        } catch {}
      }
    });
  },

  async saveProfile() {
    const name = document.getElementById('profileStoreName').value.trim();
    if (!name) { Toast.warning('Store name is required'); return; }
    try {
      Modal.loading(true);
      await API.settings.update('store_name', name);
      Modal.loading(false);
      Modal.hide();
      Toast.success('Profile updated');
      await this.loadPage();
    } catch (error) {
      Modal.loading(false);
      Toast.error(error.message);
    }
  },

  editCashAccount(id) {
    Modal.show(`
      <form id="editCashForm">
        <div class="input-group"><label>Account Name</label><input type="text" name="name" id="cashName" placeholder="Cash account name"></div>
        <div class="input-group"><label>Description</label><input type="text" name="description" id="cashDesc" placeholder="Description"></div>
      </form>`, {
      title: 'Edit Cash Account',
      footer: `<button class="btn btn-secondary" onclick="Modal.hide()">Cancel</button><button class="btn btn-primary" onclick="Accounts.saveCashAccount(${id})"><i class="fas fa-save"></i> Save</button>`,
      onOpen: async () => {
        const accounts = await API.accounts.getAll();
        const acct = accounts.find(a => a.id === id && a.account_type === 'cash');
        if (acct) {
          document.getElementById('cashName').value = acct.name || 'Main Cash';
          document.getElementById('cashDesc').value = acct.description || '';
        }
      }
    });
  },

  async saveCashAccount(id) {
    const name = document.getElementById('cashName').value.trim() || 'Main Cash';
    try {
      Modal.loading(true);
      await API.settings.update('cash_name', name);
      Modal.loading(false);
      Modal.hide();
      Toast.success('Cash account updated');
      await this.loadPage();
    } catch (error) { Modal.loading(false); Toast.error(error.message); }
  },

  showAddBankModal() {
    Modal.show(`
      <form id="bankForm" class="form-grid">
        <div class="input-group"><label>Bank Name *</label><input type="text" name="name" required placeholder="e.g., MCB Bank"></div>
        <div class="input-group"><label>Account Number</label><input type="text" name="account_number" placeholder="Account number"></div>
        <div class="input-group"><label>Opening Balance</label><input type="number" name="balance" min="0" step="0.01" value="0" placeholder="0.00"></div>
        <div class="input-group"><label>Description</label><input type="text" name="description" placeholder="Optional description"></div>
      </form>`, {
      title: 'Add New Bank Account',
      footer: `<button class="btn btn-secondary" onclick="Modal.hide()">Cancel</button><button class="btn btn-primary" onclick="Accounts.saveBank()"><i class="fas fa-save"></i> Add Account</button>`
    });
  },

  async saveBank() {
    const form = document.getElementById('bankForm');
    const fd = new FormData(form);
    const data = Object.fromEntries(fd);
    data.balance = parseFloat(data.balance) || 0;
    if (!data.name) { Toast.warning('Please enter bank name'); return; }
    try {
      Modal.loading(true);
      await API.accounts.createBank(data);
      Modal.loading(false);
      Modal.hide();
      Toast.success('Bank account added successfully');
      await this.loadPage();
    } catch (error) { Modal.loading(false); Toast.error(error.message); }
  },

  showDepositModal(type, id) {
    const typeName = type === 'cash' ? 'Cash Account' : 'Bank Account';
    Modal.show(`
      <div class="transaction-form">
        <div class="form-header deposit">
          <i class="fas fa-arrow-down"></i>
          <h3>Deposit to ${typeName}</h3>
        </div>
        <form id="depositForm">
          <div class="input-group">
            <label>Amount (PKR) *</label>
            <input type="number" name="amount" required min="1" step="0.01" placeholder="0.00" class="amount-input">
          </div>
          <div class="input-group">
            <label>Profit (Optional)</label>
            <input type="number" name="profit" min="0" step="0.01" placeholder="0.00">
          </div>
          <div class="input-group">
            <label>Description</label>
            <input type="text" name="description" placeholder="e.g., Cash deposit, Customer payment">
          </div>
        </form>
      </div>`, {
      title: 'Deposit Money',
      footer: `<button class="btn btn-secondary" onclick="Modal.hide()">Cancel</button><button class="btn btn-success" onclick="Accounts.deposit('${type}', ${id})"><i class="fas fa-check"></i> Deposit</button>`
    });
  },

  async deposit(type, id) {
    const form = document.getElementById('depositForm');
    const amount = parseFloat(form.amount.value);
    const profit = form.profit.value === '' ? null : parseFloat(form.profit.value);
    const description = form.description.value;
    if (!amount || amount <= 0) { Toast.warning('Please enter a valid amount'); return; }
    if (profit !== null && Number.isNaN(profit)) { Toast.warning('Please enter a valid profit amount'); return; }
    try {
      Modal.loading(true);
      await API.accounts.deposit({ account_type: type, account_id: id, amount, profit, description, payment_method: 'deposit' });
      Modal.loading(false);
      Modal.hide();
      Toast.success(`PKR ${amount.toLocaleString()} deposited successfully`);
      await this.loadPage();
    } catch (error) { Modal.loading(false); Toast.error(error.message); }
  },

  showWithdrawModal(type, id) {
    const typeName = type === 'cash' ? 'Cash Account' : 'Bank Account';
    Modal.show(`
      <div class="transaction-form">
        <div class="form-header withdraw">
          <i class="fas fa-arrow-up"></i>
          <h3>Withdraw from ${typeName}</h3>
        </div>
        <form id="withdrawForm">
          <div class="input-group">
            <label>Amount (PKR) *</label>
            <input type="number" name="amount" required min="1" step="0.01" placeholder="0.00" class="amount-input">
          </div>
          <div class="input-group">
            <label>Profit (Optional)</label>
            <input type="number" name="profit" min="0" step="0.01" placeholder="0.00">
          </div>
          <div class="input-group">
            <label>Description</label>
            <input type="text" name="description" placeholder="e.g., Cash withdrawal">
          </div>
        </form>
      </div>`, {
      title: 'Withdraw Money',
      footer: `<button class="btn btn-secondary" onclick="Modal.hide()">Cancel</button><button class="btn btn-danger" onclick="Accounts.withdraw('${type}', ${id})"><i class="fas fa-check"></i> Withdraw</button>`
    });
  },

  async withdraw(type, id) {
    const form = document.getElementById('withdrawForm');
    const amount = parseFloat(form.amount.value);
    const profit = form.profit.value === '' ? null : parseFloat(form.profit.value);
    const description = form.description.value;
    if (!amount || amount <= 0) { Toast.warning('Please enter a valid amount'); return; }
    if (profit !== null && Number.isNaN(profit)) { Toast.warning('Please enter a valid profit amount'); return; }
    try {
      Modal.loading(true);
      await API.accounts.withdraw({ account_type: type, account_id: id, amount, profit, description, payment_method: 'withdrawal' });
      Modal.loading(false);
      Modal.hide();
      Toast.success(`PKR ${amount.toLocaleString()} withdrawn successfully`);
      await this.loadPage();
    } catch (error) { Modal.loading(false); Toast.error(error.message); }
  },

  async showTransferModal(fromType, fromId) {
    const accounts = await API.accounts.getAll();
    const bankAccounts = accounts.filter(a => a.account_type === 'bank');

    Modal.show(`
      <div class="transaction-form">
        <div class="form-header transfer">
          <i class="fas fa-exchange-alt"></i>
          <h3>Transfer Money</h3>
        </div>
        <form id="transferForm">
          <div class="input-group">
            <label>From Account</label>
            <input type="text" value="${fromType === 'cash' ? 'Cash Account' : 'Bank Account'}" disabled>
          </div>
          <div class="input-group">
            <label>To Account *</label>
            <select name="to_type" id="transferToType" onchange="Accounts.onTransferTypeChange('${fromType}')">
              <option value="cash" ${fromType === 'bank' ? 'selected' : ''}>Cash Account</option>
              <option value="bank" ${fromType === 'cash' ? 'selected' : ''}>Bank Account</option>
            </select>
          </div>
          <div class="input-group" id="transferBankSelect" style="${fromType === 'cash' ? '' : 'display:none;'}">
            <label>Select Bank Account *</label>
            <select id="transferBankAccount">
              <option value="">-- Select Bank --</option>
              ${bankAccounts.map(b => `<option value="${b.id}">${b.name} (${Components.formatCurrency(b.balance || 0)})</option>`).join('')}
            </select>
          </div>
          <div class="input-group">
            <label>Amount (PKR) *</label>
            <input type="number" name="amount" required min="1" step="0.01" placeholder="0.00" class="amount-input">
          </div>
          <div class="input-group">
            <label>Description</label>
            <input type="text" name="description" placeholder="Transfer description">
          </div>
        </form>
      </div>`, {
      title: 'Transfer Between Accounts',
      footer: `<button class="btn btn-secondary" onclick="Modal.hide()">Cancel</button><button class="btn btn-primary" onclick="Accounts.transfer('${fromType}', ${fromId})"><i class="fas fa-check"></i> Transfer</button>`
    });
  },

  onTransferTypeChange(fromType) {
    const toType = document.getElementById('transferToType').value;
    document.getElementById('transferBankSelect').style.display = (toType === 'bank') ? '' : 'none';
  },

  async transfer(fromType, fromId) {
    const toType = document.getElementById('transferToType').value;
    const amount = parseFloat(document.querySelector('#transferForm input[name="amount"]').value);
    const description = document.querySelector('#transferForm input[name="description"]').value;
    let toId = 1;

    if (toType === 'bank') {
      toId = parseInt(document.getElementById('transferBankAccount').value);
      if (!toId) { Toast.warning('Please select a bank account'); return; }
    }

    if (!amount || amount <= 0) { Toast.warning('Please enter a valid amount'); return; }
    if (fromType === toType) { Toast.warning('Cannot transfer to the same account type'); return; }

    try {
      Modal.loading(true);
      await API.accounts.transfer({ from_type: fromType, from_id: fromId, to_type: toType, to_id: toId, amount, description });
      Modal.loading(false);
      Modal.hide();
      Toast.success(`PKR ${amount.toLocaleString()} transferred successfully`);
      await this.loadPage();
    } catch (error) { Modal.loading(false); Toast.error(error.message); }
  },

  async showAllTransactions() {
    const transactions = await API.accounts.getTransactions({ limit: 100 });
    Modal.show(`
      <div class="transactions-modal">
        <h3>All Transactions</h3>
        ${transactions.length === 0 ? '<p class="text-muted">No transactions yet</p>' : `
          <div class="transactions-list full">
            ${transactions.map(t => `
              <div class="transaction-item">
                <div class="transaction-icon ${t.type}">
                  <i class="fas fa-${t.type === 'credit' ? 'arrow-down' : t.type === 'debit' ? 'arrow-up' : 'exchange-alt'}"></i>
                </div>
                <div class="transaction-details">
                  <span class="transaction-desc">${t.description || t.category}</span>
                  <span class="transaction-meta">
                    ${t.account_type === 'cash' ? 'Cash' : 'Bank'} • ${Components.formatDateTime(t.created_at)}
                  </span>
                </div>
                <div class="transaction-amount ${t.type}">
                  ${t.type === 'credit' ? '+' : t.type === 'debit' ? '-' : ''}${Components.formatCurrency(t.amount)}
                </div>
              </div>`).join('')}
          </div>
        `}
      </div>`, {
      title: 'Transaction History',
      footer: `<button class="btn btn-info btn-sm" onclick="Accounts.exportTransactionsPDF(); Modal.hide();"><i class="fas fa-file-pdf"></i> Export PDF</button><button class="btn btn-secondary" onclick="Modal.hide()">Close</button>`
    });
  },

  async showAccountStatement(type, id) {
    const transactions = await API.accounts.getTransactions({ account_type: type, limit: 100 });
    const accountName = type === 'cash' ? 'Cash Account' : 'Bank Account';

    Modal.show(`
      <div class="statement-modal">
        <div class="statement-header">
          <h3>${accountName} Statement</h3>
          <p class="text-muted">Last 100 transactions</p>
        </div>
        ${transactions.length === 0 ? '<p class="text-muted text-center">No transactions</p>' : `
          <div class="statement-transactions">
            ${transactions.map(t => `
              <div class="statement-item">
                <div class="statement-date">${Components.formatDate(t.created_at)}</div>
                <div class="statement-desc">${t.description || t.category}</div>
                <div class="statement-amount ${t.type}">
                  ${t.type === 'credit' ? '+' : t.type === 'debit' ? '-' : ''}${Components.formatCurrency(t.amount)}
                </div>
              </div>`).join('')}
          </div>
        `}
      </div>`, {
      title: 'Account Statement',
      footer: `<button class="btn btn-secondary" onclick="Modal.hide()">Close</button>`
    });
  },

  showEditBankModal(id) {
    Modal.show(`
      <form id="editBankForm" class="form-grid">
        <div class="input-group"><label>Bank Name *</label><input type="text" name="name" id="editBankName" required></div>
        <div class="input-group"><label>Account Number</label><input type="text" name="account_number" id="editBankNumber"></div>
        <div class="input-group"><label>Description</label><input type="text" name="description" id="editBankDesc"></div>
      </form>
      <div class="mt-4" style="border-top: 1px solid var(--border-color); padding-top: 16px;">
        <button class="btn btn-danger" onclick="Accounts.deleteBank(${id})"><i class="fas fa-trash"></i> Delete Account</button>
      </div>`, {
      title: 'Edit Bank Account',
      footer: `<button class="btn btn-secondary" onclick="Modal.hide()">Cancel</button><button class="btn btn-primary" onclick="Accounts.updateBank(${id})"><i class="fas fa-save"></i> Update</button>`,
      onOpen: async () => {
        const accounts = await API.accounts.getAll();
        const account = accounts.find(a => a.id === id && a.account_type === 'bank');
        if (account) {
          document.getElementById('editBankName').value = account.name || '';
          document.getElementById('editBankNumber').value = account.account_number || '';
          document.getElementById('editBankDesc').value = account.description || '';
        }
      }
    });
  },

  async updateBank(id) {
    const name = document.getElementById('editBankName').value.trim();
    const account_number = document.getElementById('editBankNumber').value.trim();
    const description = document.getElementById('editBankDesc').value.trim();
    if (!name) { Toast.warning('Bank name is required'); return; }
    try {
      Modal.loading(true);
      await API.accounts.updateBank(id, { name, account_number, description });
      Modal.loading(false);
      Modal.hide();
      Toast.success('Bank account updated');
      await this.loadPage();
    } catch (error) { Modal.loading(false); Toast.error(error.message); }
  },

  async deleteBank(id) {
    Modal.confirm('Delete this bank account? All associated data will remain.', async () => {
      try {
        Modal.loading(true);
        await API.accounts.deleteBank(id);
        Modal.loading(false);
        Modal.hide();
        Toast.success('Bank account deleted');
        await this.loadPage();
      } catch (error) { Modal.loading(false); Toast.error(error.message); }
    }, { title: 'Delete Account', type: 'danger' });
  },

  async exportPDF() {
    try {
      const transactions = await API.accounts.getTransactions({ limit: 100 });
      if (!transactions.length) { Toast.warning('No data to export'); return; }
      const ok = Components.exportPDF(
        'SMZ - Accounts Report',
        ['Date', 'Account', 'Type', 'Amount', 'Profit', 'Description'],
        transactions.map(t => {
          const typeText = t.type === 'credit' ? 'Deposit' : t.type === 'debit' ? 'Withdraw' : 'Transfer';
          return [
            Components.formatDateTime(t.created_at),
            t.account_type === 'cash' ? 'Cash Account' : 'Bank Account',
            typeText,
            Components.formatCurrency(t.amount),
            t.profit === null || t.profit === undefined ? '-' : Components.formatCurrency(t.profit),
            t.description || t.category || '-'
          ];
        }),
        'smz-accounts'
      );
      if (ok) Toast.success('PDF exported successfully');
      else Toast.error('Failed to export PDF');
    } catch (e) { Toast.error('Failed to export PDF'); }
  },

  async exportTransactionsPDF() {
    const transactions = await API.accounts.getTransactions({ limit: 100 });
    if (!transactions.length) { Toast.warning('No transactions to export'); return; }
    const ok = Components.exportPDF(
      'SMZ - All Transactions',
      ['Date', 'Account', 'Type', 'Amount', 'Description'],
      transactions.map(t => {
        const typeText = t.type === 'credit' ? 'Deposit' : t.type === 'debit' ? 'Withdraw' : 'Transfer';
        return [
          Components.formatDateTime(t.created_at),
          t.account_type === 'cash' ? 'Cash Account' : 'Bank Account',
          typeText,
          Components.formatCurrency(t.amount),
          t.description || t.category || '-'
        ];
      }),
      'smz-transactions'
    );
    if (ok) Toast.success('PDF exported');
    else Toast.error('Failed to export PDF');
  }
};

window.Accounts = Accounts;