const WebsiteManage = {
  files: [],
  currentTab: 'upload',

  async init() {
    this.currentTab = 'upload';
    await this.loadFiles();
    this.render();
  },

  async loadFiles() {
    try {
      const data = await API.website.getFiles();
      this.files = data.files || [];
    } catch {
      this.files = [];
    }
  },

  render() {
    const container = document.getElementById('websiteManagePage');
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title"><i class="fas fa-globe"></i> Website Manage</h1>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="WebsiteManage.refresh()">
            <i class="fas fa-sync-alt"></i> Refresh
          </button>
          <a href="/website/" target="_blank" class="btn btn-primary">
            <i class="fas fa-external-link-alt"></i> View Website
          </a>
        </div>
      </div>

      <div class="website-tabs">
        <button class="website-tab ${this.currentTab === 'upload' ? 'active' : ''}" data-tab="upload">
          <i class="fas fa-upload"></i> Upload Files
        </button>
        <button class="website-tab ${this.currentTab === 'hero' ? 'active' : ''}" data-tab="hero">
          <i class="fas fa-image"></i> Hero Image
        </button>
        <button class="website-tab ${this.currentTab === 'files' ? 'active' : ''}" data-tab="files">
          <i class="fas fa-folder"></i> File Manager
        </button>
      </div>

      <div id="websiteTabContent" class="website-tab-content"></div>
    `;

    container.querySelectorAll('.website-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.currentTab = tab.dataset.tab;
        this.render();
      });
    });

    this.renderTabContent();
  },

  renderTabContent() {
    const container = document.getElementById('websiteTabContent');
    switch (this.currentTab) {
      case 'upload': this.renderUploadTab(container); break;
      case 'hero': this.renderHeroTab(container); break;
      case 'files': this.renderFilesTab(container); break;
    }
  },

  renderUploadTab(container) {
    container.innerHTML = `
      <div class="settings-section">
        <h3 class="settings-section-title"><i class="fas fa-cloud-upload-alt"></i> Upload Files</h3>
        <p style="margin-bottom:16px;color:var(--text-secondary);font-size:14px;">Upload images, documents, and media files for your website. Supported: JPG, PNG, GIF, WebP, SVG, PDF, MP4</p>

        <div class="website-upload-area" id="dropZone">
          <i class="fas fa-cloud-upload-alt" style="font-size:48px;color:var(--primary);margin-bottom:16px;"></i>
          <h3 style="font-weight:600;margin-bottom:8px;">Drag & Drop files here</h3>
          <p style="color:var(--text-muted);font-size:14px;margin-bottom:16px;">or click to browse</p>
          <input type="file" id="fileInput" multiple accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.ico,.pdf,.doc,.docx,.mp4,.webm" style="display:none">
          <button class="btn btn-primary" onclick="document.getElementById('fileInput').click()">
            <i class="fas fa-folder-open"></i> Browse Files
          </button>
        </div>

        <div id="uploadPreview" class="website-upload-preview"></div>

        <div id="uploadProgress" class="website-upload-progress hidden">
          <div class="website-progress-bar"><div class="website-progress-fill" id="uploadProgressFill"></div></div>
          <span id="uploadStatus">Uploading...</span>
        </div>

        <div id="uploadResult" class="website-upload-result"></div>
      </div>

      <div class="settings-section">
        <h3 class="settings-section-title"><i class="fas fa-mouse-pointer"></i> Quick Actions</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;">
          <button class="btn btn-secondary" onclick="WebsiteManage.uploadHeroBg()"><i class="fas fa-image"></i> Set Hero Image</button>
          <button class="btn btn-secondary" onclick="WebsiteManage.currentTab='files';WebsiteManage.render();"><i class="fas fa-folder"></i> View All Files</button>
          <a href="/website/" target="_blank" class="btn btn-secondary" style="text-decoration:none;"><i class="fas fa-eye"></i> Preview Website</a>
        </div>
      </div>
    `;

    this.setupDragDrop();
    this.setupFileInput();
  },

  setupDragDrop() {
    const dropZone = document.getElementById('dropZone');
    if (!dropZone) return;

    ['dragenter', 'dragover'].forEach(evt => {
      dropZone.addEventListener(evt, (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
      });
    });
    ['dragleave', 'drop'].forEach(evt => {
      dropZone.addEventListener(evt, (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
      });
    });
    dropZone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length) this.handleFiles(files);
    });
  },

  setupFileInput() {
    const input = document.getElementById('fileInput');
    if (!input) return;
    input.addEventListener('change', () => {
      if (input.files.length) this.handleFiles(input.files);
    });
  },

  handleFiles(files) {
    const preview = document.getElementById('uploadPreview');
    preview.innerHTML = '<h4 style="margin-bottom:12px;">Selected Files:</h4>';
    preview.innerHTML += Array.from(files).map(f => `
      <div class="website-file-item">
        <i class="fas fa-file"></i>
        <span>${f.name}</span>
        <span style="color:var(--text-muted);font-size:12px;">${(f.size / 1024).toFixed(1)} KB</span>
      </div>
    `).join('');
    preview.innerHTML += `<button class="btn btn-primary" style="margin-top:12px;" onclick="WebsiteManage.startUpload()"><i class="fas fa-upload"></i> Upload All (${files.length} files)</button>`;
    preview._files = files;
  },

  async startUpload() {
    const preview = document.getElementById('uploadPreview');
    const progress = document.getElementById('uploadProgress');
    const result = document.getElementById('uploadResult');
    const fill = document.getElementById('uploadProgressFill');
    const status = document.getElementById('uploadStatus');

    if (!preview._files || !preview._files.length) {
      Toast.warning('No files selected');
      return;
    }

    progress.classList.remove('hidden');
    result.innerHTML = '';

    try {
      const files = preview._files;
      let uploaded = 0;

      for (let i = 0; i < files.length; i++) {
        status.textContent = `Uploading ${i + 1} of ${files.length}: ${files[i].name}`;
        fill.style.width = `${((i) / files.length) * 100}%`;
        await API.website.uploadFile(files[i]);
        uploaded++;
      }

      fill.style.width = '100%';
      status.textContent = 'Upload complete!';
      result.innerHTML = `<div class="alert alert-success"><i class="fas fa-check-circle"></i> ${uploaded} file(s) uploaded successfully!</div>`;
      preview.innerHTML = '';
      preview._files = null;
      setTimeout(() => progress.classList.add('hidden'), 2000);
      await this.loadFiles();
    } catch (error) {
      status.textContent = 'Upload failed';
      result.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> ${error.message || 'Upload failed'}</div>`;
    }
  },

  renderHeroTab(container) {
    container.innerHTML = `
      <div class="settings-section">
        <h3 class="settings-section-title"><i class="fas fa-image"></i> Hero Background Image</h3>
        <p style="margin-bottom:16px;color:var(--text-secondary);font-size:14px;">Upload the hero section background image (recommended: 1920x1080px, max 5MB)</p>

        <div class="website-upload-area" style="padding:40px;text-align:center;border:2px dashed var(--border-color);border-radius:var(--radius-lg);background:var(--bg-tertiary);">
          <i class="fas fa-image" style="font-size:48px;color:var(--warning);margin-bottom:16px;"></i>
          <h3 style="font-weight:600;margin-bottom:8px;">Hero Background</h3>
          <p style="color:var(--text-muted);font-size:14px;margin-bottom:16px;">This image appears on your homepage hero section</p>
          <input type="file" id="heroFileInput" accept=".jpg,.jpeg,.png,.webp" style="display:none">
          <button class="btn btn-warning" onclick="document.getElementById('heroFileInput').click()">
            <i class="fas fa-upload"></i> Upload Hero Image
          </button>
        </div>

        <div id="heroPreview" style="margin-top:16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;"></div>
      </div>
    `;

    this.renderHeroPreview();
    document.getElementById('heroFileInput')?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        Modal.loading(true);
        await API.website.uploadHero(file);
        Modal.loading(false);
        Toast.success('Hero image uploaded!');
        this.renderHeroPreview();
      } catch (error) {
        Modal.loading(false);
        Toast.error(error.message || 'Upload failed');
      }
    });
  },

  async renderHeroPreview() {
    const container = document.getElementById('heroPreview');
    const heroFiles = this.files.filter(f => f.filename.startsWith('hero-bg'));
    if (heroFiles.length === 0) {
      container.innerHTML = '<p style="color:var(--text-muted);font-size:14px;">No hero image uploaded yet.</p>';
      return;
    }
    container.innerHTML = heroFiles.map(f => `
      <div class="website-file-card">
        <img src="${f.url}" alt="Hero" style="width:100%;height:150px;object-fit:cover;border-radius:var(--radius-md);">
        <div style="padding:8px 0;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:12px;color:var(--text-muted);">${f.filename}</span>
          <button class="action-btn danger" onclick="WebsiteManage.deleteFile('${f.filename}')"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `).join('');
  },

  renderFilesTab(container) {
    container.innerHTML = `
      <div class="settings-section">
        <h3 class="settings-section-title"><i class="fas fa-folder"></i> File Manager</h3>
        <p style="margin-bottom:16px;color:var(--text-secondary);font-size:14px;">Manage all uploaded website files.</p>
        <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;">
          <input type="text" id="fileSearch" placeholder="Search files..." style="padding:10px 14px;border:1px solid var(--border-color);border-radius:var(--radius-md);background:var(--bg-secondary);color:var(--text-primary);font-size:14px;flex:1;min-width:200px;font-family:'Inter',sans-serif;">
          <span style="padding:10px 0;font-size:14px;color:var(--text-muted);">${this.files.length} file(s)</span>
        </div>
        <div id="filesGrid" class="website-files-grid"></div>
      </div>
    `;

    this.renderFilesGrid();

    document.getElementById('fileSearch')?.addEventListener('input', (e) => {
      this.renderFilesGrid(e.target.value.toLowerCase());
    });
  },

  renderFilesGrid(search = '') {
    const container = document.getElementById('filesGrid');
    const filtered = search ? this.files.filter(f => f.filename.toLowerCase().includes(search)) : this.files;

    if (filtered.length === 0) {
      container.innerHTML = Components.emptyState('folder-open', search ? 'No matching files' : 'No files uploaded', search ? 'Try a different search term' : 'Upload files to get started');
      return;
    }

    container.innerHTML = filtered.map(f => {
      const isImage = /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(f.filename);
      return `
        <div class="website-file-card">
          ${isImage
            ? `<img src="${f.url}" alt="${f.filename}" style="width:100%;height:140px;object-fit:cover;border-radius:var(--radius-md);">`
            : `<div style="width:100%;height:140px;display:flex;align-items:center;justify-content:center;background:var(--bg-tertiary);border-radius:var(--radius-md);font-size:40px;color:var(--text-muted);"><i class="fas fa-file"></i></div>`
          }
          <div class="website-file-info">
            <div class="website-file-name" title="${f.filename}">${f.filename}</div>
            <div class="website-file-meta">${(f.size / 1024).toFixed(1)} KB</div>
          </div>
          <div class="website-file-actions">
            <button class="action-btn" onclick="WebsiteManage.copyUrl('${f.url}')" title="Copy URL"><i class="fas fa-link"></i></button>
            <button class="action-btn danger" onclick="WebsiteManage.deleteFile('${f.filename}')" title="Delete"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `;
    }).join('');
  },

  copyUrl(url) {
    navigator.clipboard.writeText(url).then(() => {
      Toast.success('URL copied to clipboard!');
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      Toast.success('URL copied!');
    });
  },

  async deleteFile(filename) {
    Modal.confirm(`Delete "${filename}"?`, async () => {
      try {
        await API.website.deleteFile(filename);
        Toast.success('File deleted');
        await this.loadFiles();
        this.render();
      } catch (error) {
        Toast.error(error.message || 'Failed to delete file');
      }
    }, { title: 'Delete File', type: 'danger' });
  },

  uploadHeroBg() {
    document.getElementById('heroFileInput')?.click();
    if (!document.getElementById('heroFileInput')) {
      this.currentTab = 'hero';
      this.render();
      setTimeout(() => document.getElementById('heroFileInput')?.click(), 100);
    }
  },

  async refresh() {
    Modal.loading(true);
    await this.loadFiles();
    this.render();
    Modal.loading(false);
    Toast.success('Refreshed');
  }
};

window.WebsiteManage = WebsiteManage;
