/* Intro de la portada: pantalla de carga + revelado de cuadritos.
   - Solo una vez por sesión (sessionStorage). Con ?intro en la URL se fuerza siempre.
   - Con "reducir movimiento" solo hay un fundido corto (salvo ?intro).
   - Si algo falla, un temporizador de seguridad la retira. */
(function () {
  var root = document.documentElement, body = document.body;
  if (!body) return;
  var qs = /[?&]intro\b/.test(location.search);
  var seen = false;
  try { seen = sessionStorage.getItem('osIntro') === '1'; } catch (e) {}
  if (seen && !qs) return;
  try { sessionStorage.setItem('osIntro', '1'); } catch (e) {}
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches && !qs;

  var el = document.createElement('div');
  el.className = 'ld' + (reduce ? ' ld-simple' : '');
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML =
    '<div class="ld-core">' +
      '<div class="ld-logo"><span>&lt;/&gt;</span></div>' +
      '<div class="ld-name">Open Source</div>' +
      '<div class="ld-bar"><i></i></div>' +
      '<div class="ld-num"><b>0</b>%</div>' +
    '</div>';
  body.insertBefore(el, body.firstChild);
  root.classList.add('ld-lock');

  var bar = el.querySelector('.ld-bar i'), num = el.querySelector('.ld-num b');
  var t0 = performance.now(), MIN = reduce ? 250 : 1500, loaded = document.readyState === 'complete';
  var shown = 0, finished = false;
  if (!loaded) window.addEventListener('load', function () { loaded = true; });

  function finish() {
    if (finished) return; finished = true;
    root.classList.remove('ld-lock');
    if (reduce) { el.classList.add('ld-out'); setTimeout(function () { el.remove(); root.classList.add('ld-done'); }, 400); return; }
    reveal();
  }

  function reveal() {
    el.classList.add('ld-core-out');
    var W = window.innerWidth, H = window.innerHeight;
    var size = W < 600 ? 44 : 64;
    var cols = Math.ceil(W / size), rows = Math.ceil(H / size);
    var grid = document.createElement('div');
    grid.className = 'ld-grid';
    grid.style.gridTemplateColumns = 'repeat(' + cols + ',1fr)';
    grid.style.gridTemplateRows = 'repeat(' + rows + ',1fr)';
    var cx = cols * 0.5, cy = rows * 0.42, maxd = Math.sqrt(cx * cx + cy * cy) || 1, frag = document.createDocumentFragment();
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var s = document.createElement('i');
      var d = Math.sqrt((c + .5 - cx) * (c + .5 - cx) + (r + .5 - cy) * (r + .5 - cy)) / maxd;
      s.style.transitionDelay = (d * 520 + Math.random() * 360).toFixed(0) + 'ms';
      frag.appendChild(s);
    }
    grid.appendChild(frag);
    el.appendChild(grid);
    void grid.offsetWidth;
    el.classList.add('ld-reveal');
    setTimeout(function () { root.classList.add('ld-done'); }, 450);
    setTimeout(function () { el.remove(); }, 1700);
  }

  (function tick(now) {
    if (finished) return;
    var p = Math.min(1, (now - t0) / MIN);
    var target = loaded ? p : Math.min(p, .88);
    shown += (target - shown) * .18;
    var v = Math.round(shown * 100);
    num.textContent = v; bar.style.transform = 'scaleX(' + shown.toFixed(3) + ')';
    if (loaded && p >= 1 && shown > .985) { num.textContent = 100; bar.style.transform = 'scaleX(1)'; setTimeout(finish, 180); return; }
    requestAnimationFrame(tick);
  })(t0);
  setTimeout(finish, 4500);
})();
