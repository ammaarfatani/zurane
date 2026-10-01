'use strict';
(() => {
  const q = s => document.querySelector(s);
  const all = s => [...document.querySelectorAll(s)];
  const e = Store.escape, money = Store.money;
  const drawer = q('#cartDrawer'), nav = q('#mobileNav'), overlay = q('#overlay');
  // Put both dialogs in the same stacking context, above the fixed header.
  [nav, overlay].forEach(el => el && document.body.append(el));
  let activePanel = null, returnFocus = null;
  function closePanel(restore = true) {
    if (!activePanel) return;
    activePanel.classList.remove('open');
    activePanel.inert = true;
    activePanel.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('visible');
    q('#navToggle').setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    activePanel = null;
    if (restore) returnFocus?.focus();
  }
  function openPanel(panel) {
    closePanel(false);
    returnFocus = document.activeElement;
    activePanel = panel;
    panel.inert = false;
    panel.setAttribute('aria-hidden', 'false');
    panel.classList.add('open');
    overlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
    q('#navToggle').setAttribute('aria-expanded', String(panel === nav));
    panel.querySelector('button, a')?.focus();
  }
  [drawer, nav].forEach(panel => {
    panel.inert = true;
    panel.setAttribute('aria-hidden', 'true');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
  });
  nav.setAttribute('aria-label', 'Navigation');
  q('#navToggle').addEventListener('click', () => openPanel(nav));
  q('#cartToggle').addEventListener('click', () => openPanel(drawer));
  q('#closeMenu').addEventListener('click', () => closePanel());
  q('#cartClose').addEventListener('click', () => closePanel());
  q('#cartContinue').addEventListener('click', () => closePanel());
  q('#cartEmpty a').href = 'shop.html';
  overlay.addEventListener('click', () => closePanel());
  document.addEventListener('keydown', event => {
    if (!activePanel) return;
    if (event.key === 'Escape') closePanel();
    if (event.key === 'Tab') {
      const elements = [...activePanel.querySelectorAll('button:not(:disabled), a[href], input, select')].filter(el => el.getClientRects().length);
      const first = elements[0], last = elements.at(-1);
      if (event.shiftKey && (document.activeElement === first || !activePanel.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && (document.activeElement === last || !activePanel.contains(document.activeElement))) { event.preventDefault(); first?.focus(); }
    }
  });
  q('.mobile-menu-list').innerHTML = `
    <li><a href="shop.html?collection=new">New Arrivals</a></li>
    <li><a href="shop.html">Shop All</a></li>
    <li><a href="shop.html?category=summer-edit">Summer Edit '26</a></li>
    <li class="has-dropdown"><div class="menu-row"><button class="category-menu-toggle" aria-expanded="false" aria-controls="categoryMenu">Shop by Category <span aria-hidden="true">+</span></button></div>
      <ul class="submenu" id="categoryMenu">${CATEGORIES.map(category => `<li><a href="shop.html?category=${category.id}">${e(category.name)}</a></li>`).join('')}</ul></li>
    <li><a href="shop.html?collection=sale">Sale</a></li>`;
  q('.category-menu-toggle').addEventListener('click', event => {
    const button = event.currentTarget;
    button.setAttribute('aria-expanded', String(button.closest('.has-dropdown').classList.toggle('active')));
  });
  all('.mobile-menu-list a').forEach(link => link.addEventListener('click', () => closePanel()));
  all('.collection-card').forEach(link => link.href = 'shop.html?category=summer-edit');
  all('.section-cta a').forEach(link => link.href = 'shop.html?collection=best');
  const footerLinks = { 'New Arrivals':'shop.html?collection=new', 'Collections':'shop.html', 'Sale':'shop.html?collection=sale', 'Bridal Couture':'shop.html?category=formals' };
  all('.footer-links a').forEach(link => { if (footerLinks[link.textContent]) link.href = footerLinks[link.textContent]; });
  all('.logo, .footer-logo').forEach(link => link.href = 'index.html');

  function summary(cart) {
    const t = Store.totals(cart);
    return `<div class="summary-row"><span>Total items</span><span>${t.count}</span></div>
      <div class="summary-row"><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
      <div class="summary-row"><span>Shipping</span><span>${t.shipping ? money(t.shipping) : 'Free'}</span></div>
      <div class="summary-row summary-total"><strong>Grand total</strong><strong>${money(t.total)}</strong></div>`;
  }
  function itemMarkup(cart, controls = false) {
    return cart.map((row,index) => {
      const p = PRODUCTS[row.id];
      return `<div class="cart-item"><img class="cart-item-img" src="${p.img}" alt="${e(p.name)}">
        <div class="cart-item-info"><a class="cart-item-name" href="product.html?id=${row.id}">${e(p.name)}</a>
        <p class="muted">Size: ${e(row.size)}</p>${row.variant ? `<p class="muted">Color: ${e(row.variant)}</p>` : ''}
        <p class="cart-item-price">${money(p.raw)} each</p>
        ${controls ? `<div class="quantity-control"><button data-quantity="${index}" data-delta="-1" aria-label="Decrease quantity of ${e(p.name)}" ${row.qty === 1 ? 'disabled' : ''}>−</button><output aria-label="Quantity">${row.qty}</output><button data-quantity="${index}" data-delta="1" aria-label="Increase quantity of ${e(p.name)}" ${cart.filter(item => item.id === row.id && item.size === row.size).reduce((sum,item) => sum + item.qty,0) >= Store.stockLimit(row.id,row.size) ? 'disabled' : ''}>+</button></div>` : `<p class="muted">Quantity: ${row.qty}</p>`}
        <p class="cart-item-price">Subtotal: ${money(p.raw * row.qty)}</p>
        ${controls ? `<button class="cart-item-remove" data-remove-item="${index}" aria-label="Remove ${e(p.name)}">Remove</button>` : ''}</div></div>`;
    }).join('');
  }
  function renderCart() {
    const cart = Store.readCart(), t = Store.totals(cart);
    q('#cartCount').textContent = t.count;
    q('#cartCount').classList.toggle('visible', t.count > 0);
    q('#cartToggle').setAttribute('aria-label', `Cart, ${t.count} items`);
    q('#cartEmpty').hidden = cart.length > 0;
    q('#cartItems').innerHTML = itemMarkup(cart, true);
    q('#cartFooter').style.display = cart.length ? '' : 'none';
    q('#cartFooter').innerHTML = summary(cart) + '<a class="btn btn-dark cart-checkout" href="checkout.html">Proceed to Checkout</a><button class="btn btn-outline cart-continue" id="cartContinue">Continue Shopping</button>';
    q('#cartContinue').addEventListener('click', () => closePanel());
    if (q('#checkoutSummary')) renderCheckoutSummary();
  }
  drawer.addEventListener('click', event => {
    const button = event.target.closest('[data-quantity], [data-remove-item]');
    if (!button) return;
    const cart = Store.readCart();
    const index = Number(button.dataset.quantity ?? button.dataset.removeItem);
    if (!cart[index]) return;
    const label = button.getAttribute('aria-label');
    if (button.hasAttribute('data-remove-item')) cart.splice(index, 1);
    else {
      const nextQty = Math.max(1, cart[index].qty + Number(button.dataset.delta));
      cart[index].qty = nextQty;
      if (Number(button.dataset.delta) > 0 && Store.stockIssues(cart).length) { showToast('The available quantity is already in your bag.'); return; }
    }
    if (!Store.saveCart(cart)) showToast('Unable to save your bag. Please enable browser storage.');
    const next = [...drawer.querySelectorAll('button')].find(b => b.getAttribute('aria-label') === label && !b.disabled);
    (next || q('#cartClose')).focus();
  });
  window.addEventListener('cartchange', renderCart);
  window.addEventListener('storage', event => { if (event.key === 'Zurane_cart' || event.key === null) renderCart(); });
  renderCart();

  const quickDialog = document.createElement('dialog');
  quickDialog.className = 'quick-dialog';
  quickDialog.setAttribute('aria-label', 'Choose product options');
  document.body.append(quickDialog);
  function openQuickAdd(id, variant) {
    const p = PRODUCTS[id];
    quickDialog.innerHTML = `<button class="dialog-close" type="button" aria-label="Close product options">×</button>
      <h2>${e(p.name)}</h2><p>${money(p.raw)}</p><form id="quickForm">
      <fieldset class="size-options"><legend>Choose size</legend>${p.sizes.map(size => `<label class="size-option"><input type="radio" name="size" value="${e(size)}" required ${p.stock[size] ? '' : 'disabled'} ${p.sizes.length === 1 && p.stock[size] ? 'checked' : ''}><span>${e(size)}</span></label>`).join('')}</fieldset>
      ${p.colors.length ? `<label class="field">Color<select name="variant">${p.colors.map(c => `<option ${c.name === variant ? 'selected' : ''}>${e(c.name)}</option>`).join('')}</select></label>` : ''}
      <p class="muted">${p.inventoryIsDemo ? 'Demo inventory — availability is not verified.' : 'Choose an available size.'}</p>
      <p class="form-error" role="alert"></p><button class="btn btn-dark" type="submit">Add to Cart</button>
      <a class="link-underline" href="product.html?id=${id}">View product details</a></form>`;
    quickDialog.querySelector('.dialog-close').addEventListener('click', () => quickDialog.close());
    quickDialog.querySelector('form').addEventListener('submit', event => {
      event.preventDefault();
      const data = new FormData(event.target);
      if (Store.add(id, data.get('variant') || '', 1, data.get('size'))) {
        quickDialog.close(); openPanel(drawer); showToast('Added to your bag');
      } else quickDialog.querySelector('.form-error').textContent = 'Unable to add this item. Check the available quantity and browser storage.';
    });
    quickDialog.showModal();
  }
  window.addEventListener('opencart', () => openPanel(drawer));
  document.addEventListener('click', event => {
    const dot = event.target.closest('.color-dot');
    if (dot) {
      dot.parentElement.querySelectorAll('.color-dot').forEach(d => {
        d.classList.toggle('active', d === dot); d.setAttribute('aria-pressed', String(d === dot));
      });
    }
    const add = event.target.closest('.quick-add');
    if (!add) return;
    const variant = add.closest('.product-card').querySelector('.color-dot.active')?.dataset.variant || '';
    openQuickAdd(add.dataset.id, variant);

  });

  // Preserve the existing look carousel, scoped so it cannot modify product grids.
  if (q('.shop-look')) {
    let current = 0;
    const ids = ['look1', 'look2'];
    function renderLook(index) {
      current = (index + ids.length) % ids.length;
      const id = ids[current], p = PRODUCTS[id];
      all('.shop-look .main-look img, .shop-look .product-card img').forEach(img => { img.src = p.img; img.alt = p.name; });
      q('.shop-look h4').textContent = p.name;
      q('.shop-look .product-info p').textContent = money(p.raw);
      q('.shop-look .view-btn').href = `product.html?id=${id}`;
      all('.shop-look .dots button').forEach((button,i) => { button.classList.toggle('active', current === i); button.setAttribute('aria-pressed', String(current === i)); });
    }
    q('.shop-look .next').addEventListener('click', () => renderLook(current + 1));
    q('.shop-look .prev').addEventListener('click', () => renderLook(current - 1));
    all('.shop-look .dots button').forEach((button,i) => button.addEventListener('click', () => renderLook(i)));
    all('.shop-look .hotspot').forEach((button,i) => button.addEventListener('click', () => { location.href = `product.html?id=${ids[i]}`; }));
    renderLook(0);
  }
  const heroImage = q('.hero-img');
  if (heroImage) {
    const sizeHero = () => { if (heroImage.naturalWidth) q('.hero').style.setProperty('--hero-ratio', `${heroImage.naturalWidth} / ${heroImage.naturalHeight}`); };
    heroImage.addEventListener('load', sizeHero); sizeHero();
  }
  q('#searchInput')?.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    const term = event.target.value.trim().toLowerCase();
    if (!term) return;
    location.href = 'shop.html?q=' + encodeURIComponent(term);
  });

  function emptyPage(title) { return `<div class="empty-page"><h1>${title}</h1><a class="btn btn-dark" href="shop.html">Continue Shopping</a></div>`; }
  function renderCheckoutSummary() {
    const cart = Store.readCart();
    q('#checkoutSummary').innerHTML = cart.length ? '<h2>Order summary</h2>' + itemMarkup(cart) + summary(cart) : '<h2>Your bag is empty</h2><a href="shop.html" class="link-underline">Continue Shopping</a>';
    if (q('#placeOrder')) q('#placeOrder').disabled = cart.length === 0;
  }
  const checkoutPage = q('#checkoutPage');
  if (checkoutPage) {
    if (!Store.readCart().length) checkoutPage.innerHTML = emptyPage('Your bag is empty');
    else {
      const field = (name,label,type,autocomplete,extra='') => `<label class="field ${name === 'address' ? 'field-wide' : ''}">${label}<input name="${name}" type="${type}" autocomplete="${autocomplete}" required maxlength="${name === 'address' ? 200 : 100}" ${extra}></label>`;
      checkoutPage.innerHTML = `<a href="shop.html" class="link-underline">Continue Shopping</a><h1>Checkout</h1><div class="commerce-layout">
        <form class="checkout-form" id="checkoutForm"><fieldset><legend>Customer information</legend><div class="form-grid">
          ${field('name','Full Name','text','name','minlength="2"')}${field('email','Email','email','email')}${field('phone','Phone Number','tel','tel','inputmode="tel" pattern="[+0-9 ()-]{7,20}"')}
        </div></fieldset><fieldset><legend>Shipping information</legend><div class="form-grid">
          ${field('address','Address','text','street-address','minlength="5"')}${field('city','City','text','address-level2')}${field('area','Area','text','address-level3')}${field('postal','Postal Code','text','postal-code','inputmode="numeric" pattern="[0-9]{5}" title="Enter a five-digit Pakistan postal code"')}
        </div><p class="muted">Delivery within Pakistan.</p></fieldset><fieldset><legend>Payment</legend>
        <label class="payment-option"><input type="radio" name="payment" value="cod" checked required>Cash on Delivery</label>
        <label class="payment-option muted"><input type="radio" name="payment" value="online" disabled>Online Payment — not connected yet</label></fieldset>
        <p class="muted">This store currently saves orders on this device only. Orders are not sent to the store and no payment is collected.</p>
        <p id="checkoutError" class="form-error" role="alert"></p><button id="placeOrder" class="btn btn-dark" type="submit">Place local order</button></form>
        <aside class="commerce-panel" id="checkoutSummary" aria-label="Order summary"></aside></div>`;
      renderCheckoutSummary();
      const form = q('#checkoutForm');
      form.addEventListener('input', event => event.target.setCustomValidity?.(''));
      let submitting = false;
      form.addEventListener('submit', event => {
        event.preventDefault();
        if (submitting) return;
        const customer = Object.fromEntries(new FormData(form));
        for (const input of form.querySelectorAll('input[required]:not([type="radio"])')) {
          input.value = input.value.trim(); customer[input.name] = input.value;
          input.setCustomValidity(input.value ? '' : 'Please enter ' + input.parentElement.firstChild.textContent.toLowerCase() + '.');
        }
        const phone = customer.phone.replace(/\D/g, '');
        form.elements.phone.setCustomValidity(phone.length >= 7 && phone.length <= 15 ? '' : 'Enter a valid phone number with 7–15 digits.');
        if (!form.reportValidity()) return;
        const cart = Store.readCart();
        if (!cart.length) { renderCheckoutSummary(); return; }
        if (Store.stockIssues(cart).length) { q('#checkoutError').textContent = 'Some quantities exceed availability. Please update your bag before placing this order.'; return; }
        if (customer.payment !== 'cod') { q('#checkoutError').textContent = 'Online payment is not available.'; return; }
        submitting = true; q('#placeOrder').disabled = true;
        const order = { number: 'ZUR-' + crypto.randomUUID().slice(0,8).toUpperCase(), createdAt: new Date().toISOString(), customer,
          items: cart.map(row => ({ ...row, name: PRODUCTS[row.id].name, img: PRODUCTS[row.id].img, raw: PRODUCTS[row.id].raw })),
          ...Store.totals(cart), payment: 'Cash on Delivery', status: 'Saved locally; not submitted to the store' };
        const orders = Store.read('Zurane_orders', []);
        if (!Store.write('Zurane_orders', [...orders, order])) {
          q('#checkoutError').textContent = 'Your order could not be saved. Please enable browser storage or free up space. Your bag has been kept.';
          submitting = false; q('#placeOrder').disabled = false; return;
        }
        Store.saveCart([]);
        location.replace('confirmation.html?order=' + encodeURIComponent(order.number));
      });
    }
  }
  const confirmationPage = q('#confirmationPage');
  if (confirmationPage) {
    const number = new URLSearchParams(location.search).get('order');
    const order = Store.read('Zurane_orders', []).find(order => order && order.number === number);
    if (!order || !Array.isArray(order.items) || !order.customer) confirmationPage.innerHTML = emptyPage('Order not found on this device');
    else {
      const c = order.customer;
      confirmationPage.innerHTML = `<p class="section-eyebrow">Zurane</p><h1>Thank you, ${e(c.name)}.</h1><p>Your order has been saved on this device.</p>
        <p class="muted">It has not been sent to the store. No payment has been collected.</p><div class="commerce-layout" style="margin-top:28px"><div>
        <dl class="confirmation-details"><dt>Order number</dt><dd>${e(order.number)}</dd><dt>Delivery to</dt><dd>${e(c.name)}<br>${e(c.address)}<br>${e(c.area)}, ${e(c.city)}, ${e(c.postal)}<br>Pakistan</dd><dt>Contact</dt><dd>${e(c.email)}<br>${e(c.phone)}</dd><dt>Payment method</dt><dd>Cash on Delivery — unpaid</dd><dt>Delivery status</dt><dd>Not scheduled. A delivery date requires confirmation from the store.</dd></dl><a class="btn btn-dark" href="shop.html">Continue Shopping</a></div>
        <aside class="commerce-panel"><h2>Ordered products</h2>${order.items.map(item => `<div class="cart-item"><img class="cart-item-img" src="${e(item.img)}" alt="${e(item.name)}"><div class="cart-item-info"><p>${e(item.name)}</p><p class="muted">Size: ${e(item.size || 'Not recorded')} · ${item.variant ? e(item.variant) + ' · ' : ''}Quantity: ${e(item.qty)}</p><p>${money(Number(item.raw) * Number(item.qty))}</p></div></div>`).join('')}
        <div class="summary-row"><span>Subtotal</span><span>${money(Number(order.subtotal))}</span></div><div class="summary-row"><span>Shipping</span><span>${order.shipping ? money(Number(order.shipping)) : 'Free'}</span></div><div class="summary-row summary-total"><strong>Total</strong><strong>${money(Number(order.total))}</strong></div></aside></div>`;
    }
  }
})();
