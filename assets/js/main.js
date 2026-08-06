/* Portfolio — theme toggle, scroll-spy nav, reveal-on-scroll. No dependencies. */
(function () {
  'use strict';

  var root = document.documentElement;
  var KEY = 'vk-theme';

  /* ---------- Theme ---------- */
  var stored = null;
  try { stored = localStorage.getItem(KEY); } catch (e) { /* private mode */ }
  if (stored === 'dark' || stored === 'light') root.setAttribute('data-theme', stored);

  function currentTheme() {
    var set = root.getAttribute('data-theme');
    if (set) return set;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  var btn = document.getElementById('theme');
  var label = document.getElementById('theme-label');

  function paintLabel() {
    if (label) label.textContent = currentTheme() === 'dark' ? 'Light' : 'Dark';
  }
  paintLabel();

  if (btn) {
    btn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem(KEY, next); } catch (e) { /* ignore */ }
      paintLabel();
    });
  }

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
    if (!root.getAttribute('data-theme')) paintLabel();
  });

  /* ---------- Year ---------- */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = String(new Date().getFullYear());

  /* ---------- Reveal on scroll ---------- */
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealables = document.querySelectorAll('.reveal');

  if (reduced || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('in'); });
  } else {
    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revObs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    revealables.forEach(function (el) { revObs.observe(el); });
  }

  /* ---------- Scroll-spy ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.rail__nav a'));
  if (navLinks.length && 'IntersectionObserver' in window) {
    var sections = navLinks
      .map(function (a) { return document.querySelector(a.getAttribute('href')); })
      .filter(Boolean);

    var visible = new Map();

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visible.set(entry.target.id, entry.intersectionRatio);
        else visible.delete(entry.target.id);
      });

      var bestId = null, bestRatio = -1;
      visible.forEach(function (ratio, id) {
        if (ratio > bestRatio) { bestRatio = ratio; bestId = id; }
      });

      navLinks.forEach(function (a) {
        var on = bestId !== null && a.getAttribute('href') === '#' + bestId;
        if (on) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    }, { rootMargin: '-15% 0px -55% 0px', threshold: [0.01, 0.25, 0.5, 0.75] });

    sections.forEach(function (s) { spy.observe(s); });
  }
})();
