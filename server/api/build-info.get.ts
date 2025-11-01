/**
 * /api/build-info
 * 
 * Returns build information captured at build time.
 * Shows which commit the deployed site is running.
 */

import { readFileSync } from 'fs'
import { join } from 'path'

export default defineEventHandler(() => {
  try {
    const buildInfoPath = join(process.cwd(), '.build-info.json')
    const buildInfo = JSON.parse(readFileSync(buildInfoPath, 'utf-8'))
    
    return {
      ...buildInfo,
      meta: {
        endpoint: '/api/build-info',
        timestamp: new Date().toISOString()
      }
    }
  } catch (error) {
    // If file doesn't exist (dev mode), return current git info
    return {
      commit: 'dev',
      branch: 'dev',
      buildDate: new Date().toISOString(),
      meta: {
        endpoint: '/api/build-info',
        timestamp: new Date().toISOString(),
        note: 'Development mode - no build info available'
      }
    }
  }
})
