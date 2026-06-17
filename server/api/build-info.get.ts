/**
 * @file build-info.get.ts
 * @description Returns build metadata including git commit, branch, and build timestamp from .build-info.json
 * @endpoint GET /api/build-info
 * @returns Build information with commit hash, branch name, and build date (returns dev placeholders if file doesn't exist)
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export default defineEventHandler(() => {
  try {
    const buildInfoPath = join(process.cwd(), '.build-info.json')
    const buildInfo = JSON.parse(readFileSync(buildInfoPath, 'utf-8'))

    return {
      ...buildInfo,
      meta: {
        endpoint: '/api/build-info',
        timestamp: new Date().toISOString(),
      },
    }
  } catch {
    // If file doesn't exist (dev mode), return current git info
    return {
      commit: 'dev',
      branch: 'dev',
      buildDate: new Date().toISOString(),
      meta: {
        endpoint: '/api/build-info',
        timestamp: new Date().toISOString(),
        note: 'Development mode - no build info available',
      },
    }
  }
})
