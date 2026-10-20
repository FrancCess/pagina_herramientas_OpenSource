/* =====================================================
   ¿Qué es? — capa inmersiva
   Usa GSAP + ScrollTrigger + Lenis (CDN). Mejora progresiva:
   si los scripts no cargan, la página sigue funcionando (todo visible).
   La terminal y el fondo de constelación no dependen de los frameworks.
   ===================================================== */
(function () {
  'use strict';
  if (!document.querySelector('.qe-hero')) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasG = !!(window.gsap && window.ScrollTrigger);
  var navEl = document.querySelector('.site-navbar');
  var navH = function () {
    /* la barra encoge ~12px al hacer scroll: se usa su altura ya encogida */
    var h = navEl ? Math.round(navEl.getBoundingClientRect().height) - (navEl.classList.contains('scrolled') ? 0 : 12) : 52;
    document.documentElement.style.setProperty('--nav-h', h + 'px');
    return h;
  };

  /* ───────── Fondo: constelación de colaboradores ───────── */
  function initCanvas() {
    var cv = document.getElementById('qeCanvas');
    if (!cv || !cv.getContext) return;
    var ctx = cv.getContext('2d');
    var hero = cv.parentElement;
    var w = 0, h = 0, dpr = 1, nodes = [], raf = 0, vis = true;
    var mouse = { x: -999, y: -999 };

    function size() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = hero.clientWidth; h = hero.clientHeight;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(90, Math.max(26, (w * h) / 15000)));
      while (nodes.length < n) {
        nodes.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.38, vy: (Math.random() - 0.5) * 0.38,
          r: Math.random() * 1.6 + 0.8, hot: Math.random() < 0.14
        });
      }
      nodes.length = n;
      nodes.forEach(function (p) { p.x = Math.min(p.x, w); p.y = Math.min(p.y, h); });
      if (reduce) draw(true);
    }

    function draw(still) {
      ctx.clearRect(0, 0, w, h);
      var D = 130, M = 190, i, j, a, b, dx, dy, d;
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        if (!still) {
          var mdx = mouse.x - a.x, mdy = mouse.y - a.y, md = Math.sqrt(mdx * mdx + mdy * mdy);
          if (md < M && md > 1) { a.vx += (mdx / md) * 0.012; a.vy += (mdy / md) * 0.012; }
          a.vx *= 0.995; a.vy *= 0.995;
          var sp = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
          if (sp > 0.9) { a.vx *= 0.9 / sp; a.vy *= 0.9 / sp; }
          a.x += a.vx; a.y += a.vy;
          if (a.x < -10) a.x = w + 10; else if (a.x > w + 10) a.x = -10;
          if (a.y < -10) a.y = h + 10; else if (a.y > h + 10) a.y = -10;
        }
      }
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        for (j = i + 1; j < nodes.length; j++) {
          b = nodes[j]; dx = a.x - b.x; dy = a.y - b.y; d = Math.sqrt(dx * dx + dy * dy);
          if (d < D) {
            ctx.strokeStyle = 'rgba(255,255,255,' + ((1 - d / D) * 0.22).toFixed(3) + ')';
            ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        dx = a.x - mouse.x; dy = a.y - mouse.y; d = Math.sqrt(dx * dx + dy * dy);
        if (d < M) {
          ctx.strokeStyle = 'rgba(200,241,53,' + ((1 - d / M) * 0.75).toFixed(3) + ')';
          ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        ctx.beginPath(); ctx.arc(a.x, a.y, a.hot ? a.r + 0.8 : a.r, 0, 6.2832);
        ctx.fillStyle = a.hot ? 'rgba(200,241,53,.95)' : 'rgba(255,255,255,.65)';
        if (a.hot) { ctx.shadowColor = 'rgba(200,241,53,.9)'; ctx.shadowBlur = 10; } else { ctx.shadowBlur = 0; }
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }

    function loop() { draw(false); raf = vis ? requestAnimationFrame(loop) : 0; }

    size();
    window.addEventListener('resize', size);
    if (reduce) return;
    if (fine) {
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
      });
      hero.addEventListener('pointerleave', function () { mouse.x = -999; mouse.y = -999; });
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        vis = en[0].isIntersecting;
        if (vis && !raf) raf = requestAnimationFrame(loop);
      }, { threshold: 0 }).observe(hero);
    }
    raf = requestAnimationFrame(loop);
  }

  /* ───────── Terminal simulada ───────── */
  function initTerminal() {
    var root = document.querySelector('[data-term]');
    if (!root) return;
    var out = root.querySelector('.term-out');
    var form = root.querySelector('.term-form');
    var input = root.querySelector('.term-input');
    var chips = root.querySelectorAll('[data-cmd]');
    var prog = document.querySelector('[data-term-prog]');
    var nEl = document.querySelector('[data-term-n]');
    var reward = document.querySelector('[data-term-reward]');
    var PROMPT = 'visitante@open-source:~/proyecto-abierto$ ';
    var seen = {};
    var hist = [], hi = 0;

    var TOTAL = 8;
    var LIB = {
      'help': { id: 'help', lines: [
        ['Comandos disponibles:', 'hl'],
        ['help — muestra esta ayuda'],
        ['ls — lista los archivos del proyecto'],
        ['cat README.md — la presentación del proyecto'],
        ['cat LICENSE — la licencia'],
        ['cat CONTRIBUTING.md — cómo colaborar'],
        ['git log --oneline — historial de cambios'],
        ['git clone — copia el proyecto para trabajar en él'],
        ['whoami — ¿quién eres aquí?'],
        ['clear — limpia la pantalla']
      ]},
      'ls': { id: 'ls', lines: [['README.md   LICENSE   CONTRIBUTING.md   src/   docs/   tests/']] },
      'cat readme.md': { id: 'readme', lines: [
        ['# proyecto-abierto', 'hl'],
        ['Un proyecto de ejemplo para entender el código abierto. Aquí cualquiera puede LEER el código, USARLO, MODIFICARLO y COMPARTIR sus mejoras. Nadie necesita pedir permiso: la licencia ya lo concede.'],
        ['Prueba: cat LICENSE', 'dim']
      ]},
      'cat license': { id: 'license', lines: [
        ['Licencia MIT (resumen en español)', 'hl'],
        ['Puedes usar, copiar, modificar, publicar y distribuir este software, incluso con fines comerciales, siempre que conserves el aviso de derechos de autor y esta licencia. El software se ofrece "tal cual", sin garantía de ningún tipo.'],
        ['Es una de las licencias más permisivas y usadas.', 'dim']
      ]},
      'cat contributing.md': { id: 'contributing', lines: [
        ['# Cómo contribuir', 'hl'],
        ['1. Haz un fork del repositorio.'],
        ['2. Crea una rama y cambia lo que quieras mejorar.'],
        ['3. Abre un Pull Request explicando qué hiciste y por qué.'],
        ['4. Responde a la revisión. ¡Y listo, ya eres colaborador/a!'],
        ['Corregir una errata en la documentación también cuenta.', 'dim']
      ]},
      'git log --oneline': { id: 'log', lines: [
        ['a91f3c2 Mejora el mensaje de error al instalar'],
        ['4be07d1 Traduce la documentación al español'],
        ['c3d2e88 Corrige una errata en el README (primer PR de Ana)', 'ok'],
        ['7f10a5b Agrega pruebas para el módulo de rutas'],
        ['e22b9c4 Primer commit: nace el proyecto']
      ]},
      'git clone': { id: 'clone', lines: [
        ["Clonando en 'proyecto-abierto'..."],
        ['remote: Enumerando objetos... listo.', 'dim'],
        ['Recibiendo objetos: 100% — listo.', 'dim'],
        ['Listo. Ahora el código es tuyo: léelo, cámbialo, mejóralo.', 'ok']
      ]},
      'whoami': { id: 'whoami', lines: [['tú — una futura persona contribuidora', 'hl']] }
    };
    var ALIAS = { 'git clone .': 'git clone', 'ayuda': 'help', 'git log': 'git log --oneline', 'cat readme': 'cat readme.md', 'cat contributing': 'cat contributing.md' };

    function print(lines, cls) {
      var base = out.children.length;
      lines.forEach(function (ln, i) {
        var d = document.createElement('div');
        d.className = 'term-line ' + (ln[1] || cls || '');
        d.style.setProperty('--i', reduce ? 0 : i);
        d.textContent = ln[0];
        out.appendChild(d);
      });
      out.scrollTop = out.scrollHeight;
    }
    function echo(cmd) {
      var d = document.createElement('div');
      d.className = 'term-line cmd';
      d.style.setProperty('--i', 0);
      var b = document.createElement('b'); b.textContent = PROMPT;
      d.appendChild(b); d.appendChild(document.createTextNode(cmd));
      out.appendChild(d);
    }
    function mark(id) {
      if (seen[id]) return;
      seen[id] = true;
      var n = Object.keys(seen).length;
      if (nEl) nEl.textContent = n;
      if (prog) prog.style.setProperty('--tp', n);
      if (prog) prog.querySelector('.bar i').style.setProperty('--tp', n);
      chips.forEach(function (c) { if (idOf(c.getAttribute('data-cmd')) === id) c.classList.add('is-done'); });
      if (n >= TOTAL && reward) {
        reward.hidden = false;
        print([['★ Recorrido completo. Ya sabes moverte por un proyecto abierto.', 'ok']]);
      }
    }
    function idOf(cmd) {
      var k = normal(cmd); return LIB[k] ? LIB[k].id : null;
    }
    function normal(raw) {
      var k = raw.trim().replace(/\s+/g, ' ').toLowerCase();
      return ALIAS[k] || k;
    }
    function run(raw) {
      var shown = raw.trim();
      if (!shown) { echo(''); return; }
      hist.push(shown); hi = hist.length;
      echo(shown);
      var k = normal(shown);
      if (k === 'clear') { out.textContent = ''; return; }
      if (/^sudo\b/.test(k)) {
        print([['Buen intento. Aquí no hace falta romper nada:', 'hl'], ['el código ya está abierto y no necesitas permisos especiales.']]);
        return;
      }
      if (/^(rm|mv|cp)\b/.test(k)) {
        print([['Es una simulación, así que no se borra nada. Mejor prueba: help', 'dim']]);
        return;
      }
      var c = LIB[k];
      if (c) { print(c.lines); mark(c.id); return; }
      print([['comando no encontrado: ' + shown, 'err'], ['Escribe help para ver los comandos disponibles.', 'dim']]);
    }

    print([['Bienvenido/a. Esta es una terminal simulada de un proyecto de código abierto. Escribe help o toca un comando de abajo.', 'hl']]);

    form.addEventListener('submit', function (e) { e.preventDefault(); run(input.value); input.value = ''; });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowUp') { if (hi > 0) { hi--; input.value = hist[hi]; } e.preventDefault(); }
      else if (e.key === 'ArrowDown') { if (hi < hist.length - 1) { hi++; input.value = hist[hi]; } else { hi = hist.length; input.value = ''; } e.preventDefault(); }
    });
    chips.forEach(function (c) {
      c.addEventListener('click', function () { run(c.getAttribute('data-cmd')); });
    });
    root.addEventListener('click', function (e) {
      if (e.target.closest('.term-chip') || e.target === out) return;
      var sel = window.getSelection && window.getSelection().toString();
      if (!sel) input.focus({ preventScroll: true });
    });
  }

  initCanvas();
  initTerminal();

  if (!hasG) return; /* sin frameworks: todo lo demás ya es legible */

  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('qe-js');

  /* ───────── Scroll suave (Lenis) sincronizado con ScrollTrigger ───────── */
  var lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    var id = a.getAttribute('href');
    if (!id || id.length < 2) return;
    a.addEventListener('click', function (e) {
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      var off = id === '#dia' ? -(navH() + 8) : -(navH() + 70);
      if (lenis) lenis.scrollTo(t, { offset: off, duration: 1.5, easing: function (x) { return 1 - Math.pow(1 - x, 4); } });
      else window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY + off, behavior: reduce ? 'auto' : 'smooth' });
      if (history.replaceState) history.replaceState(null, '', id);
    });
  });

  /* ───────── Título: letras que suben ───────── */
  var split = document.querySelector('[data-split]');
  if (split && !reduce) {
    var txt = split.textContent;
    split.textContent = '';
    var sr = document.createElement('span'); sr.className = 'visually-hidden'; sr.textContent = txt;
    var vis = document.createElement('span'); vis.setAttribute('aria-hidden', 'true');
    txt.split(' ').forEach(function (word, wi, arr) {
      var wd = document.createElement('span'); wd.className = 'qe-wd';
      word.split('').forEach(function (ch) {
        var cw = document.createElement('span'); cw.className = 'qe-chw';
        var c = document.createElement('span'); c.className = 'qe-ch'; c.textContent = ch;
        cw.appendChild(c); wd.appendChild(cw);
      });
      vis.appendChild(wd);
      if (wi < arr.length - 1) vis.appendChild(document.createTextNode(' '));
    });
    split.appendChild(sr); split.appendChild(vis);
  }

  if (!reduce) {
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.qe-hero .eco-eyebrow', { y: 20, opacity: 0, duration: 0.6 })
      .from('.qe-ch', { yPercent: 115, rotate: 6, opacity: 0, duration: 0.9, stagger: 0.045 }, '-=0.3')
      .from('.qe-hero .rot', { y: 30, opacity: 0, duration: 0.8 }, '-=0.5')
      .from('.qe-hero .eco-lead', { y: 24, opacity: 0, duration: 0.7 }, '-=0.5')
      .from('.qe-hero .qe-btn', { y: 22, opacity: 0, duration: 0.6, stagger: 0.1, clearProps: 'transform,opacity' }, '-=0.45')
      .from('.qe-hero .eco-stat', { y: 22, opacity: 0, duration: 0.6, stagger: 0.1 }, '-=0.4')
      .from('.qe-hero .code-win', { x: 60, opacity: 0, rotate: 6, duration: 1, clearProps: 'transform,opacity' }, '-=1.1')
      .from('.qe-cue', { opacity: 0, y: 12, duration: 0.6 }, '-=0.3');

    /* El hero se desvanece con suavidad al salir */
    gsap.to('.qe-hero > .container', {
      yPercent: -8, opacity: 0.25, ease: 'none',
      scrollTrigger: { trigger: '.qe-hero', start: 'center top+=' + navH(), end: 'bottom top', scrub: true }
    });
    gsap.to('.qe-canvas', {
      yPercent: 14, ease: 'none',
      scrollTrigger: { trigger: '.qe-hero', start: 'top bottom', end: 'bottom top', scrub: true }
    });

    /* Botones magnéticos */
    if (fine) {
      document.querySelectorAll('[data-magnet]').forEach(function (el) {
        var xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
        var yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
        el.addEventListener('pointermove', function (e) {
          var r = el.getBoundingClientRect();
          xTo((e.clientX - (r.left + r.width / 2)) * 0.28);
          yTo((e.clientY - (r.top + r.height / 2)) * 0.4);
        });
        el.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
      });
    }
  }

  /* ───────── Cinta que acelera con el scroll ───────── */
  var marq = document.querySelector('.qe-marq');
  if (marq && !reduce) {
    var track = marq.querySelector('.qe-marq-track');
    marq.classList.add('is-js');
    var pos = 0, dir = -1, boost = 0, lastY = window.scrollY, wrap = gsap.utils.wrap(-50, 0);
    gsap.ticker.add(function (time, dt) {
      var y = window.scrollY, dy = y - lastY; lastY = y;
      if (Math.abs(dy) > 0.5) dir += ((dy > 0 ? -1 : 1) - dir) * 0.15;
      boost += (Math.min(18, Math.abs(dy)) - boost) * 0.12;
      pos = wrap(pos + dir * (2.6 + boost * 0.55) * (dt / 1000));
      track.style.transform = 'translate3d(' + pos + '%,0,0)';
    });
  }

  /* ───────── Definición: palabras que se encienden ───────── */
  function splitWords(el) {
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (tok) {
            if (!tok) return;
            if (/^\s+$/.test(tok)) frag.appendChild(document.createTextNode(tok));
            else { var s = document.createElement('span'); s.className = 'qe-w'; s.textContent = tok; frag.appendChild(s); }
          });
          c.parentNode.replaceChild(frag, c);
        } else if (c.nodeType === 1) walk(c);
      });
    })(el);
    return el.querySelectorAll('.qe-w');
  }
  if (!reduce) {
    document.querySelectorAll('[data-words] p').forEach(function (p) {
      var ws = splitWords(p);
      gsap.fromTo(ws, { opacity: 0.14 }, {
        opacity: 1, ease: 'none', stagger: 0.5,
        scrollTrigger: { trigger: p, start: 'top 82%', end: 'bottom 58%', scrub: 0.4 }
      });
    });
    var bg = document.querySelector('[data-bgword]');
    if (bg) gsap.fromTo(bg, { xPercent: -6 }, { xPercent: 12, ease: 'none', scrollTrigger: { trigger: '.qe-statement', start: 'top bottom', end: 'bottom top', scrub: true } });
    var fig = document.querySelector('[data-fig]');
    if (fig) gsap.fromTo(fig, { '--tilt': '-4deg' }, { '--tilt': '3deg', ease: 'none', scrollTrigger: { trigger: '.qe-statement', start: 'top 70%', end: 'bottom 30%', scrub: true } });
  }

  /* ───────── Un día con open source ───────── */
  var day = document.querySelector('[data-day]');
  if (day) {
    var pin = day.querySelector('[data-pin]');
    var trackEl = day.querySelector('[data-track]');
    var panels = Array.prototype.slice.call(day.querySelectorAll('.qe-panel'));
    var clock = day.querySelector('[data-clock]');
    var ticks = Array.prototype.slice.call(day.querySelectorAll('.qe-ticks span'));
    var sun = day.querySelector('.qe-sun'), moon = day.querySelector('.qe-moon');
    var sky = day.querySelector('.qe-sky'), stars = day.querySelector('.qe-stars');
    var bar = day.querySelector('.qe-day-bar');

    var STOPS = [
      [0, '#2a1d4e', '#e0865b'], [0.25, '#1b4f8a', '#7fb9e8'], [0.5, '#0e6fb0', '#5bc0eb'],
      [0.75, '#3b1f5e', '#e0724a'], [1, '#050b1d', '#14284f']
    ];
    function skyAt(p) {
      var i = 0;
      while (i < STOPS.length - 2 && p > STOPS[i + 1][0]) i++;
      var a = STOPS[i], b = STOPS[i + 1];
      var t = Math.max(0, Math.min(1, (p - a[0]) / (b[0] - a[0])));
      return [gsap.utils.interpolate(a[1], b[1], t), gsap.utils.interpolate(a[2], b[2], t)];
    }
    var W = function () { return pin.clientWidth; }, H = function () { return pin.clientHeight; };
    function paint(p) {
      var c = skyAt(p);
      sky.style.setProperty('--sky-a', c[0]); sky.style.setProperty('--sky-b', c[1]);
      stars.style.setProperty('--stars', Math.max(0, (p - 0.66) / 0.3).toFixed(3));
      /* sol: arco del amanecer al atardecer */
      var sp = Math.min(1, p / 0.78);
      var sx = W() * (0.06 + 0.86 * sp), sy = H() * (0.62 - 0.5 * Math.sin(Math.PI * sp));
      sun.style.transform = 'translate3d(' + sx + 'px,' + sy + 'px,0) scale(' + (1 + 0.25 * (1 - Math.abs(2 * sp - 1))) + ')';
      sun.style.opacity = Math.max(0, Math.min(1, (0.86 - p) / 0.1));
      /* luna: sale al final */
      var mp = Math.max(0, (p - 0.7) / 0.3);
      moon.style.transform = 'translate3d(' + (W() * (0.74 + 0.14 * mp)) + 'px,' + (H() * (0.55 - 0.4 * mp)) + 'px,0)';
      moon.style.opacity = Math.max(0, Math.min(1, (p - 0.78) / 0.1));
      /* reloj: pasa exacto por la hora de cada panel (07, 09, 13, 18, 23:30) */
      var T = [420, 540, 780, 1080, 1410], q = Math.min(3.9999, p * 4), qi = Math.floor(q);
      var mins = Math.round(T[qi] + (T[qi + 1] - T[qi]) * (q - qi));
      var hh = Math.floor(mins / 60), mm = mins % 60;
      clock.textContent = (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm;
      var idx = Math.round(p * (panels.length - 1));
      panels.forEach(function (el, k) { el.classList.toggle('is-active', k === idx); });
      ticks.forEach(function (el, k) { el.classList.toggle('is-on', k === idx); });
      bar.style.setProperty('--dp', p.toFixed(4));
    }

    var mm = gsap.matchMedia();
    mm.add('(min-width: 992px) and (min-height: 560px) and (prefers-reduced-motion: no-preference)', function () {
      day.classList.add('is-pinned');
      var dist = function () { return Math.max(0, trackEl.scrollWidth - pin.clientWidth); };
      paint(0);
      gsap.to(trackEl, {
        x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: {
          trigger: pin, pin: true, scrub: 0.7, anticipatePin: 1, invalidateOnRefresh: true,
          start: function () { return 'top top+=' + navH(); },
          end: function () { return '+=' + Math.round(dist() * 1.05); },
          onUpdate: function (self) { paint(self.progress); },
          onRefresh: function (self) { paint(self.progress); }
        }
      });
      return function () { day.classList.remove('is-pinned'); };
    });
    mm.add('(max-width: 991.98px), (max-height: 559.98px)', function () {
      if (reduce) return;
      panels.forEach(function (pn) {
        gsap.from(pn, { y: 50, opacity: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: pn, start: 'top 88%', once: true } });
      });
    });
  }

  /* ───────── Cierre ───────── */
  if (!reduce) {
    gsap.from('.qe-final > *', {
      y: 40, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out',
      scrollTrigger: { trigger: '.qe-final', start: 'top 78%', once: true }
    });
  }

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
})();
