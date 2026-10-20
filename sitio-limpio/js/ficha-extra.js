/* ==========================================================================
   FICHAS v2 — Galería (principal + miniaturas + visor) y Opiniones
   - Galería: toma las <img class="shot-img"> de la ficha y las muestra como
     una imagen grande con 3 miniaturas debajo. Clic en la grande = visor.
   - Opiniones: calificación con estrellas + comentarios. MODO DEMOSTRACIÓN:
     se guardan solo en el navegador de quien comenta (localStorage).
   ========================================================================== */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var slug = (location.pathname.split('/').pop() || 'ficha').replace(/\.html?$/i, '');

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ------------------------------------------------------------------ */
  /* 1) GALERÍA                                                          */
  /* ------------------------------------------------------------------ */
  function initGaleria() {
    var imgs = Array.prototype.slice.call(document.querySelectorAll('.shot-item img.shot-img'));
    if (!imgs.length) return;

    // Contenedor original: el padre común de los .shot-item
    var first = imgs[0].closest('.shot-item');
    var host = document.querySelector('.shot-grid') || first.parentElement;
    host.setAttribute('data-fg-done', '');
    // Si ficha.js ya envolvió las capturas (coverflow), subimos hasta el bloque
    // que contiene todas las .shot-item.
    while (host && host.querySelectorAll('.shot-item').length < imgs.length) host = host.parentElement;
    if (!host) return;

    var data = imgs.map(function (im, i) {
      return { src: im.getAttribute('src'), alt: im.getAttribute('alt') || ('Captura ' + (i + 1)) };
    });

    var g = el('div', 'fg');
    g.setAttribute('data-fg', '');
    g.innerHTML =
      '<figure class="fg-main">' +
        '<button type="button" class="fg-open" aria-label="Ver imagen en pantalla completa">' +
          '<img class="fg-img" src="' + esc(data[0].src) + '" alt="' + esc(data[0].alt) + '">' +
          '<span class="fg-zoom" aria-hidden="true">⤢</span>' +
        '</button>' +
        '<figcaption class="fg-cap"><span class="fg-n">1 / ' + data.length + '</span><span class="fg-t">' + esc(data[0].alt) + '</span></figcaption>' +
      '</figure>' +
      '<div class="fg-thumbs" role="tablist" aria-label="Elegir captura">' +
        data.map(function (d, i) {
          return '<button type="button" class="fg-th' + (i === 0 ? ' is-on' : '') + '" role="tab" aria-selected="' + (i === 0) + '" aria-label="Captura ' + (i + 1) + '" data-i="' + i + '">' +
                 '<img src="' + esc(d.src) + '" alt="" loading="lazy"></button>';
        }).join('') +
      '</div>';

    // Seguridad: solo vaciamos el contenedor si contiene únicamente capturas.
    // Si tiene otra información (textos, tablas, datos técnicos), no se toca:
    // la galería se inserta en lugar de las capturas y lo demás se queda igual.
    if (host.querySelector('h1,h2,h3,h4,p,table,dl,ul,ol')) {
      var firstItem = host.querySelector('.shot-item');
      firstItem.parentNode.insertBefore(g, firstItem);
      Array.prototype.forEach.call(host.querySelectorAll('.shot-item'), function (s) { s.remove(); });
    } else {
      host.innerHTML = '';
      host.classList.add('fg-host');
      host.appendChild(g);
    }

    var main = g.querySelector('.fg-img');
    var n = g.querySelector('.fg-n');
    var t = g.querySelector('.fg-t');
    var ths = g.querySelectorAll('.fg-th');
    var cur = 0;

    function show(i) {
      cur = (i + data.length) % data.length;
      var swap = function () {
        main.src = data[cur].src; main.alt = data[cur].alt;
        n.textContent = (cur + 1) + ' / ' + data.length; t.textContent = data[cur].alt;
        main.classList.remove('is-out');
      };
      if (reduce) swap(); else { main.classList.add('is-out'); setTimeout(swap, 180); }
      Array.prototype.forEach.call(ths, function (b, k) {
        b.classList.toggle('is-on', k === cur); b.setAttribute('aria-selected', k === cur);
      });
    }
    Array.prototype.forEach.call(ths, function (b) {
      b.addEventListener('click', function () { show(+b.getAttribute('data-i')); });
    });
    g.querySelector('.fg-thumbs').addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault(); show(cur + (e.key === 'ArrowRight' ? 1 : -1)); ths[cur].focus();
      }
    });

    // Visor a pantalla completa
    var lb = el('div', 'fg-lb');
    lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Visor de capturas'); lb.hidden = true;
    lb.innerHTML =
      '<button type="button" class="fg-lb-x" aria-label="Cerrar">✕</button>' +
      '<button type="button" class="fg-lb-a fg-lb-prev" aria-label="Anterior">‹</button>' +
      '<img class="fg-lb-img" alt="">' +
      '<button type="button" class="fg-lb-a fg-lb-next" aria-label="Siguiente">›</button>' +
      '<p class="fg-lb-cap"></p>';
    document.body.appendChild(lb);
    var lbImg = lb.querySelector('.fg-lb-img'), lbCap = lb.querySelector('.fg-lb-cap'), lastFocus = null;

    function lbShow() {
      lbImg.src = data[cur].src; lbImg.alt = data[cur].alt;
      lbCap.textContent = (cur + 1) + ' / ' + data.length + ' · ' + data[cur].alt;
    }
    function open() {
      lastFocus = document.activeElement; lbShow(); lb.hidden = false;
      document.documentElement.classList.add('fg-lock');
      if (window.lenis && window.lenis.stop) window.lenis.stop();
      lb.querySelector('.fg-lb-x').focus();
    }
    function close() {
      lb.hidden = true; document.documentElement.classList.remove('fg-lock');
      if (window.lenis && window.lenis.start) window.lenis.start();
      if (lastFocus) lastFocus.focus();
    }
    function step(d) { show(cur + d); lbShow(); }

    g.querySelector('.fg-open').addEventListener('click', open);
    lb.querySelector('.fg-lb-x').addEventListener('click', close);
    lb.querySelector('.fg-lb-prev').addEventListener('click', function () { step(-1); });
    lb.querySelector('.fg-lb-next').addEventListener('click', function () { step(1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'Tab') { // mantener el foco dentro del visor
        var f = lb.querySelectorAll('button'), a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    });
    // Deslizar con el dedo en el visor
    var x0 = null;
    lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (x0 == null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
    });
  }

  /* ------------------------------------------------------------------ */
  /* 2) OPINIONES (demostración, localStorage)                           */
  /* ------------------------------------------------------------------ */
  var KEY = 'os-opiniones:' + slug;
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function save(list) { try { localStorage.setItem(KEY, JSON.stringify(list)); return true; } catch (e) { return false; } }


  /* Opiniones de EJEMPLO (ficticias). Se muestran con la etiqueta "Ejemplo"
     para que se vea cómo funciona la sección. Cada ficha recibe 4 distintas
     según su nombre de archivo. Para quitarlas: EJEMPLOS_ACTIVOS = false. */
  var EJEMPLOS_ACTIVOS = false;
  var EJ_NOMBRES = ['Ana G.', 'Luis M.', 'Sofía R.', 'Diego P.', 'Valeria T.', 'Carlos H.', 'Mariana L.', 'Jorge A.', 'Fernanda C.', 'Ricardo S.', 'Paola V.', 'Emilio N.'];
  var EJ_TEXTOS = [
    [5, 'Lo usé para un proyecto de la escuela y me funcionó muy bien. Que sea gratis ayuda muchísimo.'],
    [4, 'Al principio me costó un poco entenderlo, pero con la documentación y algunos tutoriales salí adelante.'],
    [5, 'Me gusta que no tenga anuncios ni me pida crear una cuenta para usarlo.'],
    [4, 'Hace todo lo que necesito. Le daría 5 estrellas si la interfaz fuera un poco más intuitiva.'],
    [5, 'La comunidad es muy activa: pregunté en el foro y me respondieron el mismo día.'],
    [3, 'Cumple, aunque para algunas cosas avanzadas tuve que buscar bastante cómo hacerlas.'],
    [5, 'Lo recomiendo para quien está empezando; hay muchísima información en internet.'],
    [4, 'Funciona bien incluso en mi laptop, que ya tiene sus años.'],
    [5, 'Me sorprendió lo completo que es para ser software libre. Ya no regreso a la alternativa de paga.'],
    [4, 'Buen programa. Las actualizaciones son frecuentes y cada vez trae mejoras.'],
    [5, 'Lo usamos en equipo para un trabajo final y no tuvimos ningún problema.'],
    [3, 'Está bien, pero me hubiera gustado más contenido en español en la documentación.']
  ];
  function ejemplos() {
    if (!EJEMPLOS_ACTIVOS) return [];
    var h = 0;
    for (var i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
    var out = [], usados = {}, base = Date.UTC(2026, 8, 1), dia = 864e5;
    for (var k = 0; out.length < 4 && k < 40; k++) {
      var j = (h + k * 7) % EJ_TEXTOS.length;
      if (usados[j]) continue; usados[j] = 1;
      out.push({ r: EJ_TEXTOS[j][0], c: EJ_TEXTOS[j][1], n: EJ_NOMBRES[(h + k * 5) % EJ_NOMBRES.length], t: base + ((h >> k) % 40 + out.length * 3) * dia, ej: true });
    }
    return out.sort(function (a, b) { return a.t - b.t; });
  }

  function stars(v, cls) {
    var s = '';
    for (var i = 1; i <= 5; i++) s += '<i class="' + (i <= Math.round(v) ? 'on' : '') + '"></i>';
    return '<span class="op-stars ' + (cls || '') + '" aria-hidden="true">' + s + '</span>';
  }
  function fecha(ts) {
    try { return new Date(ts).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch (e) { return ''; }
  }

  function initOpiniones() {
    var nameEl = document.querySelector('h1');
    var nombre = nameEl ? nameEl.textContent.trim() : 'este programa';

    var sec = el('section', 'tool-section op');
    sec.id = 'opiniones';
    sec.setAttribute('aria-labelledby', 'opT');
    sec.innerHTML =
      '<div class="op-wrap">' +
        '<div class="section-head">' +
          '<div class="icon-badge"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" stroke="white" stroke-width="2" stroke-linejoin="round"/></svg></div>' +
          '<h2 id="opT">Opiniones</h2>' +
        '</div>' +
        '<p class="section-intro">¿Qué te pareció ' + esc(nombre) + '? Califícalo y deja tu comentario. <span class="op-demo">Modo demostración: las opiniones se guardan solo en este navegador.</span></p>' +
        '<div class="op-grid">' +
          '<div class="op-sum" aria-live="polite">' +
            '<div class="op-avg"><b data-op-avg>–</b>' + stars(0, 'op-stars-lg') + '<small data-op-count>Sin calificaciones</small></div>' +
            '<div class="op-bars" data-op-bars></div>' +
          '</div>' +
          '<form class="op-form" novalidate>' +
            '<fieldset class="op-rate"><legend>Tu calificación</legend><div class="op-rate-in">' +
              [5, 4, 3, 2, 1].map(function (v) {
                return '<input type="radio" name="op-r" id="op-r' + v + '" value="' + v + '"><label for="op-r' + v + '" title="' + v + ' de 5"><span class="sr">' + v + ' estrellas</span></label>';
              }).join('') +
            '</div></fieldset>' +
            '<label class="op-lbl" for="op-name">Nombre <small>(opcional)</small></label>' +
            '<input id="op-name" class="op-in" maxlength="40" autocomplete="nickname" placeholder="Anónimo">' +
            '<label class="op-lbl" for="op-txt">Comentario</label>' +
            '<textarea id="op-txt" class="op-in" rows="3" maxlength="400" placeholder="¿Para qué lo usaste? ¿Lo recomendarías?"></textarea>' +
            '<div class="op-foot"><small data-op-left>400</small><button type="submit" class="op-btn">Publicar opinión</button></div>' +
            '<p class="op-msg" data-op-msg role="status"></p>' +
          '</form>' +
        '</div>' +
        '<ul class="op-list" data-op-list></ul>' +
      '</div>';

    // Insertar justo después de la sección de capturas; si no hay, al final del <main>
    var shotSec = document.querySelector('.fg, .shot-grid');
    shotSec = shotSec && shotSec.closest('section');
    var main = document.querySelector('main'), footer = document.querySelector('footer');
    if (shotSec) shotSec.parentNode.insertBefore(sec, shotSec.nextSibling);
    else if (main) main.appendChild(sec);
    else if (footer) footer.parentNode.insertBefore(sec, footer);
    else document.body.appendChild(sec);

    var form = sec.querySelector('.op-form'), txt = sec.querySelector('#op-txt'), nm = sec.querySelector('#op-name');
    var msg = sec.querySelector('[data-op-msg]'), left = sec.querySelector('[data-op-left]');

    txt.addEventListener('input', function () { left.textContent = 400 - txt.value.length; });

    function render() {
      var list = ejemplos().concat(load()), total = list.length;
      var sum = list.reduce(function (a, o) { return a + o.r; }, 0), avg = total ? sum / total : 0;
      sec.querySelector('[data-op-avg]').textContent = total ? avg.toFixed(1) : '–';
      sec.querySelector('.op-avg .op-stars').outerHTML = stars(avg, 'op-stars-lg');
      sec.querySelector('[data-op-count]').textContent = total ? total + (total === 1 ? ' calificación' : ' calificaciones') : 'Sin calificaciones';
      var bars = '';
      for (var v = 5; v >= 1; v--) {
        var c = list.filter(function (o) { return o.r === v; }).length, p = total ? Math.round(c / total * 100) : 0;
        bars += '<div class="op-bar"><span>' + v + '★</span><i><b style="width:' + p + '%"></b></i><small>' + c + '</small></div>';
      }
      sec.querySelector('[data-op-bars]').innerHTML = bars;

      var ul = sec.querySelector('[data-op-list]');
      if (!total) { ul.innerHTML = '<li class="op-empty">Todavía no hay opiniones. ¡Sé la primera persona en calificar!</li>'; return; }
      ul.innerHTML = list.slice().reverse().map(function (o) {
        var ini = (o.n || 'A').trim().charAt(0).toUpperCase();
        return '<li class="op-item' + (o.ej ? ' is-ej' : '') + '"><span class="op-ava" aria-hidden="true">' + esc(ini) + '</span>' +
          '<div class="op-body"><div class="op-meta"><b>' + esc(o.n || 'Anónimo') + '</b>' + stars(o.r) +
          '<span class="sr">' + o.r + ' de 5 estrellas</span><time>' + fecha(o.t) + '</time>' + (o.ej ? '<span class="op-ej" title="Opinión ficticia de ejemplo">Ejemplo</span>' : '') + '</div>' +
          (o.c ? '<p>' + esc(o.c) + '</p>' : '') +
          (o.ej ? '' : '<button type="button" class="op-del" data-t="' + o.t + '">Borrar</button>') + '</div></li>';
      }).join('');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var r = form.querySelector('input[name="op-r"]:checked');
      if (!r) { msg.textContent = 'Elige de 1 a 5 estrellas.'; return; }
      var c = txt.value.trim();
      var list = load();
      list.push({ r: +r.value, n: nm.value.trim().slice(0, 40), c: c.slice(0, 400), t: Date.now() });
      if (!save(list)) { msg.textContent = 'Tu navegador no permite guardar opiniones (modo privado).'; return; }
      form.reset(); left.textContent = 400;
      msg.textContent = '¡Gracias! Tu opinión se guardó en este navegador.';
      render();
    });

    sec.querySelector('[data-op-list]').addEventListener('click', function (e) {
      var b = e.target.closest('.op-del'); if (!b) return;
      var t = +b.getAttribute('data-t');
      save(load().filter(function (o) { return o.t !== t; }));
      msg.textContent = 'Opinión borrada.';
      render();
    });

    render();
  }

  function init() { initGaleria(); initOpiniones(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
