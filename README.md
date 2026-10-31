# ejfox.com

Personal website and blog. Nuxt 3, Vue 3, Tailwind, one Node process under
pm2. Posts are written in Obsidian, compiled to JSON at build time, and
served by Vue pages.

```bash
yarn install        # also runs `nuxt prepare` and enables .githooks/
yarn blog:process   # content/blog/**.md → content/processed/**.json
yarn dev            # http://localhost:3006
```

Vault → repo publishing goes through Dispatch, a separate Tauri app (see
`content/blog/projects/website-dispatch.md`). The old `yarn blog:import` was
removed on 2026-09-26.

## Repo map

Start here, then open the README inside whichever folder you land in.

```
app.vue, error.vue     root shell + the 404/500 page
nuxt.config.ts         routeRules (SSR vs prerender vs noindex), runtimeConfig, modules
nuxt.helpers.ts        prerender route list (respects drafts + scheduled posts)
tailwind.config.js     type scale + bg-page/sunken/surface/raised tokens

pages/                 file path = URL. pages/README.md has the route table
components/            auto-imported; components/ui/Foo.vue → <UiFoo>. components/README.md
layouts/               default.vue (site chrome) + bookmarklet.vue (bare)
composables/           use*() helpers shared by pages. composables/README.md
plugins/               code that runs on every page (sidenotes, umami, dark mode…). plugins/README.md
utils/                 pure helpers, auto-imported on the client too. utils/README.md
types/                 shared TS types (stats payloads, predictions)
assets/css/            global.css owns element typography + color tokens; tailwind.css owns utilities

server/api/            /api/* JSON routes. server/README.md is the route inventory
server/routes/         non-/api routes: feeds, sitemap, /tags.json, /via/*, .well-known
server/middleware/     redirects + .md/.json twins of pages; runs before every request
server/utils/          server-only helpers (manifest reader, epub, feeds…). server/utils/README.md

scripts/build/         runs on every deploy. processMarkdown.mjs is the content pipeline
scripts/plugins/       remark/rehype plugins used by processMarkdown (wikilinks, mermaid…)
scripts/meta/          audits + linters you run by hand (check-urls, dead links, gear lint)
scripts/author/        make + ship content (predict, crown, seal, webmentions)
scripts/README.md      what every script is and which yarn command runs it

content/blog/          source markdown (YYYY/, projects/, drafts/; private/ is gitignored)
content/processed/     generated JSON; prod serves CI's copy, not the committed one
content/predictions/   one markdown file per prediction
data/                  runtime + build data. data/README.md says what reads each file
public/                static files served as-is
docs/                  design docs + handoffs. docs/README.md indexes them
.githooks/pre-commit   check-urls gate: a public URL can't silently stop resolving
.github/workflows/     deploy, lint, PR previews, webmentions, atproto mirror
```

## Reading the code in nvim

Every source file opens with a `@file` / `@description` header, and long
files are split with `── Section ──` dividers. The conventions are in
[`docs/CODE-GUIDE.md`](docs/CODE-GUIDE.md).

- `:Telescope live_grep` for `@file` lists every file's one-line purpose.
  `/──` jumps between sections inside a file.
- Comments name related files by repo-relative path (`server/utils/manifest.ts`),
  so `gf` follows them.
- URL → file: `/blog/2024/foo` is `pages/blog/[...slug].vue`; `/api/stats` is
  `server/api/stats.get.ts`. The tables in `pages/README.md` and
  `server/README.md` cover the rest.
- `.ignore` hides generated JSON and bulk exports from rg/fd/telescope. Name
  the path to search one anyway: `rg foo content/processed`.

## Commands

```bash
# Develop
yarn dev                 # dev server, port 3006
yarn test                # vitest (yarn test:watch to keep it running)
yarn lint                # eslint; prettier is separate: yarn format:check
yarn build:prod          # local production build (NITRO_PRESET=node-server)

# Content
yarn blog                # safety lint → process → sealed-post check
yarn blog:process        # markdown → JSON (cached by content hash)
yarn blog:dead-links     # internal link rot report (no network)
yarn blog:check-links    # external link health (slow, network)
yarn seal                # publish a link-protected post (docs/SEALED-POSTS.md)
yarn check:urls          # every once-public URL still resolves

# Predictions
yarn predict --statement "X will happen" --confidence 75 --deadline 2025-12-31
yarn calibrate           # Brier scores + calibration curve

# Ship
yarn deploy              # push main and watch the deploy run (~3 min)
```

`scripts/README.md` lists the rest (gear, images, atlas, rides, resume…).

## How a post gets to the page

```
content/blog/2024/foo.md
  → scripts/build/processMarkdown.mjs   (remark/rehype, scripts/plugins/*)
  → content/processed/2024/foo.json + manifest-lite.json
  → server/api/posts/[...slug].ts       (visibility gate: utils/visibility.mjs)
  → pages/blog/[...slug].vue
  → plugins/footnotes-to-sidenotes.client.ts (footnotes → margin notes)
```

Frontmatter keys that matter:

```yaml
title: Post Title
date: 2024-01-01
dek: One-sentence description
tags: [tag1, tag2]
draft: true                 # no JSON written; 404s
unlisted: true              # served at its URL (noindex), kept out of every listing
publishAt: "2026-10-01T09:00:00-04:00"  # scheduled; always give an offset
replyTo: https://example.com/post       # IndieWeb reply (single or array)
```

## Deploy

Push to `main`. GitHub Actions processes content and builds `.output/` on the
runner, ships both to the VPS, reloads pm2, and rolls back automatically if
`/api/healthcheck` doesn't report the new commit. Never build on the VPS
(Nitro heisenbug). Manual deploy, rollback and pm2 commands are in `CLAUDE.md`
→ Deployment.

## Environment

Secrets live in a gitignored `.env`. Server-only keys go in
`runtimeConfig` in `nuxt.config.ts`, never in `runtimeConfig.public`, which
ships to every browser. LLM and paid-API calls go through a server route.

## TODO

- Rerun `node scripts/meta/hydrate-cloudinary-cache.mjs` until it reports
  `0 missing metadata` (it resumes from cache; ~331 missing at last count).
- Investigate remaining `x` failures in the hydrator output (missing assets
  vs permissions).
- Clean malformed Cloudinary URLs in markdown (e.g. `...png)![Screenshot`) so
  they can be hydrated.

---

MIT License
