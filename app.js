const els = {
  grid: document.getElementById('products-grid'),
  emptyState: document.getElementById('empty-state'),
  resultsInfo: document.getElementById('results-info'),
  searchInput: document.getElementById('search-input'),
  colorFilter: document.getElementById('color-filter'),
  diameterFilter: document.getElementById('diameter-filter'),
  cartItems: document.getElementById('cart-items'),
  cartTotal: document.getElementById('cart-total'),
  cartCount: document.getElementById('cart-count'),
  orderWhatsapp: document.getElementById('order-whatsapp')
};

const CART_KEY = 'srugot-cart-v2';
let cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');

const formatCurrency = (v) => new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(v);

const uniqueValues = (items, key) => [...new Set(items.map((item) => item[key]))].sort((a, b) => Number(a) - Number(b));

function bundlePrice(totalQty) {
  if (totalQty <= 0) return 0;
  if (totalQty === 1) return 50;
  if (totalQty === 2) return 90;
  if (totalQty === 3) return 120;
  return 120 + (totalQty - 3) * 40;
}

function populateFilters() {
  [...new Set(products.map((p) => p.color))].sort((a, b) => a.localeCompare(b, 'he')).forEach((color) => {
    els.colorFilter.insertAdjacentHTML('beforeend', `<option value="${color}">${color}</option>`);
  });

  uniqueValues(products, 'diameterCm').forEach((d) => {
    els.diameterFilter.insertAdjacentHTML('beforeend', `<option value="${d}">${d} ס״מ</option>`);
  });
}

function filteredProducts() {
  const term = els.searchInput.value.trim().toLowerCase();
  const color = els.colorFilter.value;
  const diameter = els.diameterFilter.value;

  return products.filter((p) => {
    const byName = !term || p.name.toLowerCase().includes(term);
    const byColor = !color || p.color === color;
    const byDiameter = !diameter || p.diameterCm === diameter;
    return byName && byColor && byDiameter;
  });
}

function renderProducts(list) {
  els.grid.innerHTML = list.map((p) => `
    <article class="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
      <img src="${p.image}" alt="${p.name}" class="h-36 w-full object-cover" loading="lazy">
      <div class="p-3 space-y-1">
        <h3 class="font-semibold text-sm">${p.name}</h3>
        <p class="text-xs text-slate-500">צבע: ${p.color} | קוטר: ${p.diameterCm} ס״מ</p>
        <p class="text-xs text-slate-600">${p.description}</p>
        <button data-add="${p.id}" class="mt-2 w-full rounded-lg bg-slate-900 text-white text-sm py-2">הוספה להזמנה</button>
      </div>
    </article>
  `).join('');

  els.resultsInfo.textContent = `מציג ${list.length} מתוך ${products.length} כיפות סרוגות`;
  els.emptyState.classList.toggle('hidden', list.length > 0);
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(productId) {
  const row = cart.find((i) => i.productId === productId);
  if (row) row.qty += 1;
  else cart.push({ productId, qty: 1 });
  saveCart();
  renderCart();
}

function removeFromCart(productId) {
  cart = cart.filter((i) => i.productId !== productId);
  saveCart();
  renderCart();
}

function renderCart() {
  const qty = cart.reduce((sum, i) => sum + i.qty, 0);
  const total = bundlePrice(qty);

  if (!cart.length) {
    els.cartItems.innerHTML = '<p class="text-sm text-slate-500">עדיין לא בחרת כיפות.</p>';
  } else {
    els.cartItems.innerHTML = cart.map((i) => {
      const p = products.find((x) => x.id === i.productId);
      return `<div class="flex items-center justify-between border rounded-lg p-2"><div><p class="text-sm font-medium">${p.name}</p><p class="text-xs text-slate-500">כמות: ${i.qty}</p></div><button data-remove="${p.id}" class="text-xs text-red-600">הסר</button></div>`;
    }).join('');
  }

  els.cartCount.textContent = `${qty} פריטים`;
  els.cartTotal.textContent = formatCurrency(total);

  const lines = cart.map((i) => {
    const p = products.find((x) => x.id === i.productId);
    return `• ${p.name} - כמות ${i.qty}`;
  }).join('%0A');

  const msg = `שלום, אשמח להזמין כיפות סרוגות:%0A${lines}%0Aסה"כ פריטים: ${qty}%0Aסה"כ לתשלום: ${total} ש"ח`;
  els.orderWhatsapp.href = `https://wa.me/972559487356?text=${msg}`;
}

function init() {
  populateFilters();
  renderProducts(products);
  renderCart();

  const update = () => renderProducts(filteredProducts());
  els.searchInput.addEventListener('input', update);
  els.colorFilter.addEventListener('change', update);
  els.diameterFilter.addEventListener('change', update);

  els.grid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-add]');
    if (btn) addToCart(btn.dataset.add);
  });

  els.cartItems.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-remove]');
    if (btn) removeFromCart(btn.dataset.remove);
  });
}

init();
