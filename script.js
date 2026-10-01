

'use strict';

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const state = {
  wishlist: Store.read('Zurane_wish', []),
  heroIndex: 0,
  heroTimer: null,
};

function saveWishlist() { Store.write('Zurane_wish', state.wishlist); }

(function initHeader() {
  const header = $('#header');
  if (!header) return;

  function onScroll() {
    const y = window.scrollY;
    if (y > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

(function initSearch() {
  const toggle = $('#searchToggle');
  const bar    = $('#searchBar');
  const close  = $('#searchClose');
  const input  = $('#searchInput');
  if (!toggle || !bar) return;
  input.setAttribute('aria-label', 'Search products');
  bar.inert = true;
  toggle.setAttribute('aria-expanded', 'false');
  function setSearch(open) {
    bar.classList.toggle('open', open);
    bar.inert = !open;
    toggle.setAttribute('aria-expanded', String(open));
    if (open) input.focus();
  }

  toggle.addEventListener('click', () => {
    setSearch(!bar.classList.contains('open'));
  });

  close && close.addEventListener('click', () => {
    setSearch(false);
    toggle.focus();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && bar.classList.contains('open')) { setSearch(false); toggle.focus(); }
  });
})();

(function initHeroSlider() {
  const slides = $$('.hero-slide');
  const dots   = $$('.hero-dot');
  const prev   = $('#heroPrev');
  const next   = $('#heroNext');
  if (!slides.length) return;

 function goTo(index) {
  slides[state.heroIndex]?.classList.remove('active');
  dots[state.heroIndex]?.classList.remove('active');

  state.heroIndex = (index + slides.length) % slides.length;

  slides[state.heroIndex]?.classList.add('active');
  dots[state.heroIndex]?.classList.add('active');
}

  function startTimer() {
    clearInterval(state.heroTimer);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    state.heroTimer = setInterval(() => goTo(state.heroIndex + 1), 6000);
  }

  prev && prev.addEventListener('click', () => { goTo(state.heroIndex - 1); startTimer(); });
  next && next.addEventListener('click', () => { goTo(state.heroIndex + 1); startTimer(); });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => { goTo(i); startTimer(); });
  });

  // Touch/swipe
  let touchStartX = 0;
  const hero = $('.hero');
  hero && hero.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  hero && hero.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? goTo(state.heroIndex + 1) : goTo(state.heroIndex - 1);
      startTimer();
    }
  }, { passive: true });

  startTimer();
})();

(function initWishlist() {
  function updateWishlistBtns() {
    $$('.wishlist-btn').forEach(btn => {
      const id = btn.dataset.id;
      if (state.wishlist.includes(id)) {
        btn.classList.add('active');
        btn.setAttribute('aria-label', 'Remove from wishlist');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-label', 'Add to wishlist');
      }
    });
  }

  document.addEventListener('click', e => {
    const btn = e.target.closest('.wishlist-btn');
    if (!btn) return;
    const id = btn.dataset.id;
    if (!id) return;
    if (state.wishlist.includes(id)) {
      state.wishlist = state.wishlist.filter(w => w !== id);
      showToast('Removed from wishlist');
    } else {
      state.wishlist.push(id);
      showToast('Added to wishlist');
    }
    saveWishlist();
    updateWishlistBtns();
  });

  updateWishlistBtns();
})();

(function initNewsletter() {
  const form  = $('#newsletterForm');
  const email = $('#newsletterEmail');
  if (!form) return;
  email.setAttribute('aria-label', 'Email address');

  form.addEventListener('submit', e => {
    e.preventDefault();
    const val = email.value.trim();
    if (!val) return;
    showToast('Newsletter signup is not connected yet. Please contact the store.');
    email.value = '';
  });
})();

let toastTimer = null;
function showToast(msg) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

(function initScrollReveal() {
  const targets = [
    '.section-header',
    '.collection-card',
    '.product-card',
    '.look-right',
    '.story-text-col',
    '.story-img-col',
    '.stat-item',
    '.insta-item',
    '.newsletter-inner',
    '.footer-brand',
    '.footer-links-group',
  ];

  const revealEls = targets.flatMap(sel => $$(sel));
  revealEls.forEach((el, i) => {
    el.classList.add('reveal');
    // Stagger siblings in same grid
    const parent = el.parentElement;
    const siblings = $$('.reveal', parent);
    const localIdx = siblings.indexOf(el);
    if (localIdx > 0) {
      el.style.transitionDelay = `${Math.min(localIdx * 80, 320)}ms`;
    }
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

  revealEls.forEach(el => observer.observe(el));
})();

(function initSmoothScroll() {
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (href === '#') return;
    const target = document.getElementById(href.slice(1));
    if (!target) return;
    e.preventDefault();
    const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 76;
    const offset  = target.getBoundingClientRect().top + window.scrollY - headerH - 20;
    window.scrollTo({ top: offset, behavior: 'smooth' });
  });
})();
