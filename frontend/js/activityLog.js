const ActivityLog = {
  items: [],
  search: '', startDate: '', endDate: '',

  async init() {
    this.search = ''; this.startDate = ''; this.endDate = '';
    await this.loadData();
    this.render();
  },

  async loadData() {
    try {
      const params = {};
      if (this.search) params.search = this.search;
      if (this.startDate) params.startDate = this.startDate;
      if (this.endDate) params.endDate = this.endDate;
      this.items = await API.reports.getHistory(params);
    } catch { this.items = []; }
  },

  render() {
    const container = document.getElementById('activityLogPage');
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title"><i class="fas fa-history"></i> Activity Logs</h1>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="ActivityLog.refresh()"><i class="fas fa-sync-alt"></i> Refresh</button>
        </div>
      </div>
      <div class="filter-bar">
        <div class="filter-group"><label>Search</label><input type="text" id="alSearch" placeholder="Search activity..." value="${this.search}"></div>
        <div class="filter-group"><label>From</label><input type="date" id="alStart" value="${this.startDate}"></div>
        <div class="filter-group"><label>To</label><input type="date" id="alEnd" value="${this.endDate}"></div>
        <button class="btn btn-primary btn-sm" onclick="ActivityLog.applyFilter()"><i class="fas fa-filter"></i> Filter</button>
        <button class="btn btn-secondary btn-sm" onclick="ActivityLog.clearFilter()"><i class="fas fa-times"></i> Clear</button>
      </div>
      <div class="settings-section">
        <div id="alList">${this.renderList()}</div>
      </div>
    `;
    document.getElementById('alSearch')?.addEventListener('keyup', (e) => { if (e.key === 'Enter') this.applyFilter(); });
  },

  renderList() {
    if (!this.items.length) return Components.emptyState('history', 'No Activity', 'No activity logs found.');
    return this.items.map(item => {
      const icon = item.action_type === 'CREATE' ? 'plus-circle' : item.action_type === 'DELETE' ? 'trash' : 'edit';
      const color = item.action_type === 'CREATE' ? 'var(--success)' : item.action_type === 'DELETE' ? 'var(--danger)' : 'var(--primary)';
      return `
        <div class="transaction-item" style="border-bottom:1px solid var(--border-color);">
          <div class="transaction-icon" style="background:${color}15;color:${color};"><i class="fas fa-${icon}"></i></div>
          <div class="transaction-details">
            <span class="transaction-desc">${item.description || 'N/A'}</span>
            <span class="transaction-meta">${item.action_type} | ${item.entity_type} | ${Components.formatDateTime(item.created_at)}</span>
          </div>
          <span class="badge badge-${item.action_type === 'CREATE' ? 'success' : item.action_type === 'DELETE' ? 'danger' : 'info'}">${item.action_type}</span>
        </div>
      `;
    }).join('');
  },

  applyFilter() {
    this.search = document.getElementById('alSearch').value;
    this.startDate = document.getElementById('alStart').value;
    this.endDate = document.getElementById('alEnd').value;
    this.refresh();
  },
  clearFilter() { this.search = ''; this.startDate = ''; this.endDate = ''; this.refresh(); },

  async refresh() {
    Modal.loading(true); await this.loadData(); this.render(); Modal.loading(false);
  }
};
window.ActivityLog = ActivityLog;
