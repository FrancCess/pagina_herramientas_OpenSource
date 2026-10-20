/* Edición v2: capas que se separan con el scroll, mezclador con Web Audio
   y la página entera como línea de tiempo de un editor de video.
   Solo corre en pages/edicion.html (body.tp-edicion). */
(function () {
  'use strict';
  if (!document.body.classList.contains('tp-edicion')) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var ease = function (t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };

  /* ================= 1. CAPAS ================= */
  var ly = document.querySelector('[data-ly]');
  if (ly) {
    var stage = ly.querySelector('[data-ly-stage]');
    var layers = Array.prototype.slice.call(ly.querySelectorAll('[data-ly-layer]'));
    var rows = Array.prototype.slice.call(ly.querySelectorAll('[data-ly-row]'));
    var stepEl = ly.querySelector('[data-ly-step]');
    var N = layers.length, hidden = {};
    var STEPS = [
      'Así se ve el póster terminado. Sigue bajando y míralo por dentro.',
      'En realidad son varias capas apiladas, como hojas de acetato.',
      'Capa 1 · Fondo: la fotografía original.',
      'Capa 2 · Ajuste de color: un degradado encima cambia el ambiente sin tocar la foto.',
      'Capa 3 · Forma vectorial: curvas con nodos, como en Inkscape. Se pueden escalar sin perder calidad.',
      'Capa 4 · Texto: siempre editable, en su propia capa.',
      'Capa 5 · Efectos de luz: brillos que se suman al final.',
      'Todo junto otra vez. Así trabajan GIMP, Krita e Inkscape.'
    ];
    var lastStep = -1;
    rows.forEach(function (r) {
      r.addEventListener('click', function () {
        var i = +r.getAttribute('data-ly-row'); hidden[i] = !hidden[i];
        r.setAttribute('aria-pressed', hidden[i] ? 'false' : 'true');
        layers[i].classList.toggle('is-off', !!hidden[i]);
      });
    });
    var render = function (p) {
      /* p: 0..1 progreso del recorrido */
      var open = p < .12 ? 0 : p < .3 ? ease((p - .12) / .18) : p < .8 ? 1 : p < .93 ? 1 - ease((p - .8) / .13) : 0;
      var focus = -1, step = 0;
      if (p >= .12 && p < .3) step = 1;
      else if (p >= .3 && p < .8) { focus = clamp(Math.floor((p - .3) / (.5 / N)), 0, N - 1); step = 2 + focus; }
      else if (p >= .8) step = 7;
      stage.style.setProperty('--open', open.toFixed(4));
      layers.forEach(function (l, i) {
        l.style.setProperty('--z', (i * open * 70).toFixed(1) + 'px');
        l.classList.toggle('is-focus', i === focus);
        l.classList.toggle('is-dim', focus > -1 && i !== focus);
      });
      rows.forEach(function (r) { r.classList.toggle('is-on', +r.getAttribute('data-ly-row') === focus); });
      stage.classList.toggle('is-open', open > .05);
      if (step !== lastStep) { lastStep = step; stepEl.textContent = STEPS[step]; }
    };
    var mqDesk = window.matchMedia('(min-width: 768px)');
    var staticMode = function () { return reduce; };
    if (staticMode()) {
      ly.classList.add('ly-static'); render(.5);
      stepEl.textContent = 'Una imagen son varias capas apiladas: fondo, ajuste de color, forma vectorial, texto y efectos. Toca el ojo para ocultar cada una.';
      layers.forEach(function (l) { l.classList.remove('is-dim', 'is-focus'); }); rows.forEach(function (r) { r.classList.remove('is-on'); });
    } else {
      var tick = function () {
        var r = ly.getBoundingClientRect(), vh = window.innerHeight;
        var total = r.height - vh; var p = total > 0 ? clamp(-r.top / total, 0, 1) : 0;
        render(p);
      };
      window.addEventListener('scroll', tick, { passive: true }); window.addEventListener('resize', tick); tick();
    }
  }

  /* ================= 2. MEZCLADOR (Web Audio) ================= */
  var mx = document.querySelector('[data-mx]');
  var shared = { analyser: null, playing: false };
  if (mx) {
    var AC = window.AudioContext || window.webkitAudioContext;
    var playBtn = mx.querySelector('[data-mx-play]'), label = mx.querySelector('[data-mx-label]'), timeEl = mx.querySelector('[data-mx-time]');
    var faders = Array.prototype.slice.call(mx.querySelectorAll('[data-mx-fader]'));
    var mutes = Array.prototype.slice.call(mx.querySelectorAll('[data-mx-mute]'));
    var meters = Array.prototype.slice.call(mx.querySelectorAll('[data-mx-meter]'));
    var scope = mx.querySelector('[data-mx-scope]'), sctx = scope.getContext('2d');
    var ctx = null, chans = [], master = null, analysers = [], timer = null, nextT = 0, stepN = 0, startT = 0, raf = 0;
    var BPM = 124, S16 = 60 / BPM / 4;
    /* Do mayor, electrónica animada: C – G – Am – F */
    var CH = [[60, 64, 67], [59, 62, 67], [57, 60, 64], [57, 60, 65]];
    var BASS = [36, 43, 33, 41];
    var MEL = [79, 76, 72, 76, 79, 76, 84, 79, 79, 74, 79, 83, 79, 74, 83, 79, 81, 76, 72, 76, 81, 76, 72, 69, 77, 72, 77, 81, 77, 72, 81, 77];
    var hz = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };
    var gainOf = function (i) { return (+faders[i].value / 100) * (mutes[i] && mutes[i].getAttribute('aria-pressed') === 'true' ? 0 : 1); };
    var applyGains = function () {
      if (!ctx) return;
      for (var i = 0; i < 4; i++) chans[i].gain.setTargetAtTime(gainOf(i) * gainOf(i), ctx.currentTime, .03);
      var m = +faders[4].value / 100; master.gain.setTargetAtTime(m * m * .8, ctx.currentTime, .03);
    };
    var build = function () {
      ctx = new AC();
      master = ctx.createGain(); var comp = ctx.createDynamicsCompressor();
      master.connect(comp); comp.connect(ctx.destination);
      shared.analyser = ctx.createAnalyser(); shared.analyser.fftSize = 1024; comp.connect(shared.analyser);
      for (var i = 0; i < 4; i++) {
        var g = ctx.createGain(), a = ctx.createAnalyser(); a.fftSize = 256;
        g.connect(a); g.connect(master); chans.push(g); analysers.push(a);
      }
      applyGains();
    };
    var env = function (node, t, a, peak, d) { node.gain.setValueAtTime(0.0001, t); node.gain.exponentialRampToValueAtTime(peak, t + a); node.gain.exponentialRampToValueAtTime(0.0001, t + a + d); };
    var kick = function (t) { var o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + .12); env(g, t, .002, .9, .28); o.connect(g); g.connect(chans[0]); o.start(t); o.stop(t + .32); };
    var noiseBuf = null;
    var hat = function (t, v) {
      if (!noiseBuf) { noiseBuf = ctx.createBuffer(1, ctx.sampleRate * .2, ctx.sampleRate); var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
      var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = 7000;
      env(g, t, .001, v, .05); s.connect(f); f.connect(g); g.connect(chans[0]); s.start(t); s.stop(t + .08);
    };
    var snare = function (t) {
      hat(t, .0001);
      var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = 1800;
      env(g, t, .001, .35, .16); s.connect(f); f.connect(g); g.connect(chans[0]); s.start(t); s.stop(t + .2);
    };
    var tone = function (ch, type, m, t, dur, peak, cutoff) {
      var o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter(); o.type = type; o.frequency.value = hz(m);
      f.type = 'lowpass'; f.frequency.value = cutoff || 2400; env(g, t, .01, peak, dur);
      o.connect(f); f.connect(g); g.connect(chans[ch]); o.start(t); o.stop(t + dur + .05);
    };
    var schedule = function () {
      while (nextT < ctx.currentTime + .12) {
        var s = stepN % 64, bar = Math.floor(s / 16), b = s % 16;
        if (b % 4 === 0) kick(nextT);
        if (b === 4 || b === 12) snare(nextT);
        if (b % 2 === 1) hat(nextT, .12);
        if (b % 4 === 2) tone(1, 'sawtooth', BASS[bar], nextT, S16 * 1.8, .34, 700);
        if (b === 0 || b === 6 || b === 10 || b === 14) CH[bar].forEach(function (m) { tone(2, 'sawtooth', m, nextT, S16 * 2.2, .05, 2200); });
        if (b % 2 === 0 && MEL[(s / 2 | 0) % 32] && (b % 4 === 0 || Math.random() > .35)) tone(3, 'square', MEL[(s / 2 | 0) % 32], nextT, S16 * 1.3, .07, 2600);
        nextT += S16; stepN++;
      }
    };
    var buf = new Uint8Array(256), wave = new Uint8Array(1024);
    var draw = function () {
      raf = requestAnimationFrame(draw);
      for (var i = 0; i < 4; i++) {
        analysers[i].getByteTimeDomainData(buf); var pk = 0;
        for (var k = 0; k < buf.length; k++) pk = Math.max(pk, Math.abs(buf[k] - 128));
        meters[i].style.transform = 'scaleY(' + Math.min(1, pk / 70).toFixed(3) + ')';
      }
      shared.analyser.getByteTimeDomainData(wave); var mp = 0;
      var w = scope.width, h = scope.height; sctx.clearRect(0, 0, w, h); sctx.lineWidth = 2; sctx.strokeStyle = '#FF6FA0'; sctx.beginPath();
      for (var j = 0; j < wave.length; j += 4) { var x = j / wave.length * w, y = h / 2 + (wave[j] - 128) / 128 * h * .9; mp = Math.max(mp, Math.abs(wave[j] - 128)); if (j) sctx.lineTo(x, y); else sctx.moveTo(x, y); }
      sctx.stroke();
      meters[4].style.transform = 'scaleY(' + Math.min(1, mp / 80).toFixed(3) + ')';
      var el = ctx.currentTime - startT; timeEl.textContent = ('0' + (el / 60 | 0)).slice(-2) + ':' + ('0' + (el % 60 | 0)).slice(-2);
    };
    var stop = function () {
      shared.playing = false; clearInterval(timer); cancelAnimationFrame(raf);
      if (ctx) ctx.suspend();
      meters.forEach(function (m) { m.style.transform = 'scaleY(0)'; }); sctx.clearRect(0, 0, scope.width, scope.height);
      playBtn.setAttribute('aria-pressed', 'false'); label.textContent = 'Reproducir'; mx.classList.remove('is-playing');
    };
    var play = function () {
      if (!AC) { label.textContent = 'Tu navegador no soporta audio'; return; }
      if (!ctx) build();
      ctx.resume(); nextT = ctx.currentTime + .06; startT = nextT; stepN = 0;
      timer = setInterval(schedule, 25); schedule(); draw();
      shared.playing = true; playBtn.setAttribute('aria-pressed', 'true'); label.textContent = 'Detener'; mx.classList.add('is-playing');
    };
    playBtn.addEventListener('click', function () { shared.playing ? stop() : play(); });
    faders.forEach(function (f) { f.addEventListener('input', applyGains); });
    mutes.forEach(function (m) { m.addEventListener('click', function () { m.setAttribute('aria-pressed', m.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); applyGains(); }); });
    document.addEventListener('visibilitychange', function () { if (document.hidden && shared.playing) stop(); });
  }

  /* (este script se carga ANTES de herramientas.js para que sus enlaces #ancla usen el mismo scroll suave) */
  /* ================= 3. LA PÁGINA COMO LÍNEA DE TIEMPO ================= */
  var main = document.querySelector('.tp-main') || document.querySelector('main');
  var secs = [
    { id: 'estudio', n: 'Estudio', c: '#FF6FA0' }, { id: 'capas', n: 'Capas', c: '#9B5CFF' },
    { id: 'mezcla', n: 'Mezcla', c: '#35E8C9' }, { id: 'antes-despues', n: 'Antes / después', c: '#FF9A4D' }
  ].filter(function (s) { return document.getElementById(s.id); });
  if (secs.length) {
    var bar = document.createElement('div'); bar.className = 'tl-bar'; bar.setAttribute('role', 'navigation'); bar.setAttribute('aria-label', 'Línea de tiempo de la página');
    bar.innerHTML = '<div class="tl-head"><span class="tl-rec" aria-hidden="true"></span><b class="tl-tc" data-tl-tc>00:00:00</b><small>Edición.mp4</small></div>' +
      '<div class="tl-tracks"><div class="tl-track tl-v"><span class="tl-lab">V1</span><div class="tl-clips" data-tl-clips></div></div>' +
      '<div class="tl-track tl-a"><span class="tl-lab">A1</span><div class="tl-wave" data-tl-wave></div></div>' +
      '<span class="tl-ph" data-tl-ph aria-hidden="true"></span></div>';
    document.body.appendChild(bar); document.body.classList.add('has-tl');
    var clipsEl = bar.querySelector('[data-tl-clips]'), waveEl = bar.querySelector('[data-tl-wave]'), ph = bar.querySelector('[data-tl-ph]'), tc = bar.querySelector('[data-tl-tc]');
    var NB = 90, bars = [];
    for (var i = 0; i < NB; i++) { var u = document.createElement('i'); var h = .25 + .75 * Math.abs(Math.sin(i * .7) * Math.cos(i * .23)); u.style.setProperty('--h', h.toFixed(2)); waveEl.appendChild(u); bars.push(u); }
    var clips = secs.map(function (s) {
      var b = document.createElement('a'); b.href = '#' + s.id; b.className = 'tl-clip'; b.style.setProperty('--c', s.c);
      b.innerHTML = '<span>' + s.n + '</span>'; b.setAttribute('aria-label', 'Ir a ' + s.n);
      clipsEl.appendChild(b); return { s: s, b: b, el: document.getElementById(s.id) };
    });
    var K = clips.length, bounds = [];
    var layout = function () {
      var off = window.innerHeight * .4;
      bounds = clips.map(function (c) { return c.el.getBoundingClientRect().top + window.scrollY - off; });
      bounds.push(clips[K - 1].el.getBoundingClientRect().bottom + window.scrollY - window.innerHeight * .6);
      clips.forEach(function (c, i) { c.b.style.left = (i / K * 100).toFixed(3) + '%'; c.b.style.width = 'calc(' + (100 / K).toFixed(3) + '% - 2px)'; });
    };
    var progress = function (y) {
      if (y <= bounds[0]) return { p: 0, i: -1 };
      for (var i = 0; i < K; i++) if (y < bounds[i + 1]) return { p: (i + (y - bounds[i]) / Math.max(1, bounds[i + 1] - bounds[i])) / K, i: i };
      return { p: 1, i: K - 1 };
    };
    var DUR = 180, ftk = 0;
    var update = function () {
      var pr = progress(window.scrollY), p = clamp(pr.p, 0, 1);
      bar.style.setProperty('--p', p.toFixed(4));
      var sec = p * DUR; tc.textContent = ('0' + (sec / 60 | 0)).slice(-2) + ':' + ('0' + (sec % 60 | 0)).slice(-2) + ':' + ('0' + ((sec * 24) % 24 | 0)).slice(-2);
      clips.forEach(function (c, i) { c.b.classList.toggle('is-on', i === pr.i); });
      var heroB = (document.querySelector('.tp-hero') || main).getBoundingClientRect().bottom;
      var foot = document.querySelector('footer'); var fTop = foot ? foot.getBoundingClientRect().top : 1e9;
      bar.classList.toggle('is-in', heroB < window.innerHeight * .5 && fTop > window.innerHeight - 20);
      var played = Math.round(p * NB); if (played !== ftk) { ftk = played; bars.forEach(function (u, i) { u.classList.toggle('is-p', i < played); }); }
    };
    /* las barras de audio se mueven con el mezclador si está sonando */
    var abuf = new Uint8Array(512), live = function () {
      requestAnimationFrame(live);
      if (!shared.playing || !shared.analyser || !bar.classList.contains('is-in')) { if (waveEl.classList.contains('is-live')) { waveEl.classList.remove('is-live'); bars.forEach(function (u) { u.style.removeProperty('--lv'); }); } return; }
      waveEl.classList.add('is-live'); shared.analyser.getByteFrequencyData(abuf);
      for (var i = 0; i < NB; i++) bars[i].style.setProperty('--lv', (abuf[2 + i * 2] / 255).toFixed(2));
    };
    live();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', function () { layout(); update(); });
    window.addEventListener('load', function () { layout(); update(); });
    setTimeout(function () { layout(); update(); }, 600);
    layout(); update();
  }
})();
