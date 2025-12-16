/**
 * @file index.mjs
 * @description Entry point and exports for content processing scripts - aggregates all major functions, plugins, and utilities
 * @usage import { processMarkdown, processAllFiles } from './scripts/index.mjs'
 */

// Core processing exports
export { processMarkdown, processAllFiles } from './processMarkdown.mjs'
export { importContent } from './import.mjs'

// Plugin exports
export * from './plugins/index.mjs'

// Utility exports
export * from './utils/helpers.mjs'
export * from './utils/stats.mjs'
export * from './utils/processor.mjs'

// Constants and configurations
export const CONTENT_DIR = 'content/blog'
export const OUTPUT_DIR = 'content/processed'
export const BACKUP_DIR = 'content/backup'

// Version
export const VERSION = '1.0.0'
