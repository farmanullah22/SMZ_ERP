const Settings = {
  async init() { await this.loadPage(); },

  async loadPage() {
    const settings = await API.settings.getAll();
    const users = Auth.isAdmin() ? await API.auth.getUsers() : [];

    const container = document.getElementById('settingsPage');
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Settings</h1>
      </div>

      <div class="settings-section">
        <h3 class="settings-section-title">Appearance</h3>
        <div class="settings-row">
          <div>
            <div class="settings-label">Dark Mode</div>
            <div class="settings-description">Toggle between light and dark theme</div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="darkModeToggle" ${settings.theme === 'dark' ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      ${Auth.isAdmin() ? `
      <div class="settings-section">
        <h3 class="settings-section-title">User Management</h3>
        <div class="mb-4">
          <button class="btn btn-primary" onclick="Settings.showAddUserModal()"><i class="fas fa-plus"></i> Add User</button>
        </div>
        <div id="usersList">
          ${this.renderUsers(users)}
        </div>
      </div>

      <div class="settings-section">
        <h3 class="settings-section-title">Change Password</h3>
        <form id="changePasswordForm">
          <div class="form-grid">
            <div class="input-group"><label>Current Password</label><input type="password" name="current" required></div>
            <div class="input-group"><label>New Password</label><input type="password" name="new" required></div>
          </div>
          <button type="button" class="btn btn-primary" onclick="Settings.changePassword()"><i class="fas fa-key"></i> Change Password</button>
        </form>
      </div>
      ` : ''}

      <div class="settings-section">
        <h3 class="settings-section-title">Data Management</h3>
        <div class="settings-row">
          <div>
            <div class="settings-label">Backup Database</div>
            <div class="settings-description">Download a backup of your database</div>
          </div>
          <button class="btn btn-secondary" onclick="Settings.backupDatabase()"><i class="fas fa-download"></i> Backup</button>
        </div>
      </div>

      <div class="settings-section">
        <h3 class="settings-section-title">About</h3>
        <div class="settings-row">
          <div><div class="settings-label">Version</div><div class="settings-description">1.0.0</div></div>
        </div>
        <div class="settings-row">
          <div>
            <div class="settings-label">SMZ</div>
            <div class="settings-description">Shop Management System</div>
          </div>
        </div>
      </div>`;

    document.getElementById('darkModeToggle')?.addEventListener('change', async (e) => {
      const theme = e.target.checked ? 'dark' : 'light';
      App.setTheme(theme);
      await API.settings.update('theme', theme);
    });

    if (Auth.isAdmin()) {
      this.bindUserEvents(users);
    }
  },

  renderUsers(users) {
    if (users.length === 0) return Components.emptyState('users', 'No Users', 'Add users to manage access');
    return Components.table(
      ['Username', 'Role', 'Created', 'Actions'],
      users.map(u => {
        const row = [
          u.username,
          Components.badge(u.role, u.role === 'admin' ? 'primary' : 'info'),
          Components.formatDate(u.created_at),
          ''
        ];
        row.id = u.id;
        return row;
      }),
      [{ icon: 'trash', action: 'delete', class: 'danger' }]
    );
  },

  bindUserEvents(users) {
    users.forEach(u => {
      document.querySelector(`[data-action="delete"][data-id="${u.id}"]`)?.addEventListener('click', () => this.confirmDeleteUser(u));
    });
  },

  confirmDeleteUser(user) {
    Modal.confirm(`Delete user "${user.username}"?`, async () => {
      try {
        await API.auth.deleteUser(user.id);
        Toast.success('User deleted');
        await this.loadPage();
      } catch (error) {
        Toast.error(error.message || 'Failed to delete user');
      }
    }, { title: 'Delete User', type: 'danger' });
  },

  showAddUserModal() {
    Modal.show(`
      <form id="addUserForm">
        <div class="input-group"><label>Username *</label><input type="text" name="username" required></div>
        <div class="input-group"><label>Password *</label><input type="password" name="password" required></div>
        <div class="input-group">
          <label>Role</label>
          <select name="role">
            <option value="cashier">Cashier</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </form>`, {
      title: 'Add User',
      footer: `<button class="btn btn-secondary" onclick="Modal.hide()">Cancel</button><button class="btn btn-primary" onclick="Settings.addUser()"><i class="fas fa-save"></i> Add User</button>`
    });
  },

  async addUser() {
    const form = document.getElementById('addUserForm');
    const fd = new FormData(form);
    const data = Object.fromEntries(fd);

    if (!data.username || !data.password) { Toast.warning('Fill all fields'); return; }

    try {
      Modal.loading(true);
      await API.auth.createUser(data);
      Modal.loading(false);
      Modal.hide();
      Toast.success('User added');
      await this.loadPage();
    } catch (error) { Modal.loading(false); Toast.error(error.message); }
  },

  async changePassword() {
    const form = document.getElementById('changePasswordForm');
    const current = form.current.value;
    const newPass = form.new.value;

    if (!current || !newPass) { Toast.warning('Fill all fields'); return; }

    try {
      Modal.loading(true);
      await API.auth.changePassword({ userId: Auth.getUser().id, currentPassword: current, newPassword: newPass });
      Modal.loading(false);
      form.reset();
      Toast.success('Password changed');
    } catch (error) { Modal.loading(false); Toast.error(error.message); }
  },

  backupDatabase() {
    const link = document.createElement('a');
    link.href = API.settings.backup();
    link.download = `smz-backup-${new Date().toISOString().split('T')[0]}.db`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    Toast.success('Backup download started');
  }
};

window.Settings = Settings;
