# Mobile Lighthouse: what actually moves the needle (2026-09-21)

Production mobile sits at **97** (median of 3: 96/97/98), desktop **99**. The
missing ~3 points are split FCP 1.40 / LCP 1.50 — everything else is perfect
(TBT 10ms, CLS 0.004).

The homepage document is **227KB, of which 206KB is inlined CSS**. Only **35%
of that CSS matches anything in the homepage's DOM**; the other 133KB is real,
used CSS — it just belongs to _other_ pages (prose/typography, projects, gear)
and rides along because Tailwind emits one global sheet.

## Three experiments, one counterintuitive answer

All run against identical local production builds, mobile preset, simulated
throttling, threaded static server, medians (never single runs — variance on
this rig is ±10 points).

| variant                                           | document | perf (median) | FCP   | LCP   |
| ------------------------------------------------- | -------- | ------------- | ----- | ----- |
| baseline (`inlineStyles: true`)                   | 227KB    | **69**        | 4.88s | 4.96s |
| `inlineStyles: false` (3 external sheets)         | 17KB     | 70            | —     | —     |
| critical inline 72KB + async-load the other 133KB | 89KB     | 70            | 4.80s | 4.95s |
| **unused CSS physically removed**                 | 89KB     | **76**        | 4.20s | 4.20s |

**Relocating the bytes does nothing. Deferring the bytes does nothing. Only
removing them helps.**

The critical-CSS run is the decisive one: same 89KB document as the winning
variant, same non-blocking render path — but it still _fetches_ the remaining
133KB, and scores 70 instead of 76. So the cost is not render-blocking parse,
which is what both failed experiments assumed. It's the total CSS the browser
downloads and applies.

Note the winning variant's LCP collapses onto its FCP (4.20/4.20) while
baseline carries a gap (4.88/4.96).

## What this rules out

- Splitting inline vs external CSS. Measured twice, no effect.
- `rel=preload`/async stylesheet tricks. Measured, no effect.
- Purging. Tailwind's purge is already correct — every rule checked is used
  _somewhere_ on the site (`prose-lg` is on `/reading/[slug]`, etc.).

## What's actually left

The homepage has to genuinely ship less CSS, which means splitting the global
sheet by route. Unused-on-homepage bytes, by source:

- `other utilities` — 61KB. Tailwind utilities used elsewhere. Hardest: one
  global sheet is inherent to how Tailwind is set up here.
- `prose-*` — **66KB measured** (43.5KB of it unused on the homepage, but the
  whole typography output is what has to leave the global sheet). Priced with
  the harness: stripping every typography rule from the homepage document takes
  it **69 → 73** (FCP 4.88→4.50s, LCP 4.96→4.50s, base steady at 69 across all
  5 runs). That is the single largest available win.

  **The obvious version of this fix is a no-op.** "Import typography only in
  pages that render prose" includes `pages/index.vue`, which uses
  `prose prose-zinc dark:prose-invert` on its `#index-content` block — so the
  homepage would still pull the chunk, and relocating bytes scores zero (see
  the table). The homepage must _also_ drop the `prose` class. That part is
  cheap: `content/blog/index.md` is two paragraphs, some links, a `<br>` and a
  `<span>`, so a handful of scoped rules on `#index-content` replaces it.

  The expensive part is getting typography out of the global sheet at all.
  Removing the plugin also removes its **variant utilities** (`prose-a:`,
  `prose-headings:`, `prose-blockquote:` … ~25 usages across the site), which
  would all need rewriting, and a build-time extraction of the compiled rules
  into a `prose.css` is a _snapshot_ — a newly-used modifier needs a regen.
  That's a maintenance tax on a delete-driven codebase, and the regression
  surface is every long-form page on the site.

Rough scaling: removing 133KB bought 7 points, so the bounded prose+project
work (62KB) is worth maybe 3 — enough, if it holds, but local scores (69) and
production scores (97) share no baseline. This rig validates _deltas only_.
Verify any change with 3 production runs and take the median.

## Harness

`scripts/` has nothing for this; it was ad-hoc. The rig that produced these
numbers: serve two builds on separate ports with a **threaded** static server
(single-threaded `http.server` serializes 13 JS requests and adds ±10 points of
noise), then alternate Lighthouse runs between them and compare medians.
