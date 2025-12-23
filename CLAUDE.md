# EJ Fox's Website - AI Assistant Context

## Project Overview

Personal website and digital publishing system built with Nuxt 3. Primary purpose: publishing blog posts, predictions, and stats from multiple APIs. Content originates in Obsidian, gets processed to structured JSON, then served via Vue components.

## Current Status: ✅ Production Ready

- Docker containerized, health checks working
- Dynamic tags system with journalist pyramid ordering
- Cryptographic predictions system with PGP signing
- Multi-source API aggregation for personal stats
- Clean root directory (delete-driven cleanup completed)

## Key Architectural Components

### Content Pipeline

- **Input**: Markdown files in `content/blog/` with YAML frontmatter
- **Processing**: `scripts/processMarkdown.mjs` converts MD → structured JSON
- **Output**: Individual JSON files + `manifest-lite.json` for listings
- **Frontend**: Vue components consume processed JSON, not raw Markdown

### Dynamic Systems

1. **Tags Endpoint** (`server/routes/tags.json.ts`)
   - Serves `/tags.json` with journalist pyramid ordering
   - Combines static vocabulary + usage-frequency content tags
   - Structure: !special-tags first, then by usage count, then unused base tags

2. **Predictions System**
   - **PGP Predictions**: CLI tool `yarn predict` for cryptographic predictions
     - SHA-256 hashing + Git commits + optional PGP signing
     - Storage: `content/predictions/` as Markdown with verification data
   - **Kalshi Integration**: Real-money prediction market positions
     - Live API integration: `server/api/kalshi.get.ts`
     - Multi-layer smart caching (portfolio: 2min, events: 1hr, commentary: 10min)
     - Commentary system: `content/kalshi/*.md` for position analysis
     - Calibration tracking: Brier scores, calibration curves (`scripts/calibration-analysis.mjs`)
     - Portfolio P&L: Real-time open/closed position tracking
     - Type-safe API consumer with full schema definitions (`server/types/kalshi.ts`)
   - **Scripts**:
     - `yarn kalshi:test` - Fetch current Kalshi portfolio data
     - `yarn kalshi:templates` - Generate commentary templates for positions
     - `yarn kalshi:calibration` - Run prediction accuracy analysis

3. **Stats Aggregation** (`server/api/stats.get.ts`)
   - Multi-source API integration: GitHub, YouTube, LastFM, Chess.com, etc.
   - Caching layer to avoid rate limits
   - Real-time personal metrics dashboard

4. **Gear Inventory System** (`pages/gear/index.vue`)
   - CSV-based gear tracking with weight calculations
   - Dynamic unit conversion (metric/imperial)
   - Tuftian data visualizations (weight distributions, histograms)
   - Ultra-dense data tables with 8px baseline grid
   - Container-based organization with inline statistics

5. **Threads Visualization** (`pages/threads.vue`)
   - D3.js force-directed graph on canvas (350vh scrollable)
   - Shows posts, scraps, and tags as interconnected nodes
   - Maypole tags: top 25 tags pinned in sine wave pattern down the page
   - anime.js staggered animations for node streaming
   - Tag pages: `/tag/[slug]` shows all content with that tag
   - Configurable constants at top of file:
     - `NODE_RADIUS`, `COLLISION_RADIUS`, `NODE_COLOR` - visual tuning
     - `NUM_MAYPOLES`, `CANVAS_HEIGHT_VH`, `BOUNDARY_FORCE_STRENGTH` - layout
     - `BLACKLISTED_TAGS` - tags excluded from visualization
   - Filters: toggle posts/scraps/tags visibility
   - Click nodes to navigate to content

## Important File Locations

### Critical Scripts

- `scripts/processMarkdown.mjs` - Main content processing pipeline
- `scripts/predict.mjs` - Prediction creation CLI
- `server/routes/tags.json.ts` - Dynamic tags endpoint
- `server/api/gear-csv.get.ts` - Gear CSV data endpoint

### Key Components

- `pages/threads.vue` - D3 force-directed graph visualization
- `pages/tag/[...slug].vue` - Tag detail pages
- `components/gear/GearItem.vue` - Individual gear row component
- `components/gear/GearTableRow.client.vue` - Client-side gear display
- `composables/useWeightCalculations.ts` - Weight conversion utilities

### Configuration Files

- `nuxt.config.ts` - Nuxt configuration with Docker preset
- `.env` - Environment variables (create from examples in README)
- `Dockerfile` + `docker-compose.yml` - Container deployment

### Content Structure

```
content/
├── blog/YYYY/           # Published posts
├── blog/drafts/         # Work in progress
├── blog/projects/       # Project documentation
├── predictions/         # Cryptographic predictions
└── processed/           # Generated JSON output
```

## Development Patterns

### Delete-Driven Development Philosophy

> "When system hangs, delete code until it works. No clever fixes, no complex solutions. Find the bloat, delete it. Simple beats complex. Working beats perfect."

Applied throughout codebase for:

- Root folder cleanup (removed 15MB+ of lighthouse reports, build logs)
- Animation system (deleted looping animations causing flickering)
- Component simplification (projects page: 120+ lines → 25 lines)
- TCWM scoring system removal from gear page (complex → simple weight sorting)
- Typography consolidation (custom fonts → system Georgia serif)

### Content Processing Flow

1. **Write** in Obsidian with YAML frontmatter + tags
2. **Process** via `yarn blog:process` → generates JSON + usage counts
3. **Serve** via dynamic routes consuming processed JSON
4. **Deploy** via Docker container with health checks

## Common Operations

### Content Management

```bash
# Process new blog posts
yarn blog:process

# Create cryptographic prediction
yarn predict --statement "AI will..." --confidence 80 --deadline 2025-12-31

# Check processed content
ls content/processed/2025/
cat content/processed/manifest-lite.json | jq '.[] | select(.draft != true)'
```

### Development

```bash
# Dev server (port 3006)
yarn dev

# Build for production
yarn build

# Docker development
docker-compose up --build
```

### Deployment

```bash
# Restart after .env changes
docker-compose restart

# Full rebuild
docker-compose down && docker-compose up -d --build
```

## Troubleshooting

### Nuxt Build Cache Corruption

**Error**: `"#internal/nuxt/paths" is not defined`

**Solution** (delete-driven development):

```bash
# Delete corrupted build artifacts
rm -rf .nuxt .output node_modules/.cache && yarn install && yarn build
```

### Content Processing Issues

```bash
# Debug content processing
DEBUG=true yarn blog:process

# Check individual processed files
cat content/processed/2025/post-name.json | jq .metadata

# Verify manifest structure
cat content/processed/manifest-lite.json | jq 'length'
```

### Docker Issues

```bash
# Health check
curl http://localhost:3006/api/healthcheck

# Container logs
docker logs website2-container

# Rebuild everything
docker-compose down --volumes && docker-compose up --build
```

### Gear Page Issues

**Problem**: Weights showing as 0 or NaN
**Cause**: CSV column name mismatch (`Weight_oz` vs `Base Weight ()`)
**Solution**: Update `composables/useWeightCalculations.ts` to use correct column name

**Problem**: Vue template errors with inline SVGs
**Solution**: Use simpler HTML entities or Unicode characters instead of complex SVGs in templates

## Current System Status

- **Build System**: Clean, zero ESLint errors after DELETE-DRIVEN cleanup
- **Content Pipeline**: Obsidian → JSON processing working smoothly
- **Docker**: Production-ready with health checks
- **Dynamic Tags**: Journalist pyramid ordering operational
- **Predictions**: Cryptographic verification system functional
- **Root Folder**: Professional, no build artifacts or test debris
- **Gear System**: CSV-based inventory with Weight_oz column, no TCWM scoring
- **Typography**: Georgia serif, 8px baseline grid, micro-visualizations
- **Data Tables**: Ultra-dense Tuftian design with inline sparklines
- **Sidenotes**: Ultra-simple 113-line client plugin, Tufte CSS approach
- **Layout**: Editorial left-aligned within max-w-screen-xl container

## Sidenotes System (2025-09-29)

### Overview

Replaced complex 800+ line sidenotes system with ultra-simple 113-line client-side plugin that converts standard Markdown footnotes to margin notes.

### Implementation

- **Location**: `plugins/footnotes-to-sidenotes.client.ts`
- **Approach**: Pure client-side transformation of existing footnotes
- **Dependencies**: None - works with standard Markdown footnote HTML
- **Size**: 113 lines total

### How It Works

1. Markdown processor creates standard footnotes (`section[data-footnotes]`)
2. Plugin runs after page load (200ms delay)
3. Transforms footnotes into margin notes positioned absolutely
4. Hides original footnote section
5. Mobile fallback: Shows standard footnotes below content

### Layout System

```
[Browser Window]
    ↓
[Site Container: max-w-screen-xl mx-auto] ← 1280px centered
    ↓
[Article Container: px-4 md:px-8] ← Responsive padding
    ↓
[Content Wrapper: max-w-4xl] ← 896px, LEFT-ALIGNED (no mx-auto!)
    ↓
[Text Elements: max-w-prose] ← ~65ch for readability, LEFT-ALIGNED
```

### Key CSS Rules

- Sidenotes positioned at `left: calc(100% + 2rem)`
- Width: 240px
- Desktop only: Hidden on screens < 1280px
- Override all margin auto to ensure left alignment

### Known Issues & QA Needed

1. **Layout shift on load**: 200ms delay causes visible reflow
2. **Video embeds**: Some .mp4 files showing as blurred images
3. **Width consistency**: Need to verify all pages use same container widths
4. **Sidenote overlap**: Long sidenotes may overlap - needs vertical collision detection
5. **Print styles**: Sidenotes need proper print media handling

### Files Modified

- `plugins/footnotes-to-sidenotes.client.ts` - New sidenote plugin
- `components/BlogPostContent.vue` - Simplified to basic wrapper
- `pages/blog/[...slug].vue` - Updated container widths
- Deleted 6 complex components and 3 experimental plugins

### Next Steps for QA

- [ ] Test sidenote behavior with multiple footnotes
- [ ] Verify mobile/tablet breakpoints
- [ ] Check print stylesheet behavior
- [ ] Test with very long sidenotes
- [ ] Verify no layout shift on slower connections
- [ ] Cross-browser testing (Safari, Firefox, Chrome)

## Key Design Principles

1. **Delete-Driven Development**: Remove complexity, don't add it
2. **Static Generation**: Prefer build-time processing over runtime complexity
3. **Journalist Pyramid**: Most important/frequent data first (tags, content)
4. **Type Safety**: Full TypeScript coverage with strict checking
5. **Docker First**: Container-based deployment and development
6. **Tuftian Data Density**: Maximum data-ink ratio, minimal chrome
7. **8px Baseline Grid**: Consistent vertical rhythm throughout typography
8. **Dark-First Design**: Primary dark theme with zinc color palette

---

_This file provides AI assistants with architectural context for the EJ Fox website project. For human-readable documentation, see README.md_

## VueUse Best Practices (2025-12-04)

**Always prefer VueUse composables over manual lifecycle hooks**

When working with:

- **Element sizing**: Use `useElementSize()` instead of manual `onMounted` + resize listeners
- **Window events**: Use `useEventListener()` instead of manual addEventListener
- **Async data**: Use `useAsyncState()` for cleaner async handling
- **Scroll**: Use `useScroll()` instead of scroll event listeners
- **Breakpoints**: Use `useBreakpoints()` for responsive logic

### Why?

- Handles SSR/hydration edge cases automatically
- Works correctly with async parent components (`await useAsyncData`)
- Auto-cleanup on unmount
- Type-safe and battle-tested

### Example: Element Sizing

```vue
<!-- ❌ BAD: Manual lifecycle hooks -->
<script setup>
const container = ref(null)
const width = ref(0)
onMounted(() => {
  width.value = container.value.offsetWidth
  window.addEventListener('resize', handleResize)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<!-- ✅ GOOD: VueUse composable -->
<script setup>
import { useElementSize } from '@vueuse/core'
const container = ref(null)
const { width } = useElementSize(container)
</script>
```
