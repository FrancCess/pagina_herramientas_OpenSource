/* Fichas de software: color de marca, constelación de partículas, icono 3D, título que sube,
   texto que se ilumina con el scroll, capturas que se inclinan y barra de lectura.
   Con "reducir movimiento" se quitan los bucles y las entradas, pero lo que responde al cursor/scroll se mantiene suave. */
(function () {
  'use strict';
  var hero = document.querySelector('.tool-hero');
  if (!hero || hero.__fx) return; hero.__fx = true;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* ---------- color de marca ---------- */
  var toRGB = function (c) {
    if (!c) return null; c = String(c).trim();
    var m = c.match(/^#([0-9a-f]{3})$/i); if (m) { var h = m[1]; return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)]; }
    m = c.match(/^#([0-9a-f]{6})$/i); if (m) { var n = parseInt(m[1], 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
    m = c.match(/rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)/); if (m) return [+m[1], +m[2], +m[3]];
    return null;
  };
  var icon = hero.querySelector('.tool-hero-icon'), glyph = icon && icon.querySelector('svg, i'), col = null;
  if (glyph) {
    if (glyph.tagName.toLowerCase() === 'svg') col = toRGB(glyph.getAttribute('fill'));
    else col = toRGB(getComputedStyle(glyph).color);
  }
  if (!col) col = [200, 241, 53];
  var lum = (0.2126 * col[0] + 0.7152 * col[1] + 0.0722 * col[2]) / 255;
  if (lum < 0.3) { var k = 0.62 - lum; col = col.map(function (v) { return Math.round(v + (255 - v) * k); }); }
  var rgb = col.join(',');
  document.documentElement.style.setProperty('--brand-rgb', rgb);
  document.documentElement.classList.add('fx-ficha');

  /* ---------- barra de lectura ---------- */
  var bar = document.createElement('div'); bar.className = 'fx-progress'; bar.setAttribute('aria-hidden', 'true'); document.body.appendChild(bar);

  /* ---------- título: letras que suben ---------- */
  var h1 = hero.querySelector('h1');
  if (h1 && !reduce) {
    var txt = h1.textContent; h1.setAttribute('aria-label', txt); h1.textContent = '';
    var idx = 0;
    txt.split(/(\s+)/).forEach(function (part) {
      if (/^\s+$/.test(part)) { h1.appendChild(document.createTextNode(' ')); return; }
      var w = document.createElement('span'); w.className = 'fx-w'; w.setAttribute('aria-hidden', 'true');
      part.split('').forEach(function (ch) { var s = document.createElement('span'); s.className = 'fx-ch'; s.style.setProperty('--i', idx++); s.textContent = ch; w.appendChild(s); });
      h1.appendChild(w);
    });
  }

  /* ---------- constelación ---------- */
  var cv = document.createElement('canvas'); cv.className = 'fx-canvas'; cv.setAttribute('aria-hidden', 'true'); hero.insertBefore(cv, hero.firstChild);
  var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = 1, ps = [], vis = true, raf = 0, last = 0, t = 0, mouse = { x: -999, y: -999, on: false };
  var build = function () {
    var r = hero.getBoundingClientRect(); W = r.width; H = r.height; dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.round(clamp(W * H / 7500, 24, 78)); ps = [];
    for (var i = 0; i < n; i++) ps.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * 22, vy: (Math.random() - .5) * 22, r: 1.2 + Math.random() * 1.8, ph: Math.random() * 6.28 });
  };
  var draw = function (now) {
    raf = 0; if (!vis) return;
    var dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now; t += dt;
    ctx.clearRect(0, 0, W, H);
    var L = 118, L2 = L * L, drift = reduce ? 0 : 1;
    for (var i = 0; i < ps.length; i++) {
      var p = ps[i];
      p.x += p.vx * dt * drift; p.y += p.vy * dt * drift;
      if (p.x < -10) p.x = W + 10; else if (p.x > W + 10) p.x = -10; if (p.y < -10) p.y = H + 10; else if (p.y > H + 10) p.y = -10;
      if (mouse.on) { var dx = mouse.x - p.x, dy = mouse.y - p.y, d2 = dx * dx + dy * dy; if (d2 < 200 * 200 && d2 > 1) { var d = Math.sqrt(d2), f = (1 - d / 200) * 38 * dt; p.x += dx / d * f; p.y += dy / d * f; } }
    }
    ctx.lineWidth = 1;
    for (var a = 0; a < ps.length; a++) {
      var A = ps[a];
      for (var b = a + 1; b < ps.length; b++) { var B = ps[b], ex = A.x - B.x, ey = A.y - B.y, e2 = ex * ex + ey * ey; if (e2 < L2) { ctx.strokeStyle = 'rgba(' + rgb + ',' + ((1 - Math.sqrt(e2) / L) * .38).toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke(); } }
      if (mouse.on) { var mx = A.x - mouse.x, my = A.y - mouse.y, m2 = mx * mx + my * my; if (m2 < 170 * 170) { ctx.strokeStyle = 'rgba(255,255,255,' + ((1 - Math.sqrt(m2) / 170) * .55).toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); } }
      var tw = reduce ? .8 : .6 + .4 * Math.sin(t * 1.6 + A.ph);
      ctx.fillStyle = 'rgba(' + rgb + ',' + (.55 + .45 * tw).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(A.x, A.y, A.r, 0, 6.2832); ctx.fill();
    }
    if (!reduce || mouse.on) raf = requestAnimationFrame(draw);
  };
  var kick = function () { if (!raf && vis) { last = performance.now(); raf = requestAnimationFrame(draw); } };
  build(); kick();
  if (reduce) { vis = true; raf = requestAnimationFrame(draw); }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { vis = en[0].isIntersecting; if (vis) kick(); }, { threshold: 0 }).observe(hero);
  window.addEventListener('resize', function () { build(); kick(); });

  /* ---------- icono 3D y foco que sigue al cursor ---------- */
  var tx = 0, ty = 0, cx = 0, cy = 0, tilting = false;
  var tiltLoop = function () {
    cx += (tx - cx) * .12; cy += (ty - cy) * .12;
    if (icon) icon.style.transform = 'perspective(700px) rotateY(' + (cx * 18).toFixed(2) + 'deg) rotateX(' + (-cy * 14).toFixed(2) + 'deg)';
    if (Math.abs(tx - cx) > .002 || Math.abs(ty - cy) > .002) requestAnimationFrame(tiltLoop); else tilting = false;
  };
  hero.addEventListener('pointermove', function (e) {
    var r = hero.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    mouse.x = x; mouse.y = y; mouse.on = true; kick();
    hero.style.setProperty('--sx', x + 'px'); hero.style.setProperty('--sy', y + 'px');
    if (icon && !coarse) { var ir = icon.getBoundingClientRect(); tx = clamp((e.clientX - (ir.left + ir.width / 2)) / 360, -1, 1); ty = clamp((e.clientY - (ir.top + ir.height / 2)) / 360, -1, 1); if (!tilting) { tilting = true; requestAnimationFrame(tiltLoop); } }
  }, { passive: true });
  hero.addEventListener('pointerleave', function () { mouse.on = false; tx = 0; ty = 0; if (!tilting) { tilting = true; requestAnimationFrame(tiltLoop); } });

  /* ---------- texto que se ilumina con el scroll ---------- */
  var lead = document.querySelector('.tool-section .section-intro');
  var words = [];
  if (lead) {
    lead.classList.add('fx-lead');
    var txt2 = lead.textContent.replace(/\s+/g, ' ').trim(); lead.setAttribute('aria-label', txt2); lead.textContent = '';
    var kc = 0;
    txt2.split(' ').forEach(function (w, i, arr) { var s = document.createElement('span'); s.className = 'fx-word'; if (w.replace(/[^A-Za-zÁÉÍÓÚáéíóúñÑ]/g, '').length >= 7 && (kc++ % 3 === 1)) s.classList.add('fx-key'); s.setAttribute('aria-hidden', 'true'); s.textContent = w; lead.appendChild(s); if (i < arr.length - 1) lead.appendChild(document.createTextNode(' ')); words.push(s); });
    lead.classList.remove('reveal');
  }
  var onScroll = function () {
    var vh = window.innerHeight, de = document.documentElement;
    bar.style.transform = 'scaleX(' + clamp(window.scrollY / Math.max(1, de.scrollHeight - vh), 0, 1).toFixed(4) + ')';
    if (words.length) {
      var r = lead.getBoundingClientRect(), p = clamp((vh * .86 - r.top) / (r.height + vh * .3), 0, 1), n = Math.round(p * (words.length + 2));
      for (var i = 0; i < words.length; i++) { var on = i < n; if (words[i]._on !== on) { words[i]._on = on; words[i].classList.toggle('is-lit', on); } }
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', onScroll); onScroll();

  /* ---------- capturas: galería 3D (coverflow) ---------- */
  (function gallery() {
    var grid = document.querySelector('.shot-grid'); if (!grid || grid.hasAttribute('data-fg-done')) return; /* fichas v2: ficha-extra.js ya puso la galería */
    var items = Array.prototype.slice.call(grid.querySelectorAll('.shot-item')); var N = items.length; if (!N) return;
    var h1 = hero.querySelector('h1'), tool = h1 ? (h1.getAttribute('aria-label') || h1.textContent).replace(/\s+/g, ' ').trim() : 'Software';
    var slug = (location.pathname.split('/').pop() || '').replace(/\.html?$/, '') || 'captura';
    var NS = 'http://www.w3.org/2000/svg';
    var el = function (tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var mod = function (a, n) { return ((a % n) + n) % n; };
    var ICON = '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M3 14.5l5-4.5 4 3.5 3-2.5 6 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="8" cy="7.5" r="1.4" fill="currentColor"/></svg>';
    var ARW = function (d) { return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="' + d + '" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'; };

    var root = el('div', 'fxg'); root.setAttribute('role', 'region'); root.setAttribute('aria-roledescription', 'carrusel'); root.setAttribute('aria-label', 'Capturas de ' + tool);
    root.innerHTML = '<div class="fxg-bg" aria-hidden="true"><i class="fxg-beam"></i><i class="fxg-floor"></i></div>';
    var top = el('div', 'fxg-top');
    var cnt = el('div', 'fxg-cnt'); cnt.setAttribute('aria-hidden', 'true');
    var roll = el('div', 'fxg-roll'); for (var r = 0; r < N; r++) roll.appendChild(el('b', null, pad(r + 1)));
    var rollWrap = el('div', 'fxg-rollwrap'); rollWrap.appendChild(roll); cnt.appendChild(rollWrap); cnt.appendChild(el('span', null, '/ ' + pad(N)));
    var title = el('div', 'fxg-title'); title.setAttribute('aria-live', 'polite');
    var hint = el('div', 'fxg-hint', coarse ? 'Desliza' : 'Arrastra · ← →');
    top.appendChild(cnt); top.appendChild(title); top.appendChild(hint); root.appendChild(top);

    var stage = el('div', 'fxg-stage'); stage.tabIndex = 0; stage.setAttribute('aria-label', 'Usa las flechas del teclado para cambiar de captura');
    var slides = items.map(function (it, i) {
      var img = it.querySelector('img'), ph = !img;
      var s = el('figure', 'fxg-slide' + (ph ? ' is-ph' : '')); s.setAttribute('role', 'group'); s.setAttribute('aria-roledescription', 'diapositiva'); s.setAttribute('aria-label', (i + 1) + ' de ' + N);
      var bar = el('div', 'fxg-bar', '<i></i><i></i><i></i><span>' + tool.toLowerCase() + ' — captura ' + (i + 1) + '</span>');
      var body = el('div', 'fxg-body');
      var makePh = function () {
        s.classList.add('is-ph'); body.innerHTML = '';
        var d = el('div', 'fxg-ph', '<div class="fxg-skel" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="fxg-num" aria-hidden="true">' + pad(i + 1) + '</div><div class="fxg-phc">' + ICON + '<b>Captura ' + (i + 1) + '</b><code>img/capturas/' + slug + '-' + (i + 1) + '.jpg</code></div>');
        body.appendChild(d);
      };
      if (img) {
        var im = el('img', 'fxg-img'); im.alt = img.getAttribute('alt') || ('Captura de ' + tool); im.draggable = false; im.decoding = 'async'; im.src = img.getAttribute('src');
        if (i > 0) im.loading = 'lazy';
        im.addEventListener('error', makePh); body.appendChild(im);
        s._src = im.src; s._alt = im.alt;
      } else makePh();
      s.appendChild(bar); s.appendChild(body); s.appendChild(el('span', 'fxg-shade')); s.appendChild(el('span', 'fxg-glare'));
      s._i = i; stage.appendChild(s); return s;
    });
    root.appendChild(stage);

    var segs = el('div', 'fxg-segs'); segs.setAttribute('aria-hidden', 'true');
    var segI = slides.map(function () { var g = el('span', 'fxg-seg', '<i></i>'); segs.appendChild(g); return g.firstChild; });
    if (N > 1) root.appendChild(segs);

    /* ficha original queda como respaldo (sin JS se ve la rejilla) */
    grid.parentNode.insertBefore(root, grid); grid.classList.add('fxg-off'); grid.setAttribute('hidden', ''); grid.classList.remove('reveal');

    /* ---------- movimiento ---------- */
    var circ = N >= 3, pos = 0, target = 0, tx = 0, ty = 0, ttx = 0, tty = 0, running = false;
    var dragging = false, sx = 0, spos = 0, moved = 0, lastX = 0, lastT = 0, vel = 0;
    var inView = false, hover = false, clock = 0, last = 0, DUR = 4200, lbOpen = false;
    var slideW = function () { return slides[0].offsetWidth || 480; };

    var render = function () {
      var act = circ ? mod(Math.round(pos), N) : clamp(Math.round(pos), 0, N - 1);
      slides.forEach(function (s, i) {
        var d = i - pos; if (circ) d = mod(d + N / 2, N) - N / 2;
        var ad = Math.abs(d), sg = d < 0 ? -1 : 1;
        var x = ad <= 1 ? ad * 62 : 62 + (ad - 1) * 30, z = -Math.min(ad, 2) * 200, ry = -sg * Math.min(ad, 1.25) * 42, sc = 1 - Math.min(ad, 1.4) * .13;
        var op = ad <= 1.05 ? 1 : clamp(1.7 - ad * .65, 0, 1);
        var near = clamp(1 - ad, 0, 1);
        var tiltY = near * tx * 9, tiltX = near * -ty * 7;
        s.style.transform = 'translate(-50%,-50%) translateX(' + (sg * x).toFixed(2) + '%) translateZ(' + z.toFixed(1) + 'px) rotateY(' + (ry + tiltY).toFixed(2) + 'deg) rotateX(' + tiltX.toFixed(2) + 'deg) scale(' + sc.toFixed(4) + ')';
        s.style.opacity = op.toFixed(3); s.style.zIndex = String(100 - Math.round(ad * 20));
        s.style.setProperty('--dim', (Math.min(ad, 1) * .62).toFixed(3));
        s.style.setProperty('--gx', ((tx * .5 + .5) * 100).toFixed(1) + '%'); s.style.setProperty('--gy', ((ty * .5 + .5) * 100).toFixed(1) + '%');
        s.style.setProperty('--glare', near.toFixed(3));
        s.style.setProperty('--ix', (-tx * 12 * near).toFixed(2) + 'px'); s.style.setProperty('--iy', (-ty * 8 * near).toFixed(2) + 'px');
        var on = i === act; s.classList.toggle('is-active', on); s.setAttribute('aria-hidden', on ? 'false' : 'true'); s.style.pointerEvents = ad > 1.6 ? 'none' : '';
      });
      roll.style.transform = 'translateY(' + (-act * 100 / N).toFixed(4) + '%)';
      var t0 = slides[act]; title.textContent = tool + ' · ' + (t0.classList.contains('is-ph') ? 'espacio para tu captura ' + (act + 1) : (t0._alt || 'captura ' + (act + 1)));
      segI.forEach(function (g, i) { g.style.transform = 'scaleX(' + (i < act ? 1 : 0) + ')'; });
      root.__act = act;
    };
    var tick = function () {
      running = false;
      var dp = target - pos; pos += dp * (dragging ? .45 : .13); if (Math.abs(target - pos) < .0006 && !dragging) pos = target;
      tx += (ttx - tx) * .12; ty += (tty - ty) * .12; if (Math.abs(ttx - tx) < .002) tx = ttx; if (Math.abs(tty - ty) < .002) ty = tty;
      render();
      if (pos !== target || tx !== ttx || ty !== tty || dragging) kick();
    };
    var kick = function () { if (!running) { running = true; requestAnimationFrame(tick); } };
    var goTo = function (i, fromAuto) {
      var cur = Math.round(pos), a = mod(cur, N); var d = i - a;
      if (circ) { if (d > N / 2) d -= N; if (d < -N / 2) d += N; }
      target = circ ? cur + d : clamp(i, 0, N - 1); clock = 0; kick();
    };
    var step = function (n, auto) {
      var cur = Math.round(target);
      if (circ) target = cur + n; else { var t = cur + n; if (t > N - 1) t = auto ? 0 : N - 1; target = clamp(t, 0, N - 1); }
      clock = 0; kick();
    };
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { step(-1); e.preventDefault(); } else if (e.key === 'ArrowRight') { step(1); e.preventDefault(); }
      else if (e.key === 'Home') { goTo(0); e.preventDefault(); } else if (e.key === 'End') { goTo(N - 1); e.preventDefault(); }
      else if ((e.key === 'Enter' || e.key === ' ') && slides[root.__act]._src) { openLB(root.__act); e.preventDefault(); }
    });

    /* arrastre / swipe + inclinación con el cursor */
    stage.addEventListener('pointerdown', function (e) {
      if (N < 2 || (e.pointerType === 'mouse' && e.button !== 0)) return;
      dragging = true; moved = 0; sx = lastX = e.clientX; spos = pos; target = pos; vel = 0; lastT = performance.now(); stage.classList.add('is-drag');
      try { stage.setPointerCapture(e.pointerId); } catch (_) {} kick();
    });
    stage.addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect();
      if (e.pointerType === 'mouse' || reduce || true) { ttx = clamp((e.clientX - r.left) / r.width * 2 - 1, -1, 1); tty = clamp((e.clientY - r.top) / r.height * 2 - 1, -1, 1); if (coarse) { ttx *= .4; tty *= .4; } }
      if (dragging) {
        var dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx));
        var now = performance.now(), dt = Math.max(1, now - lastT); vel = vel * .6 + ((e.clientX - lastX) / dt) * .4; lastX = e.clientX; lastT = now;
        var np = spos - dx / (slideW() * .62); target = circ ? np : clamp(np, -.25, N - 1 + .25); pos = target;
      }
      kick();
    });
    var endDrag = function () {
      if (!dragging) return; dragging = false; stage.classList.remove('is-drag');
      var np = target - clamp(vel, -2, 2) * 90 / (slideW() * .62);
      target = Math.round(np); if (!circ) target = clamp(target, 0, N - 1); clock = 0; kick();
    };
    stage.addEventListener('pointerup', endDrag); stage.addEventListener('pointercancel', endDrag);
    stage.addEventListener('pointerleave', function () { if (!dragging) { ttx = 0; tty = 0; kick(); } });
    stage.addEventListener('click', function (e) {
      if (moved > 6) { moved = 0; return; }
      var s = null, st = document.elementsFromPoint(e.clientX, e.clientY); for (var q = 0; q < st.length; q++) { if (st[q].classList && st[q].classList.contains('fxg-slide')) { s = st[q]; break; } } if (!s) return;
      var d = s._i - Math.round(pos); if (circ) d = mod(s._i - Math.round(pos) + N / 2, N) - N / 2;
      if (d !== 0) { target = Math.round(pos) + d; if (!circ) target = clamp(s._i, 0, N - 1); clock = 0; kick(); }
      else if (s._src) openLB(s._i);
    });

    /* movimiento automático: avanza solo, sin botones (arrastrar, deslizar, teclado y clic en los lados siguen funcionando) */
    var looping = false, kb = false, idleT = 0;
    var loop = function () {
      if (looping) return; looping = true;
      var f = function (t) {
        var dt = Math.min(80, t - (last || t)); last = t;
        if (!hover && !dragging) { idleT += dt; ttx = Math.sin(idleT / 1700) * .55; tty = Math.cos(idleT / 2300) * .35; kick(); }
        if (inView && !kb && !dragging && !lbOpen && !document.hidden && N > 1) {
          clock += dt; var act = root.__act || 0; if (segI[act]) segI[act].style.transform = 'scaleX(' + clamp(clock / DUR, 0, 1).toFixed(4) + ')';
          if (clock >= DUR) { clock = 0; step(1, true); }
        }
        if (inView) requestAnimationFrame(f); else { looping = false; last = 0; }
      };
      requestAnimationFrame(f);
    };
    root.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hover = true; }); root.addEventListener('pointerleave', function () { hover = false; });
    root.addEventListener('focusin', function (e) { try { kb = e.target.matches(':focus-visible'); } catch (_) { kb = false; } }); root.addEventListener('focusout', function () { kb = false; });
    if ('IntersectionObserver' in window) { new IntersectionObserver(function (en) { inView = en[0].isIntersecting; if (inView) { last = 0; loop(); kick(); } }, { threshold: .35 }).observe(root); } else { inView = true; loop(); }
    window.addEventListener('resize', function () { kick(); });

    /* visor a pantalla completa */
    var lb = null, lbFocus = null;
    function openLB(i) {
      var s = slides[i]; if (!s || !s._src) return; lbFocus = document.activeElement; lbOpen = true;
      lb = el('div', 'fxg-lb'); lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Captura ampliada');
      var im = el('img'); im.src = s._src; im.alt = s._alt;
      var x = el('button', 'fxg-lb-x', ARW('M6 6l12 12M18 6L6 18')); x.type = 'button'; x.setAttribute('aria-label', 'Cerrar');
      lb.appendChild(im); lb.appendChild(x); document.body.appendChild(lb);
      requestAnimationFrame(function () { lb.classList.add('is-in'); }); x.focus(); document.documentElement.style.overflow = 'hidden';
      lb.addEventListener('click', closeLB);
      lb._k = function (e) { if (e.key === 'Escape') closeLB(); else if (e.key === 'Tab') { e.preventDefault(); x.focus(); } };
      document.addEventListener('keydown', lb._k);
    }
    function closeLB() {
      if (!lb) return; var l = lb; lb = null; lbOpen = false; document.removeEventListener('keydown', l._k); l.classList.remove('is-in');
      document.documentElement.style.overflow = ''; setTimeout(function () { l.remove(); }, 260); if (lbFocus && lbFocus.focus) lbFocus.focus();
    }
    render(); kick();
  })();
  Array.prototype.forEach.call(document.querySelectorAll('.related-tool-link'), function (a) {
    a.addEventListener('pointermove', function (e) { var r = a.getBoundingClientRect(); a.style.setProperty('--mx', (e.clientX - r.left) + 'px'); a.style.setProperty('--my', (e.clientY - r.top) + 'px'); }, { passive: true });
  });
})();
