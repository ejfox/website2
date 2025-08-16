# Docker Deployment Prep - Detailed Progress Log

## What We're Doing

Converting this Nuxt 3 website from Netlify deployment to Docker-based deployment.

## Current Status: ✅ DOCKER BUILD SUCCESSFUL!

The Docker image builds successfully and the container runs with health checks working properly. The site is accessible on port 3006.

## Progress So Far

### ✅ COMPLETED

1. **Docker Configuration Files Created**

   - `Dockerfile` - Multi-stage build with Alpine Linux base
   - `.dockerignore` - Excludes unnecessary files from build context
   - `docker-compose.yml` - Production deployment config with health checks
   - `server/api/healthcheck.get.ts` - Health endpoint for container monitoring

2. **Nuxt Config Updated for Docker**

   - Changed preset from `netlify` to `node-server`
   - Added Docker-friendly host/port settings
   - Kept dev port as 3006 (per user request)

3. **Netlify Cleanup**

   - Removed `netlify.toml` file
   - Removed `netlify/` directory
   - Confirmed no Netlify dependencies in package.json

4. **System Dependencies Configured**
   - Multi-stage build separates build-time deps from runtime deps
   - Both build and production stages optimized for Node.js applications

### ✅ RESOLVED: Build Issues Fixed

**Fixed Issues**:

- `components/prediction/PredictionCard.vue` - Already had `lang="ts"`
- `components/prediction/VerificationDisplay.vue` - Already had `lang="ts"`
- `components/PostMetadata.vue` - Already had `lang="ts"`
- `server/api/search.get.ts` - Fixed duplicate `slug` variable declaration (line 171)

**Note**: The TypeScript interface errors were already fixed. The actual blocker was a duplicate variable declaration in the search API.

### 🔧 Build Process Details

1. **Dependencies**: System packages install successfully
2. **Yarn Install**: All npm dependencies install without errors
3. **Build Success**: Nuxt build completes successfully in ~47 seconds
4. **Container Size**: Final image optimized for production
5. **Health Check**: Container starts successfully with working health endpoint

## Next Steps (In Order)

1. ✅ ~~Fix duplicate variable declaration~~
2. ✅ ~~Complete Docker build test~~
3. ✅ ~~Test container startup and health check~~
4. Create `.env.example` with all environment variables
5. Deploy to VPS with proper environment variables
6. Set up reverse proxy (nginx/caddy) for domain routing
7. Add GitHub Actions workflow for automated deployments

## Docker Best Practices Applied

- Multi-stage build to minimize final image size
- Non-root user for security
- Health checks for monitoring
- Proper caching layers for fast rebuilds
- Optimized runtime dependencies for production

## Key Commands

```bash
# Build Docker image
docker build -t website2-test .

# Run container
docker run -p 3006:3000 website2-test

# Health check
curl http://localhost:3006/api/healthcheck
```

## Issues Encountered & Solutions

1. **Missing git**: Added to Alpine packages for npm dependencies
2. **System dependencies**: Configured Alpine packages for Node.js build environment
3. **TypeScript in Vue**: Components already had `lang="ts"` - false alarm
4. **Duplicate variable**: Fixed duplicate `slug` declaration in search.get.ts
5. **Port configuration**: Successfully mapped 3006 external → 3000 internal

## Why This Was Challenging

- Alpine Linux package names differ from Debian/Ubuntu
- Vue TypeScript compilation is strict about interface usage
- Multiple dependency layers (system → npm → build → runtime)
- Docker multi-stage builds require careful dependency management

## Production Deployment Commands

### 🔄 Restarting After .env Updates

When you update environment variables in the `.env` file, the container needs to be restarted to pick up the new values:

```bash
# Quick restart (keeps same image)
docker-compose restart

# Or restart specific service
docker restart website2-prod

# Or full rebuild if dependencies changed
docker-compose down
docker-compose up -d --build
```

**Note**: Environment variables are only read when the container starts, so a restart is required after any `.env` changes.

### Option 1: Direct deployment (if you have Docker registry access)

```bash
# Build and tag production image
docker build -t website2:latest .
docker tag website2:latest your-registry.com/website2:latest
docker push your-registry.com/website2:latest

# On VPS - pull and run
docker pull your-registry.com/website2:latest
docker run -d \
  --name website2 \
  --restart unless-stopped \
  -p 3006:3000 \
  --env-file .env \
  your-registry.com/website2:latest
```

### Option 2: Direct deployment via docker-compose

```bash
# Copy these files to your VPS:
# - docker-compose.yml
# - .env (based on .env.example)
# - Dockerfile
# - (entire project if building on VPS)

# On VPS:
docker-compose up -d
```

### Option 3: Build directly on VPS

```bash
# Clone repo on VPS
git clone https://github.com/ejfox/website2.git
cd website2

# Create .env file from .env.example
cp .env.example .env
# Edit .env with your actual values

# Build and run
docker build -t website2:latest .
docker run -d \
  --name website2 \
  --restart unless-stopped \
  -p 3006:3000 \
  --env-file .env \
  website2:latest
```

# 🚨 NUXT BUILD CACHE CORRUPTION FIX

## The Problem: "#internal/nuxt/paths" Error

This error occurs constantly during development:

```
Error: Package import specifier "#internal/nuxt/paths" is not defined in package ./package.json imported from ./.nuxt/dist/server/server.mjs
```

## The Solution: DELETE-DRIVEN DEVELOPMENT

When this error appears, **immediately** run the cache deletion command:

```bash
# 🗑️ DELETE CORRUPTED BUILD ARTIFACTS
rm -rf .nuxt .output node_modules/.cache && npm install && npm run build
```

## Why This Happens

- Nuxt 3 generates internal build files in `.nuxt/` directory
- These files can become corrupted during development
- Hot reloading and file changes can leave stale references
- The `#internal/nuxt/paths` import is generated by Nuxt but gets corrupted

## Prevention Rules

### ❌ NEVER DO THESE:
1. **Don't commit `.nuxt/` directory** - always in `.gitignore`
2. **Don't interrupt build processes** - let them complete fully
3. **Don't edit files in `.nuxt/`** - they're auto-generated
4. **Don't run `npm run dev` and `npm run build` simultaneously**
5. **Don't switch git branches during active builds**

### ✅ ALWAYS DO THESE:
1. **Clean build on branch switches**: `rm -rf .nuxt && npm run build`
2. **Clean build after major dependency changes**: Same command
3. **Stop dev server before building**: `Ctrl+C` then build
4. **Let build processes complete** before starting dev server
5. **Use the fix command immediately** when error appears

## Quick Reference Commands

```bash
# 🔄 FULL CLEAN REBUILD (when in doubt)
rm -rf .nuxt .output node_modules/.cache && npm install && npm run build

# 🧹 LIGHTER CLEAN (for minor issues)
rm -rf .nuxt && npm run build

# 🚀 START DEV AFTER CLEAN
npm run dev
```

## Success Indicators

After running the fix:
- ✅ Build completes without errors
- ✅ No "#internal/nuxt/paths" error
- ✅ Dev server starts normally
- ✅ Pages load without server errors

**Remember: This is not a bug to fix, it's a cache to DELETE. Delete-driven development wins again.**

---

_Last updated: January 31, 2025 - Docker build working + Cache corruption fix documented!_

# ESLint Fixes Master Plan - 925 Issues (687 Errors, 238 Warnings)

## Executive Summary

The codebase has 925 ESLint issues spread across 165 files. The majority are auto-fixable import issues and TypeScript type definitions. The build succeeds despite these issues, but fixing them will improve code quality, developer experience, and prevent future bugs.

## Issue Categories Breakdown

### 1. Missing Vue/Nuxt Auto-imports (60% of errors)
- `computed`, `ref`, `watch`, `onMounted`, `onUnmounted` not defined
- `useAsyncData`, `$fetch`, `navigateTo` not defined
- **Fix Strategy**: Configure Nuxt auto-imports properly in `nuxt.config.ts`

### 2. Missing Browser/Node Globals (20% of errors)
- `HTMLElement`, `URL`, `window`, `document`, `process` not defined
- `MutationObserver`, `fetch`, `console` not defined
- **Fix Strategy**: Configure ESLint environment and globals

### 3. TypeScript Issues (10% of errors)
- Unused variables and parameters
- Empty catch blocks
- Missing type imports
- **Fix Strategy**: Add proper TypeScript ESLint rules and fix individual issues

### 4. Vue-specific Issues (10% of errors)
- Missing prop defaults
- Incorrect template syntax
- Component naming conventions
- **Fix Strategy**: Update Vue ESLint rules and fix components

## Detailed Fix Plan by File

### High-Priority Files (Most Errors)

#### 1. `components/GearCard3D.client.vue` (25 errors)
```
- Missing: computed, ref, HTMLElement, URL, window, useWeightCalculations
- Fix: Add proper imports and type definitions
```

#### 2. `components/GearItem.vue` (20 errors)
```
- Missing: computed, navigateTo, URL, useWeightCalculations
- Unused: typeIcons, loadedWeight
- Fix: Import composables, remove unused vars
```

#### 3. `components/GearNavigator.vue` (15 errors)
```
- Missing: computed, useAsyncData, $fetch, navigateTo, onMounted, onUnmounted, document
- Missing prop default: currentSlug
- Fix: Add auto-imports config, add prop default
```

### Component Files Pattern Fixes

#### Vue Composition API Imports
Files affected: All component files
```typescript
// These should be auto-imported by Nuxt, fix in nuxt.config.ts:
export default defineNuxtConfig({
  imports: {
    presets: [
      {
        from: 'vue',
        imports: ['computed', 'ref', 'reactive', 'watch', 'onMounted', 'onUnmounted', 'nextTick']
      }
    ]
  }
})
```

#### Missing Composables
Files affected: GearCard3D.client.vue, GearItem.vue, GearNavigator.vue
```typescript
// Add explicit imports at top of files:
import { useWeightCalculations } from '~/composables/useWeightCalculations'
```

### Server API Files Pattern Fixes

#### Unused Parameters
Files affected: Most server/api/*.ts files
```typescript
// Change from:
export default defineEventHandler(async (event) => {
// To:
export default defineEventHandler(async () => {
// Or if event is needed later:
export default defineEventHandler(async (_event) => {
```

#### Empty Catch Blocks
Files affected: server/api/predictions/[id].ts
```typescript
// Change from:
} catch (e) {}
// To:
} catch (e) {
  // Error handled silently
}
```

### Global Type Definitions

Create `types/globals.d.ts`:
```typescript
declare global {
  interface Window {
    // Add any custom window properties
  }
}

export {}
```

### ESLint Configuration Updates

Update `eslint.config.mjs`:
```javascript
export default [
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        HTMLElement: 'readonly',
        URL: 'readonly',
        MutationObserver: 'readonly',
        fetch: 'readonly',
        console: 'readonly',
        process: 'readonly',
        module: 'readonly',
        require: 'readonly'
      }
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      'vue/require-default-prop': 'warn'
    }
  }
]
```

## Automation Strategy

### Phase 1: Global Fixes (1 command)
```bash
# Fix all auto-imports and globals via config changes
npm run lint -- --fix
```

### Phase 2: Pattern-based Fixes (Per issue type)

#### Fix all unused event parameters:
```bash
# Use sed/awk to replace (event) => with () => in server files
find server/api -name "*.ts" -type f -exec sed -i '' 's/async (event)/async (_event)/g' {} +
```

#### Fix all missing prop defaults:
```bash
# Add default: null to all props without defaults
# This requires AST manipulation, use a codemod
```

### Phase 3: File-by-file Fixes

For each high-error file, create a focused fix task:

1. **components/AmazonReferenceItem.vue**
   - Add `computed` auto-import
   - Fix `URL` global

2. **components/BarChart.vue**
   - Add `ref`, `watch` auto-imports
   - Fix `HTMLElement` type

3. **components/ContributionHeatmap.vue**
   - Add prop defaults for `title` and `subtitle`
   - Add missing auto-imports

[Continue for all 165 files...]

## Testing Strategy

After each phase:
1. Run `npm run lint` to verify fixes
2. Run `npm run build` to ensure no regressions
3. Manually test affected components in dev mode

## Priority Order

1. **Critical** (Breaks functionality):
   - Missing composable imports
   - Undefined navigation functions
   
2. **High** (Developer experience):
   - Missing auto-imports
   - TypeScript errors
   
3. **Medium** (Code quality):
   - Unused variables
   - Missing prop defaults
   
4. **Low** (Style/convention):
   - Empty blocks
   - Naming conventions

## Time Estimate

- Phase 1 (Config): 30 minutes
- Phase 2 (Patterns): 2 hours  
- Phase 3 (Individual): 4-6 hours
- Testing: 2 hours

Total: ~10 hours for complete fix

## Success Metrics

- 0 ESLint errors
- < 50 ESLint warnings (prop defaults can remain warnings)
- All builds pass
- All existing functionality works
- No performance regressions

## Rollback Plan

If fixes break functionality:
1. Git reset to previous commit
2. Apply fixes in smaller batches
3. Test each batch thoroughly
4. Create feature branch for risky changes

---

_ESLint Fix Plan created: January 17, 2025_

# DELETE-DRIVEN DEVELOPMENT SESSION LOG

## Current Status: ✅ SITE RUNNING CLEAN & FAST!

**January 30, 2025** - Major animation system overhaul and responsive design fixes completed using **delete-driven development** philosophy.

## What We Learned Today

### 🗑️ DELETE-DRIVEN DEVELOPMENT PHILOSOPHY

> **"delete-driven development: when system hangs, delete code until it works. no clever fixes, no complex solutions. find the bloat, the memory leaks, the duplicate parsers, the orphaned listeners - DELETE THEM. broken thing? delete it. hanging timeout? delete the timeout. memory leak? delete the event handlers. syntax error? delete the broken lines. always prefer removing code over adding it. simple beats complex. working beats perfect. delete your way to success. this is the way."**

**Key Principles Proven:**
- Remove broken code instead of fixing it
- Simple solutions beat complex ones  
- Working beats perfect
- Delete bloat, memory leaks, unused listeners
- Prefer removing code over adding it

### ✅ MAJOR FIXES COMPLETED

#### 1. Animation System Overhaul
- **DELETED** all looping animations causing flickering
- Fixed anime.js v4 API compliance issues (`translateY` → `y`, timing references)
- Implemented Apple-style shift+key slow-motion debug mode (2x slower)
- Standardized timing scale: 200, 400, 800, 1600, 2400ms geometric progression
- **DELETED** all setTimeout-based animations
- **RESULT**: Smooth, consistent animations with no performance issues

#### 2. Responsive PostMetadata Component  
- **DELETED** complex container query implementation
- Used simple Tailwind responsive classes instead
- Blog index: `compact=true` = vertical stack on mobile, horizontal wrap on sm+
- Blog posts: `compact=false` = single horizontal line always
- Fixed duplicate date display issue
- **RESULT**: Clean responsive metadata that works everywhere

#### 3. Projects Page Purification
- **DELETED** 80+ lines of unused code from 120+ to ~25 lines
- **DELETED**: Event listeners, scroll tracking, TOC sidebar, timeline section, router navigation, complex link logic, tags display, loading states, CSS overrides, animation code causing getTweenType errors
- **KEPT**: Data fetching, project display, date formatting, GitHub links
- **RESULT**: Fast, clean projects page with no client-side errors

#### 4. ESLint Error Massacre
- **DELETED** all 15 linter errors across codebase
- Fixed broken nested comments in Footer.vue
- **DELETED** unused animation variables and imports
- Prefixed unused variables with `_` convention
- Fixed useStorage scoping issues
- Mass-fixed unused event parameters with sed commands
- **RESULT**: Clean codebase with 0 linter errors

#### 5. SSR Error Fixes
- Added null-safe checks for `route?.path` throughout codebase
- Fixed "Cannot read properties of undefined (reading 'path')" errors
- **RESULT**: No more SSR crashes

#### 6. Safari Theme Color Implementation
- Added responsive theme-color meta tags:
  - Light mode: `#ffffff` (matches bg-white)
  - Dark mode: `#0a0a0a` (matches bg-zinc-950)
- **DELETED** duplicate theme-color definitions
- **RESULT**: Safari topbar seamlessly blends with site background

#### 7. Pluralization Bug Fix
- Fixed "1 iamges" → "1 image" bug in PostMetadata
- **DELETED** compact mode exception in pluralize function
- **RESULT**: Proper grammar for expert programmers

### 🧠 USER FEEDBACK & PREFERENCES

**Animation Philosophy:**
- "i dont want a fucking orange badge or modern glass effect NOR a snail emoji what the fuck man"
- No visual debug indicators, clean functional debug mode only
- Apple-style animation debug preferred (shift+key slow motion)

**Code Quality Standards:**
- "sometimes the metadata saays '1 iamges' which is bad form since we're expert programmers lol"
- High attention to detail and proper grammar/pluralization

**Problem-Solving Approach:**
- "what I like date-fns..." - Keep useful dependencies, fix imports properly
- Preference for familiar tools over native alternatives when they work

**Delete-Driven Development Adoption:**
- Full embrace of deletion over addition philosophy
- "refine projects.vue with our religion, deletion"
- Immediate application when things break or hang

### 📊 METRICS & IMPROVEMENTS

**Performance Gains:**
- Projects page: 120+ lines → 25 lines (79% code reduction)
- Animation system: Eliminated 6+ looping animations
- Build time: No more getTweenType errors
- Memory: No orphaned event listeners

**Code Quality:**
- ESLint errors: 15 → 0 (100% clean)
- SSR crashes: Fixed with null-safe patterns
- Browser compatibility: Safari theme colors working

**User Experience:**
- Responsive metadata works on all screen sizes
- No more flickering animations on blog pages
- Clean, fast project browsing
- Proper pluralization throughout

### 🎯 DEVELOPMENT PATTERNS ESTABLISHED

1. **Delete-First Debugging**: When something breaks, delete it before trying to fix it
2. **Minimal Viable Solutions**: Simple Tailwind classes > complex container queries
3. **Mass Pattern Fixes**: Use sed for bulk replacements across files
4. **SSR Safety**: Always add `?.` null checks for route/window access
5. **Animation Standards**: Geometric timing progression, no hardcoded values
6. **Linter-Driven Quality**: Prefix unused vars with `_`, fix all warnings

### 🚀 CURRENT SITE STATUS

- ✅ Docker build working perfectly
- ✅ Animation system standardized and smooth
- ✅ Responsive design working across all breakpoints
- ✅ Zero linter errors
- ✅ Zero client-side console errors
- ✅ Safari theme colors matching site background
- ✅ SSR-safe throughout
- ✅ Expert-level pluralization and grammar

**The site is running clean, fast, and professional. Delete-driven development proved to be incredibly effective for both debugging and code quality improvement.**

---

_Updated: January 30, 2025 - Delete-driven development session complete!_

## 🎭 Animation System - Critical Information

### The Hidden Content Bug (Projects Page)

**Problem Discovered:** Projects page content was invisible after the first 2 items.

**Root Cause:** The markdown processor (`scripts/plugins/rehypeAddClassToParagraphs.mjs`) adds animation classes to HTML elements during build:
- `animate-on-scroll` 
- `slide-from-left`
- `slide-from-bottom`
- `will-change-transform`

These classes set initial CSS states (opacity: 0, transforms) expecting JavaScript to animate them in. Without the animation JavaScript, content stays hidden forever.

**Solution:** Any page displaying processed markdown MUST initialize animations:

```javascript
// Required imports
import { animate, stagger } from '~/anime.esm.js'
import { useAnimations } from '~/composables/useAnimations'
import { useScrollAnimation } from '~/composables/useScrollAnimation'

// In onMounted or after content loads:
const content = document.querySelectorAll('.animate-on-scroll:not(img)')
animate(content, {
  opacity: [0, 1],
  translateY: [20, 0],
  duration: timing.normal,
  ease: easing.standard,
  delay: stagger(staggers.tight)
})
```

**Affected Pages:**
- ✅ `/blog/[...slug]` - Has animation setup
- ✅ `/projects` - Fixed by adding animation setup
- ⚠️  Any new page showing markdown content needs this!

**Files Involved:**
- `scripts/plugins/rehypeAddClassToParagraphs.mjs` - Adds animation classes
- `composables/useScrollAnimation.ts` - Provides animation functions
- `pages/blog/[...slug].vue` - Reference implementation
- `pages/projects.vue` - Fixed implementation

**Lesson:** When content has animation classes baked in during build, you MUST have client-side JS to trigger those animations or content will be invisible.

_Updated: January 31, 2025 - Animation system documentation added_
