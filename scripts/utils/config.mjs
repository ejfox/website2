import path from 'path'

export const CONFIG = {
  // Source directory (Obsidian vault)
  sourceDir:
    '/Users/ejfox/Library/Mobile Documents/iCloud~md~obsidian/Documents/ejfox/',

  // Content directories
  contentDir: 'content/blog',
  backupDir: 'content/blog.backup',

  // Allowed content folders
  whitelistedFolders: [
    'blog',
    'week-notes',
    'robots',
    'reading',
    'projects',
    'prompts',
    '2025',
    '2024',
    '2023',
    '2022',
    '2021',
    '2020',
    '2019',
    '2018'
  ]
}

// Helper to get absolute paths
export function getAbsolutePaths(cwd) {
  return {
    contentDir: path.resolve(cwd, CONFIG.contentDir),
    backupDir: path.resolve(cwd, CONFIG.backupDir)
  }
}
