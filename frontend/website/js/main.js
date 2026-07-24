const Website = {
  content: null,

  async init() {
    try {
      const res = await fetch('/api/website-content');
      this.content = await res.json();
    } catch {
      this.content = {};
    }
    this.render();
    this.bindEvents();
  },

  render() {
    const c = this.content || {};
    const h = c.hero || {};
    const ss = c.stampSearch || {};
    const ab = c.about || {};
    const ft = c.features || {};
    const wc = c.whyChoose || {};
    const pr = c.process || {};
    const tt = c.testimonials || {};
    const ct = c.cta || {};
    const cn = c.contact || {};
    const st = c.site || {};

    document.title = (st.site_name || 'SMZ ERP') + ' - Complete Business Management Software';

    const heroStats = (h.stats || []).map(s => `
      <div class="hero-stat">
        <span class="stat-number">${s.number || ''}</span>
        <span class="stat-label">${s.label || ''}</span>
      </div>
    `).join('');

    const featuresItems = (ft.items || []).map(f => `
      <div class="feature-card">
        <div class="feature-icon" style="background:${f.color || '#eef2ff'};color:${f.iconColor || '#4f46e5'};"><i class="fas fa-${f.icon || 'check'}"></i></div>
        <h3>${f.title || ''}</h3>
        <p>${f.text || ''}</p>
      </div>
    `).join('');

    const whyItems = (wc.items || []).map(w => `
      <div class="why-card">
        <div class="why-icon"><i class="fas fa-${w.icon || 'check-circle'}"></i></div>
        <h3>${w.title || ''}</h3>
        <p>${w.text || ''}</p>
      </div>
    `).join('');

    const processSteps = (pr.steps || []).map(p => `
      <div class="process-step">
        <div class="step-number">${p.number || 0}</div>
        <div class="step-content">
          <h3>${p.title || ''}</h3>
          <p>${p.text || ''}</p>
        </div>
      </div>
    `).join('');

    const testimonialItems = (tt.items || []).map(t => `
      <div class="testimonial-card">
        <div class="testimonial-stars">${'★'.repeat(t.rating || 5)}</div>
        <p>"${t.text || ''}"</p>
        <div class="testimonial-author">
          <div class="testimonial-avatar">${(t.name || '?').charAt(0)}</div>
          <div>
            <div class="testimonial-name">${t.name || ''}</div>
            <div class="testimonial-role">${t.role || ''}</div>
          </div>
        </div>
      </div>
    `).join('');

    document.getElementById('app').innerHTML = `
      <!-- Navbar -->
      <nav class="navbar" id="navbar">
        <div class="container">
          <a href="/website/" class="navbar-logo">
            <div class="logo-icon">${(st.site_name || 'SMZ').substring(0,3)}</div>
          </a>
          <div class="nav-links" id="navLinks">
            <a href="#home" class="nav-link active">Home</a>
            <a href="#about" class="nav-link">About</a>
            <a href="#features" class="nav-link">Features</a>
            <a href="#process" class="nav-link">How It Works</a>
            <a href="#testimonials" class="nav-link">Testimonials</a>
            <a href="#contact" class="nav-link">Contact</a>
          </div>
          <a href="#contact" class="btn-nav">${h.button1_text || 'Get Free Demo'}</a>
          <button class="hamburger" id="hamburgerBtn"><i class="fas fa-bars"></i></button>
        </div>
      </nav>

      <!-- Mobile Drawer -->
      <div class="drawer-overlay hidden" id="drawerOverlay"></div>
      <div class="drawer hidden" id="drawer">
        <div class="drawer-header">
          <div class="logo-icon" style="width:36px;height:36px;font-size:14px;">${(st.site_name || 'SMZ').substring(0,3)}</div>
          <button id="drawerClose"><i class="fas fa-times"></i></button>
        </div>
        <div class="drawer-links">
          <a href="#home" class="drawer-link active">Home</a>
          <a href="#about" class="drawer-link">About</a>
          <a href="#features" class="drawer-link">Features</a>
          <a href="#process" class="drawer-link">How It Works</a>
          <a href="#testimonials" class="drawer-link">Testimonials</a>
          <a href="#contact" class="drawer-link">Contact</a>
        </div>
      </div>

      <main>
        <!-- Hero Section -->
        <section class="hero" id="home">
          <div class="hero-bg"${h.image ? ` style="background-image:url('${h.image}');background-size:cover;background-position:center;"` : ''}></div>
          <div class="container">
            <div class="hero-content">
              ${h.badge ? `<span class="hero-badge">${h.badge}</span>` : ''}
              <h1 class="hero-title">${h.heading || ''}</h1>
              ${h.subheading ? `<p class="hero-subtitle">${h.subheading}</p>` : ''}
              ${h.description ? `<p class="hero-desc">${h.description}</p>` : ''}
              <div class="hero-buttons">
                ${h.button1_text ? `<a href="${h.button1_link || '#contact'}" class="btn-primary"><i class="fas fa-play"></i> ${h.button1_text}</a>` : ''}
                ${h.button2_text ? `<a href="${h.button2_link || '#contact'}" class="btn-secondary"><i class="fas fa-phone"></i> ${h.button2_text}</a>` : ''}
              </div>
            </div>
          </div>
          ${heroStats ? `<div class="hero-stats"><div class="container"><div class="stats-row">${heroStats}</div></div></div>` : ''}
        </section>

        <!-- Stamp Paper Search -->
        <section class="stamp-search" id="stampSearch">
          <div class="container">
            <div class="stamp-search-card">
              <h2>${ss.heading || 'Find Any Stamp Paper Instantly'}</h2>
              <p>${ss.description || ''}</p>
              <div class="search-box">
                <input type="text" id="stampSearchInput" placeholder="${ss.placeholder || 'Enter Stamp Paper Number'}">
                <button class="btn-primary" id="stampSearchBtn"><i class="fas fa-search"></i> ${ss.button_text || 'Search Record'}</button>
              </div>
              <div id="stampSearchResult"></div>
              <span class="search-hint">${ss.hint || ''}</span>
            </div>
          </div>
        </section>

        <!-- About Section -->
        <section class="about" id="about">
          <div class="container">
            <div class="about-content">
              ${ab.tag ? `<span class="section-tag">${ab.tag}</span>` : ''}
              <h2 class="section-title">${ab.heading || ''}</h2>
              <p class="about-text">${ab.text || ''}</p>
            </div>
          </div>
        </section>

        <!-- Features Section -->
        <section class="features" id="features">
          <div class="container">
            <div class="features-header">
              ${ft.tag ? `<span class="section-tag">${ft.tag}</span>` : ''}
              <h2 class="section-title">${ft.heading || ''}</h2>
            </div>
            <div class="features-grid">${featuresItems}</div>
          </div>
        </section>

        <!-- Why Choose Us -->
        <section class="why-choose" id="whyChoose">
          <div class="container">
            <div class="why-header">
              ${wc.tag ? `<span class="section-tag">${wc.tag}</span>` : ''}
              <h2 class="section-title">${wc.heading || ''}</h2>
            </div>
            <div class="why-grid">${whyItems}</div>
          </div>
        </section>

        <!-- How It Works -->
        <section class="process" id="process">
          <div class="container">
            <div class="process-header">
              ${pr.tag ? `<span class="section-tag">${pr.tag}</span>` : ''}
              <h2 class="section-title">${pr.heading || ''}</h2>
            </div>
            <div class="process-steps">${processSteps}</div>
          </div>
        </section>

        <!-- Testimonials -->
        <section class="testimonials" id="testimonials">
          <div class="container">
            <div class="testimonials-header">
              ${tt.tag ? `<span class="section-tag">${tt.tag}</span>` : ''}
              <h2 class="section-title">${tt.heading || ''}</h2>
            </div>
            <div class="testimonials-grid">${testimonialItems}</div>
          </div>
        </section>

        <!-- CTA -->
        <section class="cta" id="cta">
          <div class="container">
            <div class="cta-card">
              <h2>${ct.heading || ''}</h2>
              <p>${ct.text || ''}</p>
              <div class="cta-buttons">
                ${ct.button1_text ? `<a href="${ct.button1_link || '#contact'}" class="btn-primary btn-lg"><i class="fas fa-play"></i> ${ct.button1_text}</a>` : ''}
                ${ct.button2_text ? `<a href="${ct.button2_link || '#contact'}" class="btn-secondary btn-lg"><i class="fas fa-phone"></i> ${ct.button2_text}</a>` : ''}
              </div>
            </div>
          </div>
        </section>

        <!-- Contact -->
        <section class="contact" id="contact">
          <div class="container">
            <div class="contact-header-inner">
              ${cn.tag ? `<span class="section-tag">${cn.tag}</span>` : ''}
              <h2 class="section-title">${cn.heading || ''}</h2>
              <p>${cn.text || ''}</p>
            </div>
            <div class="contact-content">
              <div class="contact-info">
                ${cn.phone ? `<div class="contact-item"><div class="contact-icon"><i class="fas fa-phone"></i></div><div><div class="contact-label">Phone</div><div class="contact-value">${cn.phone}</div></div></div>` : ''}
                ${cn.email ? `<div class="contact-item"><div class="contact-icon"><i class="fas fa-envelope"></i></div><div><div class="contact-label">Email</div><div class="contact-value">${cn.email}</div></div></div>` : ''}
                ${cn.address ? `<div class="contact-item"><div class="contact-icon"><i class="fas fa-map-marker-alt"></i></div><div><div class="contact-label">Address</div><div class="contact-value">${cn.address}</div></div></div>` : ''}
              </div>
              <form class="contact-form" id="contactForm">
                <div class="form-row">
                  <input type="text" placeholder="Your Name" required>
                  <input type="email" placeholder="Your Email" required>
                </div>
                <input type="text" placeholder="Subject">
                <textarea rows="4" placeholder="Your Message"></textarea>
                <button type="submit" class="btn-primary">Send Message</button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <!-- Footer -->
      <footer class="footer">
        <div class="container">
          <div class="footer-content">
            <div class="footer-brand">
              <div class="logo-icon" style="width:48px;height:48px;font-size:18px;">${(st.site_name || 'SMZ').substring(0,3)}</div>
              <p>${(st.site_name || 'SMZ ERP')} — Complete business management software for PCOs, Mobile Shops, and Document Service Centers.</p>
            </div>
            <div class="footer-links">
              <h4>Quick Links</h4>
              <a href="#home">Home</a>
              <a href="#about">About</a>
              <a href="#features">Features</a>
              <a href="#contact">Contact</a>
            </div>
            <div class="footer-links">
              <h4>Contact</h4>
              ${cn.phone ? `<a href="tel:${cn.phone}">${cn.phone}</a>` : ''}
              ${cn.email ? `<a href="mailto:${cn.email}">${cn.email}</a>` : ''}
            </div>
          </div>
          <div class="footer-bottom">
            <p>&copy; ${new Date().getFullYear()} ${st.site_name || 'SMZ ERP'}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    `;
  },

  bindEvents() {
    // Nav links active + smooth scroll
    const navLinks = document.querySelectorAll('.nav-link, .drawer-link');
    const sections = document.querySelectorAll('section[id]');

    function updateActive() {
      let current = '';
      sections.forEach(s => {
        const top = s.offsetTop - 120;
        if (window.scrollY >= top && window.scrollY < top + s.offsetHeight) current = s.id;
      });
      navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${current}`));
    }
    window.addEventListener('scroll', updateActive);

    navLinks.forEach(link => {
      link.addEventListener('click', e => {
        const t = link.getAttribute('href');
        if (t && t.startsWith('#')) {
          e.preventDefault();
          const el = document.querySelector(t);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          document.getElementById('drawer').classList.add('hidden');
          document.getElementById('drawerOverlay').classList.add('hidden');
        }
      });
    });

    // Drawer
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('drawerOverlay');
    document.getElementById('hamburgerBtn').addEventListener('click', () => { drawer.classList.remove('hidden'); overlay.classList.remove('hidden'); });
    document.getElementById('drawerClose').addEventListener('click', () => { drawer.classList.add('hidden'); overlay.classList.add('hidden'); });
    overlay.addEventListener('click', () => { drawer.classList.add('hidden'); overlay.classList.add('hidden'); });

    // Stamp paper search
    document.getElementById('stampSearchBtn').addEventListener('click', () => this.searchStamp());
    document.getElementById('stampSearchInput').addEventListener('keyup', e => { if (e.key === 'Enter') this.searchStamp(); });

    // Contact form
    document.getElementById('contactForm').addEventListener('submit', e => {
      e.preventDefault();
      alert('Thank you for your message! Our team will get back to you shortly.');
    });
  },

  async searchStamp() {
    const q = document.getElementById('stampSearchInput').value.trim();
    const resultDiv = document.getElementById('stampSearchResult');
    if (!q) { resultDiv.innerHTML = '<p style="color:#94a3b8;margin-top:12px;font-size:14px;">Please enter a stamp paper number.</p>'; return; }
    resultDiv.innerHTML = '<p style="color:#94a3b8;margin-top:12px;"><i class="fas fa-spinner fa-spin"></i> Searching...</p>';
    try {
      const data = await fetch(`/api/website-content/search-stamp?number=${encodeURIComponent(q)}`).then(r => r.json());
      if (data.results && data.results.length > 0) {
        resultDiv.innerHTML = data.results.map(p => `
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-top:12px;text-align:left;">
            <strong>${p.name}</strong> — ${p.type || ''} ${p.value ? `| Value: PKR ${p.value}` : ''}
            <span style="display:block;font-size:13px;color:#64748b;margin-top:4px;">${p.customer_name ? `Customer: ${p.customer_name}` : ''} ${p.mobile ? `| ${p.mobile}` : ''}</span>
            ${p.documents ? `<span style="display:block;font-size:13px;color:#64748b;">Documents: ${Array.isArray(p.documents) ? p.documents.join(', ') : p.documents}</span>` : ''}
          </div>
        `).join('');
      } else {
        resultDiv.innerHTML = '<p style="color:#94a3b8;margin-top:12px;font-size:14px;">No stamp paper found with that number.</p>';
      }
    } catch {
      resultDiv.innerHTML = '<p style="color:#ef4444;margin-top:12px;font-size:14px;">Search failed. Please try again.</p>';
    }
  }
};

document.addEventListener('DOMContentLoaded', () => Website.init());
