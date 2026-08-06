# Portfolio — Vipul Kumar

A static, dependency-free portfolio site. No build step, no framework, no tracking.
Open `index.html` and it works.

```
index.html                  the whole page
assets/css/style.css        design tokens + layout
assets/js/main.js           theme toggle, scroll-spy, reveal-on-scroll
assets/fonts/               self-hosted Archivo + IBM Plex Mono (78 KB, latin subset)
assets/img/profile.jpg      profile photo
assets/img/certs/           certificate scans (web-sized)
assets/img/projects/        archived 2023 project screenshots (not used on the page)
```

Total weight: ~2 MB, of which the unused archive images are most of it.

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

- The availability pill in the rail — turn it off when you're booked.
- Rate / minimum engagement in the **How I work** table.
- Every number in the `.spec` tables is a real measurement. If the code changes,
  re-measure before editing, or the page stops being true.

## Accessibility & compatibility notes

- All text passes WCAG AA (4.5:1) in both themes; verified by calculation.
- Honours `prefers-reduced-motion` — all animation is disabled, nothing is hidden.
- No horizontal page scroll from 320 px up; the wide topology diagram scrolls inside
  its own container.
- Works with JavaScript disabled: you lose the theme toggle and scroll-spy, and the
  reveal animations are skipped so all content shows immediately.
