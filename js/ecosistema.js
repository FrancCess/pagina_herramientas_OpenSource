/* Esfera 3D del hero de Ecosistema: puntos, arcos con pulsos, arrastrable, con 3 puntos que enlazan a cada sección. */
(function () {
  'use strict';
  var box = document.querySelector('[data-eh-globe]'), cv = box && box.querySelector('[data-eh-canvas]');
  if (!box || !cv || !cv.getContext) return;
  var ctx = cv.getContext('2d'), pins = Array.prototype.slice.call(box.querySelectorAll('.eh-pin'));
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 0, dpr = 1, R = 0;
  var rotY = 0.6, rotX = -0.32, velY = reduce ? 0 : 0.0032, velX = 0, drag = false, lx = 0, ly = 0, visible = true, last = 0;

  /* puntos en la esfera (espiral de Fibonacci) */
  var N = 460, pts = [], i;
  for (i = 0; i < N; i++) {
    var y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * 2.399963229728653;
    pts.push({ x: Math.cos(th) * r, y: y, z: Math.sin(th) * r, s: 0.7 + ((i * 7919) % 100) / 100 * 0.9, tw: (i * 37) % 100 / 100 * 6.28 });
  }
  /* arcos entre puntos cercanos */
  var arcs = [], tries = 0;
  while (arcs.length < 30 && tries++ < 600) {
    var a = pts[(Math.random() * N) | 0], b = pts[(Math.random() * N) | 0];
    var dot = a.x * b.x + a.y * b.y + a.z * b.z, ang = Math.acos(Math.max(-1, Math.min(1, dot)));
    if (ang < 0.45 || ang > 1.5) continue;
    arcs.push({ a: a, b: b, ang: ang, off: Math.random(), sp: 0.12 + Math.random() * 0.14 });
  }
  var slerp = function (a, b, ang, t, lift) {
    var s = Math.sin(ang), k1 = Math.sin((1 - t) * ang) / s, k2 = Math.sin(t * ang) / s;
    var x = a.x * k1 + b.x * k2, y = a.y * k1 + b.y * k2, z = a.z * k1 + b.z * k2;
    var h = 1 + lift * Math.sin(Math.PI * t);
    return { x: x * h, y: y * h, z: z * h };
  };
  var rot = function (p) {
    var cy = Math.cos(rotY), sy = Math.sin(rotY), cx = Math.cos(rotX), sx = Math.sin(rotX);
    var x = p.x * cy + p.z * sy, z = -p.x * sy + p.z * cy, y = p.y * cx - z * sx; z = p.y * sx + z * cx;
    return { x: x, y: y, z: z };
  };
  var proj = function (p) { return { x: W / 2 + p.x * R, y: W / 2 - p.y * R, z: p.z }; };

  var size = function () {
    var r = box.getBoundingClientRect(); W = Math.max(200, r.width); dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = W * dpr; cv.height = W * dpr; R = W * 0.4;
  };
  size(); window.addEventListener('resize', size);

  var pinData = pins.map(function (el) {
    var la = (+el.getAttribute('data-lat')) * Math.PI / 180, lo = (+el.getAttribute('data-lon')) * Math.PI / 180;
    return { el: el, p: { x: Math.cos(la) * Math.sin(lo), y: Math.sin(la), z: Math.cos(la) * Math.cos(lo) } };
  });

  var draw = function (t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, W);
    /* halo */
    var g = ctx.createRadialGradient(W / 2, W / 2, R * 0.2, W / 2, W / 2, R * 1.25);
    g.addColorStop(0, 'rgba(40,90,170,.35)'); g.addColorStop(.7, 'rgba(20,50,110,.14)'); g.addColorStop(1, 'rgba(20,50,110,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(W / 2, W / 2, R * 1.25, 0, 6.2832); ctx.fill();
    ctx.fillStyle = 'rgba(8,22,50,.9)'; ctx.beginPath(); ctx.arc(W / 2, W / 2, R * 0.985, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = 'rgba(160,200,255,.18)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(W / 2, W / 2, R * 0.985, 0, 6.2832); ctx.stroke();
    /* puntos */
    for (var k = 0; k < N; k++) {
      var q = rot(pts[k]); if (q.z < -0.05) { if (q.z < -0.55) continue; }
      var pp = proj(q), depth = (q.z + 1) / 2, al = q.z < 0 ? 0.08 + depth * 0.2 : 0.25 + depth * 0.75;
      var tw = reduce ? 1 : 0.75 + 0.25 * Math.sin(t * 0.0018 + pts[k].tw);
      ctx.fillStyle = 'rgba(' + (q.z > 0.3 ? '200,241,53' : '170,205,255') + ',' + (al * tw).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(pp.x, pp.y, pts[k].s * (0.7 + depth * 0.9) * (W / 540), 0, 6.2832); ctx.fill();
    }
    /* arcos */
    for (var j = 0; j < arcs.length; j++) {
      var A = arcs[j], prev = null, vis = 0;
      ctx.beginPath();
      for (var s = 0; s <= 18; s++) {
        var pq = rot(slerp(A.a, A.b, A.ang, s / 18, 0.12 + A.ang * 0.16)), pr = proj(pq);
        if (pq.z < 0) { prev = null; continue; }
        if (prev) ctx.lineTo(pr.x, pr.y); else ctx.moveTo(pr.x, pr.y);
        prev = pr; vis++;
      }
      if (vis > 1) { ctx.strokeStyle = 'rgba(200,241,53,.28)'; ctx.lineWidth = 1.1; ctx.stroke(); }
      if (!reduce) {
        var tt = (t * 0.001 * A.sp + A.off) % 1, pq2 = rot(slerp(A.a, A.b, A.ang, tt, 0.12 + A.ang * 0.16));
        if (pq2.z > 0) { var p2 = proj(pq2); ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.shadowColor = '#C8F135'; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(p2.x, p2.y, 2.2 * (W / 540), 0, 6.2832); ctx.fill(); ctx.shadowBlur = 0; }
      }
    }
    /* pines HTML */
    pinData.forEach(function (d) {
      var q = rot(d.p), pp = proj(q), front = q.z > 0.12;
      d.el.style.transform = 'translate(' + pp.x.toFixed(1) + 'px,' + pp.y.toFixed(1) + 'px) translate(-50%,-50%)';
      d.el.style.opacity = front ? Math.min(1, (q.z - 0.12) * 3.5).toFixed(2) : 0;
      d.el.style.pointerEvents = front ? 'auto' : 'none';
      d.el.tabIndex = front ? 0 : -1;
      d.el.classList.toggle('is-left', pp.x > W * 0.52);
    });
  };

  var frame = function (t) {
    if (!visible) return;
    var dt = Math.min(48, t - last || 16); last = t;
    if (!drag) {
      rotY += velY * dt / 16; rotX += velX * dt / 16;
      velX *= 0.95; if (Math.abs(velY) > (reduce ? 0 : 0.0032)) velY *= 0.96; else if (!reduce) velY = 0.0032;
      rotX += (-0.32 - rotX) * 0.01;
    }
    draw(t);
    requestAnimationFrame(frame);
  };
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) {
    var v = es[0].isIntersecting; if (v && !visible) { visible = true; last = 0; requestAnimationFrame(frame); } visible = v;
  }, { threshold: 0.02 }).observe(box);
  requestAnimationFrame(frame);

  /* arrastre */
  box.addEventListener('pointerdown', function (e) { if (e.target.closest('.eh-pin')) return; drag = true; lx = e.clientX; ly = e.clientY; box.classList.add('is-drag'); try { box.setPointerCapture(e.pointerId); } catch (x) {} });
  box.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
    rotY += dx * 0.008; rotX = Math.max(-1.1, Math.min(1.1, rotX + dy * 0.006)); velY = dx * 0.0016; velX = dy * 0.0012;
    if (reduce) draw(performance.now());
  });
  var end = function () { drag = false; box.classList.remove('is-drag'); };
  box.addEventListener('pointerup', end); box.addEventListener('pointercancel', end); box.addEventListener('lostpointercapture', end);
  if (reduce) { draw(0); }
})();


/* Portada bento: luz que sigue al cursor en cada tarjeta */
(function () {
  var cards = document.querySelectorAll('[data-eb]');
  if (!cards.length || !(window.matchMedia && matchMedia('(pointer: fine)').matches)) return;
  Array.prototype.forEach.call(cards, function (c) {
    c.addEventListener('pointermove', function (e) {
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });
})();


/* ¿Sabías que…?: un dato curioso que cambia cada 7 s (pausa al pasar el mouse; sin auto con "reducir movimiento") */
(function () {
  var box = document.querySelector('[data-ec-sabias]'); if (!box) return;
  var ds = box.querySelectorAll('.ec-dato'), pts = box.querySelectorAll('.ec-pt'), cur = 0, timer = null, paused = false;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function show(i) {
    cur = (i + ds.length) % ds.length;
    Array.prototype.forEach.call(ds, function (d, k) { d.hidden = k !== cur; d.classList.toggle('is-on', k === cur); });
    Array.prototype.forEach.call(pts, function (p, k) { p.classList.toggle('is-on', k === cur); p.setAttribute('aria-current', k === cur ? 'true' : 'false'); });
  }
  Array.prototype.forEach.call(pts, function (p) { p.addEventListener('click', function () { show(+p.getAttribute('data-i')); }); });
  var nx = box.querySelector('[data-ec-next]'); if (nx) nx.addEventListener('click', function () { show(cur + 1); });
  if (reduce) return;
  box.querySelector('.ec-datos').setAttribute('aria-live', 'off');
  ['pointerenter', 'focusin'].forEach(function (ev) { box.addEventListener(ev, function () { paused = true; }); });
  ['pointerleave', 'focusout'].forEach(function (ev) { box.addEventListener(ev, function () { paused = false; }); });
  timer = setInterval(function () { if (!paused && !document.hidden) show(cur + 1); }, 7000);
})();
