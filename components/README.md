# components/

Vue components. Every file opens with an `@file` / `@description` header naming
its caller and data source (house style: `docs/CODE-GUIDE.md`).

## Auto-import names

Nuxt registers every file here globally. The name is the path's words in
PascalCase, with a word dropped when it repeats the one just before it.
`.client` / `.server` don't change the name, only where the component renders.

| path | tag |
|---|---|
| `ui/AnimatedNumber.vue` | `<UiAnimatedNumber>` |
| `gear/GearItem.vue` | `<GearItem>` (gear·gear collapses) |
| `blog/post/PostFooter.vue` | `<BlogPostFooter>` (post·post collapses) |
| `stats/StatsDataState.vue` | `<StatsDataState>` |
| `stats/ChessStats.vue` | `<StatsChessStats>` (no repeat at the boundary) |
| `projects/ProjectRow.vue` | `<ProjectsProjectRow>` (projects ≠ project) |
| `gear/Gear3DGallery.client.vue` | `<GearGear3DGallery>` (`Gear3` ≠ `Gear`) |

The authoritative list is the generated `.nuxt/components.d.ts`.
`pages/kitchen-sink.vue` (`canonicalName()`) uses the same algorithm.

Many pages skip the auto-import and `import X from '~/components/...'`
explicitly (for example `pages/blog/[...slug].vue`, `pages/projects/index.vue`,
and the stats components importing `../ui/AnimatedNumber.vue`). In those files
the tag is whatever the import calls it, so grep for the filename as well as
the tag before you decide a component is unused.

## Folders

| folder | what's in it | used by |
|---|---|---|
| `blog/` | Post chrome: `SealedPost` (client-side decrypt), `Webmentions`, `ReplyContext` + `ReplyContextItem`, `NewsletterSignup`, `AuthorLine`, `BlogSparkline` (index metadata glyphs), `BlogPostContent` | `pages/blog/[...slug].vue`, `pages/blog/index.vue`, `pages/projects/[slug].vue`, `pages/dispatch/[slug].vue` |
| `blog/post/` | `PostMetadataBar`, `PostTOC`, `PostFooter`; `PostNav` + `PostRelated` are only used by the one-off Peter Todd page | `pages/blog/[...slug].vue`, `pages/blog/2024/the-mystery-of-peter-todd.vue` |
| `blog/` (predictions) | `PredictionRef` (inline pill) and `PredictionCard` (block). Not used in templates: `plugins/prediction-refs.client.ts` mounts them over HTML from `scripts/plugins/remarkPredictionRef.mjs` | posts with `:prediction` directives |
| `stats/` | One component per `/stats` section (`GitHubStats`, `ChessStats`, `LastFmStats`…), plus shared pieces: `StatSection`, `StatsSectionHeader`, `StatsDataState`, `StatsSectionSkeleton`, `StatRow`, `ActivityCalendar` | `pages/stats.vue` |
| `github/` | d3/canvas code views: `CommitHeatmap`, `CommitMatrix`, `CodeNetwork`, plus `GithubRepoCard`, `LanguageBar`, `GistPreview` | `pages/github/*`, `pages/stats.vue`, `pages/gists.vue` |
| `gear/` | `GearItem` (table row), `GearSpecimenPlate`, three.js `Gear3DGallery` / `GearModelViewer` / `GearCard3D`; `GearCardInline` is mounted into posts by `plugins/gear-cards.client.ts` | `pages/gear/index.vue`, `pages/gear/[slug].vue` |
| `hand-drawn/` | Scanned notebook marks laid over the page: `HandDrawn` (base), `HandDrawnMark`, `HandDrawnAnnotation`, `HandDrawnUnitChart` | `pages/hand-drawn.vue`, several stats sections |
| `projects/` | `ProjectRow` (flagship, image-first) and `ProjectArchiveCard` (dense grid) | `pages/projects/index.vue` |
| `ui/` | Site-wide: `Footer`, `AnimatedNumber`, `SupportLinks`, `WebVitalsReporter` (dev overlay) | `layouts/default.vue`, stats, `pages/projects/[slug].vue` |
| `widgets/` | `PullQuote`, `ScrollIndicator`: scrollytelling bits for the Peter Todd page | `pages/blog/2024/the-mystery-of-peter-todd.vue` |
| `dispatch/` | `DispatchReceipts`: sources, claims ledger, data download | `pages/dispatch/[slug].vue` |
| `reading/`, `photo/`, `predictions/`, `keymap/`, `flashcard/` | One component each: `ReadingSparklines`, `PhotoStack`, `BeliefTimeline`, `KeymapBoard`, `FlashcardCard` | `pages/reading/index.vue`, `pages/photos/index.vue`, `pages/predictions/index.vue`, `pages/keymap.vue`, `pages/flashcards/study.vue` |
| `dev/` | Tooling, not site UI: `ChangedRoutesHud` (dev-only rail, `import.meta.dev`), `StoryRenderer` + `GalleryCell` for the kitchen sink | `layouts/default.vue`, `pages/kitchen-sink.vue` |
| root | `ParticleField` (background canvas), `PaperclipStatus` (presence emoji) in `layouts/default.vue`; `NextAvailableSlot` on `pages/index.vue`; `SitemapLink` on `pages/sitemap.vue` | |

## Kitchen sink

`/kitchen-sink` previews every component here live (`dev/` excluded). Mock
props live in `utils/kitchenSinkStories.js`, keyed by base filename (no folder,
no `.client`/`.vue`). When you add a component, add a story. The page counts
the components that are missing one and warns about orphaned keys. See
CLAUDE.md "Component Kitchen Sink" for the URL controls (`?c=`, `&gallery=1`).
