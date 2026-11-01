# CLAUDE.md

Guidance for Claude Code sessions working in this repo. See `README.md` for more detail.

## What this is
The public corporate and investor website of GizMentor FZCO (https://gizmentor.com), a UAE-based
technology and e-commerce company. It presents the company's ventures:
- Easelect: AI shopping research assistant
- MagFusion: magnetic portable charging products
- AI and automation

The site is bilingual (English at `/...`, Arabic right-to-left at `/ar/...`) with light and dark themes.
Stack: Vite, React 19, react-router-dom 6, prerendered to static HTML at build time.

## Commands
- `npm install` - install dependencies (`package-lock.json` is committed)
- `npm run dev` - local Vite dev server
- `npm run build` - client build, then SSR build, then `scripts/prerender.mjs` (writes `dist/<route>/index.html`
  for every route in both languages, plus `404.html`, `sitemap.xml`, `robots.txt`)
- `npm run build:spa` - client-only build (no prerender)
- `npm run lint` - ESLint
- `npm run preview` - serve the built `dist/`
- There is no test suite. Before opening a PR, run `npm run lint` and `npm run build`.

## Code layout
- `src/content/en.js`, `src/content/ar.js` - all copy; Arabic mirrors English key for key
- `src/config/site.js` - company facts and venture status/URLs; `null` values are hidden by the UI
- `src/config/seo.js` - OG images, JSON-LD, `routeSettings` (which routes are prerendered and in the sitemap)
- `src/routes.jsx`, `src/pages/` - routes and page components
- `src/components/` - `brand`, `easelect`, `home`, `layout`, `motion`, `ui`
- `src/i18n/` - locale mapping and `useLocale()` (`t` for copy, `to()` to localise links)
- `src/styles/index.css` - design tokens (`:root` and `:root[data-theme='dark']`)
- `scripts/prerender.mjs` - static prerender step
- `vercel.json` - clean URLs, redirects, cache and security headers
- `public/_redirects` - Netlify-style fallback of the same redirects; keep in sync with `vercel.json`

Adding a page: update `src/routes.jsx`, `routeSettings` in `src/config/seo.js`, and the page meta in both
`en.js` and `ar.js`. Any copy change must be made in both languages.

## Deploy
- gizmentor.com is served by nginx on GizMentor's own server, not by Vercel (checked 2026-11-01:
  the response comes from nginx, and the last Vercel deployment was in April 2026 while `main` has
  had commits since). nginx serves `/opt/gizmentor-website/dist` as static files.
- `.github/workflows/deploy.yml` deploys every merge to `main`: over SSH it fast-forwards the server's
  checkout, builds in a second checkout next to it (`/opt/gizmentor-website.build`), copies the
  finished `dist` in with rsync, checks `/` and `/ar/` on the server, and tags the commit
  `production-live`. Rerun by hand: Actions → Deploy → Run workflow.
- Setup, in the repo's `production` environment: secrets `DEPLOY_SSH_KEY` (a private key the server
  accepts), `DEPLOY_KNOWN_HOSTS` (the server's host key line), `DEPLOY_HOST`, `DEPLOY_USER`;
  optional variable `DEPLOY_PATH` (default `/opt/gizmentor-website`). Until they are set, a merge
  skips its deploy with a warning.
- `npm run build` writes the site to `dist`.
- `vercel.json` and `DEPLOY.md` are left from earlier setups (DEPLOY.md also describes an SPA and a
  `gizmentor-app` repo). Keep `vercel.json` and `public/_redirects` in sync with each other; trust
  `package.json` for how the site builds.

## Rules
- This repo is PUBLIC. Never commit secrets, credentials, `.env` files, or anything internal
  (private numbers, internal strategy, unreleased plans, customer data).
- `src/config/site.js` holds only verified, publishable facts; leave unknown values as `null`.
- Do not push to `main`. Work on a branch prefixed `claude/` and open a PR into `main`.
- Do not merge PRs; leave that to a human.
