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
    const hasActionsHeader = headers.some(h => h.toLowerCase() === 'actions');
    const allHeaders = hasActionsHeader ? headers : [...headers, 'Actions'];
    return `
      <div class="table-container">
        <table>
          <thead><tr>${allHeaders.map(h => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>
            ${rows.length ? rows.map(row => {
              const cells = hasActionsHeader ? row : row.slice(0, headers.length);
              return `<tr>${cells.map(cell => `<td>${cell}</td>`).join('')}
                ${!hasActionsHeader && actions.length ? `<td class="actions">${actions.map(a => `
                  <button class="action-btn ${a.class || ''}" data-action="${a.action}" data-id="${row.id || row[0]}">
                    <i class="fas fa-${a.icon}"></i>
                  </button>`).join('')}</td>` : ''}
              </tr>`;
            }).join('') : `<tr><td colspan="${allHeaders.length}" class="text-center text-muted" style="padding: 40px;">No data available</td></tr>`}
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
  },

  exportPDF(title, headers, rows, filename) {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(16);
      doc.setTextColor(99, 102, 241);
      doc.text(title, pageWidth / 2, 15, { align: 'center' });

      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text('Generated: ' + new Date().toLocaleString(), pageWidth / 2, 22, { align: 'center' });

      doc.autoTable({
        startY: 30,
        head: [headers],
        body: rows,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [99, 102, 241], fontSize: 8, halign: 'center' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { top: 30 }
      });

      doc.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
      return true;
    } catch (error) {
      console.error('PDF export error:', error);
      return false;
    }
  }
};

window.Components = Components;
