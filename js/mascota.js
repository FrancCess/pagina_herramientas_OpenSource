/* Mascota "Bit": mira al cursor, gira la cabeza, parpadea y saluda al hacer clic. */
(function () {
  'use strict';
  var root = document.querySelector('[data-bit]');
  if (!root) return;
  var head = root.querySelector('[data-bit-head]'), face = root.querySelector('[data-bit-face]');
  var say = root.querySelector('[data-bit-say]');
  var eyes = Array.prototype.map.call(root.querySelectorAll('[data-eye]'), function (g) {
    var c = g.getAttribute('data-eye').split(' ');
    return { g: g, x: +c[0], y: +c[1], p: g.querySelector('[data-pupil]') };
  });
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cur = { x: 0, y: 0 }, tgt = { x: 0, y: 0 }, near = 0, blink = 1, visible = true;
  var lastMove = 0, wander = null, hat = 0;

  var look = function (cx, cy) {
    var r = head.getBoundingClientRect();
    var ox = r.left + r.width / 2, oy = r.top + r.height * 0.5;
    var dx = cx - ox, dy = cy - oy, d = Math.sqrt(dx * dx + dy * dy) || 1;
    var f = Math.min(1, d / 220);
    tgt.x = dx / d * f; tgt.y = dy / d * f;
    near = d < r.width * 0.7 ? 1 : 0;
  };
  window.addEventListener('pointermove', function (e) { lastMove = performance.now(); wander = null; look(e.clientX, e.clientY); }, { passive: true });
  window.addEventListener('pointerdown', function (e) { lastMove = performance.now(); look(e.clientX, e.clientY); }, { passive: true });
  document.addEventListener('pointerleave', function () { tgt.x = 0; tgt.y = 0; });

  var scale = 1;
  var frame = function () {
    cur.x += (tgt.x - cur.x) * 0.14; cur.y += (tgt.y - cur.y) * 0.14;
    scale += ((near ? 0.78 : 1) - scale) * 0.12;
    var tilt = reduce ? 0 : 1;
    head.style.transform = 'perspective(700px) rotateY(' + (cur.x * 15 * tilt).toFixed(2) + 'deg) rotateX(' + (-cur.y * 11 * tilt).toFixed(2) + 'deg) rotateZ(' + (cur.x * 2.5 * tilt).toFixed(2) + 'deg)';
    face.setAttribute('transform', 'translate(' + (cur.x * 10).toFixed(2) + ' ' + (cur.y * 7).toFixed(2) + ')');
    eyes.forEach(function (e) {
      e.g.setAttribute('transform', 'translate(' + e.x + ' ' + e.y + ') scale(1 ' + blink.toFixed(3) + ')');
      e.p.setAttribute('transform', 'translate(' + (cur.x * 13).toFixed(2) + ' ' + (cur.y * 13).toFixed(2) + ') scale(' + scale.toFixed(3) + ')');
    });
    if (visible) requestAnimationFrame(frame);
  };
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) {
    var v = es[0].isIntersecting; if (v && !visible) { visible = true; requestAnimationFrame(frame); } visible = v;
  }, { threshold: 0.05 }).observe(root);
  requestAnimationFrame(frame);

  /* parpadeo y mirada errante cuando nadie mueve el mouse */
  if (!reduce) {
    var doBlink = function () {
      var t0 = performance.now();
      var step = function (t) {
        var k = (t - t0) / 160;
        blink = k < 0.5 ? 1 - k * 2 * 0.92 : k < 1 ? 0.08 + (k - 0.5) * 2 * 0.92 : 1;
        if (k < 1) requestAnimationFrame(step); else blink = 1;
      };
      requestAnimationFrame(step);
      setTimeout(doBlink, 2200 + Math.random() * 3200);
    };
    setTimeout(doBlink, 1800);
    setInterval(function () {
      if (!visible || performance.now() - lastMove < 3000 || root.classList.contains('is-happy')) return;
      var a = Math.random() * Math.PI * 2, m = 0.35 + Math.random() * 0.65;
      tgt.x = Math.cos(a) * m; tgt.y = Math.sin(a) * m * 0.6; near = 0;
    }, 1700);
  }

  /* clic / Enter: saluda */
  var lines = ['¡Hola! Soy Bit.', 'El código es de todos.', '¿Ya viste las herramientas?', 'Tu primer pull request te espera.', 'Aquí todo es libre y gratis.', '¡Fork, cambia, comparte!'];
  var n = 0, tHappy = null, tSay = null;
  var greet = function () {
    root.classList.add('is-happy'); root.classList.remove('is-hop'); void root.offsetWidth; root.classList.add('is-hop');
    say.textContent = lines[n++ % lines.length]; say.classList.add('is-on');
    clearTimeout(tHappy); clearTimeout(tSay);
    tHappy = setTimeout(function () { root.classList.remove('is-happy'); }, 1700);
    tSay = setTimeout(function () { say.classList.remove('is-on'); }, 2800);
  };
  root.addEventListener('click', greet);
  root.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); greet(); } });
})();
