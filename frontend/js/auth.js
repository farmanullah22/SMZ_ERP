const Auth = {
  user: null,

  async login(username, password) {
    try {
      const user = await API.auth.login({ username, password });
      this.user = user;
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error) {
      throw error;
    }
  },

  logout() {
    this.user = null;
    localStorage.removeItem('user');
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('appScreen').classList.add('hidden');
  },

  isLoggedIn() {
    return !!this.user;
  },

  isAdmin() {
    return this.user && this.user.role === 'admin';
  },

  getUser() {
    if (!this.user) {
      const stored = localStorage.getItem('user');
      if (stored) this.user = JSON.parse(stored);
    }
    return this.user;
  },

  updateUI() {
    const user = this.getUser();
    if (user) {
      document.getElementById('currentUserName').textContent = user.username;
      document.getElementById('currentUserRole').textContent = user.role;
      
      document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = user.role === 'admin' ? 'block' : 'none';
      });
    }
  }
};

window.Auth = Auth;
