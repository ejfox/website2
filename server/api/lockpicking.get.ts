import { readFile } from 'fs/promises'
import { join } from 'path'

export default defineEventHandler(async () => {
  try {
    const dataPath = join(process.cwd(), 'data/lockpicking.json')
    const data = await readFile(dataPath, 'utf-8')
    const lockpickingData = JSON.parse(data)
    
    // Calculate some additional stats
    const totalAttempts = lockpickingData.recentPicks?.length || 0
    const successfulPicks = lockpickingData.recentPicks?.filter((pick: any) => pick.time).length || 0
    const successRate = totalAttempts > 0 ? Math.round((successfulPicks / totalAttempts) * 100) : 0
    
    const beltsCompleted = Object.values(lockpickingData.beltProgress || {})
      .filter((belt: any) => belt.completed).length
    
    const locksOwned = lockpickingData.lockCollection?.length || 0
    const locksPicked = lockpickingData.lockCollection?.filter((lock: any) => lock.status === 'picked').length || 0
    
    return {
      ...lockpickingData,
      computed: {
        totalAttempts,
        successfulPicks,
        successRate,
        beltsCompleted,
        locksOwned,
        locksPicked,
        pickRate: locksOwned > 0 ? Math.round((locksPicked / locksOwned) * 100) : 0
      }
    }
  } catch (error) {
    console.error('Error loading lockpicking data:', error)
    
    // Return minimal fallback data
    return {
      currentBelt: 'White',
      startDate: new Date().toISOString(),
      totalPicks: 0,
      totalLocks: 0,
      beltProgress: {},
      recentPicks: [],
      lockCollection: [],
      nextTargets: [],
      tools: [],
      goals: [],
      stats: {},
      computed: {
        totalAttempts: 0,
        successfulPicks: 0,
        successRate: 0,
        beltsCompleted: 0,
        locksOwned: 0,
        locksPicked: 0,
        pickRate: 0
      }
    }
  }
})