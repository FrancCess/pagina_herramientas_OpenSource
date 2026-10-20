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
        ? 'Marca arriba las herramientas comerciales que usas hoy y mira cuánto ahorrarías al año migrando a sus alternativas open source.'
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

// ── Organizaciones: contadores, foco de luz + inclinación 3D y filtro ──
(function organizaciones() {
  const bento = document.querySelector('.org-bento');
  if (!bento) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const tiles = Array.from(bento.querySelectorAll('.org-tile[data-type]'));

  // Contadores (los años "ruedan" desde data-from; el resto cuenta desde 0)
  const nums = bento.querySelectorAll('.org-fig-num b[data-count]');
  const run = (el) => {
    const target = parseInt(el.dataset.count, 10) || 0;
    const from = el.hasAttribute('data-from') ? parseInt(el.dataset.from, 10) : 0;
    const plain = el.hasAttribute('data-plain');
    const fmt = (v) => (plain ? String(v) : v.toLocaleString('es-ES'));
    if (reduce) { el.textContent = fmt(target); return; }
    const dur = 1700, t0 = performance.now();
    const step = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(Math.round(from + (target - from) * e));
      if (p < 1) requestAnimationFrame(step);
    };
    el.textContent = fmt(from);
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.6 });
    nums.forEach((n) => io.observe(n));
  }

  // Foco de luz que sigue al cursor + inclinación sutil
  if (finePointer && !reduce) {
    tiles.forEach((tile) => {
      const max = tile.classList.contains('org-tile--feat') ? 2.5 : 4.5;
      tile.addEventListener('pointermove', (e) => {
        const r = tile.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        tile.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        tile.style.setProperty('--my', (y * 100).toFixed(1) + '%');
        tile.style.setProperty('--ry', ((x - 0.5) * 2 * max).toFixed(2) + 'deg');
        tile.style.setProperty('--rx', ((0.5 - y) * 2 * max).toFixed(2) + 'deg');
      });
      tile.addEventListener('pointerleave', () => {
        tile.style.setProperty('--rx', '0deg');
        tile.style.setProperty('--ry', '0deg');
      });
    });
  }

  // Filtro por tipo: atenúa en vez de ocultar para no romper la grilla
  const chips = document.querySelectorAll('.org-chip');
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const f = chip.dataset.filter;
      chips.forEach((c) => {
        const on = c === chip;
        c.classList.toggle('is-active', on);
        c.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      tiles.forEach((t) => {
        const dim = f !== 'all' && t.dataset.type !== f;
        t.classList.toggle('is-dim', dim);
        dim ? t.setAttribute('tabindex', '-1') : t.removeAttribute('tabindex');
      });
    });
  });
})();

// ── Ecosistema (¿Qué es? / Historia / Organizaciones): contadores, pestañas,
//    selector de licencias, línea de tiempo, filtro por era y mosaico con lightbox ──
(function ecosistemaPaginas() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Contadores del hero (data-count; data-from hace "rodar" los años; data-plain sin separador)
  const nums = document.querySelectorAll('.eco-stat b[data-count]');
  const run = (el) => {
    const target = parseInt(el.dataset.count, 10) || 0;
    const from = el.hasAttribute('data-from') ? parseInt(el.dataset.from, 10) : 0;
    const plain = el.hasAttribute('data-plain');
    const fmt = (v) => (plain ? String(v) : v.toLocaleString('es-ES'));
    if (reduce) { el.textContent = fmt(target); return; }
    const dur = 1600, t0 = performance.now();
    const step = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(Math.round(from + (target - from) * e));
      if (p < 1) requestAnimationFrame(step);
    };
    el.textContent = fmt(from);
    requestAnimationFrame(step);
  };
  if (nums.length) {
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
      }, { threshold: 0.6 });
      nums.forEach((n) => io.observe(n));
    } else nums.forEach(run);
  }

  // Pestañas (las 4 libertades): flechas del teclado + clic
  document.querySelectorAll('[data-tabs]').forEach((box) => {
    const tabs = Array.from(box.querySelectorAll('[role="tab"]'));
    const panels = Array.from(box.querySelectorAll('[role="tabpanel"]'));
    const select = (tab, focus) => {
      tabs.forEach((t, i) => {
        const on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        if (panels[i]) panels[i].hidden = !on;
      });
      if (focus) tab.focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', (e) => {
        const k = e.key;
        if (!['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'].includes(k)) return;
        e.preventDefault();
        let n = i;
        if (k === 'ArrowDown' || k === 'ArrowRight') n = (i + 1) % tabs.length;
        if (k === 'ArrowUp' || k === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
        if (k === 'Home') n = 0;
        if (k === 'End') n = tabs.length - 1;
        select(tabs[n], true);
      });
    });
  });

  // Selector de licencias: resalta la tarjeta recomendada
  const picker = document.querySelector('[data-picker]');
  if (picker) {
    const cards = document.querySelectorAll('.lic-card[data-lic]');
    const chips = picker.querySelectorAll('.org-chip');
    chips.forEach((chip) => chip.addEventListener('click', () => {
      const pick = chip.dataset.pick;
      const already = chip.classList.contains('is-active');
      chips.forEach((c) => { c.classList.remove('is-active'); c.setAttribute('aria-pressed', 'false'); });
      cards.forEach((c) => c.classList.remove('is-pick'));
      if (already) return;
      chip.classList.add('is-active');
      chip.setAttribute('aria-pressed', 'true');
      cards.forEach((c) => c.classList.toggle('is-pick', c.dataset.lic === pick));
    }));
  }

  // Línea de tiempo: progreso de la línea según el scroll + filtro por era
  const tl = document.querySelector('.tl');
  if (tl) {
    const upd = () => {
      const r = tl.getBoundingClientRect();
      const p = (window.innerHeight * 0.62 - r.top) / r.height;
      tl.style.setProperty('--prog', Math.max(0, Math.min(1, p)).toFixed(4));
    };
    if (!reduce) {
      document.addEventListener('scroll', upd, { passive: true });
      window.addEventListener('resize', upd);
      upd();
    }
    const items = Array.from(tl.querySelectorAll('.tl-item'));
    const chips = document.querySelectorAll('[data-era-filter]');
    chips.forEach((chip) => chip.addEventListener('click', () => {
      const f = chip.dataset.eraFilter;
      chips.forEach((c) => {
        const on = c === chip;
        c.classList.toggle('is-active', on);
        c.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      items.forEach((it) => it.classList.toggle('is-dim', f !== 'all' && it.dataset.era !== f));
      const first = items.find((it) => f === 'all' || it.dataset.era === f);
      if (first && f !== 'all') first.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    }));
  }

  // Mosaico: marca las que ya tienen imagen y abre una vista ampliada
  const shots = document.querySelectorAll('.eco-shot');
  if (shots.length) {
    const lb = document.createElement('div');
    lb.className = 'eco-lb';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.innerHTML = '<button type="button" aria-label="Cerrar">×</button><div><img alt=""><p></p></div>';
    document.body.appendChild(lb);
    const lbImg = lb.querySelector('img');
    const lbCap = lb.querySelector('p');
    const close = () => lb.classList.remove('is-open');
    lb.addEventListener('click', (e) => { if (e.target !== lbImg) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    shots.forEach((fig) => {
      const img = fig.querySelector('img');
      if (!img) return;
      const mark = () => fig.classList.add('has-img');
      if (img.complete && img.naturalWidth > 0) mark();
      img.addEventListener('load', mark);
      fig.addEventListener('click', () => {
        if (!fig.classList.contains('has-img')) return;
        lbImg.src = img.currentSrc || img.src;
        lbImg.alt = img.alt || '';
        lbCap.textContent = fig.querySelector('figcaption')?.textContent.replace(/^\d+\s*/, '') || '';
        lb.classList.add('is-open');
      });
    });
  }
})();

// ── ¿Qué es? — dinamismo extra: progreso, scrollspy, frase rotatoria, parallax,
//    demo abierto/cerrado, mitos, autoplay de libertades, foco de luz y flujo ──
(function queEsDinamico() {
  if (!document.querySelector('.eco-progress')) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const nav = document.querySelector('.site-navbar');
  const setNavH = () => document.documentElement.style.setProperty('--nav-h', (nav ? nav.offsetHeight : 64) + 'px');
  setNavH(); window.addEventListener('resize', setNavH);

  // Barra de progreso de lectura
  const prog = document.querySelector('.eco-progress');
  const updProg = () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    prog.style.setProperty('--sp', h > 0 ? Math.min(1, window.scrollY / h).toFixed(4) : 0);
  };
  document.addEventListener('scroll', updProg, { passive: true });
  window.addEventListener('resize', updProg); updProg();

  // Frase rotatoria del título
  const rot = document.querySelector('[data-rotate]');
  if (rot && !reduce) {
    const items = Array.from(rot.querySelectorAll('.rot-i'));
    let i = 0;
    setInterval(() => {
      const cur = items[i];
      i = (i + 1) % items.length;
      const nxt = items[i];
      cur.classList.remove('is-on'); cur.classList.add('is-out');
      nxt.classList.remove('is-out'); nxt.classList.add('is-on');
      setTimeout(() => cur.classList.remove('is-out'), 600);
    }, 3200);
  }

  // Parallax y foco de luz en el hero
  const hero = document.querySelector('[data-hero]');
  if (hero && fine && !reduce) {
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      hero.classList.add('is-live');
      hero.style.setProperty('--hx', (x * 100).toFixed(1) + '%');
      hero.style.setProperty('--hy', (y * 100).toFixed(1) + '%');
      hero.style.setProperty('--px', ((x - 0.5) * 2).toFixed(3));
      hero.style.setProperty('--py', ((y - 0.5) * 2).toFixed(3));
    });
    hero.addEventListener('pointerleave', () => {
      hero.style.setProperty('--px', 0); hero.style.setProperty('--py', 0);
      hero.classList.remove('is-live');
    });
  }

  // Menú de la página con scrollspy + indicador deslizante
  const spy = document.querySelector('[data-spy]');
  if (spy) {
    const links = Array.from(spy.querySelectorAll('a'));
    const ind = spy.querySelector('.eco-spy-ind');
    const targets = links.map((a) => document.querySelector(a.getAttribute('href')));
    const move = (a) => {
      ind.style.width = a.offsetWidth + 'px';
      ind.style.transform = 'translateX(' + a.offsetLeft + 'px)';
      ind.classList.add('is-ready');
      const box = spy.getBoundingClientRect(), r = a.getBoundingClientRect();
      if (r.left < box.left + 8 || r.right > box.right - 8) spy.scrollTo({ left: a.offsetLeft - 20, behavior: reduce ? 'auto' : 'smooth' });
    };
    let current = -1;
    const pick = () => {
      const line = window.innerHeight * 0.38;
      let idx = -1;
      targets.forEach((t, k) => { if (t && t.getBoundingClientRect().top <= line) idx = k; });
      if (idx === current) return;
      current = idx;
      links.forEach((a, k) => { a.classList.toggle('is-active', k === idx); });
      if (idx >= 0) move(links[idx]); else ind.classList.remove('is-ready');
    };
    document.addEventListener('scroll', pick, { passive: true });
    window.addEventListener('resize', () => { if (current >= 0) move(links[current]); });
    pick();
  }

  // Demo código cerrado ⇄ abierto
  const oc = document.querySelector('[data-oc]');
  if (oc) {
    const tg = oc.querySelector('.oc-toggle');
    const swapMetrics = (open) => {
      oc.querySelectorAll('.oc-metrics b').forEach((b) => {
        b.classList.add('swap');
        setTimeout(() => { b.textContent = open ? b.dataset.open : b.dataset.closed; b.classList.remove('swap'); }, reduce ? 0 : 220);
      });
    };
    const set = (open) => {
      oc.dataset.open = open ? 'true' : 'false';
      tg.setAttribute('aria-checked', open ? 'true' : 'false');
      swapMetrics(open);
    };
    let touched = false;
    tg.addEventListener('click', () => { touched = true; tg.classList.remove('nudge'); set(tg.getAttribute('aria-checked') !== 'true'); });
    oc.querySelectorAll('.oc-lab').forEach((l) => l.addEventListener('click', () => { touched = true; set(l.classList.contains('oc-lab-open')); }));
    if ('IntersectionObserver' in window && !reduce) {
      const io = new IntersectionObserver((en) => {
        if (en[0].isIntersecting) { io.disconnect(); setTimeout(() => { if (!touched) tg.classList.add('nudge'); }, 700); }
      }, { threshold: 0.6 });
      io.observe(oc);
    }
  }

  // Mitos que se voltean
  const myths = document.querySelectorAll('.myth');
  if (myths.length) {
    const count = document.querySelector('.myth-count');
    const bar = count.querySelector('.myth-bar');
    const n = count.querySelector('[data-myth-n]');
    const seen = new Set();
    myths.forEach((m, i) => m.addEventListener('click', () => {
      const on = m.getAttribute('aria-pressed') !== 'true';
      m.setAttribute('aria-pressed', on ? 'true' : 'false');
      m.querySelector('.myth-back').setAttribute('aria-hidden', on ? 'false' : 'true');
      m.querySelector('.myth-front').setAttribute('aria-hidden', on ? 'true' : 'false');
      if (on) seen.add(i);
      n.textContent = seen.size;
      bar.style.setProperty('--m', seen.size);
      count.classList.toggle('is-done', seen.size === myths.length);
    }));
  }

  // Libertades: avance automático con barra de progreso (se detiene al interactuar)
  const auto = document.querySelector('[data-tabs][data-autoplay]');
  if (auto && !reduce) {
    const tabs = Array.from(auto.querySelectorAll('[role="tab"]'));
    let stopped = false;
    const stop = () => { stopped = true; auto.classList.remove('is-playing', 'is-paused'); };
    auto.addEventListener('click', (e) => { if (e.isTrusted) stop(); });
    auto.addEventListener('keydown', stop);
    auto.addEventListener('pointerenter', () => auto.classList.add('is-paused'));
    auto.addEventListener('pointerleave', () => auto.classList.remove('is-paused'));
    auto.addEventListener('focusin', () => auto.classList.add('is-paused'));
    auto.addEventListener('focusout', () => auto.classList.remove('is-paused'));
    auto.addEventListener('animationend', (e) => {
      if (e.animationName !== 'tabProg' || stopped) return;
      const cur = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
      tabs[(cur + 1) % tabs.length].click();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((en) => {
        if (stopped) return;
        auto.classList.toggle('is-playing', en[0].isIntersecting);
      }, { threshold: 0.5 }).observe(auto);
    }
  }

  // Foco de luz en tarjetas
  if (fine && !reduce) {
    document.querySelectorAll('.lic-card, .eco-step, .myth-front').forEach((el) => {
      el.classList.add('fx-spot');
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  // Flujo de contribución: el paso activo recorre las 4 etapas en bucle
  const flow = document.querySelector('.eco-flow');
  if (flow && !reduce) {
    const steps = Array.from(flow.querySelectorAll('.eco-step'));
    let k = 0, timer = null, hovering = false;
    const tick = () => { steps.forEach((s, j) => s.classList.toggle('is-on', j === k)); k = (k + 1) % steps.length; };
    const start = () => { if (!timer) { tick(); timer = setInterval(() => { if (!hovering) tick(); }, 1900); } };
    flow.addEventListener('pointerenter', () => { hovering = true; });
    flow.addEventListener('pointerleave', () => { hovering = false; });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((en) => {
        if (en[0].isIntersecting) start();
        else if (timer) { clearInterval(timer); timer = null; }
      }, { threshold: 0.4 }).observe(flow);
    }
  }
})();

/* Fichas de software: efectos dinámicos (color de marca, constelación, icono 3D...). */
(function () {
  try {
    if (!document.querySelector('.tool-hero')) return;
    var me = document.querySelector('script[src$="js/main.js"]');
    if (!me) return;
    // Fichas v2: galería (principal + miniaturas) y opiniones. Se carga antes que ficha.js.
    var lk = document.createElement('link'); lk.rel = 'stylesheet';
    lk.href = me.src.replace(/js\/main\.js(\?.*)?$/, 'css/ficha-extra.css');
    document.head.appendChild(lk);
    var x = document.createElement('script');
    x.src = me.src.replace(/main\.js(\?.*)?$/, 'ficha-extra.js');
    var s = document.createElement('script');
    s.src = me.src.replace(/main\.js(\?.*)?$/, 'ficha.js');
    x.onload = x.onerror = function () { document.body.appendChild(s); };
    document.body.appendChild(x);
  } catch (e) {}
})();
