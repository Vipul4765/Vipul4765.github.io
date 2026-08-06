/* Portfolio — theme, generative hero field, count-up, reveal, scroll-spy.
   No dependencies. Degrades to full static content without JS. */
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

  var tbtn = document.getElementById('theme');
  if (tbtn) {
    tbtn.addEventListener('click', function () {
      var next = theme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem(KEY, next); } catch (e) { /* ignore */ }
      paint();
      if (field) field.recolor();
    });
  }
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function () {
    if (!root.getAttribute('data-theme')) { paint(); if (field) field.recolor(); }
  });

  /* ─────────── year ─────────── */

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = String(new Date().getFullYear());

  /* ─────────── hero entrance ───────────
     Releasing .in is what makes the hero visible, so it must be
     unconditional: fire on the next frame, and again on a failsafe timer
     in case that frame never arrives. */

  var hero = document.querySelector('.hero');
  function revealHero() { if (hero) hero.classList.add('in'); }
  requestAnimationFrame(function () { requestAnimationFrame(revealHero); });
  setTimeout(revealHero, 1200);
  window.addEventListener('load', revealHero);

  /* ─────────── hero field ───────────
     Abstract event-stream: particles travelling along lanes, occasional
     brighter pulses. Decorative only — depicts nothing proprietary. */

  var field = (function () {
    var cv = document.getElementById('field');
    if (!cv) return null;
    var ctx = cv.getContext('2d', { alpha: true });
    if (!ctx) return null;

    var W = 0, H = 0, dpr = 1;
    var lanes = [], parts = [];
    var ink = { line: 'rgba(255,255,255,.05)', warm: '255,162,62', hot: '255,107,61' };
    var raf = null, running = false;

    function recolor() {
      var light = theme() === 'light';
      ink.line = light ? 'rgba(16,20,28,.055)' : 'rgba(255,255,255,.05)';
      ink.warm = light ? '184,93,12' : '255,162,62';
      ink.hot  = light ? '194,69,28' : '255,107,61';
    }

    function build() {
      var rect = cv.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, Math.floor(rect.width));
      H = Math.max(1, Math.floor(rect.height));
      cv.width = Math.floor(W * dpr);
      cv.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // lanes spread across the full height, denser toward the middle
      var n = Math.max(7, Math.min(20, Math.round(H / 62)));
      lanes = [];
      for (var i = 0; i < n; i++) lanes.push(((i + 0.5) / n) * H);

      // particle budget scales with area but stays bounded
      var budget = Math.max(26, Math.min(90, Math.round((W * H) / 26000)));
      parts = [];
      for (var p = 0; p < budget; p++) parts.push(spawn(true));
    }

    function spawn(seed) {
      var hot = Math.random() < 0.16;
      return {
        y: lanes[(Math.random() * lanes.length) | 0],
        x: seed ? Math.random() * W : -40 - Math.random() * 180,
        v: 0.22 + Math.random() * 0.85,
        len: 22 + Math.random() * 108,
        a: 0.10 + Math.random() * 0.42,
        hot: hot
      };
    }

    function frame() {
      ctx.clearRect(0, 0, W, H);

      // lane rules
      ctx.strokeStyle = ink.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (var i = 0; i < lanes.length; i++) {
        var y = Math.round(lanes[i]) + 0.5;
        ctx.moveTo(0, y); ctx.lineTo(W, y);
      }
      ctx.stroke();

      // travelling streaks
      for (var p = 0; p < parts.length; p++) {
        var s = parts[p];
        s.x += s.v;
        if (s.x - s.len > W) { parts[p] = spawn(false); continue; }

        var rgb = s.hot ? ink.hot : ink.warm;
        var g = ctx.createLinearGradient(s.x - s.len, 0, s.x, 0);
        g.addColorStop(0, 'rgba(' + rgb + ',0)');
        g.addColorStop(1, 'rgba(' + rgb + ',' + s.a.toFixed(3) + ')');
        ctx.strokeStyle = g;
        ctx.lineWidth = s.hot ? 1.7 : 1.1;
        ctx.beginPath();
        ctx.moveTo(s.x - s.len, s.y);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();

        if (s.hot) {   // leading head
          ctx.fillStyle = 'rgba(' + rgb + ',' + Math.min(1, s.a + 0.30).toFixed(3) + ')';
          ctx.beginPath();
          ctx.arc(s.x, s.y, 1.7, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(frame);
    }

    function start() { if (!running) { running = true; raf = requestAnimationFrame(frame); } }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }

    recolor();
    build();

    if (reduced) {
      frame();          // one static frame
      stop();
    } else {
      start();
      // don't burn battery on a hidden tab or when the hero is off-screen
      document.addEventListener('visibilitychange', function () {
        document.hidden ? stop() : start();
      });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) {
          es[0].isIntersecting ? start() : stop();
        }, { threshold: 0 }).observe(cv);
      }
    }

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { build(); if (reduced) frame(); }, 180);
    });

    return { recolor: recolor };
  })();

  /* ─────────── count-up ─────────── */

  function group(n) { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  var counters = document.querySelectorAll('[data-count]');
  function runCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var sep = el.hasAttribute('data-sep');
    if (reduced) { el.textContent = sep ? group(target) : String(target); return; }
    var dur = 1500, t0 = null;
    function tick(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = Math.round(target * eased);
      el.textContent = sep ? group(val) : String(val);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  if ('IntersectionObserver' in window) {
    var cObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { runCount(e.target); cObs.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { cObs.observe(el); });
  } else {
    counters.forEach(runCount);
  }

  /* ─────────── reveal ─────────── */

  var rv = document.querySelectorAll('.rv');
  if (reduced || !('IntersectionObserver' in window)) {
    rv.forEach(function (el) { el.classList.add('in'); });
  } else {
    var rObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); rObs.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
    rv.forEach(function (el) { rObs.observe(el); });
  }

  /* ─────────── sticky nav + scroll-spy ─────────── */

  var nav = document.getElementById('nav');
  function onScroll() {
    if (nav) nav.classList.toggle('stuck', window.scrollY > 40);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__links a'));
  if (navLinks.length && 'IntersectionObserver' in window) {
    var secs = navLinks
      .map(function (a) { return document.querySelector(a.getAttribute('href')); })
      .filter(Boolean);
    var vis = new Map();
    var sObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
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
