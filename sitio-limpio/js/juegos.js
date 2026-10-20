/* Juegos: galería filtrable con visor, test "¿Qué juego es para ti?" y línea del tiempo arrastrable.
   Solo corre en pages/juegos.html (body.tp-juegos). */
(function () {
  'use strict';
  if (!document.body.classList.contains('tp-juegos')) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Galería ---------- */
  var grid = document.querySelector('.jg-grid');
  if (grid) {
    var chips = Array.prototype.slice.call(document.querySelectorAll('.jg-chip'));
    var current = '*';
    var tiles = function () { return Array.prototype.slice.call(grid.querySelectorAll('.jg-tile')); };
    var counts = function () {
      var all = tiles();
      chips.forEach(function (c) {
        var g = c.getAttribute('data-g');
        var n = g === '*' ? all.length : all.filter(function (t) { return t.getAttribute('data-game') === g; }).length;
        c.querySelector('small').textContent = n;
        c.hidden = n === 0 && g !== '*';
      });
      var sec = document.getElementById('galeria');
      if (sec) sec.hidden = all.length === 0;
    };
    var apply = function (g) {
      current = g;
      chips.forEach(function (c) { var on = c.getAttribute('data-g') === g; c.classList.toggle('is-on', on); c.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      tiles().forEach(function (t) { t.classList.toggle('is-out', g !== '*' && t.getAttribute('data-game') !== g); });
    };
    chips.forEach(function (c) { c.addEventListener('click', function () { apply(c.getAttribute('data-g')); }); });
    /* las imágenes que no existen se quitan solas (onerror); recalcular al cargar */
    counts();
    if ('MutationObserver' in window) new MutationObserver(counts).observe(grid, { childList: true });
    window.addEventListener('load', counts);

    /* visor */
    var lb = null, idx = 0, list = [], lastFocus = null;
    var visible = function () { return tiles().filter(function (t) { return !t.classList.contains('is-out'); }); };
    var show = function (i) {
      if (!list.length) return;
      idx = (i + list.length) % list.length;
      var t = list[idx], im = t.querySelector('img'), b = t.querySelector('figcaption b').textContent, s = t.querySelector('figcaption span').textContent;
      lb.querySelector('img').src = im.currentSrc || im.src; lb.querySelector('img').alt = im.alt;
      lb.querySelector('.jg-lb-cap b').textContent = b; lb.querySelector('.jg-lb-cap span').textContent = s;
      lb.querySelector('.jg-lb-go').href = t.querySelector('.jg-shot').getAttribute('data-href');
      lb.querySelector('.jg-lb-count').textContent = (idx + 1) + ' / ' + list.length;
    };
    var close = function () {
      if (!lb) return; var l = lb; lb = null; l.classList.remove('is-in');
      document.removeEventListener('keydown', onKey); document.documentElement.style.overflow = '';
      setTimeout(function () { l.remove(); }, 250); if (lastFocus) lastFocus.focus();
    };
    var onKey = function (e) {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') show(idx + 1);
      else if (e.key === 'ArrowLeft') show(idx - 1);
      else if (e.key === 'Tab') { var f = lb.querySelectorAll('button, a'); var first = f[0], last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); } else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); } }
    };
    var open = function (tile) {
      list = visible(); idx = list.indexOf(tile); lastFocus = document.activeElement;
      lb = document.createElement('div'); lb.className = 'jg-lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Imagen ampliada');
      lb.innerHTML = '<button type="button" class="jg-lb-x" aria-label="Cerrar">✕</button>' +
        '<button type="button" class="jg-lb-nav jg-lb-prev" aria-label="Anterior">‹</button>' +
        '<figure><img alt=""><figcaption class="jg-lb-cap"><b></b><span></span><em class="jg-lb-count"></em><a class="jg-lb-go" href="#">Ver ficha →</a></figcaption></figure>' +
        '<button type="button" class="jg-lb-nav jg-lb-next" aria-label="Siguiente">›</button>';
      document.body.appendChild(lb); document.documentElement.style.overflow = 'hidden';
      lb.querySelector('.jg-lb-x').addEventListener('click', close);
      lb.querySelector('.jg-lb-prev').addEventListener('click', function () { show(idx - 1); });
      lb.querySelector('.jg-lb-next').addEventListener('click', function () { show(idx + 1); });
      lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
      document.addEventListener('keydown', onKey);
      show(idx); requestAnimationFrame(function () { lb && lb.classList.add('is-in'); });
      lb.querySelector('.jg-lb-x').focus();
    };
    grid.addEventListener('click', function (e) { var b = e.target.closest('.jg-shot'); if (b) open(b.closest('.jg-tile')); });
    /* inclinación suave con el mouse */
    if (!reduce) grid.addEventListener('pointermove', function (e) {
      var t = e.target.closest('.jg-tile'); if (!t || e.pointerType !== 'mouse') return;
      var r = t.getBoundingClientRect(); t.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%'); t.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    });
  }

  /* ---------- Test ---------- */
  var quiz = document.querySelector('[data-quiz]');
  if (quiz) {
    var G = {
      '0-ad': { n: '0 A.D.', d: 'Estrategia en tiempo real con civilizaciones antiguas: construye tu ciudad, junta recursos y dirige ejércitos. Ideal si te gusta planear.', img: '0-ad-3' },
      'battle-for-wesnoth': { n: 'Battle for Wesnoth', d: 'Estrategia por turnos en un mundo de fantasía. Piensas cada jugada con calma y corre bien incluso en computadoras modestas.', img: 'battle-for-wesnoth-1' },
      'minetest': { n: 'Minetest (Luanti)', d: 'Un mundo de bloques para explorar, minar y construir a tu ritmo, con miles de mods hechos por la comunidad.', img: 'minetest-1' },
      'supertuxkart': { n: 'SuperTuxKart', d: 'Carreras rápidas y divertidas con la mascota de Linux. Perfecto para partidas cortas y para jugar con amigos en la misma pantalla.', img: 'supertuxkart-1' },
      'steam-proton': { n: 'Steam + Proton', d: 'Si ya tienes juegos de Windows, Proton te deja jugar muchos de ellos en Linux sin hacer nada especial.', img: 'steam-proton-2' },
      'lutris': { n: 'Lutris', d: 'Junta en un solo lugar tus juegos de distintas tiendas, emuladores y juegos nativos. Ideal si tienes de todo un poco.', img: 'lutris-3' }
    };
    var ORDER = ['supertuxkart', 'minetest', '0-ad', 'battle-for-wesnoth', 'steam-proton', 'lutris'];
    var Q = [
      { q: '¿Qué es lo que más disfrutas en un juego?', a: [
        ['Construir y explorar', { 'minetest': 3 }],
        ['Planear estrategias', { '0-ad': 2, 'battle-for-wesnoth': 2 }],
        ['Velocidad y acción', { 'supertuxkart': 3, 'steam-proton': 1 }],
        ['Seguir con mis juegos de Windows', { 'steam-proton': 3, 'lutris': 2 }]] },
      { q: '¿Cuánto tiempo le dedicas a una partida?', a: [
        ['De 5 a 10 minutos', { 'supertuxkart': 2 }],
        ['Una tarde entera', { '0-ad': 2, 'minetest': 1, 'battle-for-wesnoth': 1 }],
        ['Sin prisa, a mi ritmo', { 'minetest': 2, 'battle-for-wesnoth': 1 }],
        ['Depende del juego', { 'steam-proton': 1, 'lutris': 1 }]] },
      { q: '¿Con quién juegas normalmente?', a: [
        ['Solo', { 'battle-for-wesnoth': 2, 'minetest': 1 }],
        ['Con amigos en la misma compu', { 'supertuxkart': 3 }],
        ['En línea', { '0-ad': 2, 'minetest': 1, 'supertuxkart': 1 }],
        ['Con mi familia o con niños', { 'supertuxkart': 2, 'minetest': 2 }]] },
      { q: '¿Cómo es tu computadora?', a: [
        ['Modesta o algo vieja', { 'battle-for-wesnoth': 2, 'supertuxkart': 1, 'minetest': 1 }],
        ['Normal, de uso diario', { '0-ad': 1, 'minetest': 1, 'supertuxkart': 1 }],
        ['Potente, con buena tarjeta gráfica', { 'steam-proton': 2, '0-ad': 1 }],
        ['Tengo juegos de varias tiendas', { 'lutris': 3 }]] }
    ];
    var body = quiz.querySelector('[data-body]'), step = quiz.querySelector('[data-step]'), bar = quiz.querySelector('[data-bar]');
    var i = 0, score = {};
    var esc = function (s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; };
    var render = function () {
      step.textContent = 'Pregunta ' + (i + 1) + ' de ' + Q.length;
      bar.style.transform = 'scaleX(' + (i / Q.length) + ')';
      var q = Q[i];
      body.innerHTML = '<h3 class="jg-q-t">' + esc(q.q) + '</h3><div class="jg-q-opts">' + q.a.map(function (o, k) {
        return '<button type="button" class="jg-q-opt" data-k="' + k + '"><span>' + String.fromCharCode(65 + k) + '</span>' + esc(o[0]) + '</button>';
      }).join('') + '</div>' + (i > 0 ? '<button type="button" class="jg-q-back">← Anterior</button>' : '');
      body.classList.remove('is-in'); void body.offsetWidth; body.classList.add('is-in');
    };
    var hist = [];
    var result = function () {
      step.textContent = '¡Resultado!'; bar.style.transform = 'scaleX(1)';
      var best = ORDER.slice().sort(function (a, b) { return (score[b] || 0) - (score[a] || 0) || ORDER.indexOf(a) - ORDER.indexOf(b); });
      var g = G[best[0]], alt = G[best[1]];
      body.innerHTML = '<div class="jg-res"><div class="jg-res-media"><img src="../img/capturas/' + g.img + '.jpg" alt="" onerror="this.remove()"><span>Tu juego</span></div>' +
        '<div class="jg-res-txt"><small>Te recomendamos</small><h3>' + esc(g.n) + '</h3><p>' + esc(g.d) + '</p>' +
        '<div class="jg-res-cta"><a class="tp-btn tp-btn-main" href="tools/' + best[0] + '.html">Ver ficha →</a><button type="button" class="jg-q-again">Repetir el test</button></div>' +
        '<p class="jg-res-alt">También podría gustarte: <a href="tools/' + best[1] + '.html">' + esc(alt.n) + '</a></p></div></div>';
      body.classList.remove('is-in'); void body.offsetWidth; body.classList.add('is-in');
    };
    body.addEventListener('click', function (e) {
      var o = e.target.closest('.jg-q-opt');
      if (o) {
        var add = Q[i].a[+o.getAttribute('data-k')][1]; hist.push(add);
        Object.keys(add).forEach(function (k) { score[k] = (score[k] || 0) + add[k]; });
        i++; if (i < Q.length) render(); else result();
        var f = body.querySelector('button, a'); if (f) f.focus({ preventScroll: true });
        return;
      }
      if (e.target.closest('.jg-q-back')) {
        var last = hist.pop(); if (last) Object.keys(last).forEach(function (k) { score[k] -= last[k]; });
        i = Math.max(0, i - 1); render(); return;
      }
      if (e.target.closest('.jg-q-again')) { i = 0; score = {}; hist = []; render(); }
    });
    render();
  }

  /* ---------- Línea del tiempo: arrastrar con el mouse ---------- */
  var track = document.querySelector('.jg-track');
  if (track) {
    var down = false, sx = 0, sl = 0, moved = false;
    track.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = track.scrollLeft; track.classList.add('is-drag'); });
    window.addEventListener('pointermove', function (e) { if (!down) return; var dx = e.clientX - sx; if (Math.abs(dx) > 4) moved = true; track.scrollLeft = sl - dx; });
    window.addEventListener('pointerup', function () { down = false; track.classList.remove('is-drag'); });
    track.addEventListener('click', function (e) { if (moved) { e.preventDefault(); moved = false; } }, true);
    var upd = function () {
      var max = track.scrollWidth - track.clientWidth;
      track.parentNode.style.setProperty('--p', max > 0 ? (track.scrollLeft / max).toFixed(3) : 1);
      track.parentNode.classList.toggle('at-start', track.scrollLeft < 8);
      track.parentNode.classList.toggle('at-end', track.scrollLeft > max - 8);
    };
    track.addEventListener('scroll', upd, { passive: true }); window.addEventListener('resize', upd); upd();
  }
})();
