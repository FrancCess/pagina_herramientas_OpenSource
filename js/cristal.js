/* "Cristal": escena de partículas + tarjetas de cristal 3D en la portada.
   - Las partículas arman el símbolo </> al entrar en pantalla y se deshacen cerca del cursor.
   - Las tarjetas se inclinan con el mouse y se mueven con distinta profundidad al hacer scroll.
   - Sin JS (o sin canvas) las tarjetas quedan como una cuadrícula normal. */
(function () {
  'use strict';
  var stage = document.querySelector('[data-gl-stage]');
  if (!stage) return;
  var cv = stage.querySelector('[data-gl-canvas]'), anchor = stage.querySelector('[data-gl-anchor]');
  var cards = Array.prototype.slice.call(stage.querySelectorAll('[data-gl-card]'));
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext('2d');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
  stage.classList.add('gl-js');

  var W = 0, H = 0, dpr = 1, ps = [], visible = false, raf = 0, last = 0, A = 0, Atarget = 0, time = 0;
  var ptr = { x: -999, y: -999, in: false }, tilt = { x: 0, y: 0, tx: 0, ty: 0 }, sp = 0;
  var COLORS = ['#C8F135', '#5BC0FF', '#9B8CFF', '#FF7A7A', '#FFFFFF'];
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  var ease = function (t) { return t < 0 ? 0 : t > 1 ? 1 : 1 - Math.pow(1 - t, 3); };

  function glyphPoints(cx, cy, size) {
    var oc = document.createElement('canvas'), w = Math.ceil(size * 1.9), h = Math.ceil(size * 1.1);
    oc.width = w; oc.height = h; var o = oc.getContext('2d');
    o.fillStyle = '#fff'; o.textAlign = 'center'; o.textBaseline = 'middle';
    o.font = '800 ' + size + 'px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    o.fillText('</>', w / 2, h / 2);
    var d = o.getImageData(0, 0, w, h).data, pts = [], step = Math.max(3, Math.round(size / 46));
    for (var y = 0; y < h; y += step) for (var x = 0; x < w; x += step) if (d[(y * w + x) * 4 + 3] > 140) pts.push([cx - w / 2 + x, cy - h / 2 + y, (x / w)]);
    return pts;
  }

  function build() {
    var r = stage.getBoundingClientRect(); W = r.width; H = r.height; dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var ar = anchor.getBoundingClientRect(), cx = ar.left - r.left + ar.width / 2, cy = ar.top - r.top + ar.height / 2;
    var size = Math.max(110, Math.min(ar.height * 0.95, ar.width * 0.62, 340));
    var pts = glyphPoints(cx, cy, size); ps = [];
    pts.forEach(function (p) {
      var t = p[2];
      ps.push({ hx: p[0], hy: p[1], x: rnd(0, W), y: rnd(0, H), vx: 0, vy: 0, sx: rnd(-.2, 1.2) * W, sy: rnd(-.2, 1.2) * H,
        c: t < .34 ? COLORS[0] : t < .62 ? COLORS[1] : COLORS[2], r: rnd(1.3, 2.6), ph: rnd(0, 6.28), g: 1 });
    });
    var n = Math.round(Math.min(280, W * H / 2600));
    for (var i = 0; i < n; i++) ps.push({ hx: rnd(0, W), hy: rnd(0, H), x: rnd(0, W), y: rnd(0, H), vx: 0, vy: 0, sx: rnd(0, W), sy: rnd(0, H),
      c: COLORS[Math.floor(rnd(0, 5))], r: rnd(.7, 1.6), ph: rnd(0, 6.28), g: 0 });
  }

  function frame(now) {
    raf = 0; if (!visible) return;
    var dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now; time += dt;
    A += (Atarget - A) * Math.min(1, dt * 1.6);
    var ea = ease(A);
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    var R = coarse ? 70 : 110, R2 = R * R, drift = reduce ? 0 : 1;
    for (var i = 0; i < ps.length; i++) {
      var p = ps[i], tx, ty;
      if (p.g) { tx = p.sx + (p.hx - p.sx) * ea; ty = p.sy + (p.hy - p.sy) * ea; } else { tx = p.hx + Math.sin(time * .35 + p.ph) * 14 * drift; ty = p.hy + Math.cos(time * .3 + p.ph) * 12 * drift - sp * 30 * (p.r - .7); }
      if (p.g && ea > .9) { tx += Math.sin(time * 1.2 + p.ph) * 1.4 * drift; ty += Math.cos(time * 1.1 + p.ph) * 1.4 * drift; }
      var dx = p.x - ptr.x, dy = p.y - ptr.y, d2 = dx * dx + dy * dy;
      if (ptr.in && d2 < R2) { var d = Math.sqrt(d2) || 1, f = (1 - d / R); p.vx += dx / d * f * f * 1500 * dt; p.vy += dy / d * f * f * 1500 * dt; }
      p.vx += (tx - p.x) * 7 * dt; p.vy += (ty - p.y) * 7 * dt;
      var damp = Math.pow(0.0025, dt); p.vx *= damp; p.vy *= damp;
      p.x += p.vx * dt; p.y += p.vy * dt;
      var tw = .55 + .45 * Math.sin(time * 2 + p.ph), speed = Math.min(1, (Math.abs(p.vx) + Math.abs(p.vy)) / 220);
      ctx.globalAlpha = (p.g ? .55 + .45 * tw : .25 + .4 * tw) * (.55 + ea * .45) + speed * .3;
      ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + speed * .8), 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';

    /* inclinación y profundidad de las tarjetas */
    tilt.x += (tilt.tx - tilt.x) * .08; tilt.y += (tilt.ty - tilt.y) * .08;
    var wide = W >= 992;
    for (var c = 0; c < cards.length; c++) {
      var el = cards[c], dd = +el.getAttribute('data-d') || 1, fy = reduce ? 0 : Math.sin(time * .9 + c * 1.7) * 6 * dd;
      var ty2 = wide ? (.5 - sp) * -46 * dd + fy : fy * .5, h = el._h ? 1.04 : 1;
      var tz = (wide ? 40 * dd : 0) + (el._h ? 30 : 0);
      el.style.transform = 'perspective(1000px) translate3d(' + (tilt.x * -12 * dd).toFixed(1) + 'px,' + (ty2 + tilt.y * -8 * dd).toFixed(1) + 'px,' + tz + 'px) rotateX(' + (tilt.y * 6).toFixed(2) + 'deg) rotateY(' + (tilt.x * -9).toFixed(2) + 'deg) scale(' + h + ')';
    }
    raf = requestAnimationFrame(frame);
  }

  function start() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  var onScroll = function () {
    var r = stage.getBoundingClientRect(), vh = window.innerHeight;
    sp = Math.max(0, Math.min(1, (vh - r.top) / (vh + r.height)));
    Atarget = r.top < vh * .72 ? 1 : 0;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { build(); onScroll(); });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) { build(); onScroll(); start(); } }, { threshold: 0 }).observe(stage);
  else { visible = true; build(); onScroll(); start(); }

  stage.addEventListener('pointermove', function (e) {
    var r = stage.getBoundingClientRect(); ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.in = true;
    if (!coarse) { tilt.tx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2); tilt.ty = (e.clientY - (r.top + r.height / 2)) / (r.height / 2); }
  }, { passive: true });
  stage.addEventListener('pointerleave', function () { ptr.in = false; tilt.tx = 0; tilt.ty = 0; });
  cards.forEach(function (el) {
    el.addEventListener('pointerenter', function () { el._h = true; });
    el.addEventListener('pointerleave', function () { el._h = false; el.style.removeProperty('--mx'); });
    el.addEventListener('pointermove', function (e) { var r = el.getBoundingClientRect(); el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%'); el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%'); }, { passive: true });
  });
  window.addEventListener('load', function () { if (visible) build(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (visible) build(); });
})();
