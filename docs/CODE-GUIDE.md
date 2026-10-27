# Code guide: how files in this repo are commented

The goal: open any file cold in nvim and know in ten seconds what it is, who
calls it, and what will bite you. Density is Tuftian: a header, section
dividers, and comments that explain *why*. Don't narrate what the code says.

## 1. Every file opens with a header

2–6 lines. What it is → who uses it / where its data comes from → gotchas.
Point at related files by repo-relative path so `gf` jumps there.

TypeScript / JS / MJS:

```ts
/**
 * @file legacy-redirect.ts
 * @description 301 old/mangled URLs to where the content lives now.
 *   Rules live in server/utils/legacyRedirect.ts; this file only wires them
 *   to requests. Rebuilds its index only when manifest-lite.json changes.
 */
```

Vue SFCs put the header as an HTML comment at the very top, before
`<script>`:

```vue
<!--
  @file PostNav.vue
  @description Previous/next links at the foot of a blog post.
  @props prevPost, nextPost: { slug, title, date } | null
-->
```

Keep shebangs (`#!/usr/bin/env node`) on line 1. The header goes after them.

## 2. Section dividers in long files

For files over ~150 lines, split logical sections with one-line dividers so
`/──` and folding find them:

```ts
// ── Data loading ────────────────────────────────────────────
```

In `<template>`: `<!-- ── Sidebar ─────────── -->`. In `<style>`:
`/* ── Table ──────── */`.

## 3. Inline comments say why

Good: `// Read mtime, not contents: this runs on every /blog hit.`
Bad: `// increment i`

Comment the non-obvious: magic numbers, ordering that matters, a workaround and
the bug it dodges, a security check that looks redundant (see the
open-redirect output checks in `server/routes/via/`). Link the incident or
doc when there is one.

## 4. Don't

- Don't rename, move or delete files to "organize" them. Page filenames are
  public URLs (`check-urls` guards them), component filenames are auto-import
  names (templates + `utils/kitchenSinkStories.js` keys), and server routes
  are pinned by `server/api/__tests__/no-orphan-routes.test.ts`.
- Don't write local absolute paths (`/Users/...`). Use `~/` or repo-relative.
- Don't paste secrets, key prefixes or env values into comments.
- Don't put dates on code comments ("added 2026-10-05") unless the date is
  the point (an incident). Git blame has the rest.

## 5. Where things live

The map of directories is in the root `README.md` → "Repo map". Each code
directory with more than a handful of files has its own `README.md`.
