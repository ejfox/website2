# Scripts Directory

This directory contains all the scripts for processing markdown content, generating images, and managing the blog.

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

## Directory Structure

```
scripts/
├── plugins/           # Remark/Rehype plugins for markdown processing
├── utils/            # Shared utility functions and helpers
├── config.mjs        # Centralized configuration
├── index.mjs         # Main exports
├── processMarkdown.mjs # Core markdown processing
├── import.mjs        # Content import functionality
└── generateShareImages.mjs # Social share image generation
```

## Key Files

- `config.mjs` - Central configuration for all scripts
- `index.mjs` - Main entry point, exports all commonly used functionality
- `processMarkdown.mjs` - Core markdown processing logic
- `import.mjs` - Handles importing content from various sources
- `generateShareImages.mjs` - Generates social media share images

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

## Usage

Most functionality can be imported from the main index:

```javascript
import {
  processMarkdown,
  processAllFiles,
  generateShareImages
} from './scripts/index.mjs'
```

Configuration can be accessed via:

```javascript
import { config, getConfig } from './scripts/config.mjs'

// Get specific config value
const contentDir = getConfig('dirs.content')
```

## Development

When adding new functionality:

1. Add new plugins to `plugins/` directory
2. Add new utilities to `utils/` directory
3. Export new functionality through `index.mjs`
4. Update configuration in `config.mjs` if needed
5. Update this README with any new components

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
