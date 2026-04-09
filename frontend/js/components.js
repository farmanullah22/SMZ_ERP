const Components = {
  statCard(icon, label, value, subValue, color = 'primary') {
    return `
      <div class="stat-card">
        <div class="stat-icon ${color}"><i class="fas fa-${icon}"></i></div>
        <div class="stat-info">
          <div class="stat-label">${label}</div>
          <div class="stat-value currency">${value}</div>
          ${subValue ? `<div class="stat-sub text-muted">${subValue}</div>` : ''}
        </div>
      </div>
    `;
  },

  emptyState(icon, title, message) {
    return `
      <div class="empty-state">
        <i class="fas fa-${icon}"></i>
        <h3>${title}</h3>
        <p>${message}</p>
      </div>
    `;
  },

  badge(text, type = 'info') {
    return `<span class="badge badge-${type}">${text}</span>`;
  },

  table(headers, rows, actions = []) {
    return `
      <div class="table-container">
        <table>
          <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}${actions.length ? '<th>Actions</th>' : ''}</tr></thead>
          <tbody>
            ${rows.length ? rows.map(row => `
              <tr>${row.map(cell => `<td>${cell}</td>`).join('')}
                ${actions.length ? `<td class="actions">${actions.map(a => `
                  <button class="action-btn ${a.class || ''}" data-action="${a.action}" data-id="${row.id || row[0]}">
                    <i class="fas fa-${a.icon}"></i>
                  </button>`).join('')}</td>` : ''}
              </tr>`).join('') : `<tr><td colspan="${headers.length + (actions.length ? 1 : 0)}" class="text-center text-muted" style="padding: 40px;">No data available</td></tr>`}
          </tbody>
        </table>
      </div>`;
  },

  formatCurrency(amount) {
    return `PKR ${(parseFloat(amount) || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  },

  formatDate(date) {
    return new Date(date).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
  },

  formatDateTime(date) {
    return new Date(date).toLocaleString('en-GB', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
};

window.Components = Components;
