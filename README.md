# Portfolio — Vipul Kumar

A static, dependency-free portfolio site. No build step, no framework, no tracking.
Open `index.html` and it works.

```
index.html                  the whole page
assets/css/style.css        design tokens + layout
assets/js/main.js           theme toggle, scroll-spy, reveal-on-scroll
assets/fonts/               self-hosted variable Archivo + IBM Plex Mono (136 KB)
```

The page loads ~150 KB total and references no images at all — the only binary
assets are the four self-hosted font files.

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

### Cloudflare Pages (connected to this repo)

Cloudflare watches the repo directly — no workflow file, no API token, no secrets.

1. Sign up free at <https://dash.cloudflare.com/sign-up>
2. **Workers & Pages → Create → Pages → Connect to Git**
3. Authorise GitHub and pick this repository
4. Build settings — this is a plain static site, so:
   - Framework preset: **None**
   - Build command: *(leave empty)*
   - Build output directory: **`/`**
5. **Save and Deploy**

Every push to `master` redeploys automatically. Lives at `<project>.pages.dev`.

GitHub Pages and Cloudflare Pages can both serve this repo at once — they're
independent, so adding one does not disturb the other.

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

Colours and type live at the top of `style.css` as custom properties. The design is
dark-first, so the palette is declared **three times**:

1. `:root` — the dark palette (the default)
2. `:root[data-theme="light"]` — what the manual toggle switches to
3. `@media (prefers-color-scheme: light)` on `:root:not([data-theme])` — the OS
   preference, only while the visitor hasn't chosen a theme

**Change a light-theme colour in both places 2 and 3**, or the toggle and the OS
setting will disagree.

### Things to update as they change

- The availability pill in the hero, and the `Availability` row in **About** —
  turn both off when you're booked.
- Minimum engagement / rate in the **About** facts panel.
- Every number in the `.kv` rows and the hero counters is a real measurement taken
  from the source. If the code changes, re-measure before editing — otherwise the
  page quietly stops being true, which is the one thing it can't afford to be.

## Accessibility & compatibility notes

- All text passes WCAG AA in both themes, verified by calculation: 4.5:1 for body
  copy, and the large gradient headline clears the 3:1 large-text threshold.
- Honours `prefers-reduced-motion` — all animation is disabled, nothing is hidden.
- No horizontal page scroll, verified from 320 px to 1920 px.
- Works with JavaScript disabled. The entrance animations are armed by a `js` class
  that scripting adds; without it every element renders in its final state, so the
  page can never come up blank. Never move those hidden start states outside the
  `.js` prefix.
- The hero canvas is decorative, pauses off-screen and on hidden tabs, and renders a
  single static frame under `prefers-reduced-motion`.
