# 1nurav.github.io

Personal portfolio — Varun Babu. Astro, no UI framework, static output.

## Run locally

```bash
npm install
npm run dev
```

## Deploy

Push to `main`. The workflow in `.github/workflows/deploy.yml` builds and publishes
to Pages. Pages is already configured with GitHub Actions as its source, so there
is no setup step to repeat.

## Where things live

| Path | What |
| --- | --- |
| `src/data/site.js` | All content — bio, experience, projects, links. Edit here first. |
| `src/styles/global.css` | Design tokens, resets, shared classes, keyframes. |
| `src/components/` | One component per section, plus small reusable parts. |
| `src/scripts/motion.js` | Cursor, kinetic type, reveals, clock, accent cycling. |
| `src/assets/` | Images that should be optimized at build time. |
| `public/` | Files that need a stable, unhashed URL. |
| `originals/` | Full-resolution photo masters. Untracked, local only. |

## Images

Anything in `src/assets/` and imported goes through `astro:assets`: WebP output, a
generated `srcset`, and `width`/`height` baked in so it cannot shift the layout.
Anything in `public/` is served byte-for-byte with no processing.

Use `src/assets/` by default. `public/` is for the two cases that need a URL which
never changes: `grain.svg`, referenced from a CSS `url()` inside a scoped style
block, and `og.jpg`, whose link previews are cached by third parties.

## Adding a project

Append an entry to `projects` in `src/data/site.js`. Drop a screenshot in
`src/assets/`, import it at the top of that file, and set `image` to the import —
the card renders it instead of the striped placeholder. No markup changes needed.
