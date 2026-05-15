const els = {
  grid: document.getElementById('products-grid'),
  emptyState: document.getElementById('empty-state'),
  resultsInfo: document.getElementById('results-info'),
  searchInput: document.getElementById('search-input'),
  colorFilter: document.getElementById('color-filter'),
  diameterFilter: document.getElementById('diameter-filter'),
  styleFilter: document.getElementById('style-filter'),
  sortFilter: document.getElementById('sort-filter'),
  cartItems: document.getElementById('cart-items'),
  cartTotal: document.getElementById('cart-total'),
  cartCount: document.getElementById('cart-count'),
  orderWhatsapp: document.getElementById('order-whatsapp'),
  modal: document.getElementById('image-modal'),
  modalImage: document.getElementById('modal-image'),
  modalTitle: document.getElementById('modal-title'),
  modalActions: document.getElementById('modal-actions'),
  closeModal: document.getElementById('close-modal')
};

// --- הגדרות דיסקורד (הכנס פה את הקישור שלך) ---
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1504811180689068052/gE4fSYXDPSBuOaPQ_ylbyTkIdUasbU7Quaukk06AMldAkVyOgHdtg4Tg_16V2-bMeaxK';

async function sendToDiscord(message) {
  if (!DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL.includes('YOUR_DISCORD')) return;
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message })
    });
  } catch(e) {}
}

const CART_KEY = 'srugot-cart-v2';
let cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');

const formatCurrency = (v) => new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(v);
const uniqueValues = (items, key) => [...new Set(items.map((item) => item[key]))].sort((a, b) => Number(a) - Number(b));
const asNum = (p) => Number(p.diameterCm);

function bundlePrice(totalQty) {
  if (totalQty <= 0) return 0;
  if (totalQty === 1) return 50;
  if (totalQty === 2) return 90;
  if (totalQty === 3) return 120;
  return 120 + (totalQty - 3) * 40;
}

function populateFilters() {
  const allColors = [];
  products.forEach(p => {
    if (p.color) {
      const parts = p.color.split(/ ו-| ו|,|\/| עם /).map(c => c.trim()).filter(c => c);
      parts.forEach(part => {
        // ניקח רק את המילה הראשונה כדי לאחד גוונים (לדוגמה "ירוק זית" -> "ירוק")
        const baseColor = part.split(' ')[0];
        if (baseColor) allColors.push(baseColor);
      });
    }
  });

  [...new Set(allColors)].sort((a, b) => a.localeCompare(b, 'he')).forEach((color) => {
    els.colorFilter.insertAdjacentHTML('beforeend', `<option value="${color}">${color}</option>`);
  });

  uniqueValues(products, 'diameterCm').forEach((d) => {
    els.diameterFilter.insertAdjacentHTML('beforeend', `<option value="${d}">${d} ס״מ</option>`);
  });

  [...new Set(products.map((p) => p.style))].sort((a, b) => a.localeCompare(b, 'he')).forEach((style) => {
    els.styleFilter.insertAdjacentHTML('beforeend', `<option value="${style}">${style}</option>`);
  });
}

function getSelected(selectEl) {
  return Array.from(selectEl.selectedOptions).map(opt => opt.value).filter(v => v);
}

function filteredProducts() {
  const colors = getSelected(els.colorFilter);
  const diameters = getSelected(els.diameterFilter);
  const styles = getSelected(els.styleFilter);

  let list = products.filter((p) => {
    const byColor = colors.length === 0 || colors.some(c => p.color.includes(c));
    const byDiameter = diameters.length === 0 || diameters.includes(p.diameterCm);
    const byStyle = styles.length === 0 || styles.includes(p.style);
    return byColor && byDiameter && byStyle;
  });

  list = list.sort((a, b) => els.sortFilter.value === 'diameter-asc' ? asNum(a) - asNum(b) : asNum(b) - asNum(a));
  return list;
}

function renderProducts(list) {
  els.grid.innerHTML = list.map((p) => {
    const qty = qtyInCart(p.id);
    const addButtonDisabled = !canAdd(p.id) ? 'disabled' : '';
    const addClass = canAdd(p.id) ? 'bg-slate-900 hover:bg-slate-800' : 'bg-slate-400 cursor-not-allowed';
    
    let buttonsHtml = '';
    if (qty > 0) {
      buttonsHtml = `
        <div class="mt-2 flex items-center justify-between gap-2">
          <button data-remove="${p.id}" class="flex-1 rounded-lg bg-red-100 text-red-600 py-2 text-sm font-semibold hover:bg-red-200">הסר</button>
          <span class="text-sm font-bold text-slate-700 px-1 text-center">${qty} בהזמנה</span>
          <button data-add="${p.id}" ${addButtonDisabled} class="flex-1 rounded-lg text-white py-2 text-sm font-semibold ${addClass}">הוסף עוד</button>
        </div>
      `;
    } else {
      buttonsHtml = `<button data-add="${p.id}" ${addButtonDisabled} class="mt-2 w-full rounded-lg text-white text-sm py-2 font-semibold transition-colors ${addClass}">${canAdd(p.id) ? 'הוספה להזמנה' : 'אזל מהמלאי'}</button>`;
    }

    return `
    <article class="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
      <img src="${p.image}" alt="${p.name}" data-img-id="${p.id}" class="h-40 w-full object-contain p-2 bg-slate-50 cursor-pointer hover:scale-105 transition-transform" loading="lazy">
      <div class="p-3 space-y-1">
        <h3 class="font-semibold text-sm">${p.name}</h3>
        <p class="text-xs text-slate-500">צבע: ${p.color} | סגנון: ${p.style}</p>
        <p class="text-xs text-slate-500">קוטר: ${p.diameterCm} ס״מ</p>
        <p class="text-xs text-slate-500">נותרו במלאי: ${p.stock}</p>
        <p class="text-xs text-slate-600">${p.description}</p>
        ${buttonsHtml}
      </div>
    </article>
    `;
  }).join('');

  els.resultsInfo.textContent = `מציג ${list.length} מתוך ${products.length} כיפות סרוגות`;
  els.emptyState.classList.toggle('hidden', list.length > 0);
}

function saveCart() { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }

function qtyInCart(productId) {
  const row = cart.find((i) => i.productId === productId);
  return row ? row.qty : 0;
}

function canAdd(productId) {
  const p = products.find((x) => x.id === productId);
  return p && qtyInCart(productId) < p.stock;
}

function addToCart(productId) {
  const p = products.find((x) => x.id === productId);
  if (!p) return;
  const currentQty = qtyInCart(productId);
  if (currentQty >= p.stock) return;

  const row = cart.find((i) => i.productId === productId);
  if (row) row.qty += 1;
  else cart.push({ productId, qty: 1 });

  saveCart();
  renderProducts(filteredProducts());
  renderCart();
  if (!els.modal.classList.contains('hidden') && els.modalImage.src.includes(productId)) {
    updateModalButtons(productId);
  }

  // Track add to cart via Discord
  sendToDiscord(`🛒 **הוספה לסל!** מישהו הרגע הוסיף את "${p.name}" (קוטר: ${p.diameterCm} ס"מ) לסל שלו!`);
}
function removeFromCart(productId) {
  cart = cart.filter((i) => i.productId !== productId);
  saveCart();
  renderProducts(filteredProducts());
  renderCart();
  if (!els.modal.classList.contains('hidden') && els.modalImage.src.includes(productId)) {
    updateModalButtons(productId);
  }
}

function renderCart() {
  const qty = cart.reduce((sum, i) => sum + i.qty, 0);
  const total = bundlePrice(qty);

  if (!cart.length) {
    els.cartItems.innerHTML = '<p class="text-sm text-slate-500">עדיין לא בחרת כיפות.</p>';
  } else {
    els.cartItems.innerHTML = cart.map((i) => {
      const p = products.find((x) => x.id === i.productId);
      return `<div class="flex items-center justify-between border rounded-lg p-2"><div><p class="text-sm font-medium">${p.name}</p><p class="text-xs text-slate-500">כמות: ${i.qty} מתוך ${p.stock}</p></div><button data-remove="${p.id}" class="text-xs text-red-600">הסר</button></div>`;
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
  
  // Initialize TomSelect for multi-select premium UI
  const tsConfig = {
    plugins: ['remove_button'],
    maxItems: null,
    hidePlaceholder: true,
    render: {
      item: function(data, escape) { return '<div>' + escape(data.text) + '</div>'; }
    }
  };
  
  new TomSelect(els.colorFilter, tsConfig);
  new TomSelect(els.diameterFilter, tsConfig);
  new TomSelect(els.styleFilter, tsConfig);

  renderProducts(filteredProducts());
  renderCart();

  const update = () => renderProducts(filteredProducts());
  [els.colorFilter, els.diameterFilter, els.styleFilter, els.sortFilter].forEach((el) => {
    if (el) el.addEventListener('change', update);
  });

  els.grid.addEventListener('click', (e) => { 
    const addBtn = e.target.closest('[data-add]'); 
    if (addBtn) addToCart(addBtn.dataset.add); 
    const rmBtn = e.target.closest('[data-remove]');
    if (rmBtn) removeFromCart(rmBtn.dataset.remove);
    const imgBtn = e.target.closest('[data-img-id]');
    if (imgBtn) openImageModal(imgBtn.dataset.imgId);
  });
  els.cartItems.addEventListener('click', (e) => { const btn = e.target.closest('[data-remove]'); if (btn) removeFromCart(btn.dataset.remove); });

  els.modalActions.addEventListener('click', (e) => {
    const addBtn = e.target.closest('[data-add]');
    if (addBtn) {
      e.preventDefault();
      e.stopPropagation();
      addToCart(addBtn.dataset.add);
    }
    const rmBtn = e.target.closest('[data-remove]');
    if (rmBtn) {
      e.preventDefault();
      e.stopPropagation();
      removeFromCart(rmBtn.dataset.remove);
    }
  });

  // Modal close handlers
  els.closeModal.addEventListener('click', () => els.modal.classList.add('hidden'));
  els.modal.addEventListener('click', (e) => {
    if (e.target.id === 'image-modal') els.modal.classList.add('hidden');
  });
}

function updateModalButtons(id) {
  const p = products.find((x) => x.id === id);
  if (!p) return;
  const qty = qtyInCart(p.id);
  const addButtonDisabled = !canAdd(p.id) ? 'disabled' : '';
  const addClass = canAdd(p.id) ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-500 cursor-not-allowed';
  
  if (qty > 0) {
    els.modalActions.innerHTML = `
      <div class="flex items-center gap-3 bg-white px-3 py-1 rounded-lg">
        <button data-remove="${p.id}" class="text-red-500 font-bold px-2 py-1 hover:bg-red-50 rounded">- הסר</button>
        <span class="font-bold text-slate-800">${qty} בסל</span>
        <button data-add="${p.id}" ${addButtonDisabled} class="text-emerald-600 font-bold px-2 py-1 hover:bg-emerald-50 rounded">+ הוסף עוד</button>
      </div>
    `;
  } else {
    els.modalActions.innerHTML = `<button data-add="${p.id}" ${addButtonDisabled} class="px-6 py-2 rounded-lg text-white font-bold transition-colors ${addClass}">${canAdd(p.id) ? 'הוסף לסל עכשיו' : 'אזל מהמלאי'}</button>`;
  }
}

function openImageModal(id) {
  const p = products.find((x) => x.id === id);
  if (!p) return;
  els.modalImage.src = p.image;
  els.modalTitle.textContent = p.name;
  updateModalButtons(id);
  els.modal.classList.remove('hidden');

  // Track click via Discord
  sendToDiscord(`🔍 **צפייה קרובה!** מישהו הגדיל עכשיו את התמונה של "${p.name}"`);
}

// Track page visit via Discord
sendToDiscord(`👀 **כניסה חדשה!** מישהו נכנס הרגע לאתר שלך!`);

init();
