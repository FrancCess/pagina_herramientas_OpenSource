/* Secciones extra compartidas (Ofimática y Utilidades):
   galería filtrable con visor [data-gal], test configurable [data-quiz] con JSON,
   medidor de privacidad [data-pv] y kit por perfil [data-kit]. */
(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; };

  /* ================= GALERÍA ================= */
  $$('[data-gal]').forEach(function (sec) {
    var grid = sec.querySelector('.jg-grid'); if (!grid) return;
    var chips = $$('.jg-chip', sec);
    var tiles = function () { return $$('.jg-tile', grid); };
    var counts = function () {
      var all = tiles();
      chips.forEach(function (c) {
        var g = c.getAttribute('data-g');
        var n = g === '*' ? all.length : all.filter(function (t) { return t.getAttribute('data-game') === g; }).length;
        c.querySelector('small').textContent = n; c.hidden = n === 0 && g !== '*';
      });
      sec.hidden = all.length === 0;
    };
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        var g = c.getAttribute('data-g');
        chips.forEach(function (x) { var on = x === c; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
        tiles().forEach(function (t) { t.classList.toggle('is-out', g !== '*' && t.getAttribute('data-game') !== g); });
      });
    });
    counts();
    if ('MutationObserver' in window) new MutationObserver(counts).observe(grid, { childList: true });
    window.addEventListener('load', counts);

    var lb = null, idx = 0, list = [], lastFocus = null;
    var show = function (i) {
      idx = (i + list.length) % list.length;
      var t = list[idx], im = t.querySelector('img');
      lb.querySelector('img').src = im.currentSrc || im.src; lb.querySelector('img').alt = im.alt;
      lb.querySelector('.jg-lb-cap b').textContent = t.querySelector('figcaption b').textContent;
      lb.querySelector('.jg-lb-cap span').textContent = t.querySelector('figcaption span').textContent;
      lb.querySelector('.jg-lb-go').href = t.querySelector('.jg-shot').getAttribute('data-href');
      lb.querySelector('.jg-lb-count').textContent = (idx + 1) + ' / ' + list.length;
    };
    var onKey = function (e) {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') show(idx + 1);
      else if (e.key === 'ArrowLeft') show(idx - 1);
      else if (e.key === 'Tab') { var f = lb.querySelectorAll('button, a'), a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { z.focus(); e.preventDefault(); } else if (!e.shiftKey && document.activeElement === z) { a.focus(); e.preventDefault(); } }
    };
    var close = function () {
      if (!lb) return; var l = lb; lb = null; l.classList.remove('is-in');
      document.removeEventListener('keydown', onKey); document.documentElement.style.overflow = '';
      setTimeout(function () { l.remove(); }, 250); if (lastFocus) lastFocus.focus();
    };
    grid.addEventListener('click', function (e) {
      var b = e.target.closest('.jg-shot'); if (!b) return;
      list = tiles().filter(function (t) { return !t.classList.contains('is-out'); }); idx = list.indexOf(b.closest('.jg-tile')); lastFocus = document.activeElement;
      lb = document.createElement('div'); lb.className = 'jg-lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Imagen ampliada');
      lb.innerHTML = '<button type="button" class="jg-lb-x" aria-label="Cerrar">✕</button><button type="button" class="jg-lb-nav jg-lb-prev" aria-label="Anterior">‹</button>' +
        '<figure><img alt=""><figcaption class="jg-lb-cap"><b></b><span></span><em class="jg-lb-count"></em><a class="jg-lb-go" href="#">Ver ficha →</a></figcaption></figure>' +
        '<button type="button" class="jg-lb-nav jg-lb-next" aria-label="Siguiente">›</button>';
      document.body.appendChild(lb); document.documentElement.style.overflow = 'hidden';
      lb.querySelector('.jg-lb-x').addEventListener('click', close);
      lb.querySelector('.jg-lb-prev').addEventListener('click', function () { show(idx - 1); });
      lb.querySelector('.jg-lb-next').addEventListener('click', function () { show(idx + 1); });
      lb.addEventListener('click', function (ev) { if (ev.target === lb) close(); });
      document.addEventListener('keydown', onKey);
      show(idx); requestAnimationFrame(function () { lb && lb.classList.add('is-in'); }); lb.querySelector('.jg-lb-x').focus();
    });
    if (!reduce) grid.addEventListener('pointermove', function (e) {
      var t = e.target.closest('.jg-tile'); if (!t || e.pointerType !== 'mouse') return;
      var r = t.getBoundingClientRect(); t.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%'); t.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    });
  });

  /* ================= TEST ================= */
  $$('[data-quiz]').forEach(function (quiz) {
    var cfgEl = quiz.querySelector('[data-quiz-cfg]'); if (!cfgEl) return;
    var C; try { C = JSON.parse(cfgEl.textContent); } catch (e) { return; }
    var body = quiz.querySelector('[data-body]'), step = quiz.querySelector('[data-step]'), bar = quiz.querySelector('[data-bar]');
    var Q = C.q, i = 0, score = {}, hist = [];
    var anim = function () { body.classList.remove('is-in'); void body.offsetWidth; body.classList.add('is-in'); };
    var render = function () {
      step.textContent = 'Pregunta ' + (i + 1) + ' de ' + Q.length; bar.style.transform = 'scaleX(' + (i / Q.length) + ')';
      body.innerHTML = '<h3 class="jg-q-t">' + esc(Q[i].q) + '</h3><div class="jg-q-opts">' + Q[i].a.map(function (o, k) {
        return '<button type="button" class="jg-q-opt" data-k="' + k + '"><span>' + String.fromCharCode(65 + k) + '</span>' + esc(o[0]) + '</button>';
      }).join('') + '</div>' + (i > 0 ? '<button type="button" class="jg-q-back">← Anterior</button>' : '');
      anim();
    };
    var result = function () {
      step.textContent = '¡Resultado!'; bar.style.transform = 'scaleX(1)';
      var best = C.order.slice().sort(function (a, b) { return (score[b] || 0) - (score[a] || 0) || C.order.indexOf(a) - C.order.indexOf(b); });
      var g = C.items[best[0]], alt = C.items[best[1]];
      body.innerHTML = '<div class="jg-res"><div class="jg-res-media"><img src="../img/capturas/' + g.img + '.jpg" alt="" onerror="this.remove()"><span>Te recomendamos</span></div>' +
        '<div class="jg-res-txt"><small>Tu herramienta</small><h3>' + esc(g.n) + '</h3><p>' + esc(g.d) + '</p>' +
        '<div class="jg-res-cta"><a class="tp-btn tp-btn-main" href="tools/' + best[0] + '.html">Ver ficha →</a><button type="button" class="jg-q-again">Repetir el test</button></div>' +
        '<p class="jg-res-alt">También podría servirte: <a href="tools/' + best[1] + '.html">' + esc(alt.n) + '</a></p></div></div>';
      anim();
    };
    body.addEventListener('click', function (e) {
      var o = e.target.closest('.jg-q-opt');
      if (o) {
        var add = Q[i].a[+o.getAttribute('data-k')][1]; hist.push(add);
        Object.keys(add).forEach(function (k) { score[k] = (score[k] || 0) + add[k]; });
        i++; if (i < Q.length) render(); else result();
        var f = body.querySelector('button, a'); if (f) f.focus({ preventScroll: true }); return;
      }
      if (e.target.closest('.jg-q-back')) { var l = hist.pop(); if (l) Object.keys(l).forEach(function (k) { score[k] -= l[k]; }); i = Math.max(0, i - 1); render(); return; }
      if (e.target.closest('.jg-q-again')) { i = 0; score = {}; hist = []; render(); }
    });
    render();
  });

  /* ================= MEDIDOR DE PRIVACIDAD ================= */
  var pv = document.querySelector('[data-pv]');
  if (pv) {
    var TR = [['Anuncios de terceros', 'pub'], ['Píxel de red social', 'soc'], ['Analítica de visitas', 'ana'], ['Huella digital del navegador', 'fp'], ['Redes de anuncios', 'pub'], ['Seguimiento entre sitios', 'x'], ['Píxel de correo de marketing', 'soc'], ['Mapa de calor de clics', 'ana'], ['Grabación de sesión', 'ana'], ['Anuncios en video', 'pub'], ['Recomendaciones de terceros', 'pub'], ['Identificador entre dispositivos', 'fp']];
    /* cuántos se bloquean en cada modo (ilustrativo) */
    var MODES = [
      { blocked: 0, msg: 'Con la configuración típica, muchas empresas pueden seguir tu visita y construir un perfil de ti.' },
      { blocked: 9, msg: 'Firefox trae protección contra rastreo activada: bloquea la mayoría de rastreadores conocidos sin que hagas nada.' },
      { blocked: 11, msg: 'Brave bloquea anuncios y rastreadores por defecto con sus "escudos". Casi nadie te sigue.' }
    ];
    var field = pv.querySelector('[data-pv-field]'), nEl = pv.querySelector('[data-pv-n]'), bEl = pv.querySelector('[data-pv-b]'),
      meter = pv.querySelector('[data-pv-meter]'), msg = pv.querySelector('[data-pv-msg]'), listEl = pv.querySelector('[data-pv-list]'),
      shield = pv.querySelector('[data-pv-shield]'), tabs = $$('[data-pv-mode]', pv);
    var dots = TR.map(function (t, k) {
      var d = document.createElement('i'); d.className = 'pv-dot pv-' + t[1];
      var ang = (k / TR.length) * Math.PI * 2, r = 36 + (k % 3) * 7;
      d.style.setProperty('--x', (50 + Math.cos(ang) * r).toFixed(1) + '%'); d.style.setProperty('--y', (50 + Math.sin(ang) * r * .8).toFixed(1) + '%');
      d.style.setProperty('--d', (k * 90) + 'ms'); field.appendChild(d); return d;
    });
    var count = function (el, to) {
      var from = +el.textContent || 0; if (reduce) { el.textContent = to; return; }
      var t0 = performance.now(); var f = function (t) { var p = Math.min(1, (t - t0) / 600); el.textContent = Math.round(from + (to - from) * p); if (p < 1) requestAnimationFrame(f); }; requestAnimationFrame(f);
    };
    var set = function (m) {
      tabs.forEach(function (t) { var on = +t.getAttribute('data-pv-mode') === m; t.classList.toggle('is-on', on); t.setAttribute('aria-selected', on ? 'true' : 'false'); });
      var b = MODES[m].blocked, live = TR.length - b;
      dots.forEach(function (d, k) { d.classList.toggle('is-blocked', k < b); });
      count(nEl, live); count(bEl, b);
      var lvl = Math.round(live / TR.length * 100);
      meter.style.setProperty('--lvl', lvl + '%'); meter.setAttribute('aria-valuenow', lvl); meter.className = 'pv-meter ' + (lvl > 60 ? 'is-hi' : lvl > 20 ? 'is-mid' : 'is-lo');
      msg.textContent = MODES[m].msg; shield.classList.toggle('is-on', m > 0); pv.setAttribute('data-mode', m);
      listEl.innerHTML = TR.map(function (t, k) { return '<li class="' + (k < b ? 'is-b' : '') + '">' + esc(t[0]) + '</li>'; }).join('');
    };
    tabs.forEach(function (t) {
      t.addEventListener('click', function () { set(+t.getAttribute('data-pv-mode')); });
      t.addEventListener('keydown', function (e) {
        var i = tabs.indexOf(t); if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { var n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]; n.focus(); n.click(); e.preventDefault(); }
      });
    });
    var started = false;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en, ob) { if (en[0].isIntersecting && !started) { started = true; set(0); ob.disconnect(); } }, { threshold: .3 }).observe(pv);
    else set(0);
  }

  /* ================= KIT POR PERFIL ================= */
  var kt = document.querySelector('[data-kit]');
  if (kt) {
    var T = {
      firefox: ['Firefox', 'Navegar seguro y con herramientas de desarrollo'], brave: ['Brave', 'Navegar sin anuncios ni rastreadores'], element: ['Element', 'Chat cifrado con tu equipo'],
      'jitsi-meet': ['Jitsi Meet', 'Videollamadas sin instalar nada'], nmap: ['Nmap', 'Descubrir equipos y puertos en tu red'], wireshark: ['Wireshark', 'Ver el tráfico de red paquete por paquete'],
      nginx: ['nginx', 'Publicar tus páginas en un servidor'], docker: ['Docker', 'Empaquetar y correr apps en contenedores'], postgresql: ['PostgreSQL', 'Guardar datos en una base de datos seria'],
      'vs-code': ['VS Code', 'Escribir código con extensiones']
    };
    var K = {
      estudiante: { t: 'Para la escuela', d: 'Lo básico para estudiar, hacer equipo y entregar trabajos.', s: ['firefox', 'jitsi-meet', 'element', 'vs-code'] },
      programador: { t: 'Para programar', d: 'Escribir, probar y publicar tus proyectos.', s: ['vs-code', 'docker', 'postgresql', 'nginx', 'firefox'] },
      redes: { t: 'Para redes y seguridad', d: 'Analizar, entender y proteger una red (siempre en redes propias o con permiso).', s: ['nmap', 'wireshark', 'brave', 'element'] },
      remoto: { t: 'Para trabajar a distancia', d: 'Comunicarte con tu equipo y cuidar tu privacidad.', s: ['jitsi-meet', 'element', 'brave', 'firefox'] }
    };
    var out = kt.querySelector('[data-kt-out]'), ps = $$('[data-kt]', kt);
    var set2 = function (key) {
      ps.forEach(function (p) { var on = p.getAttribute('data-kt') === key; p.classList.toggle('is-on', on); p.setAttribute('aria-checked', on ? 'true' : 'false'); p.tabIndex = on ? 0 : -1; });
      var k = K[key];
      out.innerHTML = '<div class="kt-head"><h3>' + esc(k.t) + '</h3><p>' + esc(k.d) + '</p></div><ol class="kt-list">' + k.s.map(function (s, n) {
        return '<li style="--i:' + n + '"><a href="tools/' + s + '.html"><span class="kt-img"><img src="../img/carousel/' + s + '.jpg" alt="" loading="lazy" onerror="this.remove()"></span><span class="kt-n">' + (n + 1) + '</span><b>' + esc(T[s][0]) + '</b><small>' + esc(T[s][1]) + '</small></a></li>';
      }).join('') + '</ol>';
      out.classList.remove('is-in'); void out.offsetWidth; out.classList.add('is-in');
    };
    ps.forEach(function (p) {
      p.addEventListener('click', function () { set2(p.getAttribute('data-kt')); });
      p.addEventListener('keydown', function (e) {
        var i = ps.indexOf(p), n = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = ps[(i + 1) % ps.length]; else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = ps[(i + ps.length - 1) % ps.length];
        if (n) { n.focus(); n.click(); e.preventDefault(); }
      });
    });
    set2('estudiante');
  }
})();

/* ================= GALERÍA "REJILLA QUE SE EXPANDE" (Utilidades) =================
   En las secciones con data-gal-fx="expand", al tocar una imagen esta crece desde su
   lugar hasta llenar la pantalla (técnica FLIP) y al cerrar regresa a su sitio.
   Sustituye al visor normal de [data-gal]. Con "reducir movimiento" no hay animación. */
(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EASE = 'cubic-bezier(.2,.8,.2,1)', DUR = 520;
  Array.prototype.forEach.call(document.querySelectorAll('[data-gal][data-gal-fx="expand"]'), function (sec) {
    var grid = sec.querySelector('.jg-grid'); if (!grid) return;
    var ov = null, big = null, list = [], idx = 0, lastFocus = null, busy = false;

    var visibles = function () { return Array.prototype.filter.call(grid.querySelectorAll('.jg-tile'), function (t) { return !t.classList.contains('is-out'); }); };
    var imgOf = function (t) { return t.querySelector('img'); };
    var target = function (im) {
      var vw = window.innerWidth, vh = window.innerHeight, small = vw < 600;
      var r = (im.naturalWidth && im.naturalHeight) ? im.naturalWidth / im.naturalHeight : 1.5;
      var maxW = Math.min(vw - (small ? 24 : 150), 1400), maxH = vh - (small ? 190 : 140);
      var w = Math.min(maxW, maxH * r), h = w / r;
      return { left: (vw - w) / 2, top: Math.max(12, (vh - h) / 2 - (small ? 40 : 18)), width: w, height: h };
    };
    var place = function (el, t) { el.style.left = t.left + 'px'; el.style.top = t.top + 'px'; el.style.width = t.width + 'px'; el.style.height = t.height + 'px'; };
    var delta = function (from, to) {
      return 'translate(' + (from.left - to.left) + 'px,' + (from.top - to.top) + 'px) scale(' + (from.width / to.width) + ',' + (from.height / to.height) + ')';
    };
    var caption = function () {
      var t = list[idx], fc = t.querySelector('figcaption');
      ov.querySelector('.ux-cap b').textContent = fc.querySelector('b').textContent;
      ov.querySelector('.ux-cap span').textContent = fc.querySelector('span').textContent;
      ov.querySelector('.ux-cap em').textContent = (idx + 1) + ' / ' + list.length;
      ov.querySelector('.ux-go').href = t.querySelector('.jg-shot').getAttribute('data-href');
    };
    var setSrc = function (t) {
      Array.prototype.forEach.call(grid.querySelectorAll('.ux-src'), function (x) { x.classList.remove('ux-src'); });
      if (t) t.classList.add('ux-src');
    };
    var onKey = function (e) {
      if (!ov) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'Tab') {
        var f = ov.querySelectorAll('button, a'), a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { z.focus(); e.preventDefault(); }
        else if (!e.shiftKey && document.activeElement === z) { a.focus(); e.preventDefault(); }
      }
    };
    var onResize = function () { if (big) place(big, target(big)); };

    function open(tile) {
      if (ov || busy) return;
      list = visibles(); idx = Math.max(0, list.indexOf(tile)); lastFocus = document.activeElement;
      var src = imgOf(tile), from = src.getBoundingClientRect();
      ov = document.createElement('div'); ov.className = 'ux-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Imagen ampliada');
      ov.innerHTML = '<div class="ux-bg"></div><img class="ux-img" alt="">' +
        '<div class="ux-ui"><button type="button" class="ux-x" aria-label="Cerrar">✕</button>' +
        '<button type="button" class="ux-nav ux-prev" aria-label="Anterior">‹</button><button type="button" class="ux-nav ux-next" aria-label="Siguiente">›</button>' +
        '<div class="ux-cap"><b></b><span></span><em></em><a class="ux-go" href="#">Ver ficha →</a></div></div>';
      document.body.appendChild(ov);
      big = ov.querySelector('.ux-img'); big.src = src.currentSrc || src.src; big.alt = src.alt;
      var to = target(src); place(big, to); caption(); setSrc(tile);
      document.documentElement.style.overflow = 'hidden';
      if (window.lenis && window.lenis.stop) window.lenis.stop();
      ov.querySelector('.ux-bg').addEventListener('click', close);
      ov.querySelector('.ux-x').addEventListener('click', close);
      ov.querySelector('.ux-prev').addEventListener('click', function () { go(-1); });
      ov.querySelector('.ux-next').addEventListener('click', function () { go(1); });
      document.addEventListener('keydown', onKey); window.addEventListener('resize', onResize);
      var x0 = null;
      ov.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
      ov.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 45) go(dx < 0 ? 1 : -1); });
      if (!reduce && big.animate) {
        busy = true;
        big.animate([{ transform: delta(from, to), borderRadius: '16px' }, { transform: 'none', borderRadius: '16px' }], { duration: DUR, easing: EASE })
          .onfinish = function () { busy = false; };
      }
      requestAnimationFrame(function () { ov.classList.add('is-open'); ov.querySelector('.ux-x').focus({ preventScroll: true }); });
    }

    function go(d) {
      if (!ov || busy || list.length < 2) return;
      idx = (idx + d + list.length) % list.length;
      var t = list[idx], im = imgOf(t); setSrc(t); caption();
      var swap = function () { big.src = im.currentSrc || im.src; big.alt = im.alt; place(big, target(im)); };
      if (reduce || !big.animate) { swap(); return; }
      busy = true;
      big.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(' + (-d * 40) + 'px)' }], { duration: 170, easing: 'ease-in' }).onfinish = function () {
        swap();
        big.animate([{ opacity: 0, transform: 'translateX(' + (d * 40) + 'px)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'ease-out' }).onfinish = function () { busy = false; };
      };
    }

    function close() {
      if (!ov || busy) return;
      var o = ov, b = big, t = list[idx];
      var finish = function () {
        o.remove(); setSrc(null); document.documentElement.style.overflow = '';
        if (window.lenis && window.lenis.start) window.lenis.start();
        document.removeEventListener('keydown', onKey); window.removeEventListener('resize', onResize);
        var btn = t && t.querySelector('.jg-shot'); (btn || lastFocus) && (btn || lastFocus).focus({ preventScroll: true });
        busy = false;
      };
      ov = null; big = null; o.classList.remove('is-open');
      var r = t && imgOf(t).getBoundingClientRect();
      var onScreen = r && r.bottom > 0 && r.top < window.innerHeight;
      if (reduce || !b.animate) { finish(); return; }
      busy = true;
      var cur = b.getBoundingClientRect();
      var anim = onScreen
        ? b.animate([{ transform: 'none' }, { transform: delta(r, cur) }], { duration: 440, easing: EASE, fill: 'forwards' })
        : b.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: 'forwards' });
      anim.onfinish = finish;
    }

    sec.addEventListener('click', function (e) {
      var s = e.target.closest && e.target.closest('.jg-shot'); if (!s || !grid.contains(s)) return;
      e.preventDefault(); e.stopPropagation(); open(s.closest('.jg-tile'));
    }, true);
  });
})();

/* Mosaico de Utilidades: la miniatura crece hacia dentro de la galería (no se sale por los bordes) */
(function () {
  var grid = document.querySelector('[data-gal-fx="expand"] .jg-grid'); if (!grid) return;
  grid.addEventListener('pointerover', function (e) {
    var tile = e.target.closest && e.target.closest('.jg-tile'); if (!tile) return;
    var g = grid.getBoundingClientRect(), r = tile.getBoundingClientRect(), shot = tile.querySelector('.jg-shot');
    var cx = (r.left + r.width / 2 - g.left) / g.width, cy = (r.top + r.height / 2 - g.top) / g.height;
    shot.style.setProperty('--ox', cx < 0.2 ? '0%' : cx > 0.8 ? '100%' : '50%');
    shot.style.setProperty('--oy', cy < 0.2 ? '0%' : cy > 0.8 ? '100%' : '50%');
  });
})();
