/**
 * @file config.mjs
 * @description Content-pipeline paths and settings. Every path resolves from
 *   process.cwd(), so run scripts from the repo root.
 *   Imported by scripts/build/processMarkdown.mjs (dirs: content/blog →
 *   content/processed, backup in content/backup), scripts/meta/check-internal-links.mjs
 *   and scripts/blog/import-sealed.mjs.
 * Gotchas: only `dirs` is read anywhere today. processing, cloudinary,
 *   defaultFrontmatter, patterns and getConfig have no callers, so changing
 *   them does nothing.
 * @usage import { config, dirs, processing } from './scripts/config.mjs'
 * @env DEBUG_PROCESS - sets processing.debugMode (unread)
 * @env CLOUDINARY_CLOUD_NAME - builds cloudinary.baseUrl (unread)
 */

import path from 'node:path'

export const config = {
  // Directories
  dirs: {
    content: path.resolve(process.cwd(), 'content', 'blog'),
    output: path.resolve(process.cwd(), 'content', 'processed'),
    backup: path.resolve(process.cwd(), 'content', 'backup'),
    ai2html: path.resolve(process.cwd(), 'public', 'ai2html'),
  },

  // Processing options
  processing: {
    batchSize: 10,
    concurrency: 4,
    retryAttempts: 3,
    debugMode: process.env.DEBUG_PROCESS === 'true',
  },

  // Cloudinary configuration
  cloudinary: {
    baseUrl: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/`,
    defaultTransforms: 'f_auto,q_auto',
  },

  // Default frontmatter
  defaultFrontmatter: {
    draft: false,
    share: false,
    robots: 'index, follow',
  },

  // File patterns
  patterns: {
    markdown: '**/*.md',
    images: '**/*.{png,jpg,jpeg,gif,webp}',
    exclude: ['**/node_modules/**', '**/./**'],
  },
}

// Helper function to get config value
export function getConfig(path, defaultValue = undefined) {
  return (
    path.split('.').reduce((obj, key) => obj?.[key], config) ?? defaultValue
  )
}

// Export individual commonly used values
export const { dirs, processing, cloudinary, defaultFrontmatter, patterns } =
  config
