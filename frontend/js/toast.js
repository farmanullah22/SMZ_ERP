const Toast = {
  show(message, title = '', type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = { success: 'fa-check', error: 'fa-xmark', warning: 'fa-exclamation', info: 'fa-info' };

    toast.innerHTML = `
      <div class="toast-icon"><i class="fas ${icons[type]}"></i></div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close"><i class="fas fa-times"></i></button>
    `;

    container.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', () => this.remove(toast));
    if (duration > 0) setTimeout(() => this.remove(toast), duration);
    return toast;
  },

  remove(toast) {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 250);
  },

  success(message, title = 'Success') { return this.show(message, title, 'success'); },
  error(message, title = 'Error') { return this.show(message, title, 'error'); },
  warning(message, title = 'Warning') { return this.show(message, title, 'warning'); },
  info(message, title = 'Info') { return this.show(message, title, 'info'); }
};

window.Toast = Toast;
