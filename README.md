# 1nurav.github.io

Personal portfolio — Varun Babu. Astro, no UI framework, static output.

## Run locally

```bash
npm install
npm run dev
```

## Deploy

Push to `main`. The workflow in `.github/workflows/deploy.yml` builds and publishes to Pages.
One-time setup: repo **Settings → Pages → Source → GitHub Actions**.

```bash
git init && git add . && git commit -m 'portfolio'
gh repo create 1nurav/1nurav.github.io --public --push
```

## Where things live

| Path | What |
| --- | --- |
| `src/data/site.js` | All content — bio, experience, projects, links. Edit here first. |
| `src/styles/global.css` | Design tokens, resets, shared classes, keyframes. |
| `src/components/` | One component per section, plus small reusable parts. |
| `src/scripts/motion.js` | Cursor, kinetic type, reveals, clock, accent cycling. |
| `public/assets/` | Photo and grain texture. |

## Adding a project

Append an entry to `projects` in `src/data/site.js`. Drop a screenshot in
`public/assets/` and set `image` to its path — the card renders it instead of the
striped placeholder. No markup changes needed.
