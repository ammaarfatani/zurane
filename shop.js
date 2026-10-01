'use strict';
(() => {
  const page = document.querySelector('#shopPage');
  const e = Store.escape;
  const products = Object.values(PRODUCTS);
  const sizes = [...new Set(products.flatMap(p => p.sizes))];
  const fabrics = [...new Set(products.map(p => p.fabric).filter(Boolean))].sort();
  const options = (values) => values.map(value => `<option value="${e(value)}">${e(value)}</option>`).join('');
  page.innerHTML = `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="index.html">Home</a><span>/</span><span>Shop</span></nav><h1 id="shopTitle">Shop</h1>
    <form id="shopFilters" class="shop-filters" role="search" aria-label="Filter products">
      <div class="shop-search"><label for="catalogSearch">Search products</label><div><input id="catalogSearch" type="search" name="q" placeholder="Search by name, fabric or style"><button type="submit" class="btn btn-dark">Search</button></div></div>
      <div class="filter-toolbar"><button id="filterToggle" class="filter-toggle" type="button" aria-expanded="false" aria-controls="filterFields">Filters <span aria-hidden="true">+</span></button><div class="filter-fields" id="filterFields">
        <label>Category<select name="category"><option value="">All categories</option>${CATEGORIES.map(c=>`<option value="${c.id}">${e(c.name)}</option>`).join('')}</select></label>
        <label>Collection<select name="collection"><option value="">All products</option><option value="new">New arrivals</option><option value="sale">Sale</option><option value="best">Best sellers</option></select></label>
        <label>Size<select name="size"><option value="">All sizes</option>${options(sizes)}</select></label>
        <label>Fabric<select name="fabric"><option value="">All fabrics</option>${options(fabrics)}</select></label>
        <label>Availability<select name="availability"><option value="">All</option><option value="in-stock">In stock</option><option value="out-of-stock">Out of stock</option></select></label>
        <label>Min price<input type="number" name="min" min="0" step="1" placeholder="PKR 0"></label><label>Max price<input type="number" name="max" min="0" step="1" placeholder="Any price"></label>
        <button type="button" class="filter-clear link-underline" id="clearFilters">Clear filters</button></div>
        <label class="sort-control">Sort by<select name="sort"><option value="featured">Featured</option><option value="price-asc">Price: Low to high</option><option value="price-desc">Price: High to low</option><option value="newest">Newest</option><option value="name">Name: A–Z</option></select></label>
      </div><p class="form-error" id="filterError" role="alert"></p></form>
      <p id="resultCount" class="result-count" role="status" aria-live="polite"></p><div id="shopGrid" class="products-grid shop-grid"></div>
      <div id="noResults" class="empty-results" hidden><h2>No products match your selection</h2><p>Try another search or clear the filters.</p><button class="btn btn-outline" id="resetResults">Show all products</button></div>`;
  const form = page.querySelector('#shopFilters');
  function render(updateUrl = false) {
    const data = Object.fromEntries(new FormData(form));
    const requestedCategory = new URLSearchParams(location.search).get('category');
    const unknownCategory = !updateUrl && requestedCategory && !CATEGORIES.some(category => category.id === requestedCategory);
    const min = data.min === '' ? 0 : Number(data.min), max = data.max === '' ? Infinity : Number(data.max);
    const invalidRange = min > max;
    page.querySelector('#filterError').textContent = invalidRange ? 'Minimum price must be less than or equal to maximum price.' : '';
    const filtered = invalidRange || unknownCategory ? [] : products.filter(p => Catalog.inCategory(p,data.category) && Catalog.matches(p,data.q)
      && (data.collection !== 'new' || p.isNew) && (data.collection !== 'sale' || p.isSale)
      && (data.collection !== 'best' || ['5','6','7','8'].includes(p.id))
      && (!data.size || p.sizes.includes(data.size)) && (!data.fabric || p.fabric === data.fabric)
      && (!data.availability || Object.entries(p.stock).some(([size,n]) => n > 0 && (!data.size || size === data.size)) === (data.availability === 'in-stock'))
      && p.raw >= min && p.raw <= max);
    filtered.sort((a,b) => data.sort === 'price-asc' ? a.raw-b.raw : data.sort === 'price-desc' ? b.raw-a.raw : data.sort === 'name' ? a.name.localeCompare(b.name) : data.sort === 'newest' ? Number(b.isNew)-Number(a.isNew) || a.featuredRank-b.featuredRank : a.featuredRank-b.featuredRank);
    const title = unknownCategory ? 'Category not found' : data.q ? `Search results for “${data.q}”` : data.category ? CATEGORIES.find(c => c.id === data.category)?.name || 'Shop' : ({new:'New Arrivals',sale:'Sale',best:'Best Sellers'}[data.collection] || 'Shop All');
    page.querySelector('#shopTitle').textContent = title;
    document.title = title + ' — Zurane';
    page.querySelector('#shopGrid').innerHTML = Catalog.cards(filtered);
    page.querySelector('#resultCount').textContent = `${filtered.length} product${filtered.length === 1 ? '' : 's'}`;
    page.querySelector('#noResults').hidden = filtered.length > 0;
    if (updateUrl) {
      const params = new URLSearchParams(Object.entries(data).filter(([key,value]) => value && !(key === 'sort' && value === 'featured')));
      history.pushState(null,'',location.pathname+(params.size ? '?'+params : ''));
    }
  }
  function restore() {
    const params = new URLSearchParams(location.search);
    form.reset();
    for (const [key,value] of params) if (form.elements[key]) form.elements[key].value = value;
    if (!form.elements.sort.value) form.elements.sort.value = 'featured';
    render();
  }
  form.addEventListener('submit', event => { event.preventDefault(); render(true); });
  form.addEventListener('change', () => { if(form.checkValidity()) render(true); });
  const clear = () => { form.reset(); render(true); };
  page.querySelector('#clearFilters').addEventListener('click',clear);
  page.querySelector('#resetResults').addEventListener('click',clear);
  page.querySelector('#filterToggle').addEventListener('click', event => {
    const open = form.classList.toggle('filters-open'); event.currentTarget.setAttribute('aria-expanded',String(open));
  });
  window.addEventListener('popstate',restore);
  restore();
})();
