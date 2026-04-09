const Modal = {
  show(content, options = {}) {
    const overlay = document.getElementById('modalOverlay');
    const modal = document.getElementById('modal');
    
    modal.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">${options.title || 'Modal'}</h3>
        <button class="modal-close" id="modalCloseBtn"><i class="fas fa-times"></i></button>
      </div>
      <div class="modal-body">${content}</div>
      ${options.footer ? `<div class="modal-footer">${options.footer}</div>` : ''}
    `;

    overlay.classList.remove('hidden');
    document.getElementById('modalCloseBtn').addEventListener('click', () => this.hide());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) this.hide(); });
    if (options.onOpen) options.onOpen();
    return modal;
  },

  hide() {
    document.getElementById('modalOverlay').classList.add('hidden');
    document.getElementById('modal').innerHTML = '';
  },

  confirm(message, onConfirm, options = {}) {
    const title = options.title || 'Confirm';
    const footer = `
      <button class="btn btn-secondary" id="modalCancelBtn">Cancel</button>
      <button class="btn btn-${options.type || 'primary'}" id="modalConfirmBtn">${options.confirmText || 'Confirm'}</button>
    `;

    this.show(`<p>${message}</p>`, {
      title,
      footer,
      onOpen: () => {
        document.getElementById('modalCancelBtn').addEventListener('click', () => this.hide());
        document.getElementById('modalConfirmBtn').addEventListener('click', () => { this.hide(); if (onConfirm) onConfirm(); });
      }
    });
  },

  loading(show = true) {
    document.getElementById('loadingOverlay').classList.toggle('hidden', !show);
  }
};

window.Modal = Modal;
