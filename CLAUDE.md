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

# Recent Session TODOs & Context (January 6, 2025)

## ✅ COMPLETED THIS SESSION
1. **Fixed blog index showing future/prediction posts** - Implemented whitelist filtering to only show year-based posts (`2024/post-name`)
2. **Fixed 404 page showing unpublished drafts** - Added filtering to prevent drafts and `_stale` content from appearing in search results
3. **Implemented whitelist content filtering** - Much safer than blacklist approach, prevents any unwanted content exposure
4. **Created PR #8** - https://github.com/ejfox/website2/pull/8 with comprehensive security improvements

## 🔧 CURRENT ISSUE: Supabase Integration
- **Problem**: Scrapbook page failing with CSP and config issues
- **Fixed**: Added Supabase URLs to CSP and runtime config in `nuxt.config.ts`
- **Status**: Need to restart dev server for changes to take effect

## 🎯 NEXT OBJECTIVES
1. **Set up Supabase MCP** - User wants to use MCP for database operations instead of direct client calls
2. **Create data-dense scrap display** - User wants a verbose/detailed view of scraps with rich metadata
3. **Explore scrap data structure** - Use MCP to examine real schema and example data

## 📊 Scrap Data Available (from existing code analysis)
- **Sources**: Pinboard, GitHub, Are.na, Mastodon, Twitter, YouTube
- **Rich metadata**: Tags, location, relationships, screenshots, embeddings
- **Timestamps**: created_at, updated_at, published_at
- **Processing**: embeddings (text + image), graph relationships

## 🛠️ Technical Notes
- Current scrapbook at `/scrapbook` uses infinite scroll grid layout
- Components: `Scrap/Item.vue`, `Scrap/Metadata.vue`, `Scrap/Pinboard.vue`
- Composable: `useScraps.ts` handles Supabase client operations
- API: `/api/scraps.post.ts` for server-side operations

## 🔐 Environment Setup Needed
```bash
# Required in .env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

## 💡 Design Direction for Data-Dense View
User wants to pivot from visual grid to data-rich display. Options discussed:
- Dense table view with metadata columns
- Compact cards with more text info
- List view with expanded details
- Dashboard with stats + detailed items

---
*Last updated: January 6, 2025 - Ready for MCP setup and data-dense scrap display*