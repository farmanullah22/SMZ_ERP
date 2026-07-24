document.addEventListener('DOMContentLoaded', () => {
  // Navigation active state
  const navLinks = document.querySelectorAll('.nav-link, .drawer-link');
  const sections = document.querySelectorAll('section[id]');

  function updateActiveLink() {
    let current = '';
    sections.forEach(section => {
      const top = section.offsetTop - 120;
      const bottom = top + section.offsetHeight;
      if (window.scrollY >= top && window.scrollY < bottom) {
        current = section.getAttribute('id');
      }
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
  }

  window.addEventListener('scroll', updateActiveLink);

  // Smooth scroll
  navLinks.forEach(link => {
    link.addEventListener('click', e => {
      const target = link.getAttribute('href');
      if (target && target.startsWith('#')) {
        e.preventDefault();
        const el = document.querySelector(target);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        // Close drawer on mobile
        document.getElementById('drawer').classList.add('hidden');
        document.getElementById('drawerOverlay').classList.add('hidden');
      }
    });
  });

  // Drawer
  const hamburger = document.getElementById('hamburgerBtn');
  const drawer = document.getElementById('drawer');
  const overlay = document.getElementById('drawerOverlay');
  const closeBtn = document.getElementById('drawerClose');

  hamburger.addEventListener('click', () => {
    drawer.classList.remove('hidden');
    overlay.classList.remove('hidden');
  });
  closeBtn.addEventListener('click', () => {
    drawer.classList.add('hidden');
    overlay.classList.add('hidden');
  });
  overlay.addEventListener('click', () => {
    drawer.classList.add('hidden');
    overlay.classList.add('hidden');
  });

  // Stamp search placeholder
  document.querySelector('.search-box .btn-primary')?.addEventListener('click', () => {
    const input = document.querySelector('.search-box input');
    if (input && input.value.trim()) {
      alert(`Searching for stamp paper: ${input.value.trim()}\n\nThis feature is available in the admin dashboard.`);
    } else {
      alert('Please enter a Stamp Paper Number.');
    }
  });

  // Contact form placeholder
  document.querySelector('.contact-form')?.addEventListener('submit', e => {
    e.preventDefault();
    alert('Thank you for your message! Our team will get back to you shortly.\n\nYou can also reach us directly at +92 300 1234567');
  });
});
