'use strict';
(() => {
  const page = document.querySelector('#productPage');
  if (!page) return;
  const params = new URLSearchParams(location.search), id = params.get('id');
  const p = Object.hasOwn(PRODUCTS,id) ? PRODUCTS[id] : null;
  const e = Store.escape, money = Store.money;
  if (!p) { page.innerHTML = '<h1>Product not found</h1><a class="btn btn-dark" href="shop.html">Continue Shopping</a>'; return; }
  document.title = p.name + ' — Zurane';
  const category = CATEGORIES.find(c => c.id === p.category);
  const related = Object.values(PRODUCTS).filter(other => other.id !== id).sort((a,b) => Number(b.category === p.category) - Number(a.category === p.category) || a.featuredRank - b.featuredRank).slice(0,4);
  page.innerHTML = `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="index.html">Home</a><span>/</span><a href="shop.html">Shop</a><span>/</span><a href="shop.html?category=${p.category}">${e(category.name)}</a></nav>
    <div class="product-layout"><section class="product-gallery" aria-label="Product images">
      <div class="gallery-stage"><button class="gallery-zoom" aria-label="Enlarge ${e(p.name)} image"><img id="galleryImage" src="${p.images[0]}" alt="${e(p.name)}" class="product-detail-image"></button>
      ${p.images.length > 1 ? '<button class="gallery-arrow gallery-prev" aria-label="Previous image">‹</button><button class="gallery-arrow gallery-next" aria-label="Next image">›</button>' : ''}</div>
      <div class="gallery-thumbnails">${p.images.map((image,i) => `<button aria-label="View image ${i+1}" aria-pressed="${i === 0}" data-image="${i}"><img src="${image}" alt="${e(p.name)} view ${i+1}"></button>`).join('')}</div>
      <p class="muted gallery-hint">Tap image to enlarge</p></section>
    <section class="product-details" aria-label="Product details"><p class="section-eyebrow">Zurane</p><h1>${e(p.name)}</h1>
      <div class="detail-price">${p.isSale ? `<del>${money(p.price)}</del>` : ''}<span>${money(p.raw)}</span>${p.isSale ? `<span class="detail-discount">${e(p.badge)}</span>` : ''}</div>
      <p class="muted">Shipping calculated at checkout.</p><p class="availability" id="availability" role="status">${Object.values(p.stock).some(stock => stock > 0) ? 'Available sizes below' : 'Out of stock'}${p.inventoryIsDemo ? ' · Demo inventory' : ''}</p>
      <form id="productForm"><fieldset class="size-options"><legend>Size</legend>${p.sizes.map(size => `<label class="size-option"><input type="radio" name="size" value="${e(size)}" required ${p.stock[size] > 0 ? '' : 'disabled'} ${p.sizes.length === 1 && p.stock[size] > 0 ? 'checked' : ''}><span>${e(size)}</span></label>`).join('')}</fieldset>
      ${p.colors.length ? `<label class="field product-color">Color<select name="variant">${p.colors.map(c => `<option>${e(c.name)}</option>`).join('')}</select></label>` : ''}
      <label for="productQuantity" class="quantity-label">Quantity</label><div class="quantity-control product-quantity"><button type="button" data-step="-1" aria-label="Decrease quantity">−</button><input id="productQuantity" type="number" name="quantity" value="1" min="1" max="99" step="1" required aria-label="Quantity"><button type="button" data-step="1" aria-label="Increase quantity">+</button></div>
      <p id="productError" class="form-error" role="alert"></p><div class="purchase-actions"><button class="btn btn-dark" type="submit" value="add" ${Object.values(p.stock).some(stock => stock > 0) ? '' : 'disabled'}>Add to Cart</button><button class="btn btn-dark" type="submit" value="buy" ${Object.values(p.stock).some(stock => stock > 0) ? '' : 'disabled'}>Buy Now</button></div></form>
      <div class="product-accordions"><details open><summary>Description</summary><p>${e(p.description)}</p><dl><dt>Category</dt><dd>${e(category.name)}</dd>${p.fabric ? `<dt>Fabric</dt><dd>${e(p.fabric)}</dd>` : ''}<dt>Product code</dt><dd>ZUR-${e(id.toUpperCase())}</dd></dl></details>
      <details><summary>Shipping information</summary><p>Delivery within Pakistan. Free shipping on orders above PKR 5,000; otherwise ${money(Store.SHIPPING.fee)}. The final total is shown before you place an order.</p></details>
      <details><summary>Size &amp; product notes</summary><p>${p.sizes[0] === 'Unstitched' ? 'This product is listed as unstitched.' : 'Select your size before adding to your bag. Confirm garment measurements with the store before ordering.'}</p>${p.inventoryIsDemo ? '<p>Sizes and stock shown are demonstration values and have not been verified by the store.</p>' : ''}<p>Colors may appear different depending on your screen. Only supplied product photography is shown.</p></details></div>
    </section></div><section class="related-products"><h2>Related products</h2><div class="products-grid related-grid">${Catalog.cards(related)}</div></section>
    <dialog class="image-dialog" aria-label="Enlarged product image"><button class="dialog-close" aria-label="Close enlarged image">×</button><img src="${p.images[0]}" alt="${e(p.name)}"></dialog>`;
  const form = page.querySelector('#productForm'), quantity = form.elements.quantity;
  let imageIndex = 0;
  const dialog = page.querySelector('.image-dialog');
  function selectImage(index) {
    imageIndex = (index + p.images.length) % p.images.length;
    page.querySelector('#galleryImage').src = p.images[imageIndex];
    dialog.querySelector('img').src = p.images[imageIndex];
    page.querySelectorAll('[data-image]').forEach(button => button.setAttribute('aria-pressed',String(Number(button.dataset.image) === imageIndex)));
  }
  page.querySelectorAll('[data-image]').forEach(button => button.addEventListener('click', () => selectImage(Number(button.dataset.image))));
  page.querySelector('.gallery-prev')?.addEventListener('click', () => selectImage(imageIndex-1));
  page.querySelector('.gallery-next')?.addEventListener('click', () => selectImage(imageIndex+1));
  page.querySelector('.gallery-zoom').addEventListener('click', () => dialog.showModal());
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  let touchX;
  page.querySelector('.gallery-stage').addEventListener('touchstart', event => { touchX = event.changedTouches[0].clientX; }, {passive:true});
  page.querySelector('.gallery-stage').addEventListener('touchend', event => { const delta = touchX - event.changedTouches[0].clientX; if (Math.abs(delta) > 50) selectImage(imageIndex + (delta > 0 ? 1 : -1)); }, {passive:true});
  function updateAvailability() {
    const size = new FormData(form).get('size');
    const count = size ? Store.stockLimit(id,size) : 99;
    quantity.max = count;
    if (Number(quantity.value) > count) quantity.value = Math.max(1,count);
    if (size) page.querySelector('#availability').textContent = `${count ? 'In stock' : 'Out of stock'} · ${size}${p.inventoryIsDemo ? ' · Demo inventory' : ''}`;
    page.querySelector('[data-step="-1"]').disabled = Number(quantity.value) <= 1;
    page.querySelector('[data-step="1"]').disabled = Number(quantity.value) >= count;
  }
  form.addEventListener('change', updateAvailability);
  form.addEventListener('input', () => { page.querySelector('#productError').textContent = ''; });
  page.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => {
    quantity.value = Math.max(1,Math.min(Number(quantity.max), (Number(quantity.value) || 1) + Number(button.dataset.step))); updateAvailability();
  }));
  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    if (!Store.add(id,data.get('variant') || '',Number(data.get('quantity')),data.get('size'))) {
      page.querySelector('#productError').textContent = 'Unable to add this quantity. Your bag may already contain the available stock, or browser storage is unavailable.'; return;
    }
    if (event.submitter?.value === 'buy') location.href = 'checkout.html';
    else { window.dispatchEvent(new Event('opencart')); showToast('Added to your bag'); }
  });
  updateAvailability();
})();
