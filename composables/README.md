# composables/

Nuxt auto-imports every export here, so callers have no import line: grep the
function name. One file per composable.

| file | main export | what it does | used by |
|---|---|---|---|
| `useCalibration.ts` | `useCalibration()` | useFetch of /api/calibration (shared key) | pages/predictions/ |
| `useFlashcards.ts` | `useFlashcards()`, `Flashcard` | shuffle / next / prev / flip state for a CSV deck | pages/flashcards/study.vue |
| `useLiveStats.ts` | `useLiveStats()`, `changedSections()`, `isNewer()` | polls /api/stats every 5 min while visible; swaps in newer data and flashes changed sections | pages/stats.vue, components/stats/StatSection.vue |
| `usePageSeo.ts` | `usePageSeo()` | title, canonical, OG/Twitter, article:* and JSON-LD for a page (reactive inputs) | nearly every page |
| `usePaperclipStatus.ts` | `usePaperclipStatus()` | presence emoji: SSR seed from /api/paperclip, then one shared EventSource per tab | components/PaperclipStatus.vue |
| `useProcessedMarkdown.ts` | `useProcessedMarkdown()` | manifest + post fetchers with the listing visibility rules (hidden, unlisted, password, scheduled) | blog/index/stats/tag pages, server rss.xml, feed.json, archive.epub |
| `useScrollReveal.ts` | `useScrollReveal()` | IntersectionObserver + anime.js entrance for a container's children | listing pages (index, blog, reading, predictions, scraps, gear) |
| `useStats.ts` | `useStats()` | /api/stats + /api/stats-lite with a sessionStorage stale seed and has*Data flags | pages/stats.vue, components/stats/* |
| `useTemporalContext.ts` | `useTemporalContext()` | client-only "around this time" fetch from /api/temporal-context | pages/blog/[...slug].vue |
| `useTOC.ts` | `useTOC()` | ref to #nav-toc-container for teleporting a TOC | blog, projects, predictions, reading, gear pages |
| `useTypingAnimation.ts` | `useTypingAnimation()` | typewriter reveal of a title with no layout shift (v-html output) | pages/blog/[...slug].vue, Peter Todd post |

The date helpers that used to be a `useDateFormat` composable now live in
`utils/date.ts`.
