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
   - CLI tool: `yarn predict` for cryptographic predictions
   - SHA-256 hashing + Git commits + optional PGP signing
   - Storage: `content/predictions/` as Markdown with verification data

3. **Stats Aggregation** (`server/api/stats.get.ts`)
   - Multi-source API integration: GitHub, YouTube, LastFM, Chess.com, etc.
   - Caching layer to avoid rate limits
   - Real-time personal metrics dashboard

## Important File Locations

### Critical Scripts
- `scripts/processMarkdown.mjs` - Main content processing pipeline
- `scripts/predict.mjs` - Prediction creation CLI
- `server/routes/tags.json.ts` - Dynamic tags endpoint

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

## Current System Status

- **Build System**: Clean, zero ESLint errors after DELETE-DRIVEN cleanup
- **Content Pipeline**: Obsidian → JSON processing working smoothly
- **Docker**: Production-ready with health checks
- **Dynamic Tags**: Journalist pyramid ordering operational  
- **Predictions**: Cryptographic verification system functional
- **Root Folder**: Professional, no build artifacts or test debris

## Key Design Principles

1. **Delete-Driven Development**: Remove complexity, don't add it
2. **Static Generation**: Prefer build-time processing over runtime complexity  
3. **Journalist Pyramid**: Most important/frequent data first (tags, content)
4. **Type Safety**: Full TypeScript coverage with strict checking
5. **Docker First**: Container-based deployment and development

---

*This file provides AI assistants with architectural context for the EJ Fox website project. For human-readable documentation, see README.md*

