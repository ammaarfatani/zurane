'use strict';
window.Catalog = (() => {
  const e = Store.escape;
  function inCategory(product, category) { return !category || product.category === category || product.collections.includes(category); }
  function matches(product, term) {
    const words = term.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const text = [product.name,product.description,product.category,product.subcategory,product.fabric,product.gender, ...product.sizes].join(' ').toLowerCase();
    return words.every(word => text.includes(word));
  }
  function cards(products) {
    const wish = Store.read('Zurane_wish', []);
    return products.map(p => `<div class="product-card" data-product="${p.id}">
      <div class="product-img-wrap"><a href="product.html?id=${p.id}" aria-label="View ${e(p.name)}">
        <img src="${p.img}" alt="${e(p.name)}" class="product-img" loading="lazy">
        <img src="${p.images[1] || p.img}" alt="" class="product-img product-img--hover" loading="lazy"></a>
        ${p.badge ? `<div class="product-badges"><span class="badge ${p.isSale ? 'badge-sale' : 'badge-new'}">${e(p.badge)}</span></div>` : ''}
        <button class="wishlist-btn ${wish.includes(p.id) ? 'active' : ''}" aria-label="${wish.includes(p.id) ? 'Remove from' : 'Add to'} wishlist" data-id="${p.id}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></button>
        <button class="quick-add" data-id="${p.id}">${Object.values(p.stock).some(n => n > 0) ? 'Add to Cart' : 'View Product'}</button>
      </div><div class="product-info"><h3 class="product-name"><a href="product.html?id=${p.id}">${e(p.name)}</a></h3>
      <div class="product-price">${p.original ? `<span class="price-original">${e(p.original)}</span>` : ''}<span class="price-sale">${Store.money(p.raw)}</span></div>
      ${p.colors.length ? `<div class="product-colors" aria-label="Color">${p.colors.map((c,i) => `<button class="color-dot ${i === 0 ? 'active' : ''}" style="background:${c.hex}" title="${e(c.name)}" aria-label="${e(c.name)}" aria-pressed="${i === 0}" data-variant="${e(c.name)}"></button>`).join('')}</div>` : ''}
      </div></div>`).join('');
  }
  return { cards, inCategory, matches };
})();
document.querySelectorAll('[data-products]').forEach(grid => {
  grid.innerHTML = Catalog.cards(grid.dataset.products.split(',').map(id => PRODUCTS[id]));
});
