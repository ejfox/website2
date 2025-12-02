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
    hidden: false,
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
