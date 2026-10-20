/* =====================================================
   Herramientas (hub, distros, ofimática, edición, juegos,
   utilidades y desarrollo) — capa interactiva.
   GSAP + ScrollTrigger + Lenis son opcionales (mejora progresiva):
   si no cargan, todo el contenido sigue visible y usable.
   ===================================================== */
(function () {
  'use strict';
  if (!document.body.classList.contains('tp')) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasG = !!(window.gsap && window.ScrollTrigger);
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var page = (document.body.className.match(/tp-(\w+)/) || [])[1];
  var navEl = $('.site-navbar');
  var navH = function () {
    var h = navEl ? Math.round(navEl.getBoundingClientRect().height) - (navEl.classList.contains('scrolled') ? 0 : 12) : 52;
    document.documentElement.style.setProperty('--nav-h', h + 'px');
    return h;
  };
  navH();

  /* ───────── Progreso de lectura ───────── */
  var prog = $('.tp-progress');
  if (prog) {
    var upd = function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      prog.style.setProperty('--sp', h > 0 ? Math.min(1, window.scrollY / h).toFixed(4) : 0);
    };
    document.addEventListener('scroll', upd, { passive: true }); window.addEventListener('resize', upd); upd();
  }

  /* ───────── Utilidades: contadores, tipeo ───────── */
  function countTo(el, to, suffix, prefix) {
    if (reduce) { el.textContent = (prefix || '') + to + (suffix || ''); return; }
    var t0 = null, dur = 1400;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = (prefix || '') + Math.round(to * e) + (suffix || '');
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function onView(el, cb, th) {
    if (!('IntersectionObserver' in window)) { cb(); return; }
    var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { io.disconnect(); cb(); } }, { threshold: th || 0.4 });
    io.observe(el);
  }
  $$('.tp-stat b[data-count]').forEach(function (b) {
    var to = parseInt(b.getAttribute('data-count'), 10);
    if (to === 0) return;
    onView(b, function () { countTo(b, to); }, 0.6);
  });
  $$('.tp-fact-n').forEach(function (n) {
    var m = n.textContent.trim().match(/^(\$?)(\d+)(%?)$/);
    if (m && m[2] !== '0') onView(n, function () { countTo(n, parseInt(m[2], 10), m[3], m[1]); }, 0.6);
  });

  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function visibleTracker(el) {
    var v = true;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { v = en[0].isIntersecting; }, { threshold: 0.05 }).observe(el);
    return function () { return v && !document.hidden; };
  }

  /* ───────── Título: letras que suben ───────── */
  var h1 = $('[data-split]');
  if (h1 && !reduce && hasG) {
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (tok) {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
            var wd = document.createElement('span'); wd.className = 'tp-wd'; wd.setAttribute('aria-hidden', 'true');
            tok.split('').forEach(function (ch) {
              var w = document.createElement('span'); w.className = 'tp-chw';
              var s = document.createElement('span'); s.className = 'tp-ch'; s.textContent = ch;
              w.appendChild(s); wd.appendChild(w);
            });
            frag.appendChild(wd);
          });
          c.parentNode.replaceChild(frag, c);
        } else if (c.nodeType === 1) walk(c);
      });
    })(h1);
  }

  /* ───────── Parallax con el mouse (escenas del hero) ───────── */
  var hero = $('.tp-hero');
  if (hero && fine && !reduce) {
    $$('[data-parallax]').forEach(function (st) {
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        st.style.setProperty('--px', (((e.clientX - r.left) / r.width - 0.5) * 2).toFixed(3));
        st.style.setProperty('--py', (((e.clientY - r.top) / r.height - 0.5) * 2).toFixed(3));
      });
      hero.addEventListener('pointerleave', function () { st.style.setProperty('--px', 0); st.style.setProperty('--py', 0); });
    });
  }

  /* ───────── Inclinación 3D + brillo en tarjetas ───────── */
  if (fine && !reduce) {
    $$('.tpc, .tpd').forEach(function (c) {
      var media = c.querySelector('.tpc-media, .feature-card-media');
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty('--ry', ((x - 0.5) * 7).toFixed(2) + 'deg');
        c.style.setProperty('--rx', ((0.5 - y) * 7).toFixed(2) + 'deg');
        if (media) { media.style.setProperty('--mx', (x * 100).toFixed(0) + '%'); media.style.setProperty('--my', (y * 100).toFixed(0) + '%'); }
      });
      c.addEventListener('pointerleave', function () { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
    });
  }

  /* ───────── Filtros por grupo (barra pegajosa) ───────── */
  $$('[data-bar]').forEach(function (bar) {
    var chips = $$('[data-filter]', bar);
    if (!chips.length) return;
    var items = $$('[data-group]');
    chips.forEach(function (ch) {
      ch.addEventListener('click', function () {
        var f = ch.getAttribute('data-filter');
        chips.forEach(function (c) { c.classList.toggle('is-on', c === ch); c.setAttribute('aria-pressed', c === ch ? 'true' : 'false'); });
        items.forEach(function (it) {
          if (it.closest('.tp-bar')) return;
          it.classList.toggle('tp-hide', f !== '*' && it.getAttribute('data-group') !== f);
        });
        if (hasG && window.ScrollTrigger) setTimeout(function () { ScrollTrigger.refresh(); }, 60);
      });
    });
  });

  /* ───────── Barra de secciones con scrollspy ───────── */
  $$('[data-bar]').forEach(function (bar) {
    var links = $$('a.tp-chip', bar);
    if (!links.length) return;
    var targets = links.map(function (a) { return $(a.getAttribute('href')); });
    var pick = function () {
      var line = window.innerHeight * 0.4, idx = -1;
      targets.forEach(function (t, k) { if (t && t.getBoundingClientRect().top <= line) idx = k; });
      links.forEach(function (a, k) { a.classList.toggle('is-on', k === idx); });
    };
    document.addEventListener('scroll', pick, { passive: true }); pick();
  });

  /* ───────── Páginas: hub ───────── */
  function constellation() {
    var cv = $('#tpCanvas'); if (!cv || !cv.getContext) return;
    var ctx = cv.getContext('2d'), hero = cv.parentElement, w = 0, h = 0, nodes = [], mouse = { x: -999, y: -999 }, ok = visibleTracker(hero);
    var size = function () {
      w = hero.clientWidth; h = hero.clientHeight; cv.width = w; cv.height = h;
      var n = Math.round(Math.min(80, Math.max(24, w * h / 16000)));
      while (nodes.length < n) nodes.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, hot: Math.random() < .14 });
      nodes.length = n;
    };
    size(); window.addEventListener('resize', size);
    if (fine) { hero.addEventListener('pointermove', function (e) { var r = hero.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; }); hero.addEventListener('pointerleave', function () { mouse.x = mouse.y = -999; }); }
    var draw = function (still) {
      ctx.clearRect(0, 0, w, h);
      nodes.forEach(function (a) { if (!still) { a.x += a.vx; a.y += a.vy; if (a.x < 0 || a.x > w) a.vx *= -1; if (a.y < 0 || a.y > h) a.vy *= -1; } });
      for (var i = 0; i < nodes.length; i++) {
        var a = nodes[i];
        for (var j = i + 1; j < nodes.length; j++) { var b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y); if (d < 120) { ctx.strokeStyle = 'rgba(255,255,255,' + ((1 - d / 120) * .2).toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); } }
        var dm = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (dm < 180) { ctx.strokeStyle = 'rgba(200,241,53,' + ((1 - dm / 180) * .7).toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); }
        ctx.fillStyle = a.hot ? 'rgba(200,241,53,.95)' : 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.arc(a.x, a.y, a.hot ? 2.6 : 1.7, 0, 6.3); ctx.fill();
      }
    };
    if (reduce) draw(true); else (function loop() { if (ok()) draw(false); requestAnimationFrame(loop); })();
  }
  function initHub() {
    constellation();
    var acc = $('[data-acc]');
    if (acc) {
      var panels = $$('[data-panel]', acc);
      var open = function (p) { panels.forEach(function (x) { x.classList.toggle('is-on', x === p); }); };
      var mobile = function () { return window.matchMedia('(max-width: 991.98px)').matches; };
      panels.forEach(function (p) {
        p.addEventListener('mouseenter', function () { if (!mobile() && fine) open(p); });
        p.addEventListener('focus', function () { open(p); });
        p.addEventListener('click', function (e) {
          if ((mobile() || !fine) && !p.classList.contains('is-on')) { e.preventDefault(); open(p); }
        });
      });
    }
    var it = $('[data-intents]');
    if (it) {
      var chips = $$('[data-intent]', it), outs = $$('.it-res', it);
      chips.forEach(function (c) {
        c.addEventListener('click', function () {
          var k = c.getAttribute('data-intent');
          chips.forEach(function (x) { x.classList.toggle('is-on', x === c); });
          outs.forEach(function (o) { o.hidden = o.getAttribute('data-for') !== k; });
        });
      });
    }
    /* marquesina de dos filas: reacciona al scroll */
    var rows = $$('.mq-row');
    if (rows.length && hasG && !reduce) {
      var mq = $('.mq'); mq.classList.add('is-js');
      var pos = rows.map(function () { return 0; }), boost = 0, lastY = window.scrollY;
      gsap.ticker.add(function (t, dt) {
        var y = window.scrollY, dy = Math.abs(y - lastY); lastY = y;
        boost += (Math.min(16, dy) - boost) * 0.12;
        rows.forEach(function (r, i) {
          var dir = parseInt(r.getAttribute('data-mq'), 10);
          var half = r.scrollWidth / 2;
          pos[i] += dir * (38 + boost * 14) * (dt / 1000);
          if (pos[i] <= -half) pos[i] += half; if (pos[i] > 0) pos[i] -= half;
          r.style.transform = 'translate3d(' + pos[i] + 'px,0,0)';
        });
      });
    }
  }

  /* ───────── Motor de tipeo con "terminal" ───────── */
  function typer(out, ok) {
    var token = 0;
    return {
      stop: function () { token++; },
      run: async function (steps) {
        var my = ++token, buf = '';
        for (var i = 0; i < steps.length; i++) {
          var s = steps[i];
          if (my !== token) return;
          if (s.wait) { await sleep(s.wait); continue; }
          if (s.instant) { buf += s.t; out.innerHTML = s.fmt ? s.fmt(buf) : esc(buf); continue; }
          for (var k = 0; k < s.t.length; k++) {
            while (!ok()) { await sleep(300); if (my !== token) return; }
            buf += s.t[k];
            out.innerHTML = (s.fmt ? s.fmt(buf) : esc(buf)) + '<span class="tp-caret"></span>';
            if (my !== token) return;
            await sleep(reduce ? 0 : (s.sp || 28));
          }
        }
        out.innerHTML = (steps.fmt ? steps.fmt(buf) : (steps[0] && steps[0].fmt ? steps[0].fmt(buf) : esc(buf))) + '<span class="tp-caret"></span>';
      }
    };
  }

  /* ───────── Páginas: distros ───────── */
  function initDistros() {
    var win = $('[data-distro-term]');
    if (win) {
      var out = $('[data-term-out]', win), ok = visibleTracker(win);
      var D = [
        ['Ubuntu', 'ubuntu', 'debian', 'ubuntu.com'], ['Linux Mint', 'linuxmint', 'ubuntu debian', 'linuxmint.com'],
        ['Fedora Linux', 'fedora', '', 'fedoraproject.org'], ['Debian GNU/Linux', 'debian', '', 'debian.org'],
        ['Arch Linux', 'arch', '', 'archlinux.org'], ['Kali GNU/Linux', 'kali', 'debian', 'kali.org']
      ];
      var fmt = function (t) {
        return t.split('\n').map(function (ln) {
          var m;
          if (ln.charAt(0) === '$') return '<span class="k">$</span>' + esc(ln.slice(1));
          if ((m = ln.match(/^(\w+)=(.*)$/))) return '<span class="n">' + m[1] + '</span>=' + (m[2].charAt(0) === '"' ? '"<span class="s">' + esc(m[2].replace(/"/g, '')) + '</span>' + (m[2].length > 1 && m[2].slice(-1) === '"' ? '"' : '') : esc(m[2]));
          return esc(ln);
        }).join('\n');
      };
      var ty = typer(out, ok), i = 0;
      (async function loop() {
        while (true) {
          var d = D[i % D.length]; i++;
          var like = d[2] ? 'ID_LIKE=' + d[2] + '\n' : '';
          var steps = [{ t: '$ cat /etc/os-release\n', fmt: fmt, sp: 38 }, { wait: 250 }, { t: 'NAME="' + d[0] + '"\nID=' + d[1] + '\n' + like + 'HOME_URL="https://' + d[3] + '"\n', fmt: fmt, sp: 14 }, { t: '$ ', fmt: fmt, sp: 10 }, { wait: reduce ? 100000 : 2300 }];
          steps.fmt = fmt;
          await ty.run(steps);
          if (reduce) return;
        }
      })();
    }
    var fd = $('[data-finder]');
    if (fd) {
      var sel = { lvl: '', pri: '' }, res = $('[data-fd-res]', fd);
      var R = {
        easy: { n: ['ubuntu', 'Se instala sin complicarte y reconoce casi todo el hardware.'], a: ['fedora', 'Software moderno y actualizado, con un escritorio muy pulido.'], e: ['debian', 'Estabilidad de roca: es la base de muchas otras distros.'] },
        win: { n: ['zorin-os', 'Su escritorio se parece a Windows, ideal para migrar sin trauma.'], a: ['linux-mint', 'Cinnamon es clásico y familiar: menú, barra de tareas y bandeja.'], e: ['linux-mint', 'Cinnamon es clásico y familiar, y funciona sin dramas.'] },
        priv: { n: ['tails', 'Arranca desde USB, enruta todo por Tor y no deja rastro en el equipo.'], a: ['tails', 'Arranca desde USB, enruta todo por Tor y no deja rastro en el equipo.'], e: ['tails', 'Arranca desde USB, enruta todo por Tor y no deja rastro en el equipo.'] },
        light: { n: ['linux-mint', 'Su edición Xfce funciona con fluidez en equipos modestos.'], a: ['debian', 'Instalación mínima: tú decides qué corre y qué no.'], e: ['alpine-linux', 'Minimalista por diseño: pequeña, rápida y muy austera.'] },
        sec: { n: ['kali-linux', 'Trae cientos de herramientas de seguridad. Aviso: no es para el uso diario.'], a: ['kali-linux', 'Trae cientos de herramientas de seguridad listas para auditar y practicar.'], e: ['kali-linux', 'El estándar para pentesting, con todo preinstalado.'] },
        ctl: { n: ['debian', 'Una base estable para aprender desde cero y construir a tu ritmo.'], a: ['arch-linux', 'Instalas solo lo que quieres. Aprenderás mucho en el camino.'], e: ['arch-linux', 'Rolling release y todo bajo tu control: tú construyes el sistema.'] }
      };
      $$('.fd-opts', fd).forEach(function (g) {
        $$('button', g).forEach(function (b) {
          b.addEventListener('click', function () {
            $$('button', g).forEach(function (x) { x.classList.toggle('is-on', x === b); });
            sel[g.getAttribute('data-q')] = b.getAttribute('data-v');
            if (sel.lvl && sel.pri) {
              var r = R[sel.pri][sel.lvl], tpl = $('template[data-fd-tpl="' + r[0] + '"]');
              if (!tpl) return;
              res.innerHTML = tpl.innerHTML; res.querySelector('[data-why]').textContent = r[1];
            }
          });
        });
      });
    }
  }

  /* ───────── Páginas: ofimática ───────── */
  function initOfimatica() {
    var wrap = $('[data-fmts]');
    if (wrap) {
      var out = $('[data-fmt-out]'), tiles = $$('.fmt', wrap);
      tiles.forEach(function (t) {
        t.addEventListener('click', function () {
          tiles.forEach(function (x) { x.classList.toggle('is-on', x === t); });
          out.innerHTML = '<b></b><span></span>';
          out.firstChild.textContent = t.querySelector('b').textContent + ' → ' + t.getAttribute('data-app');
          out.lastChild.textContent = t.getAttribute('data-txt');
        });
      });
    }
    var sav = $('[data-sav]');
    if (sav) {
      var rn = $('[data-sav-range]', sav), ry = $('[data-sav-yr]', sav);
      var fm = function (n) { return '$' + n.toLocaleString('en-US'); };
      var calc = function () {
        var n = +rn.value, y = +ry.value, tot = n * 10 * 12 * y;
        $('[data-sav-n]', sav).textContent = n; $('[data-sav-y]', sav).textContent = y;
        $('[data-sav-paid]', sav).textContent = fm(tot); $('[data-sav-win]', sav).textContent = fm(tot);
        [rn, ry].forEach(function (r) { r.style.setProperty('--fill', ((r.value - r.min) / (r.max - r.min) * 100) + '%'); });
      };
      rn.addEventListener('input', calc); ry.addEventListener('input', calc); calc();
    }
  }

  /* ───────── Páginas: edición ───────── */
  function initEdicion() {
    var ba = $('[data-ba]');
    if (ba) {
      var rg = $('[data-ba-range]', ba);
      var set = function () { ba.style.setProperty('--pos', rg.value + '%'); };
      rg.addEventListener('input', set); set();
      if (!reduce) onView(ba, function () {
        var t0 = null;
        (function step(t) {
          if (!t0) t0 = t;
          var p = Math.min(1, (t - t0) / 1600);
          rg.value = 50 + Math.sin(p * Math.PI * 2) * 28 * (1 - p); set();
          if (p < 1) requestAnimationFrame(step);
        })(performance.now());
      }, 0.5);
    }
    var ph = $('[data-ph]'), tc = $('[data-tc]');
    if (ph && !reduce) {
      var ok = visibleTracker(ph), t0 = performance.now();
      (function loop(t) {
        if (ok()) {
          var p = ((t - t0) / 9000) % 1;
          ph.style.setProperty('--p', p.toFixed(4));
          var s = p * 36, m = Math.floor(s / 60), sec = Math.floor(s % 60), fr = Math.floor((s % 1) * 30);
          tc.textContent = '00:' + (sec < 10 ? '0' : '') + sec + ':' + (fr < 10 ? '0' : '') + fr;
        }
        requestAnimationFrame(loop);
      })(performance.now());
    }
  }

  /* ───────── Páginas: juegos ───────── */
  function initJuegos() {
    var cv = $('#tpCanvas');
    if (cv && cv.getContext) {
      var ctx = cv.getContext('2d'), w = 0, h = 0, S = 18, blocks = [], ok = visibleTracker(cv.parentElement);
      var C = ['#6CFF8E', '#FF6FA0', '#5CB1FF', '#FFD479', '#B58CFF'];
      var size = function () { w = cv.parentElement.clientWidth; h = cv.parentElement.clientHeight; cv.width = w; cv.height = h; };
      size(); window.addEventListener('resize', size);
      var spawn = function (y) { return { x: Math.floor(Math.random() * (w / S)) * S, y: y, v: 0.25 + Math.random() * 0.7, c: C[Math.floor(Math.random() * C.length)], a: 0.12 + Math.random() * 0.28 }; };
      for (var i = 0; i < 36; i++) blocks.push(spawn(Math.random() * h));
      var draw = function () {
        ctx.clearRect(0, 0, w, h);
        blocks.forEach(function (b) {
          if (!reduce) b.y += b.v;
          if (b.y > h) { Object.assign(b, spawn(-S)); }
          ctx.globalAlpha = b.a; ctx.fillStyle = b.c; ctx.fillRect(b.x, b.y, S - 3, S - 3);
        });
        ctx.globalAlpha = 1;
      };
      if (reduce) draw(); else (function loop() { if (ok()) draw(); requestAnimationFrame(loop); })();
    }
    var sc = $('[data-score]');
    if (sc && !reduce) {
      var n = 0, ok2 = visibleTracker(sc);
      setInterval(function () { if (!ok2()) return; n += 10 * (1 + Math.floor(Math.random() * 5)); sc.textContent = ('000000' + n).slice(-6); }, 380);
    }
  }

  /* ───────── Páginas: utilidades (paleta de comandos) ───────── */
  function initUtilidades() {
    var pal = $('[data-pal]');
    if (!pal) return;
    var input = $('.tool-search-input', pal), list = $('[data-pal-list]', pal);
    var data = $$('.col-tp').map(function (c) {
      var a = c.querySelector('a.tool-card-link'); if (!a) return null;
      return { name: c.querySelector('h4').textContent, desc: c.querySelector('p').textContent, badge: (c.querySelector('.tc-badge') || {}).textContent || '', group: c.getAttribute('data-group') || '', href: a.getAttribute('href'), icon: c.querySelector('.tpc-icon').innerHTML, color: c.querySelector('.tpc').style.getPropertyValue('--b2') };
    }).filter(Boolean);
    var SUG = ['Firefox', 'VS Code', 'Docker', 'Wireshark', 'Nginx'];
    var cur = 0, shown = [];
    var render = function () {
      var q = input.value.trim().toLowerCase();
      shown = q ? data.filter(function (d) { return (d.name + ' ' + d.desc + ' ' + d.badge + ' ' + d.group).toLowerCase().indexOf(q) > -1; }).slice(0, 6)
                : SUG.map(function (n) { return data.filter(function (d) { return d.name === n; })[0]; }).filter(Boolean);
      cur = 0; list.innerHTML = '';
      if (!shown.length) { var e = document.createElement('li'); e.className = 'pe'; e.textContent = 'Nada con ese término. Prueba con "navegador", "seguridad" o "docker".'; list.appendChild(e); return; }
      shown.forEach(function (d, i) {
        var li = document.createElement('li'); li.setAttribute('role', 'option'); if (i === 0) li.className = 'is-on';
        li.innerHTML = '<span class="pi"></span><div><b></b><small></small></div><span class="pg"></span>';
        li.querySelector('.pi').innerHTML = d.icon; li.querySelector('.pi').style.setProperty('--b2', d.color);
        li.querySelector('b').textContent = d.name; li.querySelector('small').textContent = d.badge; li.querySelector('.pg').textContent = q ? '' : 'Sugerida';
        li.addEventListener('mouseenter', function () { mark(i); });
        li.addEventListener('click', function () { location.href = d.href; });
        list.appendChild(li);
      });
    };
    var mark = function (i) { cur = i; $$('li', list).forEach(function (l, k) { l.classList.toggle('is-on', k === i); }); };
    input.addEventListener('input', render);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (shown.length) mark((cur + 1) % shown.length); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (shown.length) mark((cur - 1 + shown.length) % shown.length); }
      else if (e.key === 'Enter') { if (shown[cur]) location.href = shown[cur].href; }
      else if (e.key === 'Escape') { input.value = ''; input.dispatchEvent(new Event('input')); }
    });
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); input.focus(); window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); }
    });
    render();
  }

  /* ───────── Páginas: desarrollo (editor con pestañas) ───────── */
  function initDesarrollo() {
    var win = $('[data-code]');
    if (!win) return;
    var out = $('[data-code-out]', win), res = $('[data-code-res]', win), tabs = $$('[data-lang]', win), ok = visibleTracker(win);
    var S = {
      python: { f: 'saludo.py', t: '# Un saludo en Python\ndef saludar(nombre):\n    return f"Hola, {nombre}!"\n\nprint(saludar("mundo"))', r: 'Hola, mundo!', kw: 'def|return|print|import|for|in|if|else' },
      javascript: { f: 'saludo.js', t: '// Un saludo en JavaScript\nconst saludar = (nombre) => `Hola, ${nombre}!`;\n\nconsole.log(saludar("mundo"));', r: 'Hola, mundo!', kw: 'const|let|var|function|return|console|log' },
      rust: { f: 'main.rs', t: '// Un saludo en Rust\nfn main() {\n    let nombre = "mundo";\n    println!("Hola, {}!", nombre);\n}', r: 'Hola, mundo!', kw: 'fn|let|mut|println|use|match' },
      go: { f: 'main.go', t: '// Un saludo en Go\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hola, mundo!")\n}', r: 'Hola, mundo!', kw: 'package|import|func|var|return|fmt|Println' },
      bash: { f: 'saludo.sh', t: '# Un saludo en Bash\nnombre="mundo"\necho "Hola, $nombre!"', r: 'Hola, mundo!', kw: 'echo|if|then|fi|for|do|done' }
    };
    var hl = function (lang) {
      var re = new RegExp('(\\/\\/.*$|#.*$)|(`[^`]*`|"[^"\\n]*")|\\b(' + S[lang].kw + ')\\b|(\\b\\d+\\b)', 'gm');
      return function (txt) {
        return esc(txt).replace(re, function (m, c, s, k, n) { return c ? '<span class="c">' + c + '</span>' : s ? '<span class="s">' + s + '</span>' : k ? '<span class="k">' + k + '</span>' : '<span class="n">' + n + '</span>'; });
      };
    };
    var ty = typer(out, ok), cur = 0, auto = true, timer = null;
    var play = async function (lang) {
      res.textContent = '';
      var steps = [{ t: S[lang].t, fmt: hl(lang), sp: 16 }, { wait: 250 }];
      steps.fmt = hl(lang);
      await ty.run(steps);
      res.textContent = S[lang].r;
    };
    var go = function (lang, user) {
      tabs.forEach(function (t) { t.classList.toggle('is-on', t.getAttribute('data-lang') === lang); });
      if (user) auto = false;
      play(lang);
    };
    tabs.forEach(function (t) { t.addEventListener('click', function () { go(t.getAttribute('data-lang'), true); }); });
    go('python', false);
    if (!reduce) setInterval(function () {
      if (!auto || !ok()) return;
      cur = (cur + 1) % tabs.length; go(tabs[cur].getAttribute('data-lang'), false);
    }, 7600);
  }

  var INIT = { hub: initHub, distros: initDistros, ofimatica: initOfimatica, edicion: initEdicion, juegos: initJuegos, utilidades: initUtilidades, desarrollo: initDesarrollo };
  if (INIT[page]) INIT[page]();

  /* ───────── Frameworks: GSAP + Lenis ───────── */
  if (!hasG) return;
  gsap.registerPlugin(ScrollTrigger);

  var lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach(function (a) {
    var id = a.getAttribute('href');
    if (!id || id.length < 2) return;
    a.addEventListener('click', function (e) {
      var t = $(id); if (!t) return;
      e.preventDefault();
      var off = -(navH() + 70);
      if (lenis) lenis.scrollTo(t, { offset: off, duration: 1.4, easing: function (x) { return 1 - Math.pow(1 - x, 4); } });
      else window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY + off, behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  if (!reduce) {
    var stage = hero ? hero.querySelector('.tp-hero-grid > :nth-child(2)') : null;
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.tp-hero .tp-back', { y: 16, opacity: 0, duration: 0.5 })
      .from('.tp-hero .tp-eyebrow', { y: 20, opacity: 0, duration: 0.6 }, '-=0.3')
      .from('.tp-hero .tp-ch', { yPercent: 115, rotate: 6, opacity: 0, duration: 0.9, stagger: 0.04 }, '-=0.3')
      .from('.tp-hero .tp-lead', { y: 24, opacity: 0, duration: 0.7 }, '-=0.5')
      .from('.tp-hero .tp-btn', { y: 22, opacity: 0, duration: 0.6, stagger: 0.1, clearProps: 'transform,opacity' }, '-=0.45')
      .from('.tp-hero .tp-stat', { y: 22, opacity: 0, duration: 0.6, stagger: 0.1 }, '-=0.4');
    if (stage) tl.from(stage, { x: 60, opacity: 0, duration: 1, clearProps: 'transform,opacity' }, '-=1.4');
    tl.from('.tp-cue', { opacity: 0, y: 12, duration: 0.6 }, '-=0.3');

    gsap.to('.tp-hero > .container', { yPercent: -7, opacity: 0.3, ease: 'none', scrollTrigger: { trigger: '.tp-hero', start: 'center top+=' + navH(), end: 'bottom top', scrub: true } });
    var bg = $('.tp-hero-bg');
    if (bg) gsap.to(bg, { yPercent: 14, ease: 'none', scrollTrigger: { trigger: '.tp-hero', start: 'top bottom', end: 'bottom top', scrub: true } });

    if (fine) {
      $$('[data-magnet]').forEach(function (el) {
        var xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' }), yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
        el.addEventListener('pointermove', function (e) { var r = el.getBoundingClientRect(); xTo((e.clientX - (r.left + r.width / 2)) * 0.28); yTo((e.clientY - (r.top + r.height / 2)) * 0.4); });
        el.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
      });
    }
    /* títulos de sección con entrada */
    $$('.tp-head h2').forEach(function (h) {
      gsap.from(h, { y: 40, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
    });
    var fact = $('.tp-fact');
    if (fact) gsap.from('.tp-fact-n', { scale: 0.6, opacity: 0, duration: 1, ease: 'back.out(1.6)', scrollTrigger: { trigger: fact, start: 'top 80%', once: true } });
  }

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
