/* Portfolio — theme, live node network, cursor spotlight, count-up,
   reveal, scroll-spy. No dependencies. Degrades to full static content. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─────────── theme ─────────── */

  var KEY = 'vk-theme';
  var stored = null;
  try { stored = localStorage.getItem(KEY); } catch (e) { /* private mode */ }
  if (stored === 'dark' || stored === 'light') root.setAttribute('data-theme', stored);

  function theme() {
    return root.getAttribute('data-theme') ||
      (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  }

  var ico = document.getElementById('theme-ico');
  function paint() { if (ico) ico.textContent = theme() === 'dark' ? '◐' : '◑'; }
  paint();

  var net = null;   // assigned below; referenced only from callbacks

  var tbtn = document.getElementById('theme');
  if (tbtn) {
    tbtn.addEventListener('click', function () {
      var next = theme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem(KEY, next); } catch (e) { /* ignore */ }
      paint();
      if (net) net.recolor();
    });
  }
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function () {
    if (!root.getAttribute('data-theme')) { paint(); if (net) net.recolor(); }
  });

  /* ─────────── year ─────────── */

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = String(new Date().getFullYear());

  /* ─────────── hero entrance ───────────
     Releasing .in is what makes the hero visible, so it fires three
     independent ways: next frame, on load, and a failsafe timer. */

  var hero = document.querySelector('.hero');
  function revealHero() { if (hero) hero.classList.add('in'); }
  requestAnimationFrame(function () { requestAnimationFrame(revealHero); });
  window.addEventListener('load', revealHero);
  setTimeout(revealHero, 1200);

  /* ─────────── live node network ───────────
     Decorative abstraction of a distributed pipeline: a source feeding
     layers of workers feeding sinks, with pulses travelling the edges.
     Depicts nothing proprietary — the topology is invented for the page. */

  net = (function () {
    var cv = document.getElementById('net');
    if (!cv) return null;
    var ctx = cv.getContext('2d');
    if (!ctx) return null;

    var W = 0, H = 0, dpr = 1, t = 0, raf = null, running = false;
    var nodes = [], edges = [], pulses = [];
    var C = {};

    function recolor() {
      var light = theme() === 'light';
      C.edge = light ? 'rgba(12,16,24,.16)'  : 'rgba(255,255,255,.11)';
      C.node = light ? 'rgba(12,16,24,.42)'  : 'rgba(255,255,255,.32)';
      C.core = light ? '#B85D0C' : '#FFB454';
      C.hot  = light ? '#C2451C' : '#FF6B3D';
      C.halo = light ? 'rgba(184,93,12,'   : 'rgba(255,180,84,';
    }

    /* Layered layout in normalised 0..1 space, resolved to pixels on build. */
    var LAYERS = [1, 4, 4, 2];

    function build() {
      var r = cv.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, Math.floor(r.width));
      H = Math.max(1, Math.floor(r.height));
      cv.width = Math.floor(W * dpr);
      cv.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      nodes = []; edges = [];
      /* Extra bottom padding keeps the lowest row clear of the caption bar,
         which overlays the canvas and would otherwise collide on short panels. */
      var padX = W * 0.13, padTop = H * 0.14, padBot = H * 0.14 + 30;
      var spanX = W - padX * 2, spanY = Math.max(40, H - padTop - padBot);

      var idxByLayer = [];
      for (var l = 0; l < LAYERS.length; l++) {
        var count = LAYERS[l], ids = [];
        for (var i = 0; i < count; i++) {
          var fx = LAYERS.length === 1 ? 0.5 : l / (LAYERS.length - 1);
          var fy = count === 1 ? 0.5 : i / (count - 1);
          ids.push(nodes.length);
          nodes.push({
            x: padX + fx * spanX,
            y: padTop + fy * spanY,
            r: l === 0 ? 6 : (l === LAYERS.length - 1 ? 5.5 : 4.4),
            layer: l,
            flash: 0,
            ph: Math.random() * Math.PI * 2      // float phase
          });
        }
        idxByLayer.push(ids);
      }

      for (var L = 0; L < idxByLayer.length - 1; L++) {
        var from = idxByLayer[L], to = idxByLayer[L + 1];
        for (var a = 0; a < from.length; a++) {
          for (var b = 0; b < to.length; b++) {
            // keep the graph legible: connect all from a single source/sink,
            // otherwise only near-diagonal neighbours
            var near = from.length === 1 || to.length === 1 ||
                       Math.abs(a - b) <= 1;
            if (near) edges.push({ a: from[a], b: to[b] });
          }
        }
      }
      pulses = [];
    }

    function pos(n) {
      // gentle float so the graph feels alive without moving much
      var fy = reduced ? 0 : Math.sin(t / 1400 + n.ph) * 3.5;
      return { x: n.x, y: n.y + fy };
    }

    function spawn() {
      if (!edges.length || pulses.length > 26) return;
      var e = edges[(Math.random() * edges.length) | 0];
      pulses.push({ e: e, p: 0, v: 0.006 + Math.random() * 0.011, hot: Math.random() < 0.25 });
    }

    function frame(ts) {
      t = ts || 0;
      ctx.clearRect(0, 0, W, H);

      // edges
      ctx.lineWidth = 1;
      ctx.strokeStyle = C.edge;
      ctx.beginPath();
      for (var i = 0; i < edges.length; i++) {
        var A = pos(nodes[edges[i].a]), B = pos(nodes[edges[i].b]);
        ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y);
      }
      ctx.stroke();

      // pulses
      for (var p = pulses.length - 1; p >= 0; p--) {
        var s = pulses[p];
        if (!reduced) s.p += s.v;
        if (s.p >= 1) {
          nodes[s.e.b].flash = 1;
          pulses.splice(p, 1);
          continue;
        }
        var na = pos(nodes[s.e.a]), nb = pos(nodes[s.e.b]);
        var x = na.x + (nb.x - na.x) * s.p;
        var y = na.y + (nb.y - na.y) * s.p;
        var col = s.hot ? C.hot : C.core;

        // trail
        var tx = na.x + (nb.x - na.x) * Math.max(0, s.p - 0.16);
        var ty = na.y + (nb.y - na.y) * Math.max(0, s.p - 0.16);
        var g = ctx.createLinearGradient(tx, ty, x, y);
        g.addColorStop(0, C.halo + '0)');
        g.addColorStop(1, C.halo + '.85)');
        ctx.strokeStyle = g; ctx.lineWidth = s.hot ? 2 : 1.4;
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(x, y); ctx.stroke();

        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(x, y, s.hot ? 2.6 : 2, 0, Math.PI * 2); ctx.fill();
      }

      // nodes
      for (var n = 0; n < nodes.length; n++) {
        var nd = nodes[n], q = pos(nd);
        if (nd.flash > 0) {
          ctx.fillStyle = C.halo + (nd.flash * 0.3).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(q.x, q.y, nd.r + 12 * (1 - nd.flash) + 4, 0, Math.PI * 2); ctx.fill();
          if (!reduced) nd.flash = Math.max(0, nd.flash - 0.028);
        }
        ctx.fillStyle = nd.flash > 0.05 ? C.core : C.node;
        ctx.beginPath(); ctx.arc(q.x, q.y, nd.r, 0, Math.PI * 2); ctx.fill();

        ctx.strokeStyle = C.edge; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(q.x, q.y, nd.r + 4.5, 0, Math.PI * 2); ctx.stroke();
      }

      if (!reduced && Math.random() < 0.09) spawn();
      if (running) raf = requestAnimationFrame(frame);
    }

    function start() { if (!running) { running = true; raf = requestAnimationFrame(frame); } }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }

    recolor();
    build();

    if (reduced) {
      // one populated static frame so the panel is never empty
      for (var k = 0; k < 8; k++) spawn();
      pulses.forEach(function (s, i) { s.p = 0.2 + (i % 5) * 0.15; });
      frame(0);
    } else {
      start();
      document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) { es[0].isIntersecting ? start() : stop(); },
          { threshold: 0 }).observe(cv);
      }
    }

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { build(); if (reduced) frame(0); }, 180);
    });

    return { recolor: recolor };
  })();

  /* ─────────── cursor spotlight on cards ─────────── */

  if (!reduced && window.matchMedia('(hover: hover)').matches) {
    var cards = document.querySelectorAll('.card');
    cards.forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
        c.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
      });
    });
  }

  /* ─────────── count-up ─────────── */

  function group(n) { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  var counters = document.querySelectorAll('[data-count]');
  function runCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var sep = el.hasAttribute('data-sep');
    if (reduced) { el.textContent = sep ? group(target) : String(target); return; }
    var dur = 1600, t0 = null;
    function tick(ts) {
      if (t0 === null) t0 = ts;
      var pr = Math.min(1, (ts - t0) / dur);
      var v = Math.round(target * (1 - Math.pow(1 - pr, 3)));
      el.textContent = sep ? group(v) : String(v);
      if (pr < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  if ('IntersectionObserver' in window) {
    var cObs = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { runCount(e.target); cObs.unobserve(e.target); } });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { cObs.observe(el); });
  } else {
    counters.forEach(runCount);
  }

  /* ─────────── reveal ─────────── */

  var rv = document.querySelectorAll('.rv');
  function revealAll() { rv.forEach(function (el) { el.classList.add('in'); }); }

  if (reduced || !('IntersectionObserver' in window)) {
    revealAll();
  } else {
    var rObs = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rObs.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
    rv.forEach(function (el) { rObs.observe(el); });

    /* Failsafe: these elements start invisible, so if the observer never
       delivers — a stalled callback, an unsupported edge case — the page would
       silently lose most of its content. If nothing has resolved by 2.5s,
       reveal everything. In normal operation at least the first card has
       already resolved, so the scroll choreography is left intact. */
    setTimeout(function () {
      if (!document.querySelector('.rv.in')) revealAll();
    }, 2500);
  }

  /* ─────────── sticky nav + scroll-spy ─────────── */

  var nav = document.getElementById('nav');
  function onScroll() { if (nav) nav.classList.toggle('stuck', window.scrollY > 40); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__links a'));
  if (navLinks.length && 'IntersectionObserver' in window) {
    var secs = navLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
    var vis = new Map();
    var sObs = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) vis.set(e.target.id, e.intersectionRatio);
        else vis.delete(e.target.id);
      });
      var best = null, top = -1;
      vis.forEach(function (r, id) { if (r > top) { top = r; best = id; } });
      navLinks.forEach(function (a) {
        if (best && a.getAttribute('href') === '#' + best) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    }, { rootMargin: '-12% 0px -60% 0px', threshold: [0.01, 0.2, 0.5] });
    secs.forEach(function (s) { sObs.observe(s); });
  }
})();
