# Portfolio — Vipul Kumar

A static, dependency-free portfolio site. No build step, no framework, no tracking.
Open `index.html` and it works.

```
index.html                  the whole page
assets/css/style.css        design tokens + layout
assets/js/main.js           theme toggle, scroll-spy, reveal-on-scroll
assets/fonts/               self-hosted variable Archivo + IBM Plex Mono (136 KB)
assets/img/                  archived assets — not referenced by the page
```

The page itself loads ~150 KB. The `assets/img/` folder is an offline archive of the
old 2023 site and is not referenced — delete it if you don't want it in the repo.

**Confidentiality:** the copy deliberately describes scope and scale only. No
implementation techniques, algorithms or system internals appear anywhere on the page.
Keep it that way when editing — the detail belongs in a call, under NDA.

## Run it locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy

### GitHub Pages (free, easiest)

```bash
git init && git add -A && git commit -m "portfolio site"
gh repo create vipulkumar-dev --public --source=. --push
```

Then in the repo: **Settings → Pages → Source: `main` / root**.
Live at `https://vipul4765.github.io/vipulkumar-dev/` in about a minute.

### Vercel or Netlify (free, custom domain in 2 minutes)

Drag the folder onto <https://app.netlify.com/drop>, or:

```bash
npx vercel --prod
```

Both detect a static site automatically — no configuration needed.

### Custom domain

A `.dev` or `.com` domain runs roughly ₹800–1,500/year. Point it at whichever host
above, then update `<meta property="og:*">` in `index.html` to the real URL so link
previews work when you share it.

## Editing

Everything is in one HTML file with commented sections (`HERO`, `SELECTED WORK`,
`SERVICES`, `CAPABILITIES`, `APPROACH`, `BACKGROUND`, `CONTACT`).

Colours and type live at the top of `style.css` as custom properties, defined three
times: `:root` (light), `@media (prefers-color-scheme: dark)`, and the two
`:root[data-theme=...]` blocks the manual toggle uses. **Change a colour in all the
blocks it appears in**, or the theme toggle will disagree with the OS setting.

### Things to update as they change

- The availability pill in the hero — turn it off when you're booked.
- Rate / minimum engagement in the **How I work** table.
- Every number in the `.spec` tables is a real measurement. If the code changes,
  re-measure before editing, or the page stops being true.

## Accessibility & compatibility notes

- All text passes WCAG AA in both themes, verified by calculation: 4.5:1 for body
  copy, and the large gradient headline clears the 3:1 large-text threshold.
- Honours `prefers-reduced-motion` — all animation is disabled, nothing is hidden.
- No horizontal page scroll from 320 px up; the wide topology diagram scrolls inside
  its own container.
- Works with JavaScript disabled. The entrance animations are armed by a `js` class
  that scripting adds; without it every element renders in its final state, so the
  page can never come up blank. Never move those hidden start states outside the
  `.js` prefix.
- The hero canvas is decorative, pauses off-screen and on hidden tabs, and renders a
  single static frame under `prefers-reduced-motion`.
