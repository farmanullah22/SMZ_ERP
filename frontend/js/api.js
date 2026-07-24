const API = {
  baseUrl: window.location.origin + '/api',

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Request failed');
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  auth: {
    login: (data) => API.request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    changePassword: (data) => API.request('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
    getUsers: () => API.request('/auth/users'),
    createUser: (data) => API.request('/auth/users', { method: 'POST', body: JSON.stringify(data) }),
    deleteUser: (id) => API.request(`/auth/users/${id}`, { method: 'DELETE' })
  },

  products: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return API.request(`/products${query ? `?${query}` : ''}`);
    },
    getById: (id) => API.request(`/products/${id}`),
    create: (data) => API.request('/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => API.request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => API.request(`/products/${id}`, { method: 'DELETE' }),
    getCategories: () => API.request('/products/categories'),
    createCategory: (data) => API.request('/products/categories', { method: 'POST', body: JSON.stringify(data) }),
    deleteCategory: (id) => API.request(`/products/categories/${id}`, { method: 'DELETE' }),
    getSuppliers: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return API.request(`/products/suppliers${query ? `?${query}` : ''}`);
    },
    createSupplier: (data) => API.request('/products/suppliers', { method: 'POST', body: JSON.stringify(data) }),
    updateSupplier: (id, data) => API.request(`/products/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteSupplier: (id) => API.request(`/products/suppliers/${id}`, { method: 'DELETE' }),
    getLowStock: () => API.request('/products/low-stock')
  },

  sales: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return API.request(`/sales${query ? `?${query}` : ''}`);
    },
    getById: (id) => API.request(`/sales/${id}`),
    create: (data) => API.request('/sales', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id) => API.request(`/sales/${id}`, { method: 'DELETE' }),
    getStats: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return API.request(`/sales/stats${query ? `?${query}` : ''}`);
    },
    getMonthly: (period = 'monthly', months = 12) => API.request(`/sales/monthly?period=${period}&months=${months}`)
  },

  purchases: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return API.request(`/purchases${query ? `?${query}` : ''}`);
    },
    getById: (id) => API.request(`/purchases/${id}`),
    create: (data) => API.request('/purchases', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id) => API.request(`/purchases/${id}`, { method: 'DELETE' }),
    getStats: () => API.request('/purchases/stats')
  },

  customers: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return API.request(`/customers${query ? `?${query}` : ''}`);
    },
    getById: (id) => API.request(`/customers/${id}`),
    create: (data) => API.request('/customers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => API.request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => API.request(`/customers/${id}`, { method: 'DELETE' })
  },

  accounts: {
    getAll: () => API.request('/accounts'),
    getByType: (type) => API.request(`/accounts/type/${type}`),
    getTransactions: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return API.request(`/accounts/transactions${query ? `?${query}` : ''}`);
    },
    createBank: (data) => API.request('/accounts/bank', { method: 'POST', body: JSON.stringify(data) }),
    updateBank: (id, data) => API.request(`/accounts/bank/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteBank: (id) => API.request(`/accounts/bank/${id}`, { method: 'DELETE' }),
    deposit: (data) => API.request('/accounts/deposit', { method: 'POST', body: JSON.stringify(data) }),
    withdraw: (data) => API.request('/accounts/withdraw', { method: 'POST', body: JSON.stringify(data) }),
    transfer: (data) => API.request('/accounts/transfer', { method: 'POST', body: JSON.stringify(data) })
  },

  stampPapers: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return API.request(`/stamp-papers${query ? `?${query}` : ''}`);
    },
    create: (data) => API.request('/stamp-papers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => API.request(`/stamp-papers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => API.request(`/stamp-papers/${id}`, { method: 'DELETE' }),
    uploadDoc: (file) => { const fd = new FormData(); fd.append('document', file); return fetch(`${API.baseUrl}/stamp-papers/upload-doc`, { method: 'POST', body: fd }).then(r => r.json()); }
  },

  reports: {
    getSales: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return API.request(`/reports/sales${query ? `?${query}` : ''}`);
    },
    getProfitLoss: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return API.request(`/reports/profit-loss${query ? `?${query}` : ''}`);
    },
    getInventory: () => API.request('/reports/inventory'),
    getCustomers: () => API.request('/reports/customers'),
    getSuppliers: () => API.request('/reports/suppliers'),
    getPurchases: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return API.request(`/reports/purchases${query ? `?${query}` : ''}`);
    },
    getAccounts: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return API.request(`/reports/accounts${query ? `?${query}` : ''}`);
    },
    getHistory: (params = {}) => { const q = new URLSearchParams(params).toString(); return API.request(`/reports/history${q ? `?${q}` : ''}`).then(r => r.history || []); }
  },

  analytics: {
    getData: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return API.request(`/analytics${query ? `?${query}` : ''}`);
    }
  },

  expenses: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return API.request(`/expenses${query ? `?${query}` : ''}`);
    },
    getCategories: () => API.request('/expenses/categories'),
    create: (data) => API.request('/expenses', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => API.request(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => API.request(`/expenses/${id}`, { method: 'DELETE' })
  },

  settings: {
    getAll: () => API.request('/settings'),
    update: (key, value) => API.request('/settings', { method: 'PUT', body: JSON.stringify({ key, value }) }),
    backup: () => `${API.baseUrl}/settings/backup`
  },

  services: {
    getAll: (params = {}) => { const q = new URLSearchParams(params).toString(); return API.request(`/services${q ? `?${q}` : ''}`); },
    getById: (id) => API.request(`/services/${id}`),
    create: (data) => API.request('/services', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => API.request(`/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => API.request(`/services/${id}`, { method: 'DELETE' })
  },

  mobileTransactions: {
    getAll: (params = {}) => { const q = new URLSearchParams(params).toString(); return API.request(`/mobile-transactions${q ? `?${q}` : ''}`); },
    create: (data) => API.request('/mobile-transactions', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id) => API.request(`/mobile-transactions/${id}`, { method: 'DELETE' }),
    getStats: (params = {}) => { const q = new URLSearchParams(params).toString(); return API.request(`/mobile-transactions/stats${q ? `?${q}` : ''}`); }
  },

  recharges: {
    getAll: (params = {}) => { const q = new URLSearchParams(params).toString(); return API.request(`/recharges${q ? `?${q}` : ''}`); },
    create: (data) => API.request('/recharges', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id) => API.request(`/recharges/${id}`, { method: 'DELETE' }),
    getStats: (params = {}) => { const q = new URLSearchParams(params).toString(); return API.request(`/recharges/stats${q ? `?${q}` : ''}`); }
  },

  credits: {
    getAll: (params = {}) => { const q = new URLSearchParams(params).toString(); return API.request(`/credits${q ? `?${q}` : ''}`); },
    create: (data) => API.request('/credits', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => API.request(`/credits/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => API.request(`/credits/${id}`, { method: 'DELETE' }),
    addPayment: (id, data) => API.request(`/credits/${id}/payments`, { method: 'POST', body: JSON.stringify(data) }),
    getStats: () => API.request('/credits/stats')
  },

  website: {
    getFiles: () => API.request('/website/files'),
    uploadFile: (file) => {
      const formData = new FormData();
      formData.append('file', file);
      return fetch(`${API.baseUrl}/website/upload`, {
        method: 'POST',
        body: formData
      }).then(r => r.json());
    },
    uploadMultiple: (files) => {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      return fetch(`${API.baseUrl}/website/upload-multiple`, {
        method: 'POST',
        body: formData
      }).then(r => r.json());
    },
    uploadHero: (file) => {
      const formData = new FormData();
      formData.append('hero', file);
      return fetch(`${API.baseUrl}/website/upload-hero`, {
        method: 'POST',
        body: formData
      }).then(r => r.json());
    },
    deleteFile: (filename) => API.request(`/website/files/${encodeURIComponent(filename)}`, { method: 'DELETE' })
  },

  websiteContent: {
    get: () => API.request('/website-content/manage'),
    updateSection: (section, data) => API.request(`/website-content/section/${section}`, { method: 'PUT', body: JSON.stringify(data) }),
    uploadImage: (file) => { const fd = new FormData(); fd.append('image', file); return fetch(`${API.baseUrl}/website-content/upload-image`, { method: 'POST', body: fd }).then(r => r.json()); },
    searchStamp: (number) => API.request(`/website-content/search-stamp?number=${encodeURIComponent(number)}`),
    reset: () => API.request('/website-content/reset', { method: 'POST' })
  }
};

window.API = API;
