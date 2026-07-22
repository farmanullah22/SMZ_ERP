const App = {
  currentPage: 'dashboard',

  async init() {
    await this.loadTheme();
    this.setupNavigation();
    this.setupSidebar();

    const user = Auth.getUser();
    if (user) {
      document.getElementById('loginScreen').classList.add('hidden');
      document.getElementById('appScreen').classList.remove('hidden');
      Auth.updateUI();
    }

    const hash = window.location.hash.slice(1) || 'dashboard';
    this.navigateTo(hash);

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('loginUsername').value;
      const password = document.getElementById('loginPassword').value;

      try {
        Modal.loading(true);
        await Auth.login(username, password);
        Modal.loading(false);
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('appScreen').classList.remove('hidden');
        Auth.updateUI();
        await this.navigateTo('dashboard');
      } catch (error) {
        Modal.loading(false);
        Toast.error('Invalid credentials');
      }
    });
  },

  async loadTheme() {
    try {
      const settings = await API.settings.getAll();
      this.setTheme(settings.theme || 'light');
    } catch {
      const saved = localStorage.getItem('theme') || 'light';
      this.setTheme(saved);
    }
  },

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    const icon = document.getElementById('themeIcon');
    if (icon) icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    this.setTheme(current === 'dark' ? 'light' : 'dark');
    API.settings.update('theme', document.documentElement.getAttribute('data-theme')).catch(() => {});
  },

  setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigateTo(item.dataset.page);
      });
    });

    document.getElementById('themeToggle')?.addEventListener('click', () => this.toggleTheme());

    document.getElementById('globalSearch')?.addEventListener('input', (e) => {
      if (e.target.value.length >= 2) {
        this.navigateTo('products');
        setTimeout(() => {
          const search = document.getElementById('productSearch');
          if (search) { search.value = e.target.value; search.dispatchEvent(new Event('input')); }
        }, 100);
      }
    });
  },

  navigateTo(page) {
    this.currentPage = page;

    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    const pageEl = document.getElementById(`${page}Page`);
    if (pageEl) pageEl.classList.remove('hidden');

    window.location.hash = page;
    this.loadPage(page);
  },

  async loadPage(page) {
    switch (page) {
      case 'dashboard': await Dashboard.init(); break;
      case 'products': await Products.init(); break;
      case 'sales': await Sales.init(); break;
      case 'purchases': await Purchases.init(); break;
      case 'customers': await Customers.init(); break;
      case 'suppliers': await Suppliers.init(); break;
      case 'stampPapers': await StampPapers.init(); break;
      case 'accounts': await Accounts.init(); break;
      case 'expenses': await Expenses.init(); break;
      case 'analytics': await Analytics.init(); break;
      case 'reports': await Reports.init(); break;
      case 'settings': await Settings.init(); break;
    }
  },

  setupSidebar() {
    const sidebar = document.getElementById('sidebar');
    document.getElementById('sidebarToggle')?.addEventListener('click', () => sidebar.classList.toggle('collapsed'));
    document.getElementById('mobileMenuBtn')?.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !document.getElementById('mobileMenuBtn').contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  },

  logout() {
    Auth.logout();
    Toast.info('Logged out successfully');
  }
};

window.App = App;

document.addEventListener('DOMContentLoaded', () => App.init());
