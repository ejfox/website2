# EJ Fox's Website

Personal website + blog: Nuxt 3 • Vue 3 • Tailwind • Docker

## Quick Start

```bash
yarn install && yarn blog:import && yarn blog:process && yarn dev
```

## Commands

| Command                  | Description                     |
| ------------------------ | ------------------------------- |
| `yarn dev`               | Dev server (port 3006)          |
| `yarn build`             | Production build                |
| `yarn blog:import`       | Import from Obsidian            |
| `yarn blog:process`      | Process MD → JSON               |
| `yarn predict`           | Create cryptographic prediction |
| `yarn webmentions`       | Send webmentions (last 7 days)  |
| `yarn webmentions --all` | Send all webmentions            |

## Features

### Content Pipeline

Obsidian → Markdown → Unified/Rehype → JSON → Vue

```
content/blog/YYYY/*.md  →  content/processed/YYYY/*.json
```

### Frontmatter

```yaml
---
title: Post Title
date: 2024-01-01
dek: One-sentence description
tags: [tag1, tag2]
draft: false # Hide from lists
hidden: false # Skip processing
replyTo: https://example.com/post # IndieWeb reply (single or array)
---
```

### IndieWeb

| Feature          | Details                                                                         |
| ---------------- | ------------------------------------------------------------------------------- |
| **Reply posts**  | `replyTo:` fetches OG data, shows context, sends webmention                     |
| **Webmentions**  | Display likes/reposts/replies, moderation via `data/webmention-moderation.json` |
| **Microformats** | h-entry, h-card, u-in-reply-to on all posts                                     |
| **WebSub**       | Hub at pubsubhubbub.superfeedr.com                                              |

### Predictions System

```bash
yarn predict --statement "X will happen" --confidence 75 --deadline 2025-12-31
```

- SHA-256 + Git commit + optional PGP signing
- AI quality analysis via OpenRouter
- See `docs/PREDICTIONS.md`

### Stats Aggregation

Two endpoints for personal metrics:

- `/api/stats` - Full stats with arrays and nested data (~2.4KB)
- `/api/stats-lite` - Lightweight for iOS Shortcuts (~345 bytes, 86% smaller)

Aggregates: GitHub, Chess.com, LastFM, RescueTime, Letterboxd, Discogs, Kalshi

See `docs/STATS-API.md` and `docs/IOS-SHORTCUTS-EXAMPLES.md` for usage

### Gear Inventory

CSV-based gear tracking at `/gear` with weight calculations, Tuftian visualizations

### Sidenotes

Footnotes auto-convert to margin notes on desktop (Tufte-style)

## Deployment

Push to `main` → GitHub Action SSHs to VPS → pulls, builds, restarts Docker

Manual: `ssh vps "cd /data2/website2 && git pull && yarn build && docker-compose up -d --build"`

## Environment

```bash
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
YOUTUBE_API_KEY=
YOUTUBE_CHANNEL_ID=
```

## Directory Structure

```
content/blog/       # Source markdown by year
content/processed/  # Output JSON
server/api/         # API endpoints
components/         # Vue components
scripts/            # Processing scripts
data/               # Config files (moderation, gear CSV)
```

## Debug

```bash
DEBUG=true yarn blog:process
CHECK_LINKS=true yarn blog:process  # Link health check
AUTO_FIX_LINKS=true yarn blog:process  # Auto-fix with archive.org
```

## TODO

- Rerun `node scripts/hydrate-cloudinary-cache.mjs` until it reports `0 missing metadata` (it resumes from cache).
- Investigate remaining `x` failures in the hydrator output (missing assets vs permissions).
- Document the hydrator runtime/usage and add it to the Commands table once stable.
- Rerun the hydrator to reduce the remaining ~331 missing entries (current baseline).
- Clean malformed Cloudinary URLs in markdown (e.g. `...png)![Screenshot`) so they can be hydrated.

---

MIT License
