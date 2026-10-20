/* Bit, guía de la línea del tiempo: baja con el scroll y voltea a ver cada hito (sin globo de diálogo). */
(function () {
  'use strict';
  var g = document.querySelector('[data-bit-guide]');
  var tl = g && g.closest('.tl');
  if (!g || !tl) return;
  var head = g.querySelector('[data-bit-head]'), face = g.querySelector('[data-bit-face]');
  var eyes = Array.prototype.map.call(g.querySelectorAll('[data-eye]'), function (el) {
    var c = el.getAttribute('data-eye').split(' ');
    return { g: el, x: +c[0], y: +c[1], p: el.querySelector('[data-pupil]') };
  });
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var items = Array.prototype.slice.call(tl.querySelectorAll('.tl-item'));
  var cur = { x: 0, y: 0 }, tgt = { x: 0, y: 0 }, blink = 1, y = 0, yT = 0, v = 0, lastScroll = window.scrollY;
  var lastPtr = -1e9, ptr = { x: 0, y: 0 }, active = -1, visible = true, narrow = false, lastH = 0, tHappy = null, emph = 1;

  var measure = function () { narrow = window.innerWidth < 768; };
  measure(); window.addEventListener('resize', measure);

  var pointer = function (e) { lastPtr = performance.now(); ptr.x = e.clientX; ptr.y = e.clientY; };
  window.addEventListener('pointermove', pointer, { passive: true });
  window.addEventListener('pointerdown', pointer, { passive: true });

  var hop = function (happy) {
    g.classList.remove('is-hop'); void g.offsetWidth; g.classList.add('is-hop');
    if (happy) { g.classList.add('is-happy'); clearTimeout(tHappy); tHappy = setTimeout(function () { g.classList.remove('is-happy'); }, 1500); }
  };
  var nearest = function (tipY) {
    var best = -1, bd = 1e9;
    items.forEach(function (it, i) {
      if (it.classList.contains('is-dim')) return;
      var node = it.querySelector('.tl-node'); if (!node) return;
      var r = node.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - tipY);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  };

  var frame = function () {
    var r = tl.getBoundingClientRect(), vh = window.innerHeight;
    var tipViewport = vh * 0.62;
    yT = Math.max(0, Math.min(r.height, tipViewport - r.top));
    y += (yT - y) * (reduce ? 1 : 0.12);
    g.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';

    var sy = window.scrollY, dv = Math.min(1, Math.abs(sy - lastScroll) / 60); lastScroll = sy;
    v += (dv - v) * 0.15; g.style.setProperty('--v', v.toFixed(3));

    var onScreen = r.bottom > 0 && r.top < vh;
    if (onScreen) {
      var idx = nearest(tipViewport);
      if (idx !== active && idx >= 0) {
        var first = active === -1; active = idx;
                if (!first) emph = 1.9; /* gira la cabeza con más ganas hacia el nuevo hito */
      }
      /* mirada: al cursor si lo movió hace poco; si no, a la tarjeta del hito actual */
      var hr = head.getBoundingClientRect(), ox = hr.left + hr.width / 2, oy = hr.top + hr.height / 2, tx, ty;
      if (performance.now() - lastPtr < 1800) { tx = ptr.x; ty = ptr.y; }
      else if (active >= 0) {
        var card = items[active].querySelector('.tl-card'); var cr = card.getBoundingClientRect();
        tx = cr.left + cr.width / 2; ty = cr.top + cr.height * 0.35;
      } else { tx = ox; ty = oy + 200; }
      var dx = tx - ox, dy = ty - oy, d = Math.sqrt(dx * dx + dy * dy) || 1, f = Math.min(1, d / 200);
      tgt.x = dx / d * f; tgt.y = dy / d * f;
    }
    cur.x += (tgt.x - cur.x) * 0.14; cur.y += (tgt.y - cur.y) * 0.14;
    emph += (1 - emph) * 0.045;
    var tilt = reduce ? 0.5 : emph;
    head.style.transform = 'perspective(500px) rotateY(' + (cur.x * 16 * tilt).toFixed(2) + 'deg) rotateX(' + (-cur.y * 11 * tilt).toFixed(2) + 'deg) rotateZ(' + (cur.x * 2.5 * tilt).toFixed(2) + 'deg)';
    face.setAttribute('transform', 'translate(' + (cur.x * 10).toFixed(2) + ' ' + (cur.y * 7).toFixed(2) + ')');
    eyes.forEach(function (e) {
      e.g.setAttribute('transform', 'translate(' + e.x + ' ' + e.y + ') scale(1 ' + blink.toFixed(3) + ')');
      e.p.setAttribute('transform', 'translate(' + (cur.x * 13).toFixed(2) + ' ' + (cur.y * 13).toFixed(2) + ')');
    });
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  if (!reduce) {
    var doBlink = function () {
      var t0 = performance.now();
      var step = function (t) { var k = (t - t0) / 160; blink = k < 0.5 ? 1 - k * 1.84 : k < 1 ? 0.08 + (k - 0.5) * 1.84 : 1; if (k < 1) requestAnimationFrame(step); else blink = 1; };
      requestAnimationFrame(step); setTimeout(doBlink, 2400 + Math.random() * 3200);
    };
    setTimeout(doBlink, 1500);
  }

  var greet = function () { hop(true); };
  g.addEventListener('click', greet);
  g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); greet(); } });
})();
