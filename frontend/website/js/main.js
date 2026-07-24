const Website = {
  cart: JSON.parse(localStorage.getItem('websiteCart') || '[]'),
  reviews: [
    { image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop', rating: 5, text: '<span class="fw-700">ALHAMDULLILAH</span> — the best homemade food in town! Aneela\'s Kitchen never disappoints. The flavors are authentic and the delivery is always on time.' },
    { image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop', rating: 5, text: 'Absolutely love the <span class="fw-700">TRUSTABLE</span> quality. Every meal feels like it\'s made just for you. Highly recommend to everyone!' }
  ],
  currentReview: 0,
  workshopImages: [
    'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&h=600&fit=crop'
  ],
  testimonials: [
    { name: 'Fatima A.', text: 'The biryani from Aneela\'s Kitchen is hands down the best I\'ve ever had. The aroma, the taste — everything is perfect!', rating: 5 },
    { name: 'Ahmed K.', text: 'We ordered for a family gathering and everyone loved the food. The quantity and quality were both excellent. Will order again!', rating: 5 },
    { name: 'Sara M.', text: 'Finally a place that makes food taste like home. The delivery was prompt and the food was still hot. Amazing service!', rating: 5 }
  ],

  init() {
    this.setupNavigation();
    this.setupDrawer();
    this.setupCart();
    this.renderProducts();
    this.renderReviews();
    this.renderWorkshop();
    this.renderTestimonials();
    this.updateCartBadge();
  },

  setupNavigation() {
    document.querySelectorAll('.nav-link, .drawer-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('href');
        if (target && target.startsWith('#')) {
          const el = document.querySelector(target);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
        document.querySelectorAll('.nav-link, .drawer-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        document.getElementById('drawer').classList.add('hidden');
        document.getElementById('drawerOverlay').classList.add('hidden');
      });
    });
  },

  setupDrawer() {
    document.getElementById('hamburgerBtn').addEventListener('click', () => {
      document.getElementById('drawer').classList.remove('hidden');
      document.getElementById('drawerOverlay').classList.remove('hidden');
    });
    document.getElementById('drawerClose').addEventListener('click', () => {
      document.getElementById('drawer').classList.add('hidden');
      document.getElementById('drawerOverlay').classList.add('hidden');
    });
    document.getElementById('drawerOverlay').addEventListener('click', () => {
      document.getElementById('drawer').classList.add('hidden');
      document.getElementById('drawerOverlay').classList.add('hidden');
    });
  },

  setupCart() {
    const openDrawer = () => {
      document.getElementById('cartDrawer').classList.remove('hidden');
      document.getElementById('cartOverlay').classList.remove('hidden');
      this.renderCartItems();
    };
    document.getElementById('floatingCart')?.addEventListener('click', openDrawer);
    document.getElementById('cartBtnMobile')?.addEventListener('click', openDrawer);
    document.getElementById('cartBtnDesktop')?.addEventListener('click', openDrawer);

    document.getElementById('cartClose').addEventListener('click', () => {
      document.getElementById('cartDrawer').classList.add('hidden');
      document.getElementById('cartOverlay').classList.add('hidden');
    });
    document.getElementById('cartOverlay').addEventListener('click', () => {
      document.getElementById('cartDrawer').classList.add('hidden');
      document.getElementById('cartOverlay').classList.add('hidden');
    });
  },

  updateCartBadge() {
    const count = this.cart.reduce((s, i) => s + i.quantity, 0);
    document.querySelectorAll('.cart-badge').forEach(b => b.textContent = count);
  },

  addToCart(product) {
    const existing = this.cart.find(i => i.id === product.id);
    if (existing) {
      existing.quantity += product.quantity || 1;
    } else {
      this.cart.push({ ...product, quantity: product.quantity || 1 });
    }
    localStorage.setItem('websiteCart', JSON.stringify(this.cart));
    this.updateCartBadge();
    Toast?.success?.('Added to cart!');
  },

  renderCartItems() {
    const container = document.getElementById('cartDrawerItems');
    if (this.cart.length === 0) {
      container.innerHTML = '<div class="cart-empty"><p>Your cart is empty</p></div>';
      return;
    }
    container.innerHTML = this.cart.map((item, i) => `
      <div style="display:flex;align-items:flex-start;gap:12px;background:white;border-radius:5px;box-shadow:0 2px 2px rgba(0,0,0,0.02);padding:15px 15px 10px;margin-top:15px;">
        <img src="${item.image || 'https://via.placeholder.com/88'}" alt="${item.name}" style="width:88px;height:88px;object-fit:cover;flex-shrink:0;border-radius:4px;">
        <div style="flex:1;min-width:0">
          <div style="font-family:'Poppins',sans-serif;font-size:16px;font-weight:600;color:black;margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${item.name}</div>
          <div style="font-family:'Poppins',sans-serif;font-size:13px;font-weight:500;color:#222;">PKR ${(item.price * item.quantity).toLocaleString()}</div>
        </div>
        <button onclick="Website.removeFromCart(${i})" style="flex-shrink:0;color:black;background:none;border:none;cursor:pointer;margin-top:4px;" onmouseover="this.style.color='#DC2626'" onmouseout="this.style.color='black'">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
        </button>
      </div>
    `).join('');
  },

  removeFromCart(index) {
    this.cart.splice(index, 1);
    localStorage.setItem('websiteCart', JSON.stringify(this.cart));
    this.updateCartBadge();
    this.renderCartItems();
  },

  products: [
    { id: 1, name: 'Chicken Biryani', price: 350, category: 'main', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=400&fit=crop' },
    { id: 2, name: 'Mutton Karahi', price: 650, category: 'main', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=400&fit=crop' },
    { id: 3, name: 'Chicken Handi', price: 450, category: 'main', image: 'https://images.unsplash.com/photo-1604908176997-152f1b2b3a7c?w=400&h=400&fit=crop' },
    { id: 4, name: 'Daal Chawal', price: 250, category: 'main', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=400&fit=crop' },
    { id: 5, name: 'Chicken Roll', price: 180, category: 'snacks', image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=400&fit=crop' },
    { id: 6, name: 'Samosa (6 pcs)', price: 120, category: 'snacks', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=400&fit=crop' },
    { id: 7, name: 'Gulab Jamun', price: 150, category: 'desserts', image: 'https://images.unsplash.com/photo-1675872112609-c86cf99eda9f?w=400&h=400&fit=crop' },
    { id: 8, name: 'Kheer', price: 200, category: 'desserts', image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&h=400&fit=crop' },
    { id: 9, name: 'Raita', price: 80, category: 'sides', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=400&fit=crop' },
    { id: 10, name: 'Naan', price: 30, category: 'sides', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=400&fit=crop' },
    { id: 11, name: 'Zarda Rice', price: 220, category: 'desserts', image: 'https://images.unsplash.com/photo-1675872112609-c86cf99eda9f?w=400&h=400&fit=crop' },
    { id: 12, name: 'Chicken Shawarma', price: 250, category: 'snacks', image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=400&fit=crop' }
  ],
  currentCategory: 'all',

  getCategories() {
    const cats = [...new Set(this.products.map(p => p.category))];
    return ['all', ...cats];
  },

  renderProducts() {
    this.renderCategoryFilters();
    this.renderProductGrid();
  },

  renderCategoryFilters() {
    const container = document.getElementById('categoryFilters');
    container.innerHTML = this.getCategories().map(cat => `
      <button class="cat-filter ${cat === this.currentCategory ? 'active' : 'inactive'}" data-cat="${cat}">
        ${this.getCategoryIcon(cat)} ${cat.charAt(0).toUpperCase() + cat.slice(1)}
      </button>
    `).join('');

    container.querySelectorAll('.cat-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentCategory = btn.dataset.cat;
        this.renderCategoryFilters();
        this.renderProductGrid();
      });
    });
  },

  getCategoryIcon(cat) {
    const icons = { all: '', main: '', snacks: '', desserts: '', sides: '' };
    return icons[cat] || '';
  },

  renderProductGrid() {
    const container = document.getElementById('productsGrid');
    const filtered = this.currentCategory === 'all'
      ? this.products
      : this.products.filter(p => p.category === this.currentCategory);

    if (filtered.length === 0) {
      container.innerHTML = '<div class="empty-state"><h3>No products found</h3><p>Try a different category</p></div>';
      return;
    }

    container.innerHTML = filtered.map(p => `
      <div class="product-card">
        <div class="product-card-image">
          <img src="${p.image}" alt="${p.name}" loading="lazy">
          ${p.onsale ? '<span class="sale-badge">Sale</span>' : ''}
        </div>
        <h3 class="product-name">${p.name}</h3>
        <div class="product-price">PKR ${p.price.toLocaleString()}</div>
        <div class="qty-selector">
          <button class="qty-btn" onclick="Website.decQty(this)">−</button>
          <span class="qty-display">1</span>
          <button class="qty-btn" onclick="Website.incQty(this)">+</button>
          <button class="add-to-cart" onclick="Website.addToCartBtn(this, ${p.id}, '${p.name}', ${p.price}, '${p.image}')">Add to Cart</button>
        </div>
      </div>
    `).join('');
  },

  decQty(btn) {
    const display = btn.parentElement.querySelector('.qty-display');
    const val = parseInt(display.textContent);
    if (val > 1) display.textContent = val - 1;
  },

  incQty(btn) {
    const display = btn.parentElement.querySelector('.qty-display');
    const val = parseInt(display.textContent);
    display.textContent = val + 1;
  },

  addToCartBtn(btn, id, name, price, image) {
    const display = btn.parentElement.querySelector('.qty-display');
    const qty = parseInt(display.textContent);
    this.addToCart({ id, name, price, image, quantity: qty });
  },

  renderReviews() {
    const review = this.reviews[this.currentReview];
    const imagesContainer = document.getElementById('reviewsImages');
    const contentContainer = document.getElementById('reviewsContent');

    imagesContainer.innerHTML = `<img src="${review.image}" alt="Review">`;

    contentContainer.innerHTML = `
      <div class="review-nav">
        <button class="review-nav-btn" onclick="Website.prevReview()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M15 18l-6-6 6-6"/></svg></button>
        <button class="review-nav-btn" onclick="Website.nextReview()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 18l6-6-6-6"/></svg></button>
      </div>
      <div class="review-rating">${review.rating}.0</div>
      <div class="review-stars">${'<svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'.repeat(review.rating)}</div>
      <div class="review-text">${review.text}</div>
      <a href="#shop" class="btn-shop">Shop Now</a>
    `;
  },

  prevReview() {
    this.currentReview = (this.currentReview - 1 + this.reviews.length) % this.reviews.length;
    this.renderReviews();
  },

  nextReview() {
    this.currentReview = (this.currentReview + 1) % this.reviews.length;
    this.renderReviews();
  },

  renderWorkshop() {
    const container = document.getElementById('workshopGrid');
    container.innerHTML = this.workshopImages.map(url =>
      `<img src="${url}" alt="Workshop" loading="lazy">`
    ).join('');
  },

  renderTestimonials() {
    const container = document.getElementById('testimonialsGrid');
    container.innerHTML = this.testimonials.map(t => `
      <div class="testimonial-card">
        <div class="testimonial-quote"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151C7.563 6.068 6 8.789 6 11h4v10H0z"/></svg></div>
        <p class="testimonial-text">"${t.text}"</p>
        <div class="testimonial-author">
          <div class="testimonial-avatar">${t.name.charAt(0)}</div>
          <div>
            <div style="font-weight:600;font-size:14px;">${t.name}</div>
            <div class="testimonial-stars">${'<svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'.repeat(t.rating)}</div>
          </div>
        </div>
      </div>
    `).join('');
  }
};

document.addEventListener('DOMContentLoaded', () => Website.init());

const Toast = {
  success(msg) {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#0A0A0A;color:white;padding:12px 24px;border-radius:8px;font-family:Poppins,sans-serif;font-size:14px;z-index:9999;animation:fadeInUp 0.3s ease';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; setTimeout(() => el.remove(), 300); }, 2000);
  }
};
