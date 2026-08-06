/* Portfolio — theme, pointer motion, odometers, reveal, scroll-spy.
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
    });
  }
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function () {
    if (!root.getAttribute('data-theme')) paint();
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

  /* ─────────── pointer-driven motion ───────────
     Spotlight, card tilt and magnetic buttons share one rAF loop with
     lerped targets, so they glide instead of snapping and we never
     schedule more than one frame of work per pointer burst. */

  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (!reduced && fine) {
    var lerp = function (a, b, n) { return a + (b - a) * n; };
    var tilts = [], mags = [], pending = false;

    function schedule() { if (!pending) { pending = true; requestAnimationFrame(step); } }

    document.querySelectorAll('.card').forEach(function (c) {
      var st = { el: c, rx: 0, ry: 0, trx: 0, try_: 0, active: false };
      tilts.push(st);
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        c.style.setProperty('--mx', (px * 100) + '%');
        c.style.setProperty('--my', (py * 100) + '%');
        /* Tilt stays small — a card that swings reads as a gimmick, and a
           large rotateX makes text edges shimmer during the transition. */
        st.try_ = (px - 0.5) * 5;
        st.trx = (0.5 - py) * 3.5;
        st.active = true;
        schedule();
      });
      c.addEventListener('pointerleave', function () {
        st.trx = 0; st.try_ = 0; st.active = true; schedule();
      });
    });

    document.querySelectorAll('.btn, .navcta').forEach(function (b) {
      var st = { el: b, x: 0, y: 0, tx: 0, ty: 0, active: false };
      mags.push(st);
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        st.tx = (e.clientX - (r.left + r.width / 2)) * 0.26;
        st.ty = (e.clientY - (r.top + r.height / 2)) * 0.38;
        st.active = true; schedule();
      });
      b.addEventListener('pointerleave', function () {
        st.tx = 0; st.ty = 0; st.active = true; schedule();
      });
    });

    function step() {
      pending = false;
      var busy = false;

      tilts.forEach(function (s) {
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
  }

  /* ─────────── odometer counters ───────────
     Each digit is a 0-9 column that slides to its target, stepped left to
     right. Reads as mechanical rather than as a number flickering upward. */

  function group(n) { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  function buildOdo(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var str = el.hasAttribute('data-sep') ? group(target) : String(target);
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
    el.textContent = '';
    el.appendChild(wrap);
    return wrap;
  }

  function rollOdo(wrap) {
    wrap.querySelectorAll('.odo__d').forEach(function (d) {
      d.__col.style.setProperty('--d', d.__target);
    });
  }

  var counters = document.querySelectorAll('[data-count]');
  counters.forEach(function (el) {
    el.__odo = buildOdo(el);
    if (reduced) rollOdo(el.__odo);
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

  /* ─────────── stagger groups ─────────── */

  document.querySelectorAll('.stag').forEach(function (g) {
    Array.prototype.forEach.call(g.children, function (c, i) {
      c.style.setProperty('--i', i);
    });
  });

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
       delivers the page would silently lose most of its content. If nothing
       has resolved by 2.5s, reveal everything. */
    setTimeout(function () {
      if (!document.querySelector('.rv.in')) revealAll();
    }, 2500);
  }

  /* ─────────── scroll: progress bar, sticky nav, spy ─────────── */

  var nav = document.getElementById('nav');
  var bar = document.getElementById('progress');
  var barIn = bar && bar.firstElementChild;
  var ticking = false;

  function onFrame() {
    ticking = false;
    var y = window.scrollY;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (nav) nav.classList.toggle('stuck', y > 40);
    if (barIn && !reduced) {
      barIn.style.setProperty('--p', h > 0 ? Math.min(1, Math.max(0, y / h)).toFixed(4) : 0);
    }
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
