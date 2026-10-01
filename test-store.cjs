// Dependency-free local integration test using an isolated headless Edge profile.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const root = __dirname;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const artifactDir = path.join(root, '.qa');
fs.mkdirSync(artifactDir, { recursive: true });
const server = http.createServer((req, res) => {
  const filename = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!filename.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(filename, (error, data) => {
    if (error) { res.writeHead(404).end(); return; }
    const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.webp':'image/webp' };
    res.setHeader('Content-Type', types[path.extname(filename)] || 'application/octet-stream'); res.end(data);
  });
});
let browser, socket;
const errors = [], results = [];
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=9337', '--remote-allow-origins=*',
    `--user-data-dir=${path.join(artifactDir, 'browser-profile')}`, 'about:blank'
  ], { windowsHide: true, stdio: 'ignore' });
  let targets;
  for (let i = 0; i < 100; i++) {
    try { targets = await (await fetch('http://127.0.0.1:9337/json')).json(); if (targets.some(t => t.type === 'page')) break; } catch {}
    await delay(100);
  }
  assert(targets, 'Headless browser did not start');
  socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise(resolve => socket.addEventListener('open', resolve, {once:true}));
  let sequence = 0; const pending = new Map();
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) { const task = pending.get(message.id); pending.delete(message.id); message.error ? task.reject(message.error) : task.resolve(message.result); }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
  });
  const call = (method, params = {}) => new Promise((resolve,reject) => { const id = ++sequence; pending.set(id,{resolve,reject}); socket.send(JSON.stringify({id,method,params})); });
  const evaluate = async expression => {
    const response = await call('Runtime.evaluate', {expression, returnByValue:true, awaitPromise:true});
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || 'Evaluation failed');
    return response.result.value;
  };
  await call('Runtime.enable'); await call('Page.enable');
  const navigate = async page => {
    await call('Page.navigate', {url:origin+'/'+page});
    for (let i=0;i<100;i++) {
      await delay(50);
      if (await evaluate(`location.href.includes(${JSON.stringify(page)}) && document.readyState === 'complete' && typeof Store !== 'undefined'`)) return;
    }
    throw new Error('Page did not load: '+page);
  };
  const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  const screenshot = async name => {
    // Scroll to trigger the site's existing reveal and lazy-image behavior.
    const height = await evaluate('document.documentElement.scrollHeight');
    for (let y=0;y<height;y+=700) { await evaluate(`window.scrollTo({top:${y},behavior:'instant'})`); await delay(80); }
    await evaluate("window.scrollTo({top:0,behavior:'instant'})"); await delay(500);
    const shot = await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
    fs.writeFileSync(path.join(artifactDir,name+'.png'),Buffer.from(shot.data,'base64'));
    const viewport = await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
    fs.writeFileSync(path.join(artifactDir,name+'-viewport.png'),Buffer.from(viewport.data,'base64'));
  };
  const checkWidth = async (width,label) => {
    await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
    await delay(100);
    const metrics = await evaluate(`({width:innerWidth, scroll:document.documentElement.scrollWidth, offenders:[...document.querySelectorAll('body *')].filter(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return s.visibility!=='hidden'&&s.display!=='none'&&r.width&&r.right>innerWidth+1&&!el.closest('.announcement-bar,.hero,.search-bar');}).map(el=>el.className).slice(0,10)})`);
    assert(metrics.scroll <= width+1, `${label} ${width}px overflow: ${JSON.stringify(metrics)}`);
    results.push(`${label} ${width}px: no horizontal overflow`);
  };
  await navigate('index.html');
  await evaluate('localStorage.clear()'); await navigate('index.html');
  assert.equal(await evaluate("document.querySelector('.logo-text').textContent"),'ZURANE');
  assert.equal(await evaluate("document.querySelector('a[href^=\"mailto:\"]').getAttribute('href')"),'mailto:hello@zurane.com');
  await evaluate("localStorage.setItem('Salman_cart',JSON.stringify([{id:'1',qty:2}]));localStorage.setItem('Salman_wish',JSON.stringify(['1']));localStorage.setItem('Salman_orders',JSON.stringify([{number:'SAL-LEGACY'}]))");
  await navigate('index.html');
  assert.equal(await evaluate('Store.readCart()[0].qty'),2);
  assert.deepEqual(await evaluate("Store.read('Zurane_wish',[])"),['1']);
  assert.equal(await evaluate("Store.read('Zurane_orders',[])[0].number"),'SAL-LEGACY');
  await evaluate('localStorage.clear()'); await navigate('index.html');
  assert.equal(await evaluate("document.querySelectorAll('[data-product]').length"),8);
  assert.equal(await evaluate("document.querySelector('[data-product=\"1\"] img').getAttribute('src')"),'./public/summer1.webp');
  await click('.shop-look .next');
  assert.equal(await evaluate("document.querySelector('[data-product=\"1\"] img').getAttribute('src')"),'./public/summer1.webp');
  for (const width of [320,375,390,430,768,1024,1280,1920]) {
    await checkWidth(width,'Home');
    await click('#navToggle'); await checkWidth(width,'Menu'); await click('#closeMenu');
    assert.equal(await evaluate('document.body.style.overflow'),'');
  }
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
  await screenshot('home-mobile');
  await click('[data-product="8"] .quick-add');
  await click('#quickForm [name=size][value=S]');
  await evaluate("document.querySelector('#quickForm').requestSubmit()");
  assert.equal(await evaluate('Store.totals(Store.readCart()).total'),4450);
  await click('[data-quantity="0"][data-delta="1"]');
  assert.equal(await evaluate('Store.totals(Store.readCart()).total'),8400);
  await click('[data-quantity="0"][data-delta="-1"]');
  await screenshot('cart-mobile');
  for (const width of [320,375,390,430,768,1024,1280,1920]) await checkWidth(width,'Cart');
  await navigate('index.html');
  assert.equal(await evaluate("document.querySelector('#cartCount').textContent"),'1');
  await click('#cartToggle'); await click('[data-remove-item="0"]');
  assert.equal(await evaluate('Store.readCart().length'),0);

  await navigate('shop.html');
  assert.equal(await evaluate("document.querySelectorAll('#shopGrid [data-product]').length"),10);
  for (const width of [320,375,390,430,768,1024,1280,1920]) {
    await checkWidth(width,'Shop');
    await evaluate("document.querySelector('#shopFilters').classList.add('filters-open')");
    await checkWidth(width,'Expanded filters');
  }
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
  await screenshot('shop-mobile');
  await navigate('shop.html?collection=new');
  assert.deepEqual(await evaluate("[...document.querySelectorAll('#shopGrid [data-product]')].map(el=>el.dataset.product)"),['1','2','3','4']);
  await navigate('shop.html?collection=sale');
  assert.deepEqual(await evaluate("[...document.querySelectorAll('#shopGrid [data-product]')].map(el=>el.dataset.product)"),['1','2','4','6','8']);
  await navigate('shop.html?category=unstitched');
  assert.deepEqual(await evaluate("[...document.querySelectorAll('#shopGrid [data-product]')].map(el=>el.dataset.product)"),['5']);
  await navigate('shop.html?category=formals');
  assert.deepEqual(await evaluate("[...document.querySelectorAll('#shopGrid [data-product]')].map(el=>el.dataset.product)"),['2','6','7']);
  await navigate('shop.html?q=lawn');
  assert.deepEqual(await evaluate("[...document.querySelectorAll('#shopGrid [data-product]')].map(el=>el.dataset.product)"),['1','5']);
  await navigate('shop.html?q=nonexistent');
  assert.equal(await evaluate("document.querySelector('#noResults').hidden"),false);
  await navigate('shop.html?category=missing-category');
  assert.equal(await evaluate("document.querySelector('#shopTitle').textContent"),'Category not found');
  await click('#resetResults');
  assert.equal(await evaluate("document.querySelectorAll('#shopGrid [data-product]').length"),10);
  await evaluate("const form=document.querySelector('#shopFilters'); form.elements.max.value=8000; form.elements.sort.value='price-asc'; form.requestSubmit()");
  assert.deepEqual(await evaluate("[...document.querySelectorAll('#shopGrid [data-product]')].map(el=>el.dataset.product)"),['8','4','1','look1','5']);
  await navigate('shop.html?size=XS&availability=in-stock');
  assert.equal(await evaluate("document.querySelectorAll('#shopGrid [data-product]').length"),0);
  await navigate('index.html');
  await click('#navToggle'); await click('.category-menu-toggle');
  await click('#categoryMenu a[href="shop.html?category=ready-to-wear"]');
  await delay(300);
  assert.deepEqual(await evaluate("[...document.querySelectorAll('#shopGrid [data-product]')].map(el=>el.dataset.product)"),['3','4','8']);
  await click('[data-product="4"] .product-name a'); await delay(300);
  assert.equal(await evaluate("document.querySelector('#productForm').checkValidity()"),false);
  await click('[name=size][value=M]');
  await click('[data-step="1"]');
  await evaluate("document.querySelector('#productForm').requestSubmit(document.querySelector('[value=add]'))");
  assert.deepEqual(await evaluate('Store.readCart()'),[{id:'4',variant:'',size:'M',qty:2}]);
  await click('#cartClose');
  await click('[name=size][value=L]');
  await evaluate("document.querySelector('#productForm').requestSubmit(document.querySelector('[value=add]'))");
  assert.equal(await evaluate('Store.readCart().length'),2);
  await click('#cartClose'); await click('.gallery-zoom');
  assert.equal(await evaluate("document.querySelector('.image-dialog').open"),true);
  await click('.image-dialog .dialog-close');
  await screenshot('product-mobile');
  await evaluate('Store.saveCart([])');

  await navigate('product.html?id=5');
  await evaluate("document.querySelector('[name=variant]').value='Ivory';document.querySelector('[name=quantity]').value='2';document.querySelector('#productForm').requestSubmit(document.querySelector('[value=add]'))");
  assert.deepEqual(await evaluate('Store.readCart()'),[{id:'5',variant:'Ivory',size:'Unstitched',qty:2}]);
  await click('#cartClose');
  await evaluate("document.querySelector('[name=variant]').value='Rose';document.querySelector('[name=quantity]').value='1';document.querySelector('#productForm').requestSubmit(document.querySelector('[value=buy]'))");
  await delay(300);
  assert((await evaluate('location.pathname')).endsWith('checkout.html'));
  assert.equal(await evaluate('Store.readCart().length'),2);
  assert.equal(await evaluate("document.querySelector('#checkoutForm').checkValidity()"),false);
  for (const width of [320,375,390,430,768,1024,1280,1920]) await checkWidth(width,'Checkout');
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
  await screenshot('checkout-mobile');
  await evaluate(`Object.entries({name:'Test Customer',email:'test@example.com',phone:'+92 300 1234567',address:'12 Test Street',city:'Lahore',area:'Gulberg',postal:'54000'}).forEach(([name,value])=>document.querySelector('#checkoutForm').elements[name].value=value);document.querySelector('#checkoutForm').requestSubmit()`);
  await delay(300);
  assert((await evaluate('location.pathname')).endsWith('confirmation.html'));
  assert.equal(await evaluate('Store.readCart().length'),0);
  assert.equal(await evaluate("Store.read('Zurane_orders',[])[0].total"),21600);
  assert((await evaluate("Store.read('Zurane_orders',[])[0].number")).startsWith('ZUR-'));
  assert((await evaluate('document.body.innerText')).includes('No payment has been collected'));
  for (const width of [320,375,390,430,768,1024,1280,1920]) await checkWidth(width,'Confirmation');
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
  await screenshot('confirmation-mobile');
  const savedUrl = await evaluate('location.pathname.slice(1)+location.search');
  await navigate(savedUrl);
  assert((await evaluate('document.body.innerText')).includes('Test Customer'));
  await navigate('checkout.html');
  assert((await evaluate('document.body.innerText')).includes('Your bag is empty'));
  await navigate('product.html?id=unknown');
  assert((await evaluate('document.body.innerText')).includes('Product not found'));
  await navigate('product.html?id=1');
  for (const width of [320,375,390,430,768,1024,1280,1920]) await checkWidth(width,'Product');
  await evaluate("localStorage.setItem('Zurane_cart','{bad json')"); await navigate('index.html');
  assert.equal(await evaluate('Store.readCart().length'),0);
  await evaluate("localStorage.setItem('Zurane_cart',JSON.stringify([{id:'missing',qty:1},{id:'1',qty:-5},{id:'1',qty:2,rawPrice:1}]))");
  assert.equal(await evaluate('Store.totals(Store.readCart()).subtotal'),14224);
  assert.equal(await evaluate("Store.add('1','',1,'XS')"),false);
  assert.equal(await evaluate("Store.add('1','',9,'S')"),false);
  await evaluate("localStorage.clear(); Storage.prototype.setItem=function(){throw new Error('Storage unavailable')}");
  await click('[data-product="1"] .quick-add');
  await click('#quickForm [name=size][value=S]');
  await evaluate("document.querySelector('#quickForm').requestSubmit()");
  assert((await evaluate("document.querySelector('.quick-dialog .form-error').textContent")).includes('Unable to add'));
  await navigate('index.html');
  await call('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
  await screenshot('home-desktop');

  await click('#searchToggle');
  await evaluate("const input=document.querySelector('#searchInput'); input.value='silk'; input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}))");
  await delay(300);
  assert.deepEqual(await evaluate("[...document.querySelectorAll('#shopGrid [data-product]')].map(el=>el.dataset.product)"),['6']);
  await navigate('shop.html'); await screenshot('shop-desktop');
  await navigate('product.html?id=1'); await screenshot('product-desktop');
  await evaluate("Store.add('1','',1,'S')");
  await navigate('checkout.html');
  await evaluate(`Object.entries({name:'Test Customer',email:'test@example.com',phone:'+92 300 1234567',address:'12 Test Street',city:'Lahore',area:'Gulberg',postal:'54000'}).forEach(([name,value])=>document.querySelector('#checkoutForm').elements[name].value=value); Storage.prototype.setItem=function(){throw new Error('Storage full')}; document.querySelector('#checkoutForm').requestSubmit()`);
  assert((await evaluate("document.querySelector('#checkoutError').textContent")).includes('could not be saved'));
  assert.equal(await evaluate('Store.readCart().length'),1);
  await navigate('checkout.html');
  await evaluate(`Object.entries({name:'Test Customer',email:'test@example.com',phone:'+92 300 1234567',address:'12 Test Street',city:'Lahore',area:'Gulberg',postal:'54000'}).forEach(([name,value])=>document.querySelector('#checkoutForm').elements[name].value=value); PRODUCTS['1'].stock.S=0; document.querySelector('#checkoutForm').requestSubmit()`);
  assert((await evaluate("document.querySelector('#checkoutError').textContent")).includes('exceed availability'));
  results.push('PASS: category menu → listing → product → size/quantity → cart; different sizes stay separate; new/sale/category/search/size/price/availability filters; sorting; gallery zoom; stock limits; order storage failure preserves cart.');

  assert.deepEqual(errors,[],'Browser runtime errors');
  results.push('PASS: Zurane branding, email link, ZUR order numbers and legacy cart/wishlist/order migration.');
  // Compare the original archive's desktop header/hero against the updated site.
  if (fs.existsSync(path.join(artifactDir,'baseline','index.html'))) {
    await call('Page.navigate',{url:origin+'/.qa/baseline/index.html'});
    for (let i=0;i<100;i++) { await delay(50); if (await evaluate("location.pathname.includes('/baseline/') && document.readyState === 'complete'")) break; }
    await screenshot('original-desktop');
  }
  results.push('PASS: cart add/increase/decrease/remove, reload persistence, shipping threshold, variants, Buy Now, validation, local checkout, order persistence, empty/missing states, corrupt storage, storage failures, catalog pricing, carousel isolation; zero runtime errors.');
  fs.writeFileSync(path.join(artifactDir,'test-results.txt'),results.join('\n'));
  console.log(results.join('\n'));
})().catch(error => { console.error(error); process.exitCode=1; }).finally(() => { socket?.close(); browser?.kill(); server.close(); });
