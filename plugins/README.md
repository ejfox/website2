# plugins/

Nuxt plugins run once per app boot, outside any component, and most of them
reach into the rendered DOM. They're the "spooky action at a distance" in this
repo: if post HTML changes shape after load, one of these did it.

- `*.client.*` runs only in the browser; anything else runs on server + client.
- Nuxt runs them in filename order (no `enforce`/`order` is set on any of them).
- Most DOM enhancers re-run on client navigation (`router.afterEach` or the
  `page:finish` hook) and mark what they've done so a re-run skips it.
- Plugins can't use component lifecycle hooks (onMounted never fires) or
  VueUse composables that depend on useMounted (see umami-events.client.ts).

| file | runs | when | what it does |
|---|---|---|---|
| `attribution.client.ts` | client | app start | calls `attribution().initAttribution()` (utils/attribution.ts): first/last-touch UTMs + referrer into localStorage |
| `clarity.client.ts` | client | requestIdleCallback (3s timeout) | injects Microsoft Clarity, only if public `clarityId` is set |
| `content-hmr.client.ts` | client, dev only | Vite HMR `content:updated` | `refreshNuxtData()` when scripts/dev/content-watch.mjs reprocesses a post |
| `dark-mode.client.js` | client | app start | `useDark()` keeps the `dark` class on `<html>` in step with the OS |
| `first-touch.client.ts` | client | app start + every click/auxclick (window, capture) | stores `ej_first_touch` once; rewrites Cal.com link hrefs with first-touch UTMs at click time; sets `data-umami-event-source` on `consulting-book` elements |
| `floating-vue.ts` | universal | app start | installs FloatingVue globally (`v-tooltip`, dropdowns) + its CSS |
| `footnotes-to-sidenotes.client.ts` | client | onNuxtReady + router.afterEach | inserts `span.sidenote` after each footnote `<sup>`; hides `section[data-footnotes]` at ≥1280px |
| `gear-cards.client.ts` | client | onNuxtReady + router.afterEach; unmount in beforeEach | mounts `GearCardInline` into `div.gear-card-inline[data-gear-slug]`, sharing the Nuxt app's provides |
| `hand-drawn.client.ts` | client | early sprite fetch, then onNuxtReady + router.afterEach | `span[data-hd]` → sprite marks; `.blog-post-content hr` → `div.hd-divider`; footnote markers 1–12 → circled numbers; sets `data-hd-done` |
| `link-previews.client.ts` | client | 200ms after onNuxtReady / router.afterEach | hover popovers (fixed `div.link-preview-popover` on `<body>`) for `.blog-post-content a[data-preview-url]`, via `/api/og`; hover devices only |
| `markdownTable.client.ts` | client | window load + page:finish | `.prose table` and `#main-content table` (unless `data-plain`) get `.data-table`, `.numeric` columns, a `.table-container` wrapper and click-to-sort headers |
| `prediction-refs.client.ts` | client | onNuxtReady + router.afterEach | replaces `[data-prediction-ref]` with standalone `PredictionCard` / `PredictionRef` apps |
| `toc-highlight.client.ts` | client | app:mounted, then a global scroll listener | toggles `.active` on `#nav-toc-container a[href^="#"]` for the current h2/h3 |
| `umami-events.client.ts` | client | document click (capture) + page:finish | `outbound`, `contact-email`, `rss-click` events; injects a hidden 85% read sentinel into `.h-entry .e-content` for `read-complete` |
| `umami.client.js` | client, ejfox.com only | requestIdleCallback (3s timeout) + router.afterEach | loads Umami tracker, umami-plus helper and (by utils/replayPolicy.ts) the session-replay recorder; skips webdriver and /bookmarklet |
| `video-viewport.client.ts` | client | 250ms after load + page:finish | plays `video[autoplay]` / `video[data-autoplay]` only while ≥20% visible; adds controls to article videos; honours reduced motion; lazy-swaps `data-poster` |
