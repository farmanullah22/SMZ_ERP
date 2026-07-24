const WebsiteManage = {
  content: null,
  currentTab: 'hero',
  files: [],

  async init() {
    this.currentTab = 'hero';
    await this.loadContent();
    await this.loadFiles();
    this.render();
  },

  async loadContent() {
    try {
      this.content = await API.websiteContent.get();
    } catch { this.content = {}; }
  },

  async loadFiles() {
    try {
      const data = await API.website.getFiles();
      this.files = data.files || [];
    } catch { this.files = []; }
  },

  render() {
    const tabs = [
      { id: 'hero', icon: 'image', label: 'Hero' },
      { id: 'stampSearch', icon: 'search', label: 'Stamp Search' },
      { id: 'about', icon: 'info-circle', label: 'About' },
      { id: 'features', icon: 'list', label: 'Features' },
      { id: 'whyChoose', icon: 'star', label: 'Why Choose' },
      { id: 'process', icon: 'steps', label: 'Process' },
      { id: 'testimonials', icon: 'comment-dots', label: 'Testimonials' },
      { id: 'cta', icon: 'bullhorn', label: 'CTA' },
      { id: 'contact', icon: 'envelope', label: 'Contact' },
      { id: 'site', icon: 'cog', label: 'Site Settings' },
      { id: 'files', icon: 'folder', label: 'File Manager' }
    ];

    const container = document.getElementById('websiteManagePage');
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title"><i class="fas fa-globe"></i> Website Manage</h1>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="WebsiteManage.resetContent()"><i class="fas fa-undo"></i> Reset Defaults</button>
          <button class="btn btn-secondary" onclick="WebsiteManage.refresh()"><i class="fas fa-sync-alt"></i> Refresh</button>
          <a href="/website/" target="_blank" class="btn btn-primary"><i class="fas fa-external-link-alt"></i> View Website</a>
        </div>
      </div>

      <div class="website-tabs">
        ${tabs.map(t => `
          <button class="website-tab ${this.currentTab === t.id ? 'active' : ''}" data-tab="${t.id}">
            <i class="fas fa-${t.icon}"></i> ${t.label}
          </button>
        `).join('')}
      </div>

      <div id="websiteTabContent"></div>
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
    const ct = document.getElementById('websiteTabContent');
    switch (this.currentTab) {
      case 'hero': this.renderSectionForm(ct, 'hero', ['badge', 'heading', 'subheading', 'description', 'button1_text', 'button1_link', 'button2_text', 'button2_link', { key: 'stats', type: 'array', fields: ['number', 'label'] }]); break;
      case 'stampSearch': this.renderSectionForm(ct, 'stampSearch', ['heading', 'description', 'placeholder', 'button_text', 'hint']); break;
      case 'about': this.renderSectionForm(ct, 'about', ['tag', 'heading', 'text']); break;
      case 'features': this.renderSectionForm(ct, 'features', ['tag', 'heading', { key: 'items', type: 'array', fields: ['icon', 'title', 'text', 'color'] }]); break;
      case 'whyChoose': this.renderSectionForm(ct, 'whyChoose', ['tag', 'heading', { key: 'items', type: 'array', fields: ['icon', 'title', 'text'] }]); break;
      case 'process': this.renderSectionForm(ct, 'process', ['tag', 'heading', { key: 'steps', type: 'array', fields: ['number', 'title', 'text'] }]); break;
      case 'testimonials': this.renderSectionForm(ct, 'testimonials', ['tag', 'heading', { key: 'items', type: 'array', fields: ['name', 'role', 'text', 'rating'] }]); break;
      case 'cta': this.renderSectionForm(ct, 'cta', ['heading', 'text', 'button1_text', 'button1_link', 'button2_text', 'button2_link']); break;
      case 'contact': this.renderSectionForm(ct, 'contact', ['tag', 'heading', 'text', 'phone', 'email', 'address']); break;
      case 'site': this.renderSiteSettings(ct); break;
      case 'files': this.renderFileManager(ct); break;
    }
  },

  renderSectionForm(container, section, fields) {
    const data = this.content[section] || {};
    container.innerHTML = `
      <div class="settings-section">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
          <h3 class="settings-section-title" style="margin:0;"><i class="fas fa-edit"></i> Edit ${section.charAt(0).toUpperCase() + section.slice(1)}</h3>
          <button class="btn btn-primary btn-sm" onclick="WebsiteManage.saveSection('${section}')"><i class="fas fa-save"></i> Save Changes</button>
        </div>
        <form id="sectionForm-${section}" class="content-form">
          ${fields.map(f => this.renderField(data, f, section)).join('')}
        </form>
      </div>
    `;
  },

  renderField(data, field, section) {
    if (typeof field === 'object' && field.type === 'array') {
      const items = data[field.key] || [];
      return `
        <div class="form-section">
          <label class="form-label">${field.key}</label>
          <div id="arrayContainer-${section}-${field.key}">
            ${items.map((item, i) => `
              <div class="array-item" data-index="${i}">
                <div class="array-fields">
                  ${field.fields.map(fk => {
                    const val = item[fk];
                    if (fk === 'number') return `<input type="number" class="array-input" data-field="${fk}" value="${val || ''}" placeholder="${fk}" style="width:70px;">`;
                    if (fk === 'rating') return `<input type="number" class="array-input" data-field="${fk}" value="${val || 5}" placeholder="${fk}" min="1" max="5" style="width:70px;">`;
                    if (fk === 'color') return `<input type="color" class="array-input" data-field="${fk}" value="${val || '#eef2ff'}" style="width:50px;height:36px;padding:2px;">`;
                    if (fk === 'text') return `<textarea class="array-input" data-field="${fk}" placeholder="${fk}" rows="2">${val || ''}</textarea>`;
                    return `<input type="text" class="array-input" data-field="${fk}" value="${val || ''}" placeholder="${fk}">`;
                  }).join('')}
                </div>
                <button type="button" class="action-btn danger" onclick="WebsiteManage.removeArrayItem('${section}','${field.key}',${i})"><i class="fas fa-times"></i></button>
              </div>
            `).join('')}
          </div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="WebsiteManage.addArrayItem('${section}','${field.key}')" style="margin-top:8px;"><i class="fas fa-plus"></i> Add</button>
        </div>
      `;
    }
    const val = data[field] || '';
    if (field === 'description' || field === 'text' || field === 'subheading') {
      return `<div class="input-group"><label>${field}</label><textarea name="${field}" rows="3">${val}</textarea></div>`;
    }
    return `<div class="input-group"><label>${field}</label><input type="text" name="${field}" value="${val}"></div>`;
  },

  addArrayItem(section, key) {
    const container = document.getElementById(`arrayContainer-${section}-${key}`);
    const div = document.createElement('div');
    div.className = 'array-item';
    const firstInput = container.querySelector('.array-input');
    if (!firstInput) return;
    const fields = container.querySelector('.array-item:last-child .array-fields');
    if (fields) {
      div.innerHTML = fields.innerHTML;
      div.querySelectorAll('.array-input').forEach(inp => { if (inp.type !== 'color') inp.value = ''; });
    }
    const idx = container.children.length;
    div.dataset.index = idx;
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'action-btn danger';
    btn.innerHTML = '<i class="fas fa-times"></i>';
    btn.onclick = () => this.removeArrayItem(section, key, idx);
    div.appendChild(btn);
    container.appendChild(div);
  },

  removeArrayItem(section, key, index) {
    const container = document.getElementById(`arrayContainer-${section}-${key}`);
    const items = container.querySelectorAll('.array-item');
    if (items[index]) items[index].remove();
  },

  async saveSection(section) {
    const form = document.getElementById(`sectionForm-${section}`);
    if (!form) return;
    const data = {};
    const textInputs = form.querySelectorAll('input[type="text"], input[type="number"], textarea');
    textInputs.forEach(inp => { if (inp.name) data[inp.name] = inp.value; });
    const arrayContainers = form.querySelectorAll('[id^="arrayContainer-"]');
    arrayContainers.forEach(ac => {
      const key = ac.id.replace(`arrayContainer-${section}-`, '');
      const items = [];
      ac.querySelectorAll('.array-item').forEach(item => {
        const obj = {};
        item.querySelectorAll('.array-input').forEach(inp => {
          obj[inp.dataset.field] = inp.type === 'number' ? parseFloat(inp.value) || (inp.dataset.field === 'number' ? 0 : inp.dataset.field === 'rating' ? 5 : inp.value) : inp.value;
        });
        items.push(obj);
      });
      data[key] = items;
    });
    try {
      Modal.loading(true);
      await API.websiteContent.updateSection(section, data);
      Modal.loading(false);
      Toast.success(`${section} section saved!`);
      await this.loadContent();
    } catch (error) {
      Modal.loading(false);
      Toast.error(error.message || 'Save failed');
    }
  },

  renderSiteSettings(container) {
    const s = this.content.site || {};
    container.innerHTML = `
      <div class="settings-section">
        <h3 class="settings-section-title"><i class="fas fa-cog"></i> Site Settings</h3>
        <form id="sectionForm-site">
          <div class="input-group"><label>Site Name</label><input type="text" name="site_name" value="${s.site_name || ''}"></div>
          <div class="input-group"><label>Logo URL</label><input type="text" name="logo" value="${s.logo || ''}"></div>
        </form>
        <div style="margin-top:20px;display:flex;gap:12px;">
          <button class="btn btn-primary" onclick="WebsiteManage.saveSection('site')"><i class="fas fa-save"></i> Save Settings</button>
          <button class="btn btn-secondary" onclick="WebsiteManage.uploadLogo()"><i class="fas fa-upload"></i> Upload Logo</button>
        </div>
      </div>
      <div class="settings-section">
        <h3 class="settings-section-title"><i class="fas fa-image"></i> Hero Background Image</h3>
        <div class="website-upload-area" style="padding:40px;text-align:center;border:2px dashed var(--border-color);border-radius:var(--radius-lg);background:var(--bg-tertiary);">
          <i class="fas fa-image" style="font-size:48px;color:var(--warning);margin-bottom:16px;"></i>
          <p style="margin-bottom:16px;">Upload hero background image</p>
          <input type="file" id="heroImageInput" accept="image/*" style="display:none">
          <button class="btn btn-warning" onclick="document.getElementById('heroImageInput').click()"><i class="fas fa-upload"></i> Upload Hero Image</button>
        </div>
      </div>
    `;
    document.getElementById('heroImageInput')?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        Modal.loading(true);
        const res = await API.websiteContent.uploadImage(file);
        const section = this.content.hero || {};
        section.image = res.url;
        await API.websiteContent.updateSection('hero', section);
        Modal.loading(false);
        Toast.success('Hero image updated!');
        await this.loadContent();
      } catch (err) {
        Modal.loading(false);
        Toast.error('Upload failed');
      }
    });
  },

  uploadLogo() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        Modal.loading(true);
        const res = await API.websiteContent.uploadImage(file);
        const section = this.content.site || {};
        section.logo = res.url;
        await API.websiteContent.updateSection('site', section);
        Modal.loading(false);
        Toast.success('Logo uploaded!');
        await this.loadContent();
      } catch (err) {
        Modal.loading(false);
        Toast.error('Upload failed');
      }
    };
    input.click();
  },

  renderFileManager(container) {
    container.innerHTML = `
      <div class="settings-section">
        <h3 class="settings-section-title"><i class="fas fa-upload"></i> Upload Files</h3>
        <div class="website-upload-area" id="dropZone" style="padding:40px;text-align:center;border:2px dashed var(--border-color);border-radius:var(--radius-lg);background:var(--bg-tertiary);">
          <i class="fas fa-cloud-upload-alt" style="font-size:48px;color:var(--primary);margin-bottom:16px;"></i>
          <p style="margin-bottom:16px;">Drag & drop or click to browse</p>
          <input type="file" id="fileInput" multiple accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.ico,.pdf,.doc,.docx,.mp4,.webm" style="display:none">
          <button class="btn btn-primary" onclick="document.getElementById('fileInput').click()"><i class="fas fa-folder-open"></i> Browse Files</button>
        </div>
        <div id="uploadPreview" style="margin-top:12px;"></div>
        <div id="uploadProgress" class="hidden" style="margin-top:12px;"><div class="website-progress-bar"><div class="website-progress-fill" id="uploadProgressFill"></div></div><span id="uploadStatus">Uploading...</span></div>
      </div>
      <div class="settings-section">
        <h3 class="settings-section-title"><i class="fas fa-folder"></i> File Manager</h3>
        <div style="display:flex;gap:12px;margin-bottom:16px;">
          <input type="text" id="fileSearch" placeholder="Search files..." style="flex:1;padding:10px;border:1px solid var(--border-color);border-radius:var(--radius-md);background:var(--bg-secondary);color:var(--text-primary);font-size:14px;">
          <span style="padding:10px 0;font-size:14px;color:var(--text-muted);">${this.files.length} file(s)</span>
        </div>
        <div id="filesGrid" class="website-files-grid"></div>
      </div>
    `;
    this.setupFileUpload();
    this.renderFilesGrid();
    document.getElementById('fileSearch')?.addEventListener('input', e => this.renderFilesGrid(e.target.value.toLowerCase()));
  },

  setupFileUpload() {
    const dropZone = document.getElementById('dropZone');
    if (!dropZone) return;
    ['dragenter', 'dragover'].forEach(evt => dropZone.addEventListener(evt, e => { e.preventDefault(); dropZone.classList.add('drag-over'); }));
    ['dragleave', 'drop'].forEach(evt => dropZone.addEventListener(evt, e => { e.preventDefault(); dropZone.classList.remove('drag-over'); }));
    dropZone.addEventListener('drop', e => { if (e.dataTransfer.files.length) this.handleFiles(e.dataTransfer.files); });
    document.getElementById('fileInput')?.addEventListener('change', () => { if (document.getElementById('fileInput').files.length) this.handleFiles(document.getElementById('fileInput').files); });
  },

  handleFiles(files) {
    const preview = document.getElementById('uploadPreview');
    preview.innerHTML = '<h4 style="margin-bottom:12px;">Selected:</h4>' + Array.from(files).map(f => `<div class="website-file-item"><i class="fas fa-file"></i> ${f.name} <span style="color:var(--text-muted);font-size:12px;">${(f.size/1024).toFixed(1)} KB</span></div>`).join('');
    preview.innerHTML += `<button class="btn btn-primary" style="margin-top:12px;" onclick="WebsiteManage.startUpload()"><i class="fas fa-upload"></i> Upload (${files.length})</button>`;
    preview._files = files;
  },

  async startUpload() {
    const preview = document.getElementById('uploadPreview');
    const files = preview._files;
    if (!files || !files.length) { Toast.warning('No files'); return; }
    const progress = document.getElementById('uploadProgress');
    const fill = document.getElementById('uploadProgressFill');
    const status = document.getElementById('uploadStatus');
    progress.classList.remove('hidden');
    try {
      for (let i = 0; i < files.length; i++) {
        status.textContent = `Uploading ${i+1}/${files.length}: ${files[i].name}`;
        fill.style.width = `${(i/files.length)*100}%`;
        await API.website.uploadFile(files[i]);
      }
      fill.style.width = '100%';
      status.textContent = 'Complete!';
      Toast.success(`${files.length} file(s) uploaded`);
      preview.innerHTML = '';
      preview._files = null;
      setTimeout(() => progress.classList.add('hidden'), 2000);
      await this.loadFiles();
      this.renderFilesGrid();
    } catch (e) { Toast.error(e.message || 'Upload failed'); }
  },

  renderFilesGrid(search = '') {
    const container = document.getElementById('filesGrid');
    const filtered = search ? this.files.filter(f => f.filename.toLowerCase().includes(search)) : this.files;
    if (!filtered.length) { container.innerHTML = Components.emptyState('folder-open', search ? 'No matches' : 'No files', ''); return; }
    container.innerHTML = filtered.map(f => {
      const isImage = /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(f.filename);
      return `<div class="website-file-card">
        ${isImage ? `<img src="${f.url}" alt="${f.filename}" style="width:100%;height:140px;object-fit:cover;border-radius:var(--radius-md);">` : `<div style="width:100%;height:140px;display:flex;align-items:center;justify-content:center;background:var(--bg-tertiary);border-radius:var(--radius-md);font-size:40px;color:var(--text-muted);"><i class="fas fa-file"></i></div>`}
        <div class="website-file-info"><div class="website-file-name">${f.filename}</div><div class="website-file-meta">${(f.size/1024).toFixed(1)} KB</div></div>
        <div class="website-file-actions">
          <button class="action-btn" onclick="WebsiteManage.copyUrl('${f.url}')" title="Copy URL"><i class="fas fa-link"></i></button>
          <button class="action-btn danger" onclick="WebsiteManage.deleteFile('${f.filename}')" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
      </div>`;
    }).join('');
  },

  copyUrl(url) {
    navigator.clipboard.writeText(url).then(() => Toast.success('URL copied!')).catch(() => { const ta = document.createElement('textarea'); ta.value = url; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); Toast.success('URL copied!'); });
  },

  async deleteFile(filename) {
    Modal.confirm(`Delete "${filename}"?`, async () => {
      try { await API.website.deleteFile(filename); Toast.success('Deleted'); await this.loadFiles(); this.renderFilesGrid(); }
      catch (e) { Toast.error(e.message || 'Failed'); }
    }, { title: 'Delete', type: 'danger' });
  },

  async resetContent() {
    Modal.confirm('Reset all website content to default values?', async () => {
      try {
        Modal.loading(true);
        await API.websiteContent.reset();
        Modal.loading(false);
        Toast.success('Content reset to defaults');
        await this.loadContent();
        this.render();
      } catch (e) {
        Modal.loading(false);
        Toast.error(e.message || 'Reset failed');
      }
    }, { title: 'Reset Content', type: 'danger' });
  },

  async refresh() {
    Modal.loading(true);
    await this.loadContent();
    await this.loadFiles();
    this.render();
    Modal.loading(false);
    Toast.success('Refreshed');
  }
};

window.WebsiteManage = WebsiteManage;
