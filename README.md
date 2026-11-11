# retrospectionn.github.io

Personal portfolio of Ammaz Khan. One site, three separate views switched by the toggle at the
top of the page:

| View | Path | What it covers |
| --- | --- | --- |
| Ads | `/` and `/ads/` | Amazon advertising and account-management career |
| Research | `/research/` | Education, policy research and writing |
| Maps | `/maps/` | OpenStreetMap, GIS projects and volunteering |

Live at <https://retrospectionn.github.io/> (GitHub Pages) and
<https://ammaz-portfolio.vercel.app/> (Vercel).

## How it is built

- Vite, React and TypeScript, styled with Tailwind; text content lives in `site/src/content/`.
- A single three.js particle field sits behind all three views and re-forms when the view
  changes: a bar chart for Ads, a constellation for Research, and the real terrain and main
  roads of Islamabad for Maps.
- Terrain is baked from AWS Terrain Tiles and roads from OpenStreetMap
  (© OpenStreetMap contributors) by `pnpm bake:dem`.

## Layout

| Path | What it is |
| --- | --- |
| `site/` | Source: the Vite project (Vercel builds from here) |
| `index.html`, `ads/`, `research/`, `maps/`, `404.html`, `assets/`, `data/`, `media/`, `og/`, `favicon.svg` | Build output, published to the root by `pnpm publish:pages` and committed, so GitHub Pages can serve `main` directly |
| `sw.js` | Retires a service worker left by an earlier site at this address (no fetch handler) |
| `.pages-manifest.json` | Files the publish script wrote, so the next publish can remove stale ones |

## Commands

Run from `site/`:

```sh
pnpm dev             # dev server at http://localhost:5173
pnpm build           # type-check, build to site/dist, write the per-view pages
pnpm publish:pages   # copy site/dist to the repository root for GitHub Pages
```

`publish:pages` deletes only files it wrote on the previous run and refuses to touch `site/`
or any root file it did not write.

## Changes

- **2026-11-11** — First version: the three views, the shared particle field and the
  Islamabad terrain.
