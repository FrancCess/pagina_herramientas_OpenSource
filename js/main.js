/* ================================================
   main.js — shared across all pages
   - Reveal on scroll (IntersectionObserver)
   - Navbar scroll shadow
   ================================================ */

// Reveal on scroll
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('is-visible'));
}

// Contadores animados (cuentan al entrar en pantalla)
(function statCounters() {
  const nums = document.querySelectorAll('.stat-number[data-count]');
  if (!nums.length) return;

  const animate = (el) => {
    const target = parseInt(el.getAttribute('data-count'), 10) || 0;
    const suffix = el.getAttribute('data-suffix') || '';
    const prefix = el.getAttribute('data-prefix') || '';
    const duration = 1400;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      const value = Math.round(target * eased);
      el.textContent = prefix + value.toLocaleString('es-ES') + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    nums.forEach((el) => io.observe(el));
  } else {
    nums.forEach((el) => animate(el));
  }
})();

// Buscador / filtro de herramientas (distros, ofimática, edición, juegos, utilidades, desarrollo)
(function toolSearch() {
  const input = document.querySelector('.tool-search-input');
  if (!input) return;

  const cards = Array.from(document.querySelectorAll('.tool-card'));
  const items = cards.map((card) => {
    const wrap = card.closest('.col-12, [class*="col-"]') || card.parentElement;
    const name = card.querySelector('h4')?.textContent || '';
    const desc = card.querySelector('p')?.textContent || '';
    const tag = card.querySelector('.tc-badge')?.textContent || '';
    const haystack = (name + ' ' + desc + ' ' + tag).toLowerCase();
    return { wrap, haystack };
  });

  const catLabels = Array.from(document.querySelectorAll('.cat-label')).map((el) => {
    const wrap = el.closest('.col-12') || el.parentElement;
    // Cards belonging to this label: DOM siblings after it until the next cat-label wrapper.
    const group = [];
    let node = wrap.nextElementSibling;
    while (node && !node.querySelector('.cat-label')) {
      const card = node.querySelector('.tool-card');
      if (card) {
        const found = items.find((it) => it.wrap === node);
        if (found) group.push(found);
      }
      node = node.nextElementSibling;
    }
    return { wrap, group };
  });

  const emptyMsg = document.querySelector('.tool-search-empty');

  const applyFilter = () => {
    const q = input.value.trim().toLowerCase();
    let visibleCount = 0;
    items.forEach((it) => {
      const match = q === '' || it.haystack.includes(q);
      it.wrap.classList.toggle('tool-card-hidden', !match);
      if (match) visibleCount++;
    });
    catLabels.forEach(({ wrap, group }) => {
      const anyVisible = q === '' || group.some((it) => it.haystack.includes(q));
      wrap.classList.toggle('tool-card-hidden', !anyVisible);
    });
    if (emptyMsg) emptyMsg.hidden = visibleCount !== 0;
  };

  input.addEventListener('input', applyFilter);
})();

// Calculadora de ahorro (OS vs Comercial)
(function savingsCalculator() {
  const checks = document.querySelectorAll('.calc-check');
  const totalEl = document.getElementById('savingsTotal');
  const hintEl = document.getElementById('savingsHint');
  if (!checks.length || !totalEl) return;

  const update = () => {
    let total = 0;
    let count = 0;
    checks.forEach((c) => {
      if (c.checked) {
        total += parseInt(c.getAttribute('data-annual'), 10) || 0;
        count++;
      }
    });
    totalEl.textContent = '$' + total.toLocaleString('es-ES');
    totalEl.classList.remove('bump');
    void totalEl.offsetWidth; // reinicia la animación
    totalEl.classList.add('bump');
    if (hintEl) {
      hintEl.textContent = count === 0
        ? 'Marcá arriba las herramientas comerciales que usás hoy y mirá cuánto ahorrarías al año migrando a sus alternativas open source.'
        : `Con ${count} herramienta${count === 1 ? '' : 's'} marcada${count === 1 ? '' : 's'}, así de simple sería tu ahorro anual.`;
    }
  };

  checks.forEach((c) => c.addEventListener('change', update));
})();

// Navbar scroll shadow
const nav = document.querySelector('.site-navbar');
if (nav) {
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// Botón flotante temporal: probar negro vs. azul oscuro
(function themeTester() {
  const KEY = 'os-theme-test';
  const saved = sessionStorage.getItem(KEY);
  if (saved === 'blue') document.documentElement.setAttribute('data-theme', 'blue');

  const btn = document.createElement('button');
  btn.className = 'theme-tester';
  btn.type = 'button';
  const label = document.createElement('span');
  const dot = document.createElement('span');
  dot.className = 'tt-dot';
  btn.appendChild(dot);
  btn.appendChild(label);

  const setLabel = () => {
    const isBlue = document.documentElement.getAttribute('data-theme') === 'blue';
    label.textContent = isBlue ? 'Viendo: azul oscuro' : 'Probar azul oscuro';
  };
  setLabel();

  btn.addEventListener('click', () => {
    const isBlue = document.documentElement.getAttribute('data-theme') === 'blue';
    if (isBlue) {
      document.documentElement.removeAttribute('data-theme');
      sessionStorage.removeItem(KEY);
    } else {
      document.documentElement.setAttribute('data-theme', 'blue');
      sessionStorage.setItem(KEY, 'blue');
    }
    setLabel();
  });

  document.body.appendChild(btn);
})();
