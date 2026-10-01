'use strict';
// Local prototype only. Replace order creation with a server endpoint before launch.
window.Store = (() => {
  const CART_KEY = 'Zurane_cart';
  const SHIPPING = { fee: 250, freeAbove: 5000 }; // Configurable PKR delivery rate.
  // Preserve existing shoppers' carts, wishlists and orders after the rebrand.
  for (const suffix of ['cart', 'wish', 'orders']) {
    try {
      const key = 'Zurane_' + suffix;
      const legacy = localStorage.getItem('Salman_' + suffix);
      if (localStorage.getItem(key) === null && legacy !== null) localStorage.setItem(key, legacy);
    } catch { /* A storage failure is reported if the user tries to save. */ }
  }
  function read(key, fallback) {
    try { const value = JSON.parse(localStorage.getItem(key)); return Array.isArray(fallback) ? (Array.isArray(value) ? value : fallback) : (value ?? fallback); }
    catch { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { return false; }
  }
  function normalize(items) {
    const result = [];
    if (!Array.isArray(items)) return result;
    for (const item of items) {
      if (!item || !Object.hasOwn(PRODUCTS, String(item.id))) continue;
      const id = String(item.id), product = PRODUCTS[id];
      if (!Number.isInteger(item.qty) || item.qty < 1) continue;
      const variant = product.colors.some(c => c.name === item.variant) ? item.variant : (product.colors[0]?.name || '');
      const size = product.sizes.includes(item.size) ? item.size : product.sizes.find(s => product.stock[s] > 0);
      if (!size) continue;
      const existing = result.find(row => row.id === id && row.variant === variant && row.size === size);
      if (existing) existing.qty = Math.min(99, existing.qty + item.qty);
      else result.push({ id, variant, size, qty: Math.min(99, item.qty) });
    }
    return result;
  }
  function readCart() { return normalize(read(CART_KEY, [])); }
  function totals(cart) {
    const subtotal = cart.reduce((sum, row) => sum + PRODUCTS[row.id].raw * row.qty, 0);
    const count = cart.reduce((sum, row) => sum + row.qty, 0);
    const shipping = subtotal && subtotal <= SHIPPING.freeAbove ? SHIPPING.fee : 0;
    return { subtotal, count, shipping, total: subtotal + shipping };
  }
  function saveCart(cart) {
    const ok = write(CART_KEY, normalize(cart));
    if (ok) window.dispatchEvent(new Event('cartchange'));
    return ok;
  }
  function stockLimit(id, size) { return Math.min(99, PRODUCTS[id]?.stock[size] || 0); }
  function stockIssues(cart) {
    return cart.filter(row => cart.filter(other => other.id === row.id && other.size === row.size).reduce((sum, item) => sum + item.qty, 0) > stockLimit(row.id, row.size));
  }
  function add(id, variant = '', qty = 1, size = '') {
    if (!Object.hasOwn(PRODUCTS, id) || !Number.isInteger(qty) || qty < 1 || qty > 99) return false;
    const product = PRODUCTS[id];
    if (!product.sizes.includes(size)) return false;
    variant = product.colors.some(c => c.name === variant) ? variant : (product.colors[0]?.name || '');
    const cart = readCart();
    const row = cart.find(item => item.id === id && item.variant === variant && item.size === size);
    const reserved = cart.filter(item => item.id === id && item.size === size).reduce((sum,item) => sum + item.qty, 0);
    if (reserved + qty > stockLimit(id, size)) return false;
    if (row) row.qty += qty; else cart.push({ id, variant, size, qty });
    return saveCart(cart);
  }
  return { read, write, readCart, saveCart, add, totals, normalize, stockLimit, stockIssues, SHIPPING,
    money: value => 'PKR ' + value.toLocaleString('en-PK'),
    escape: value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])) };
})();
