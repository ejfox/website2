import { execSync } from 'child_process'

export default defineEventHandler(async (_event) => {
  try {
    // Get git info
    const gitCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim().substring(0, 8)
    const gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim()
    const gitMessage = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim()
    const gitDate = execSync('git log -1 --pretty=%ci', { encoding: 'utf8' }).trim()
    
    // Get build info
    const buildDate = new Date().toISOString()
    const nodeVersion = process.version
    const uptime = process.uptime()
    
    return {
      version: {
        commit: gitCommit,
        branch: gitBranch,
        message: gitMessage,
        date: gitDate,
        buildDate,
        nodeVersion,
        uptime: Math.floor(uptime),
        env: process.env.NODE_ENV || 'development'
      },
      status: 'ok',
      timestamp: new Date().toISOString()
    }
  } catch (_error) {
    return {
      version: {
        commit: 'unknown',
        branch: 'unknown', 
        message: 'Git info unavailable',
        date: 'unknown',
        buildDate: new Date().toISOString(),
        nodeVersion: process.version,
        uptime: Math.floor(process.uptime()),
        env: process.env.NODE_ENV || 'development'
      },
      status: 'ok',
      timestamp: new Date().toISOString(),
      error: 'Git commands failed (probably not in git repo)'
    }
  }
})