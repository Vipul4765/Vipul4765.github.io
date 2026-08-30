# Portfolio — Vipul Kumar

A static, dependency-free personal site. No build step, no framework, no tracking.
Open `index.html` and it works.

```
index.html      the entire page — markup, CSS and JS inline
og-source.html  source for the share preview
og.png          1200×630 share preview (regenerate instructions below)
robots.txt      crawler rules and sitemap pointer
sitemap.xml     the single canonical page for search engines
```

No webfonts, no images beyond the inline profile photo and share preview, and no external
requests of any kind. The only outbound destinations are email, algoverve.in, LinkedIn
and GitHub.
The type is a system font stack: a serif for headings, the UI sans for everything else.
Light theme is the default.

Live at <https://vipul4765.github.io/> (GitHub Pages, `master` branch, root).

## The rules this page is built on

**1. Confidentiality — scope only, never method.**
Everything in the work section describes *what a system is for*, never how it works.
No algorithms, no data structures, no internal designs, no keyspace or protocol detail.
That is Vipul's research and his employer's code. The detail belongs in a call, under
NDA. Re-read the work section after any edit and take out anything that crept in.

**2. Attribution — say plainly what is yours.**
The page marks each system with one of two hand-drawn circles:

- **filled** = built by me
- **open** = I contributed to it

Four systems are marked as his (execution engine, both streaming-gateway generations,
and the backtesting engine). The two gateway generations are discussed together in one
featured case study. Two systems are marked as contributions (trading platform API ≈11%
of the codebase, market data ingestion ≈13%). The payment, invoice and email services are
**not** his work — they are a colleague's, essentially in full — and must never be
listed here in any form. See the `repo-authorship-map` note for how those shares were
measured, and re-measure before adding anything:

```bash
git log --all --no-merges --pretty=format:'@@@%an|%ae' --numstat
```

**3. No line counts, no test counts.**
An earlier version led with "150,734 lines of production code". Volume is not a quality
signal, and to a senior buyer it reads as bloat. The page states consequence instead:
what each system must not get wrong.

**4. Voice — first person, plain, and occasionally blunt.**
Short sentences next to long ones. Few em-dashes. It is allowed to admit a rewrite and
to say what he doesn't do. If a paragraph reads like marketing copy, it is wrong.

## Run it locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Editing

Everything is in `index.html`, in commented sections (`NAV`, `HERO`, `THE PRODUCT`,
`WORK`, `SERVICES`, `PROCESS`, `ABOUT`, `CONTACT`).

Colours and type live at the top of the `<style>` block as custom properties. The
palette is declared **four times** and they must be kept in step:

1. `:root` — the light palette (the default)
2. `@media (prefers-color-scheme: dark)` — the OS preference
3. `:root[data-theme="light"]` — what the manual toggle switches to
4. `:root[data-theme="dark"]` — likewise

The two explicit `[data-theme]` blocks come **after** the media query so a manual pick
beats the operating system in both directions.

### Things to update as they change

- The engagement wording in the hero and the `Availability` row in the contact panel.
- The `og.png` headline and role line if the positioning changes, so the share preview
  matches the page.
- The `lastmod` date in `sitemap.xml` when a published content change lands.

## Two things that are easy to break

**Never move the animation start-states out of the `.rv-on` / `.js` prefix.**
Nothing on this page is hidden by default. An inline script in `<head>` adds `.js`, and
the script at the bottom adds `.rv-on`; only then does anything become invisible, and
two independent failsafes (`.reveal-all` at 6 s from `<head>`, and 3.5 s from the main
script) un-hide everything regardless. If you write `opacity: 0` outside that gate and
the script fails, the page comes up blank. This has happened before.

**Measure computed font sizes after any class refactor.** A previous rewrite moved cards
onto a shared class and silently orphaned the project-title selector; all the titles fell
back to the browser default and it survived a visual review because it merely looked "a
bit weak". Probe the DOM, don't eyeball it:

```bash
google-chrome --headless=new --disable-gpu --virtual-time-budget=6000 \
  --window-size=1440,900 --dump-dom "file://$PWD/index.html"
```

## Regenerating `og.png`

The share image is a 1200×630 screenshot of a small standalone HTML file that mirrors the
hero. Keep the headline in step with the page's `<h1>`, then:

```bash
google-chrome --headless=new --disable-gpu --hide-scrollbars \
  --window-size=1200,630 --screenshot=og.png "file://$PWD/og-source.html"
```

## Accessibility & compatibility

- All text passes WCAG AA in both themes, verified by calculation and recorded in the
  comment at the top of the `<style>` block. Worst pair is 5.58:1 (light) / 6.44:1 (dark).
- Honours `prefers-reduced-motion`: all animation off, nothing hidden.
- No horizontal scroll, verified from 320 px to 1920 px.
- **Works with JavaScript disabled.** Verified: every word still renders. What disappears
  is only what cannot work without script — the market-session line, the theme toggle and
  the copy button, all of which are born hidden and unhidden from JS.
- The market-session line reads the clock in `Asia/Kolkata` and states the *published* NSE
  window (Mon–Fri, 09:15–15:30 IST). It deliberately claims nothing about uptime. Exchange
  holidays are not modelled, which is why the copy describes the schedule rather than
  today's trading. Note that engines canonicalise the zone to `Asia/Calcutta`; both
  spellings must be accepted or the row silently never appears.

## Deploy

Push to `master`. GitHub Pages serves the repo root.
