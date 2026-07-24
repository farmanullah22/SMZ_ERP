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
    const ct = c.cta || {};
    const cn = c.contact || {};
    const st = c.site || {};

    document.title = (st.site_name || 'SMZ ERP') + ' - Shop Management Software';

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

    const sl = c.heroSlider || {};
    const sliderImages = sl.images || [];
    const hasSlider = sliderImages.length > 0;

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
          <a href="#contact" class="drawer-link">Contact</a>
        </div>
      </div>

      <main>
        <!-- Hero Section -->
        <section class="hero${hasSlider ? ' hero-with-slider' : ''}" id="home">
          ${hasSlider ? `
          <div class="hero-slider" id="heroSlider">
            ${sliderImages.map((img, i) => `
              <div class="hero-slide${i === 0 ? ' active' : ''}" style="background-image:url('${img}');" data-index="${i}">
                <div class="hero-slide-overlay"></div>
              </div>
            `).join('')}
            <button class="slider-arrow slider-arrow-prev" id="sliderPrev"><i class="fas fa-chevron-left"></i></button>
            <button class="slider-arrow slider-arrow-next" id="sliderNext"><i class="fas fa-chevron-right"></i></button>
            <div class="slider-dots">
              ${sliderImages.map((_, i) => `<span class="slider-dot${i === 0 ? ' active' : ''}" data-slide="${i}"></span>`).join('')}
            </div>
          </div>
          ` : `<div class="hero-bg"></div>`}
          <div class="container">
            <div class="hero-content${hasSlider ? ' hero-content-overlay' : ''}">
              ${!hasSlider && h.badge ? `<span class="hero-badge">${h.badge}</span>` : ''}
              ${!hasSlider ? `<h1 class="hero-title">${(h.heading || '').replace(/(One Place|Manage|Shop|Records)/, '<span>$1</span>')}</h1>` : ''}
              ${!hasSlider && h.subheading ? `<p class="hero-subtitle">${h.subheading}</p>` : ''}
              ${!hasSlider && h.description ? `<p class="hero-desc">${h.description}</p>` : ''}
              ${!hasSlider ? `<div class="hero-buttons">
                ${h.button1_text ? `<a href="${h.button1_link || '#contact'}" class="btn-primary"><i class="fas fa-play"></i> ${h.button1_text}</a>` : ''}
                ${h.button2_text ? `<a href="${h.button2_link || '#contact'}" class="btn-secondary"><i class="fas fa-phone"></i> ${h.button2_text}</a>` : ''}
              </div>` : ''}
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

    // Navbar scroll effect
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    });

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

    // Hero Slider
    this.initSlider();
  },

  initSlider() {
    const slider = document.getElementById('heroSlider');
    if (!slider) return;
    const slides = slider.querySelectorAll('.hero-slide');
    const dots = slider.querySelectorAll('.slider-dot');
    if (!slides.length) return;
    let current = 0;
    let interval;

    function goToSlide(index) {
      slides.forEach(s => s.classList.remove('active'));
      dots.forEach(d => d.classList.remove('active'));
      current = (index + slides.length) % slides.length;
      slides[current].classList.add('active');
      dots[current].classList.add('active');
    }

    function next() { goToSlide(current + 1); }
    function prev() { goToSlide(current - 1); }

    function startAuto() { interval = setInterval(next, 5000); }
    function stopAuto() { clearInterval(interval); }

    document.getElementById('sliderNext')?.addEventListener('click', () => { next(); stopAuto(); startAuto(); });
    document.getElementById('sliderPrev')?.addEventListener('click', () => { prev(); stopAuto(); startAuto(); });

    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        goToSlide(parseInt(dot.dataset.slide));
        stopAuto();
        startAuto();
      });
    });

    slider.addEventListener('mouseenter', stopAuto);
    slider.addEventListener('mouseleave', startAuto);

    startAuto();
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
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
              <div>
                <strong>${p.stamp_number ? '#' + p.stamp_number + ' — ' : ''}${p.name}</strong>
                ${p.type ? `<span style="font-size:13px;color:#64748b;">${p.type}</span>` : ''}
                ${p.value ? `<span style="font-size:13px;color:#64748b;">| Value: PKR ${p.value}</span>` : ''}
              </div>
              ${p.documents && p.documents.length ? `<a href="${p.documents[0]}" target="_blank" class="btn-primary" style="padding:6px 14px;font-size:13px;text-decoration:none;display:inline-flex;align-items:center;gap:6px;" download><i class="fas fa-download"></i> Download</a>` : ''}
            </div>
            ${p.customer_name || p.mobile || p.purpose ? `<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:12px;font-size:13px;color:#475569;">
              ${p.customer_name ? `<span><strong>Customer:</strong> ${p.customer_name}</span>` : ''}
              ${p.mobile ? `<span><strong>Mobile:</strong> ${p.mobile}</span>` : ''}
              ${p.purpose ? `<span><strong>Purpose:</strong> ${p.purpose}</span>` : ''}
            </div>` : ''}
            ${p.documents && p.documents.length > 1 ? `<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px;">${p.documents.map((doc, i) => `<a href="${doc}" target="_blank" style="font-size:12px;padding:4px 10px;background:#f1f5f9;border-radius:6px;color:#4f46e5;text-decoration:none;display:inline-flex;align-items:center;gap:4px;"><i class="fas fa-file"></i> Doc ${i+1} <i class="fas fa-download" style="font-size:10px;"></i></a>`).join('')}</div>` : ''}
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
