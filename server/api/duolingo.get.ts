/**
 * @file duolingo.get.ts
 * @description Fetches Duolingo language learning stats via unofficial public API
 * @endpoint GET /api/duolingo
 * @returns User streak, XP, languages learned, and current courses
 */

interface DuolingoUser {
  username: string
  streak: number
  totalXp: number
  courses: Array<{
    title: string
    xp: number
    level: number
    crowns: number
  }>
  currentCourse?: {
    title: string
    xp: number
    level: number
  }
  creationDate: number
  lastUpdated: string
}

interface DuolingoCourse {
  title: string
  learningLanguage: string
  fromLanguage: string
  xp: number
  crowns: number
  level?: number
}

export default defineEventHandler(async (): Promise<DuolingoUser | null> => {
  const username = 'ejfox2'

  try {
    // Duolingo's public user endpoint
    const response = await fetch(
      `https://www.duolingo.com/2017-06-30/users?username=${username}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; StatsBot/1.0)',
          Accept: 'application/json',
        },
      }
    )

    if (!response.ok) {
      console.error(`Duolingo API error: ${response.status}`)
      return null
    }

    const data = await response.json()
    const user = data.users?.[0]

    if (!user) {
      console.error('Duolingo user not found')
      return null
    }

    // Extract courses with XP
    const courses: Array<{
      title: string
      xp: number
      level: number
      crowns: number
    }> = (user.courses || []).map((course: DuolingoCourse) => ({
      title: course.title || course.learningLanguage,
      xp: course.xp || 0,
      level: course.level || 0,
      crowns: course.crowns || 0,
    }))

    // Sort by XP to find most active course
    const sortedCourses = [...courses].sort((a, b) => b.xp - a.xp)

    return {
      username: user.username,
      streak: user.streak || 0,
      totalXp: user.totalXp || courses.reduce((sum, c) => sum + c.xp, 0),
      courses: sortedCourses,
      currentCourse: sortedCourses[0] || undefined,
      creationDate: user.creationDate,
      lastUpdated: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Duolingo fetch error:', error)
    return null
  }
})
