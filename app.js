const els = {
  grid: document.getElementById('products-grid'),
  emptyState: document.getElementById('empty-state'),
  resultsInfo: document.getElementById('results-info'),
  searchInput: document.getElementById('search-input'),
  colorFilter: document.getElementById('color-filter'),
  sizeFilter: document.getElementById('size-filter'),
  cartToggle: document.getElementById('cart-toggle'),
  cartClose: document.getElementById('cart-close'),
  cartDrawer: document.getElementById('cart-drawer'),
  overlay: document.getElementById('overlay'),
  cartItems: document.getElementById('cart-items'),
  cartTotal: document.getElementById('cart-total'),
  cartCount: document.getElementById('cart-count')
};

const CART_KEY = 'kipa-shop-cart-v1';
let cart = loadCart();

function formatCurrency(value) {
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(value);
}

function uniqueValues(items, key) {
  return [...new Set(items.map((item) => item[key]))].sort((a, b) => a.localeCompare(b, 'he'));
}

function populateFilters() {
  uniqueValues(products, 'color').forEach((color) => {
    const option = document.createElement('option');
    option.value = color;
    option.textContent = color;
    els.colorFilter.appendChild(option);
  });

  uniqueValues(products, 'size').forEach((size) => {
    const option = document.createElement('option');
    option.value = size;
    option.textContent = size;
    els.sizeFilter.appendChild(option);
  });
}

function getFilteredProducts() {
  const text = els.searchInput.value.trim().toLowerCase();
  const color = els.colorFilter.value;
  const size = els.sizeFilter.value;

  return products.filter((product) => {
    const matchesText = !text || product.name.toLowerCase().includes(text);
    const matchesColor = !color || product.color === color;
    const matchesSize = !size || product.size === size;
    return matchesText && matchesColor && matchesSize;
  });
}

function productCard(product) {
  return `
    <article class="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100 flex flex-col">
      <img src="${product.image}" alt="${product.name}" class="h-48 w-full object-cover" loading="lazy" />
      <div class="p-4 flex-1 flex flex-col gap-2">
        <h3 class="font-semibold text-lg">${product.name}</h3>
        <p class="text-sm text-slate-600">${product.description}</p>
        <div class="text-sm text-slate-500 mt-1">
          <span>צבע: ${product.color}</span>
          <span class="mx-2">•</span>
          <span>מידה: ${product.size}</span>
        </div>
        <div class="mt-auto pt-3 flex items-center justify-between">
          <strong class="text-brand-navy">${formatCurrency(product.price)}</strong>
          <button data-add-to-cart="${product.id}" class="rounded-lg bg-brand-navy text-white text-sm px-3 py-2 hover:bg-slate-800 transition">הוספה לעגלה</button>
        </div>
      </div>
    </article>
  `;
}

function renderProducts(items) {
  els.grid.innerHTML = items.map(productCard).join('');
  els.resultsInfo.textContent = `מציג ${items.length} מתוך ${products.length} כיפות`;
  els.emptyState.classList.toggle('hidden', items.length > 0);
}

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(productId) {
  const found = cart.find((item) => item.productId === productId);
  if (found) {
    found.qty += 1;
  } else {
    cart.push({ productId, qty: 1 });
  }
  saveCart();
  renderCart();
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.productId !== productId);
  saveCart();
  renderCart();
}

function renderCart() {
  if (!cart.length) {
    els.cartItems.innerHTML = '<p class="text-slate-500 text-sm">העגלה ריקה כרגע.</p>';
    els.cartTotal.textContent = formatCurrency(0);
    els.cartCount.textContent = '0';
    return;
  }

  let total = 0;
  let count = 0;

  els.cartItems.innerHTML = cart
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return '';
      const lineTotal = product.price * item.qty;
      total += lineTotal;
      count += item.qty;

      return `
        <div class="border rounded-lg p-3">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="font-medium">${product.name}</p>
              <p class="text-sm text-slate-500">כמות: ${item.qty}</p>
              <p class="text-sm text-slate-500">${formatCurrency(lineTotal)}</p>
            </div>
            <button data-remove-from-cart="${product.id}" class="text-xs text-red-600 hover:text-red-700">הסר</button>
          </div>
        </div>
      `;
    })
    .join('');

  els.cartTotal.textContent = formatCurrency(total);
  els.cartCount.textContent = String(count);
}

function openCart() {
  els.cartDrawer.classList.remove('-translate-x-full');
  els.overlay.classList.remove('hidden');
}

function closeCart() {
  els.cartDrawer.classList.add('-translate-x-full');
  els.overlay.classList.add('hidden');
}

function onFilterChange() {
  renderProducts(getFilteredProducts());
}

function bindEvents() {
  els.searchInput.addEventListener('input', onFilterChange);
  els.colorFilter.addEventListener('change', onFilterChange);
  els.sizeFilter.addEventListener('change', onFilterChange);

  els.grid.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-add-to-cart]');
    if (!btn) return;
    addToCart(btn.dataset.addToCart);
  });

  els.cartItems.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-remove-from-cart]');
    if (!btn) return;
    removeFromCart(btn.dataset.removeFromCart);
  });

  els.cartToggle.addEventListener('click', openCart);
  els.cartClose.addEventListener('click', closeCart);
  els.overlay.addEventListener('click', closeCart);
}

function init() {
  populateFilters();
  renderProducts(products);
  renderCart();
  bindEvents();
}

init();
