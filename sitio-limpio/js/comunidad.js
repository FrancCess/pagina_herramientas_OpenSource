/* Comunidad: parallax del hero (mouse + scroll) y baraja interactiva de pasos. */
(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ── Parallax ── */
  var hero = document.querySelector('[data-cm-hero]'), scene = document.querySelector('[data-cm-scene]');
  if (hero && scene && !reduce) {
    var tx = 0, ty = 0, cx = 0, cy = 0, sy = 0, tsy = 0, on = true, raf = null;
    var loop = function () {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08; sy += (tsy - sy) * 0.1;
      scene.style.setProperty('--mx', cx.toFixed(3)); scene.style.setProperty('--my', cy.toFixed(3)); scene.style.setProperty('--sy', sy.toFixed(3));
      raf = on ? requestAnimationFrame(loop) : null;
    };
    var kick = function () { if (!raf) raf = requestAnimationFrame(loop); };
    if (fine) hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * -2; ty = ((e.clientY - r.top) / r.height - 0.5) * -2; kick();
    });
    if (fine) hero.addEventListener('pointerleave', function () { tx = 0; ty = 0; kick(); });
    var onScroll = function () { var r = hero.getBoundingClientRect(); tsy = Math.max(0, Math.min(1.2, -r.top / Math.max(1, r.height))); kick(); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { on = es[0].isIntersecting; if (on) kick(); }, { threshold: 0 }).observe(hero);
    kick();
  }

  /* ── Baraja de pasos ── */
  var stepper = document.querySelector('#participar .stepper');
  if (!stepper) return;
  var steps = Array.prototype.slice.call(stepper.querySelectorAll('.step'));
  if (!steps.length) return;
  var n = steps.length, active = 0;
  var deck = document.createElement('div'); deck.className = 'cm-deck'; deck.setAttribute('data-deck', '');
  var stage = document.createElement('div'); stage.className = 'cm-deck-stage'; deck.appendChild(stage);
  var cards = steps.map(function (s, i) {
    var c = document.createElement('article');
    c.className = 'cm-card'; c.tabIndex = 0; c.setAttribute('role', 'group'); c.setAttribute('aria-roledescription', 'carta'); c.setAttribute('aria-label', 'Paso ' + (i + 1) + ' de ' + n);
    c.innerHTML = '<header><span class="cm-n">' + (i + 1) + '</span><h4>' + s.querySelector('h4').textContent + '</h4></header><div class="cm-body">' + s.querySelector('p').innerHTML + '</div>';
    stage.appendChild(c);
    c.addEventListener('click', function () { if (active !== i) go(i); });
    c.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && active !== i) { e.preventDefault(); go(i); } });
    return c;
  });
  var ctrl = document.createElement('div'); ctrl.className = 'cm-ctrl';
  ctrl.innerHTML = '<button type="button" class="cm-nav" data-prev aria-label="Paso anterior">← <span>Anterior</span></button><div class="cm-pills" role="group" aria-label="Ir al paso">' +
    steps.map(function (s, i) { return '<button type="button" class="cm-pill" data-go="' + i + '" aria-label="Paso ' + (i + 1) + '">' + (i + 1) + '</button>'; }).join('') +
    '</div><button type="button" class="cm-nav" data-next aria-label="Paso siguiente"><span>Siguiente</span> →</button>';
  deck.appendChild(ctrl);
  var hint = document.createElement('p'); hint.className = 'cm-hint'; hint.textContent = 'Pasa el cursor para abrir la baraja y haz clic en una carta para traerla al frente. También funcionan las flechas del teclado.';
  deck.appendChild(hint);
  var live = document.createElement('p'); live.className = 'visually-hidden'; live.setAttribute('aria-live', 'polite'); deck.appendChild(live);
  stepper.parentNode.insertBefore(deck, stepper);
  document.documentElement.classList.add('cm-js');
  var pills = Array.prototype.slice.call(ctrl.querySelectorAll('.cm-pill'));

  function render() {
    cards.forEach(function (c, i) {
      var d = (i - active + n) % n;
      c.style.setProperty('--d', d); c.setAttribute('data-front', d === 0 ? 'true' : 'false');
      c.setAttribute('aria-hidden', d === 0 ? 'false' : 'false');
    });
    pills.forEach(function (p, i) { p.setAttribute('aria-current', i === active ? 'true' : 'false'); });
  }
  function go(i) { active = (i + n) % n; render(); live.textContent = 'Paso ' + (active + 1) + ' de ' + n + ': ' + steps[active].querySelector('h4').textContent; }
  ctrl.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-prev')) go(active - 1); else if (b.hasAttribute('data-next')) go(active + 1); else if (b.hasAttribute('data-go')) go(+b.getAttribute('data-go'));
  });
  deck.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); go(active + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); go(active - 1); }
  });

  /* alto de la carta más alta */
  var measure = function () {
    deck.style.removeProperty('--ch');
    var h = 0; cards.forEach(function (c) { c.style.minHeight = '0'; h = Math.max(h, c.offsetHeight); c.style.minHeight = ''; });
    deck.style.setProperty('--ch', Math.ceil(h) + 'px');
  };
  measure(); window.addEventListener('resize', measure); if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  render();

})();
