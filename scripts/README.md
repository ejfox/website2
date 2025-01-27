# Scripts Directory

This directory contains all the scripts for processing markdown content, generating images, and managing the blog.

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

- `remarkCustomElements.mjs` - Handles custom markdown elements
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