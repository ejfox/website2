# Docker Deployment Prep - Detailed Progress Log

## What We're Doing

Converting this Nuxt 3 website from Netlify deployment to Docker-based deployment. The main challenge is that this project uses the `canvas` npm package for OG image generation, which requires native system dependencies that are complex to install in Docker containers.

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

4. **Canvas Dependencies Solved**
   - Added all required Alpine packages for canvas: `cairo-dev`, `jpeg-dev`, `pango-dev`, etc.
   - Multi-stage build separates build-time deps from runtime deps
   - Both build and production stages have appropriate canvas libraries

### ✅ RESOLVED: Build Issues Fixed

**Fixed Issues**:

- `components/prediction/PredictionCard.vue` - Already had `lang="ts"`
- `components/prediction/VerificationDisplay.vue` - Already had `lang="ts"`
- `components/PostMetadata.vue` - Already had `lang="ts"`
- `server/api/search.get.ts` - Fixed duplicate `slug` variable declaration (line 171)

**Note**: The TypeScript interface errors were already fixed. The actual blocker was a duplicate variable declaration in the search API.

### 🔧 Build Process Details

1. **Dependencies**: ~380MB of Alpine packages install successfully
2. **Yarn Install**: All npm dependencies install without errors (canvas compiles correctly)
3. **Build Success**: Nuxt build completes successfully in ~47 seconds
4. **Container Size**: Final image includes all runtime dependencies for canvas
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
- All canvas runtime dependencies in production stage

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
2. **Canvas compilation**: Added full suite of Alpine dev packages
3. **TypeScript in Vue**: Components already had `lang="ts"` - false alarm
4. **Duplicate variable**: Fixed duplicate `slug` declaration in search.get.ts
5. **Port configuration**: Successfully mapped 3006 external → 3000 internal

## Why This Was Frustrating

- Canvas package requires extensive native dependencies
- Alpine Linux package names differ from Debian/Ubuntu
- Vue TypeScript compilation is strict about interface usage
- Multiple dependency layers (system → npm → build → runtime)

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

---

_Last updated: June 9, 2025 - Docker build working!_

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
