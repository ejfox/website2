# EJ Fox's Website

A personal website and blog built with Nuxt 3, Vue 3, and D3.js. Content is managed through Obsidian and processed through a custom pipeline for seamless publishing.

## Features

- **Content Management**: Write in Obsidian with markdown, publish with git
- **Modern Stack**: Built with Nuxt 3, Vue 3 Composition API, and D3.js
- **Rich Content**: Support for code highlighting, Mermaid diagrams, and interactive elements
- **Image Optimization**: Automatic Cloudinary integration for responsive images
- **Smart Filtering**: Multi-layer content visibility protection
- **Developer Experience**: Hot reload, TypeScript support, and detailed debugging

## Content Management

### Writing Content

Content is written in Markdown within Obsidian and organized into sections:
- **Blog Posts**: Main articles and thoughts
- **Week Notes**: Weekly updates in YYYY-WW format
- **Projects**: Portfolio and project showcases
- **Reading Notes**: Book summaries and reflections
- **Robots**: AI and automation experiments
- **Prompts**: Writing prompts and exercises

### Frontmatter Options

Control post visibility and metadata with frontmatter:
```yaml
---
title: Post Title
date: 2024-01-01
hidden: true/false    # Completely excludes content from processing
share: true/false     # Required for drafts/robots
dek: Description      # Required for week notes
---
```

## Content Processing Pipeline

### 1. Import Stage (import.mjs)

First line of defense - reads from Obsidian vault and performs initial filtering:
- Immediately skips any content with hidden: true
- Filters sensitive content (drafts, robots) based on share status
- Auto-corrects week note dates from filenames
- Generates metadata (word count, reading time)

### 2. Processing Stage (processMarkdown.mjs)

Second line of defense - transforms content for web display:
- Double-checks hidden status before processing
- Converts markdown to HTML
- Handles syntax highlighting
- Processes Mermaid diagrams
- Optimizes images via Cloudinary
- Generates manifest-lite.json for quick access

### 3. Runtime Stage (useProcessedMarkdown.ts)

Final line of defense - handles dynamic content filtering:
- Triple-checks hidden status before serving
- Applies visibility rules
- Sorts and groups content
- Provides composables for content access
- Manages special section requirements

## Visibility Rules

### Regular Posts
- Visible by default
- Setting hidden: true prevents the post from being processed at all

### Drafts & Robots
- Hidden by default
- Require share: true to be processed
- Setting hidden: true overrides share status

### Week Notes
- Visible by default if they have a description
- Use YYYY-WW filename format
- Setting hidden: true prevents processing

## Development

### Prerequisites
- Node.js 18+
- Yarn
- Obsidian vault with content

### Setup
1. Clone the repository
2. Install dependencies: `yarn install`
3. Copy .env.example to .env and configure
4. Run development server: `yarn dev`

### Content Processing
1. Write content in Obsidian
2. Run `yarn process` to rebuild content
3. Changes appear in development server

### Environment Variables
- `CLOUDINARY_*`: Image optimization settings
- `DEBUG_IMPORT`: Show import process details
- `DEBUG_PROCESS`: Show markdown processing details
- `DEBUG_POSTS`: Show post filtering details

## License

MIT License - See LICENSE file for details