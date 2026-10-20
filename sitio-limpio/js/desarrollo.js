/* Desarrollo v2 — carrusel 3D (Swiper) + carriles de frameworks.
   Mejora progresiva: sin Swiper las tarjetas quedan en una tira con scroll horizontal. */
(function () {
  'use strict';
  if (!document.body.classList.contains('tp-desarrollo')) return;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ───────── Carrusel 3D de lenguajes ───────── */
  var stage = $('[data-dv-stage]'), el = $('[data-dv-swiper]');
  if (stage && el && window.Swiper) {
    var slides = $$('.swiper-slide', el);
    var total = slides.length;
    var thumbs = $$('.dv-th', stage), chips = $$('.dv-chip', stage);
    var now = $('[data-dv-now]', stage), cnt = $('[data-dv-count]', stage), bar = $('[data-dv-bar]', stage);
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };

    var sw = new Swiper(el, {
      effect: 'coverflow', grabCursor: true, centeredSlides: true, slidesPerView: 'auto',
      loop: true, loopAdditionalSlides: 3, speed: 750, slideToClickedSlide: true,
      noSwiping: true, noSwipingSelector: '.dv-go', preventClicks: false, preventClicksPropagation: false, /* el botón "Ver ficha" no arrastra el carrusel */
      keyboard: { enabled: true, onlyInViewport: true },
      coverflowEffect: { rotate: 30, stretch: 0, depth: 190, modifier: 1, slideShadows: false },
      breakpoints: { 0: { coverflowEffect: { rotate: 20, depth: 130, stretch: 0, modifier: 1, slideShadows: false } }, 768: { coverflowEffect: { rotate: 30, depth: 190, stretch: 0, modifier: 1, slideShadows: false } } },
      a11y: { enabled: true, prevSlideMessage: 'Lenguaje anterior', nextSlideMessage: 'Lenguaje siguiente' }
    });
    stage.classList.add('is-live');

    /* "Ver ficha": abrir siempre la ficha al tocar el botón de la tarjeta activa
       (Swiper a veces se 'come' el clic si el mouse o el dedo se mueve un poco). */
    el.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('.dv-go'); if (!a) return;
      var slide = a.closest('.swiper-slide');
      if (slide && !slide.classList.contains('swiper-slide-active')) { e.preventDefault(); sw.slideToLoop(realIdx(slide)); return; }
      e.preventDefault(); e.stopPropagation(); window.location.href = a.href;
    }, true);
    var downGo = null;
    el.addEventListener('pointerdown', function (e) {
      var a = e.target.closest && e.target.closest('.swiper-slide-active .dv-go');
      downGo = a ? { a: a, x: e.clientX, y: e.clientY } : null;
    }, true);
    document.addEventListener('pointerup', function (e) {
      if (!downGo) return; var d = downGo; downGo = null;
      if (Math.abs(e.clientX - d.x) > 20 || Math.abs(e.clientY - d.y) > 20) return;
      e.preventDefault(); window.location.href = d.a.href; /* la tarjeta se inclina y el botón se mueve bajo el cursor */
    }, true);

    var realIdx = function (s) { var v = s.getAttribute('data-swiper-slide-index'); return v === null ? -1 : +v; };
    var groupsFirst = {};
    $$('.swiper-slide:not(.swiper-slide-duplicate)', el).forEach(function (s) {
      var g = s.getAttribute('data-group'), i = realIdx(s);
      if (!(g in groupsFirst) || i < groupsFirst[g]) groupsFirst[g] = i;
    });
    var original = $$('.swiper-slide:not(.swiper-slide-duplicate)', el).sort(function (a, b) { return realIdx(a) - realIdx(b); });

    var update = function () {
      var i = sw.realIndex, s = original[i];
      if (!s) return;
      var col = getComputedStyle(s).getPropertyValue('--c').trim() || s.style.getPropertyValue('--c');
      stage.style.setProperty('--dv', col);
      if (now) now.textContent = s.getAttribute('data-name');
      if (cnt) cnt.textContent = pad(i + 1) + ' / ' + pad(total);
      if (bar) bar.style.setProperty('--p', ((i + 1) / total).toFixed(3));
      thumbs.forEach(function (t, k) {
        var on = k === i; t.classList.toggle('is-on', on); t.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (on && t.parentNode.scrollWidth > t.parentNode.clientWidth) {
          var p = t.parentNode; p.scrollTo({ left: t.offsetLeft - (p.clientWidth - t.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
        }
      });
      var g = s.getAttribute('data-group');
      chips.forEach(function (c) { c.classList.toggle('is-on', c.getAttribute('data-group') === g); });
    };
    sw.on('slideChange', update); update();

    thumbs.forEach(function (t, k) { t.addEventListener('click', function () { sw.autoplay && sw.autoplay.running && sw.autoplay.stop(); sw.slideToLoop(k); }); });
    chips.forEach(function (c) { c.addEventListener('click', function () { var k = groupsFirst[c.getAttribute('data-group')]; if (k !== undefined) sw.slideToLoop(k); }); });
    var pv = $('[data-dv-prev]', stage), nx = $('[data-dv-next]', stage);
    if (pv) pv.addEventListener('click', function () { sw.slidePrev(); });
    if (nx) nx.addEventListener('click', function () { sw.slideNext(); });

    /* Autoplay solo cuando la sección está en pantalla y sin reduced-motion */
    if (!reduce && 'IntersectionObserver' in window) {
      var timer = null, active = false, paused = false;
      var tick = function () { if (active && !paused && !document.hidden) sw.slideNext(); };
      var start = function () { if (!timer) timer = setInterval(tick, 4200); };
      var halt = function () { clearInterval(timer); timer = null; };
      new IntersectionObserver(function (es) { es.forEach(function (e) { active = e.isIntersecting; active ? start() : halt(); }); }, { threshold: 0.35 }).observe(stage);
      ['pointerenter', 'focusin'].forEach(function (ev) { stage.addEventListener(ev, function () { paused = true; }); });
      ['pointerleave', 'focusout'].forEach(function (ev) { stage.addEventListener(ev, function () { paused = false; }); });
      stage.addEventListener('pointerdown', function () { halt(); active = false; });
    }

    /* Inclinación 3D de la tarjeta activa con el mouse */
    if (fine && !reduce) {
      el.addEventListener('pointermove', function (e) {
        var s = $('.swiper-slide-active .dv-card', el); if (!s) return;
        var r = s.getBoundingClientRect();
        var x = (e.clientX - (r.left + r.width / 2)) / r.width, y = (e.clientY - (r.top + r.height / 2)) / r.height;
        s.style.setProperty('--ry', (x * 9).toFixed(2) + 'deg'); s.style.setProperty('--rx', (-y * 7).toFixed(2) + 'deg');
      });
      el.addEventListener('pointerleave', function () { $$('.dv-card', el).forEach(function (c) { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); }); });
    }
  }

  /* ───────── Carriles de frameworks ───────── */
  var lanes = $$('[data-lane]');
  var detail = $('[data-fw-detail]');
  var chipsFw = $$('.fw-chip');
  var show = function (slug) {
    var tpl = $('template[data-fw-tpl="' + slug + '"]');
    if (!tpl || !detail) return;
    detail.innerHTML = '';
    detail.appendChild(tpl.content.cloneNode(true));
    chipsFw.forEach(function (c) { c.classList.toggle('is-on', c.getAttribute('data-fw') === slug); });
    var b = $('[data-copy]', detail);
    if (b) b.addEventListener('click', function () {
      var txt = $('code', detail).textContent, done = function () { b.textContent = '¡Copiado!'; b.classList.add('ok'); setTimeout(function () { b.textContent = 'Copiar'; b.classList.remove('ok'); }, 1500); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, done);
      else { var ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(ta); done(); }
    });
  };
  chipsFw.forEach(function (c) { c.addEventListener('click', function () { show(c.getAttribute('data-fw')); }); });
  var firstChip = chipsFw[0];
  if (firstChip) show(firstChip.getAttribute('data-fw'));

  var lanesWrap = $('[data-lanes]'), tg = $('[data-fw-toggle]');
  if (tg && lanesWrap) tg.addEventListener('click', function () {
    var p = lanesWrap.classList.toggle('is-paused');
    tg.setAttribute('aria-pressed', p ? 'true' : 'false');
    tg.innerHTML = p ? '<span>▶</span> Reanudar movimiento' : '<span>⏸</span> Pausar movimiento';
  });

  /* La velocidad de los carriles reacciona al scroll */
  if (lanes.length && !reduce && lanes[0].querySelector('.fw-track').getAnimations) {
    var anims = lanes.map(function (l) { return l.querySelector('.fw-track').getAnimations()[0]; }).filter(Boolean);
    var lastY = window.scrollY, rate = 1, target = 1, raf = null;
    var loop = function () {
      rate += (target - rate) * 0.12; target += (1 - target) * 0.06;
      anims.forEach(function (a, i) { a.playbackRate = Math.max(0.2, rate) * (i % 2 ? 1 : 1); });
      if (Math.abs(rate - 1) > 0.02 || Math.abs(target - 1) > 0.02) raf = requestAnimationFrame(loop); else { raf = null; anims.forEach(function (a) { a.playbackRate = 1; }); }
    };
    window.addEventListener('scroll', function () {
      var v = Math.abs(window.scrollY - lastY); lastY = window.scrollY;
      target = Math.min(4.5, 1 + v * 0.08);
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
  }
})();
