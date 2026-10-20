/* Portada extendida: cuatro libertades (pestañas), licencias (tarjetas que voltean),
   hitos (carril horizontal) y test "¿qué distro te conviene?". */
(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Cuatro libertades ---------- */
  (function () {
    var root = document.querySelector('[data-ix-free]'); if (!root) return;
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]')), panels = Array.prototype.slice.call(root.querySelectorAll('[role="tabpanel"]'));
    var cur = 0, timer = 0, touched = false, vis = false;
    var go = function (i, focus) {
      cur = (i + tabs.length) % tabs.length;
      tabs.forEach(function (t, k) { var on = k === cur; t.classList.toggle('is-on', on); t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
      panels.forEach(function (p, k) { var on = k === cur; p.classList.toggle('is-on', on); p.hidden = !on; });
      if (focus) tabs[cur].focus();
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { touched = true; go(i); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); touched = true; go(cur + 1, true); }
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); touched = true; go(cur - 1, true); }
        else if (e.key === 'Home') { e.preventDefault(); go(0, true); } else if (e.key === 'End') { e.preventDefault(); go(tabs.length - 1, true); }
      });
    });
    if (!reduce && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { vis = en[0].isIntersecting; }, { threshold: .4 }).observe(root);
      timer = setInterval(function () { if (vis && !touched && !document.hidden) go(cur + 1); }, 6000);
    }
  })();

  /* ---------- Licencias ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.ix-lic'), function (b) {
    b.addEventListener('click', function () { var on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on); });
  });

  /* ---------- Hitos ---------- */
  (function () {
    var root = document.querySelector('[data-ix-tl]'); if (!root) return;
    var sc = root.querySelector('[data-tl-scroll]'), prog = root.querySelector('[data-tl-prog]');
    var prev = root.querySelector('[data-tl-prev]'), next = root.querySelector('[data-tl-next]');
    var step = function () { var c = sc.querySelector('.ix-tl-card'); return c ? c.getBoundingClientRect().width + 16 : 300; };
    var upd = function () { var max = sc.scrollWidth - sc.clientWidth; var p = max > 0 ? sc.scrollLeft / max : 1; prog.style.transform = 'scaleX(' + Math.max(.06, p).toFixed(3) + ')'; prev.disabled = sc.scrollLeft < 4; next.disabled = sc.scrollLeft > max - 4; };
    prev.addEventListener('click', function () { sc.scrollBy({ left: -step(), behavior: reduce ? 'auto' : 'smooth' }); });
    next.addEventListener('click', function () { sc.scrollBy({ left: step(), behavior: reduce ? 'auto' : 'smooth' }); });
    sc.addEventListener('scroll', upd, { passive: true }); window.addEventListener('resize', upd); upd();
    /* arrastrar con el mouse */
    var down = false, sx = 0, sl = 0, moved = 0;
    sc.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; sx = e.clientX; sl = sc.scrollLeft; moved = 0; sc.classList.add('is-drag'); });
    window.addEventListener('pointermove', function (e) { if (!down) return; moved = Math.abs(e.clientX - sx); sc.scrollLeft = sl - (e.clientX - sx); });
    window.addEventListener('pointerup', function () { if (!down) return; down = false; sc.classList.remove('is-drag'); });
  })();

  /* ---------- Test de distro ---------- */
  (function () {
    var root = document.querySelector('[data-ix-quiz]'); if (!root) return;
    var box = root.querySelector('[data-q-box]'), bar = root.querySelector('[data-q-prog]');
    var D = {
      ubuntu: { n: 'Ubuntu', href: 'pages/tools/ubuntu.html', why: 'Es una de las distros más populares, con muchísima documentación y ayuda en foros. Una apuesta segura para empezar, estudiar o programar.' },
      mint: { n: 'Linux Mint', href: 'pages/tools/linux-mint.html', why: 'Tiene un escritorio clásico, parecido a lo que ya conoces, y está pensada para que todo funcione sin complicarte.' },
      zorin: { n: 'Zorin OS', href: 'pages/tools/zorin-os.html', why: 'Está diseñada para quien viene de Windows o macOS: se ve familiar y la transición es suave.' },
      fedora: { n: 'Fedora', href: 'pages/tools/fedora.html', why: 'Trae software reciente y está respaldada por Red Hat. Muy buena para aprender y trabajar con herramientas modernas.' },
      debian: { n: 'Debian', href: 'pages/tools/debian.html', why: 'Es muy estable y es la base de muchas otras distros, incluida Ubuntu. Perfecta si prefieres que nada cambie de golpe.' },
      arch: { n: 'Arch Linux', href: 'pages/tools/arch-linux.html', why: 'Tú armas el sistema pieza por pieza y siempre estás al día. Ideal para aprender Linux a fondo, con paciencia.' }
    };
    var Q = [
      { q: '¿Cómo te llevas con instalar y configurar cosas?', o: [['Quiero que funcione sin tocar nada', { ubuntu: 2, mint: 2, zorin: 2 }], ['Me gusta aprender y ajustar un poco', { fedora: 2, debian: 2, ubuntu: 1 }], ['Quiero controlar cada detalle', { arch: 3, debian: 1 }]] },
      { q: '¿De dónde vienes?', o: [['De Windows y quiero algo parecido', { zorin: 3, mint: 2 }], ['De un poco de todo', { ubuntu: 2, fedora: 1, mint: 1 }], ['De Mac o de Linux', { fedora: 2, arch: 2, debian: 1 }]] },
      { q: '¿Qué valoras más?', o: [['Estabilidad: que no se rompa', { debian: 3, ubuntu: 1, mint: 1 }], ['Lo más nuevo siempre', { arch: 2, fedora: 3 }], ['Facilidad y buen aspecto', { zorin: 2, mint: 2, ubuntu: 2 }]] },
      { q: '¿Para qué lo usarás sobre todo?', o: [['Estudiar y programar', { ubuntu: 2, fedora: 2, debian: 1 }], ['Uso diario: escuela, web, documentos', { mint: 3, zorin: 2, ubuntu: 1 }], ['Aprender cómo funciona Linux', { arch: 3, debian: 2 }]] }
    ];
    var step = 0, score = {};
    var esc = function (t) { return String(t).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); };
    var render = function () {
      bar.style.transform = 'scaleX(' + (step / Q.length) + ')';
      if (step < Q.length) {
        var it = Q[step];
        box.innerHTML = '<p class="ix-q-n">Pregunta ' + (step + 1) + ' de ' + Q.length + '</p><h3>' + esc(it.q) + '</h3><div class="ix-q-opts">' +
          it.o.map(function (o, i) { return '<button type="button" data-o="' + i + '">' + esc(o[0]) + '</button>'; }).join('') + '</div>';
        box.classList.remove('is-in'); void box.offsetWidth; box.classList.add('is-in');
      } else {
        var best = null, bv = -1; Object.keys(D).forEach(function (k) { if ((score[k] || 0) > bv) { bv = score[k] || 0; best = k; } });
        var d = D[best];
        box.innerHTML = '<p class="ix-q-n">Tu resultado</p><h3 class="ix-q-res">' + esc(d.n) + '</h3><p class="ix-q-why">' + esc(d.why) + '</p><div class="ix-q-act"><a class="btn-primary-os" href="' + d.href + '">Ver ficha de ' + esc(d.n) + '</a><button type="button" class="ix-q-again" data-again>Repetir el test</button></div>';
        box.classList.remove('is-in'); void box.offsetWidth; box.classList.add('is-in');
      }
    };
    box.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-again')) { step = 0; score = {}; render(); return; }
      var i = +b.getAttribute('data-o'); if (isNaN(i)) return;
      var add = Q[step].o[i][1]; Object.keys(add).forEach(function (k) { score[k] = (score[k] || 0) + add[k]; });
      step++; render();
      var f = box.querySelector('button, a'); if (f) f.focus({ preventScroll: true });
    });
    render();
  })();
})();
