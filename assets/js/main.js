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

  /* ─────────── pointer-driven motion ───────────
     Spotlight, card tilt and magnetic buttons all run off one rAF loop
     with lerped targets, so they glide instead of snapping and we never
     schedule more than one frame of work per pointer burst. */

  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (!reduced && fine) {
    var lerp = function (a, b, n) { return a + (b - a) * n; };
    var tracked = [], pending = false;

    document.querySelectorAll('.card').forEach(function (c) {
      var st = { el: c, rx: 0, ry: 0, trx: 0, try_: 0, active: false };
      tracked.push(st);
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        c.style.setProperty('--mx', (px * 100) + '%');
        c.style.setProperty('--my', (py * 100) + '%');
        /* Tilt stays small — a card that swings reads as a gimmick, and a
           large rotateX makes the text edges shimmer during the transition. */
        st.try_ = (px - 0.5) * 6;
        st.trx = (0.5 - py) * 4;
        st.active = true;
        schedule();
      });
      c.addEventListener('pointerleave', function () {
        st.trx = 0; st.try_ = 0; st.active = true; schedule();
      });
    });

    var mags = [];
    document.querySelectorAll('.btn, .navcta').forEach(function (b) {
      var st = { el: b, x: 0, y: 0, tx: 0, ty: 0, active: false };
      mags.push(st);
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        st.tx = (e.clientX - (r.left + r.width / 2)) * 0.28;
        st.ty = (e.clientY - (r.top + r.height / 2)) * 0.4;
        st.active = true; schedule();
      });
      b.addEventListener('pointerleave', function () {
        st.tx = 0; st.ty = 0; st.active = true; schedule();
      });
    });

    function step() {
      pending = false;
      var busy = false;

      tracked.forEach(function (s) {
        if (!s.active) return;
        s.rx = lerp(s.rx, s.trx, 0.12);
        s.ry = lerp(s.ry, s.try_, 0.12);
        s.el.style.setProperty('--rx', s.rx.toFixed(3) + 'deg');
        s.el.style.setProperty('--ry', s.ry.toFixed(3) + 'deg');
        if (Math.abs(s.rx - s.trx) < 0.01 && Math.abs(s.ry - s.try_) < 0.01) s.active = false;
        else busy = true;
      });

      mags.forEach(function (s) {
        if (!s.active) return;
        s.x = lerp(s.x, s.tx, 0.16);
        s.y = lerp(s.y, s.ty, 0.16);
        s.el.style.setProperty('--tx', s.x.toFixed(2) + 'px');
        s.el.style.setProperty('--ty', s.y.toFixed(2) + 'px');
        if (Math.abs(s.x - s.tx) < 0.05 && Math.abs(s.y - s.ty) < 0.05) s.active = false;
        else busy = true;
      });

      if (busy) schedule();
    }

    function schedule() { if (!pending) { pending = true; requestAnimationFrame(step); } }
  }

  /* ─────────── odometer counters ───────────
     Each digit is a 0-9 column that slides to its target, stepped left to
     right. Reads as mechanical rather than as a number flickering upward. */

  function group(n) { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  function buildOdo(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var str = el.hasAttribute('data-sep') ? group(target) : String(target);
    var frag = document.createDocumentFragment();
    var wrap = document.createElement('span');
    wrap.className = 'odo';
    wrap.setAttribute('aria-label', str);

    var k = 0;
    for (var i = 0; i < str.length; i++) {
      var ch = str[i];
      if (ch < '0' || ch > '9') {                 // comma, space, anything else
        var lit = document.createElement('span');
        lit.textContent = ch;
        lit.setAttribute('aria-hidden', 'true');
        wrap.appendChild(lit);
        continue;
      }
      var d = document.createElement('span');
      d.className = 'odo__d';
      d.setAttribute('aria-hidden', 'true');
      var col = document.createElement('span');
      col.className = 'odo__c';
      for (var n = 0; n <= 9; n++) {
        var s = document.createElement('span');
        s.textContent = String(n);
        col.appendChild(s);
      }
      col.style.setProperty('--k', k++);
      d.appendChild(col);
      d.__col = col;
      d.__target = +ch;
      wrap.appendChild(d);
    }
    frag.appendChild(wrap);
    el.textContent = '';
    el.appendChild(frag);
    return wrap;
  }

  function rollOdo(wrap) {
    wrap.querySelectorAll('.odo__d').forEach(function (d) {
      d.__col.style.setProperty('--d', d.__target);
    });
  }

  var counters = document.querySelectorAll('[data-count]');
  counters.forEach(function (el) {
    var wrap = buildOdo(el);
    el.__odo = wrap;
    if (reduced) rollOdo(wrap);
  });

  if (!reduced) {
    if ('IntersectionObserver' in window) {
      var cObs = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { rollOdo(e.target.__odo); cObs.unobserve(e.target); }
        });
      }, { threshold: 0.4 });
      counters.forEach(function (el) { cObs.observe(el); });
      /* Failsafe: an unfired observer would leave every counter reading 0. */
      setTimeout(function () { counters.forEach(function (el) { rollOdo(el.__odo); }); }, 3000);
    } else {
      counters.forEach(function (el) { rollOdo(el.__odo); });
    }
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

  /* ─────────── stagger groups ───────────
     Index each child so the reveal cascades rather than landing at once. */

  document.querySelectorAll('.stag').forEach(function (g) {
    Array.prototype.forEach.call(g.children, function (c, i) {
      c.style.setProperty('--i', i);
    });
  });

  /* ─────────── scroll-driven motion ───────────
     Progress bar, hero parallax, and a ticker that leans with scroll
     velocity. All reads happen once per frame in one rAF. */

  var nav = document.getElementById('nav');
  var bar = document.getElementById('progress');
  var barIn = bar && bar.firstElementChild;
  var viz = document.querySelector('.hero__viz');
  var tickerRow = document.querySelector('.ticker__row');

  var lastY = window.scrollY, vel = 0, skew = 0, ticking = false;

  function onFrame() {
    ticking = false;
    var y = window.scrollY;
    var h = document.documentElement.scrollHeight - window.innerHeight;

    if (nav) nav.classList.toggle('stuck', y > 40);

    if (barIn && !reduced) {
      barIn.style.setProperty('--p', h > 0 ? Math.min(1, Math.max(0, y / h)).toFixed(4) : 0);
    }

    if (!reduced) {
      if (viz && y < window.innerHeight * 1.4) {
        viz.style.setProperty('--pz', (y * -0.06).toFixed(2) + 'px');
      }
      /* velocity -> a slight lean on the marquee; decays back to upright */
      vel = y - lastY;
      var want = Math.max(-6, Math.min(6, vel * 0.22));
      skew += (want - skew) * 0.18;
      if (Math.abs(skew) < 0.02) skew = 0;
      if (tickerRow) tickerRow.style.setProperty('--sk', skew.toFixed(2) + 'deg');
      if (Math.abs(skew) > 0) schedFrame();
    }
    lastY = y;
  }

  function schedFrame() { if (!ticking) { ticking = true; requestAnimationFrame(onFrame); } }

  onFrame();
  window.addEventListener('scroll', schedFrame, { passive: true });
  window.addEventListener('resize', schedFrame, { passive: true });

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
