# Scripts Directory

This directory contains all scripts for content processing, predictions, performance monitoring, and site management.

## Quick Reference

```bash
# Content Processing
yarn blog:process          # Process all markdown files
yarn blog:check-links      # Process + check all link health (slower)
yarn blog:fix-links        # Process + auto-fix broken links with archive.org (slowest)
yarn blog:import           # Import content from Obsidian
yarn blog:watch            # Watch for content changes
yarn blog:publish          # Publish new content

# Predictions
yarn predict               # Create new cryptographic prediction (PGP)
yarn kalshi:test           # Fetch Kalshi portfolio data
yarn kalshi:templates      # Generate commentary templates
yarn kalshi:calibration    # Run prediction accuracy analysis

# Performance & Security
node scripts/lighthouse-check.mjs        # Run Lighthouse audit
node scripts/security-performance-audit.js # Audit third-party domains
node scripts/perf-analyze.mjs            # Analyze performance metrics
```

## Content Type Detection Rules

### Week Notes

A post is considered a week note if ANY of these conditions are met:

1. Type is 'weekNote'
2. Slug starts with 'week-notes/'
3. Slug matches YYYY-WW pattern (e.g. "2024-45")

Supported formats:

- Modern format: `week-notes/2024-45`
- Legacy format: `2024-45` (at root level)
- Type-based: Any post with `type: 'weekNote'`

### Special Sections

These sections are filtered out of main blog posts:

- `reading/` - Book notes and reading logs
- `projects/` - Project documentation
- `robots/` - Robot-related content
- `drafts/` - Draft posts
- `study-notes/` - Study and learning notes
- `prompts/` - AI prompts and templates

### System Files

These are always excluded:

- Index files (slug === 'index')
- System files (slug starts with '!' or '\_')

### Visibility Rules

- `hidden: true` -> Post is hidden everywhere
- In `drafts/` -> hidden by default unless `share: true`
- In `robots/` -> hidden by default unless `share: true`
- Week notes -> never auto-hidden, respect `hidden: true` from frontmatter
- Other posts -> respect `hidden: true` from frontmatter

## All Scripts

### Content Processing

**`processMarkdown.mjs`** - Core markdown processing pipeline

- **Purpose:** Converts raw markdown into structured JSON that Nuxt can consume
- **What it does:**
  - Reads markdown files from `content/blog/`
  - Parses frontmatter (title, date, tags, etc.)
  - Extracts table of contents from headings
  - Counts words, images, links, code blocks
  - Processes markdown to HTML with syntax highlighting
  - Generates individual JSON files per post
  - Creates `manifest-lite.json` master index
  - **Link extraction & health checking:**
    - Always extracts external links to `data/external_links_final.csv`
    - With `CHECK_LINKS=true` flag: checks all link health with HTTP HEAD requests
    - Generates `data/linkrot-report.json` with broken links
    - Shows which posts contain broken links
    - Categorizes: working, broken, timeout/errors
  - **Auto-fix broken links** (with `AUTO_FIX_LINKS=true`):
    - Searches archive.org Wayback Machine for broken links
    - Replaces dead URLs with archived versions in source markdown
    - Adds indicator: `*[archived YYYY-MM-DD]*` after replaced links
    - Modifies original markdown files - review with `git diff` before committing
    - Reports which files were updated
- **When to use:** After writing new posts or editing existing ones
- **Usage:**
  - `yarn blog:process` - Process content only (fast)
  - `yarn blog:check-links` - Process + check all link health (slower)
  - `yarn blog:fix-links` - Process + auto-fix broken links with archive.org (slowest)
- **Output:**
  - `content/processed/` - Processed JSON files
  - `data/external_links_final.csv` - All external links with sources
  - `data/linkrot-report.json` - Link health report (with CHECK_LINKS flag)
  - Modified `content/blog/**/*.md` files - broken links replaced with archived versions (with AUTO_FIX_LINKS flag)

**`blog/import.mjs`** - Content import from Obsidian

- **Purpose:** Pulls your writing from Obsidian into the website content directory
- **What it does:**
  - Copies markdown files from Obsidian vault to `content/blog/`
  - Validates frontmatter exists and is correct
  - Handles Obsidian-specific syntax (wikilinks, embeds)
  - Skips files that haven't changed
  - Reports what was imported
- **When to use:** After writing in Obsidian, before processing
- **Usage:** `yarn blog:import`
- **Tip:** Use `DRY_RUN=true` to preview without copying

**`blog/watch.sh`** - Watch for content changes

- **Purpose:** Auto-rebuild during local development
- **What it does:**
  - Monitors `content/blog/` for file changes
  - Automatically runs `processMarkdown.mjs` when files change
  - Keeps processed JSON in sync with source markdown
- **When to use:** During active writing/editing sessions
- **Usage:** `yarn blog:watch`
- **Tip:** Run in separate terminal alongside `yarn dev`

**`blog/publish.sh`** - Publish workflow

- **Purpose:** One-command publish new content
- **What it does:**
  - Imports from Obsidian
  - Processes all markdown
  - Stages and commits changes
  - (Optional) Pushes to remote
- **When to use:** Ready to publish new post
- **Usage:** `yarn blog:publish`

### Predictions System

**`predict-pro.mjs`** - Cryptographic prediction creation tool

- **Purpose:** Create tamper-proof, timestamped predictions to track your forecasting accuracy
- **What it does:**
  - Interactive prompts guide you through creating well-formed predictions
  - Validates statement clarity (20-300 chars) and resolution criteria
  - Enforces confidence calibration (5-95% to avoid overconfidence)
  - Generates SHA-256 hash of prediction for verification
  - Creates markdown file in `content/predictions/`
  - Auto-commits to Git with timestamp
  - Optionally signs with GPG for cryptographic proof
  - Includes quality guidelines and best practices
- **When to use:** Making any prediction you want to track (politics, tech, personal goals)
- **Why it matters:** Can't retroactively change predictions - they're cryptographically locked in
- **Usage:** `yarn predict`
- **Output:** `content/predictions/YYYY-MM-DD-prediction-slug.md`

**`kalshi-test.mjs`** - Fetch Kalshi portfolio data

- **Purpose:** Pull your real-money prediction market positions for display on site
- **What it does:**
  - Authenticates with Kalshi API using credentials from `.env`
  - Fetches all your open market positions
  - Gets historical closed positions
  - Calculates P&L (profit/loss) for each position
  - Shows market details, strike prices, quantities
  - Outputs JSON with full portfolio data
- **When to use:** Updating site with current Kalshi positions, checking P&L
- **Usage:** `yarn kalshi:test`
- **Requires:** `KALSHI_EMAIL` and `KALSHI_PASSWORD` in `.env`

**`generate-commentary-templates.mjs`** - Generate Kalshi commentary templates

- **Purpose:** Create structured markdown files to explain your market positions
- **What it does:**
  - Reads your Kalshi portfolio positions
  - Generates markdown template for each position
  - Includes market details, your position, current odds
  - Creates frontmatter with market metadata
  - Saves to `content/kalshi/` with market ticker as filename
- **When to use:** After taking new Kalshi positions you want to document
- **Why:** Adds narrative context to raw market data - why you took the position
- **Usage:** `yarn kalshi:templates`
- **Follow-up:** Edit generated files to add your analysis/reasoning

**`calibration-analysis.mjs`** - Prediction accuracy tracking

- **Purpose:** Measure how well-calibrated your predictions are over time
- **What it does:**
  - Reads all resolved predictions from `content/predictions/`
  - Calculates Brier score (accuracy metric, lower = better)
  - Generates calibration curves (are your 70% predictions right 70% of the time?)
  - Groups by confidence buckets (50-60%, 60-70%, etc.)
  - Identifies overconfident vs underconfident patterns
  - Creates detailed calibration report
- **When to use:** After resolving several predictions, quarterly reviews
- **Why it matters:** Reveals systematic biases in your forecasting
- **Usage:** `yarn kalshi:calibration`
- **Output:** Calibration statistics and recommendations

**`sign-prediction.mjs`** - PGP signing for predictions

- **Purpose:** Add cryptographic signature to prove you made a prediction at a specific time
- **What it does:**
  - Takes prediction markdown file as input
  - Signs entire file with your GPG private key
  - Appends signature block to file
  - Creates cryptographic proof that can't be backdated
- **When to use:** Making high-stakes predictions you might want to prove later
- **Why:** Extra layer of verification beyond Git timestamps
- **Usage:** `node scripts/sign-prediction.mjs content/predictions/my-prediction.md`
- **Requires:** GPG installed and configured with your key

**`create-prediction.mjs`** - Legacy prediction creator (deprecated)

- **Purpose:** Old version of prediction creation tool
- **Status:** Replaced by `predict-pro.mjs` which has better UX and validation
- **Action:** Use `yarn predict` instead

### Performance & Security

**`lighthouse-check.mjs`** - Lighthouse performance audit

- **Purpose:** Measure site performance with Google's official metrics
- **What it does:**
  - Runs Lighthouse CLI against local dev server
  - Measures Core Web Vitals (LCP, FID, CLS)
  - Checks performance, accessibility, best practices
  - Reports scores and specific issues
  - Highlights optimization opportunities
  - Saves detailed JSON report
- **When to use:** Before deploying, after major changes, weekly checks
- **Why it matters:** Catches performance regressions before production
- **Usage:** `node scripts/lighthouse-check.mjs` (requires dev server running)
- **Tip:** Run on `localhost:3000` or pass custom URL

**`security-performance-audit.js`** - Third-party domain audit

- **Purpose:** Find and categorize all external services your site depends on
- **What it does:**
  - Scans all `.js`, `.ts`, `.vue`, `.html`, `.css` files for URLs
  - Extracts every `https://` reference in codebase
  - Categorizes domains: analytics, CDNs, ads, social, payments
  - Assigns risk levels: HIGH (trackers), MEDIUM (analytics), LOW (fonts/images)
  - Counts references per domain
  - Generates security report JSON with recommendations
  - Flags privacy concerns (ad networks, trackers)
- **When to use:** Pre-deploy audits, quarterly security reviews, before adding new services
- **Why it matters:** Reveals surveillance capitalism creep, identifies performance bottlenecks
- **Usage:** `node scripts/security-performance-audit.js`
- **Output:** `security-performance-audit.json` with full findings

**`perf-analyze.mjs`** - Performance analysis

- **Purpose:** Custom performance metric tracking beyond Lighthouse
- **What it does:**
  - Analyzes bundle sizes
  - Tracks JavaScript execution time
  - Measures custom performance marks
  - Generates performance comparison reports
- **When to use:** Investigating specific performance issues
- **Usage:** `node scripts/perf-analyze.mjs`

**`dev-with-perf.mjs`** - Development with performance monitoring

- **Purpose:** Run dev server with real-time performance tracking
- **What it does:**
  - Starts Nuxt dev server
  - Monitors build times
  - Tracks HMR (Hot Module Replacement) speed
  - Logs slow operations
  - Shows memory usage
- **When to use:** Debugging slow dev experience, optimizing build performance
- **Usage:** `node scripts/dev-with-perf.mjs`
- **Alternative to:** `yarn dev` when you need performance insights

### Utilities

**`generate-build-info.mjs`** - Build metadata generation

- **Purpose:** Embed build metadata into production builds for debugging
- **What it does:**
  - Captures Git commit hash, branch name, commit message
  - Records build timestamp
  - Detects if working directory is dirty (uncommitted changes)
  - Writes JSON file that gets included in build
  - Shows in footer or debug panel
- **When to use:** Automatically runs on every build (`prebuild` hook)
- **Why it matters:** Helps identify which version is deployed when debugging production issues
- **Usage:** Automatic via `yarn build`, or manual `node scripts/generate-build-info.mjs`

**`check-series.mjs`** - Series validation

- **Purpose:** Ensure multi-part blog posts are properly linked and ordered
- **What it does:**
  - Scans all posts for `series` frontmatter field
  - Groups posts by series name
  - Checks that parts are numbered sequentially (Part 1, 2, 3...)
  - Validates all parts have same series name
  - Reports missing parts or numbering issues
- **When to use:** Before publishing new part of a series
- **Why:** Broken series navigation frustrates readers
- **Usage:** `node scripts/check-series.mjs`

**`blog.mjs`** - Blog utilities

- **Purpose:** Shared functions used across blog scripts
- **What it does:**
  - Provides date formatting helpers
  - Slug generation utilities
  - Frontmatter validation functions
  - Common file operations
- **When to use:** Import into other scripts, not run directly
- **Usage:** `import { formatDate, generateSlug } from './scripts/blog.mjs'`

**`fetch-my-events.mjs`** - Event fetching

- **Purpose:** Pull personal events/calendar data to display on site
- **What it does:**
  - Fetches from calendar API (Google Calendar, iCal, etc.)
  - Parses event data (title, date, location, description)
  - Filters for public/shareable events
  - Generates JSON for timeline/events page
- **When to use:** Updating "Now" page, events timeline, speaking engagements
- **Usage:** `node scripts/fetch-my-events.mjs`
- **Requires:** Calendar API credentials in `.env`

**`fix-date-fns-imports.mjs`** - Import fixer

- **Purpose:** Migrate to date-fns v3+ modular import syntax
- **What it does:**
  - Scans all `.js`, `.mjs`, `.ts`, `.vue` files
  - Finds old `import { format } from 'date-fns'` patterns
  - Replaces with `import { format } from 'date-fns/format'`
  - Updates all date-fns imports to tree-shakeable syntax
- **When to use:** After upgrading date-fns, one-time migration
- **Why:** Reduces bundle size by only importing functions you use
- **Usage:** `node scripts/fix-date-fns-imports.mjs` (run once, commit changes)

**`fix-vueuse-imports.mjs`** - Import fixer

- **Purpose:** Migrate to VueUse modular import syntax
- **What it does:**
  - Finds `import { useX } from '@vueuse/core'` patterns
  - Replaces with direct imports `import { useX } from '@vueuse/core/useX'`
  - Optimizes for tree-shaking
- **When to use:** After VueUse upgrade, bundle size optimization
- **Usage:** `node scripts/fix-vueuse-imports.mjs` (run once, commit changes)

### Shell Scripts

**`publish_blog_automator.sh`** - Automator workflow

- **Purpose:** macOS Quick Action for one-click publishing from Finder
- **What it does:**
  - macOS Automator service that shows in right-click menu
  - Runs full publish workflow (import → process → commit → push)
  - Shows success/failure notifications
- **When to use:** After setting up macOS Automator
- **Setup:** Import into Automator as Service/Quick Action
- **Alternative:** Just use `yarn blog:publish` from terminal

**`vps_update.sh`** - VPS deployment

- **Purpose:** Deploy latest changes to your VPS server
- **What it does:**
  - SSHs into VPS
  - Pulls latest Git changes
  - Runs `yarn install` for new dependencies
  - Rebuilds site with `yarn build`
  - Restarts Docker containers or PM2 process
  - Runs health checks
- **When to use:** Deploying to production VPS (alternative to Vercel/Netlify)
- **Usage:** `bash scripts/vps_update.sh`
- **Requires:** SSH access configured, VPS hostname in script

**`sign-post.sh`** - Post signing workflow

- **Purpose:** GPG-sign blog posts for authenticity verification
- **What it does:**
  - Takes blog post markdown file as input
  - Generates detached GPG signature
  - Stores `.sig` file alongside post
  - Allows readers to verify post hasn't been tampered with
- **When to use:** Publishing controversial/important posts you want to prove authorship of
- **Usage:** `bash scripts/sign-post.sh content/blog/2025/my-post.md`
- **Requires:** GPG key configured

## Directory Structure

```
scripts/
├── blog/             # Blog-specific scripts
│   ├── import.mjs
│   ├── create-prediction.mjs
│   ├── watch.sh
│   └── publish.sh
├── plugins/          # Remark/Rehype plugins for markdown processing
│   ├── remarkEnhanceLinks.mjs
│   ├── remarkObsidianSupport.mjs
│   ├── remarkExtractToc.mjs
│   ├── remarkAi2htmlEmbed.mjs
│   └── rehypeAddClassToParagraphs.mjs
├── utils/            # Shared utility functions and helpers
│   ├── helpers.mjs
│   ├── stats.mjs
│   ├── processor.mjs
│   └── backup.mjs
├── predictions/      # Prediction-related scripts
│   └── sign-prediction.mjs
├── config.mjs        # Centralized configuration
├── index.mjs         # Main exports
└── processMarkdown.mjs # Core markdown processing
```

## Key Files

- `config.mjs` - Central configuration for all scripts
- `index.mjs` - Main entry point, exports all commonly used functionality
- `processMarkdown.mjs` - Core markdown processing logic
- `import.mjs` - Handles importing content from various sources

## Plugins

The `plugins/` directory contains all remark and rehype plugins used in markdown processing:

- `remarkEnhanceLinks.mjs` - Enhances links with metadata and icons
- `remarkObsidianSupport.mjs` - Adds support for Obsidian-style wikilinks
- `remarkExtractToc.mjs` - Extracts table of contents
- `remarkAi2htmlEmbed.mjs` - Embeds AI2HTML graphics
- `rehypeAddClassToParagraphs.mjs` - Adds classes to paragraphs
- `rehypeDefaultClasses.mjs` - Adds default classes to HTML elements

## Utils

The `utils/` directory contains shared utility functions:

- `helpers.mjs` - General helper functions
- `stats.mjs` - Processing statistics tracking
- `processor.mjs` - Unified processor setup
- `backup.mjs` - Backup functionality

## Usage Examples

### Content Processing

```bash
# Full blog processing workflow
yarn blog:import && yarn blog:process

# Watch for changes during development
yarn blog:watch

# Dry run to preview changes
DRY_RUN=true yarn blog:import
```

### Creating Predictions

```bash
# Interactive prediction creation
yarn predict

# Create Kalshi commentary templates
yarn kalshi:templates

# Check prediction calibration
yarn kalshi:calibration
```

### Performance Monitoring

```bash
# Run Lighthouse audit on local server
yarn dev  # In one terminal
node scripts/lighthouse-check.mjs  # In another

# Security audit
node scripts/security-performance-audit.js
```

### Programmatic Usage

Most functionality can be imported from the main index:

```javascript
import { processMarkdown, processAllFiles } from './scripts/index.mjs'
```

Configuration can be accessed via:

```javascript
import { config, getConfig } from './scripts/config.mjs'

// Get specific config value
const contentDir = getConfig('dirs.content')
```

## Development

When adding new scripts:

1. Add new plugins to `plugins/` directory
2. Add new utilities to `utils/` directory
3. Add new scripts to appropriate category folder
4. Export new functionality through `index.mjs` if needed
5. Update configuration in `config.mjs` if needed
6. Add npm script to `package.json` if appropriate
7. Document in this README under the correct category

### Script Conventions

- Use `#!/usr/bin/env node` shebang for executable scripts
- Add `chmod +x` for shell scripts
- Use `consola` for pretty console output
- Use Zod for input validation
- Follow existing error handling patterns
- Include usage examples in comments

## Common Issues

### Week Note Detection

Week notes can appear in multiple formats. Make sure to check for all three patterns:

```javascript
const isWeekNote =
  type === 'weekNote' ||
  slug.startsWith('week-notes/') ||
  /^\d{4}-\d{2}$/.test(lastPart) // YYYY-WW format
```

### Content Filtering

When filtering content:

1. Check both root-level and metadata properties
2. Handle legacy formats and patterns
3. Use consistent filtering logic across all components
4. Test with various content types and formats

## Missing Scripts / TODO

### Image Optimizer - Not yet implemented

- **Purpose:** Auto-optimize images before deployment to improve performance
- **Why:** Large images are #1 cause of slow page loads
- **Potential implementation:**
  - Scan `public/images/` and `content/blog/` for images
  - Check dimensions and file sizes
  - Optimize with sharp/imagemin
  - Convert to WebP/AVIF
  - Generate multiple sizes for responsive images
  - Update markdown to use `<picture>` tags
- **Suggested location:** `scripts/optimize-images.mjs`
- **Suggested command:** `yarn images:optimize`

### Dead Code Detector - Not yet implemented

- **Purpose:** Find unused components, composables, utils
- **Why:** Delete-driven development needs automation
- **Potential implementation:**
  - Parse all imports across codebase
  - Build dependency graph
  - Find files never imported
  - Identify dead CSS classes
  - Report candidates for deletion
- **Suggested location:** `scripts/find-dead-code.mjs`
- **Suggested command:** `yarn code:find-dead`
