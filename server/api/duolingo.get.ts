/**
 * @file duolingo.get.ts
 * @description GET /api/duolingo. Duolingo stats for user ejfox2 from the
 *   unofficial, keyless public users endpoint: { username, streak, totalXp,
 *   courses (by XP), currentCourse, creationDate, lastUpdated }. Imported by
 *   stats.get.ts. No cache. Returns null on any upstream error.
 */

interface DuolingoUser {
  username: string
  streak: number
  totalXp: number
  courses: Array<{
    title: string
    xp: number
    level: number | null
    crowns: number | null
  }>
  currentCourse?: {
    title: string
    xp: number
    level: number | null
  }
  creationDate: number
  lastUpdated: string
}

interface DuolingoCourse {
  id?: string
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

    // Duolingo dropped per-course levels with the path redesign: the public
    // endpoint no longer sends `level`, and `crowns` is a 9999 sentinel. Both
    // become null rather than a fake "Level 0" next to thousands of XP.
    const CROWNS_SENTINEL = 9999
    const courses: Array<{
      id?: string
      title: string
      xp: number
      level: number | null
      crowns: number | null
    }> = (user.courses || []).map((course: DuolingoCourse) => ({
      id: course.id,
      title: course.title || course.learningLanguage,
      xp: course.xp || 0,
      level: course.level && course.level > 0 ? course.level : null,
      crowns:
        course.crowns && course.crowns !== CROWNS_SENTINEL
          ? course.crowns
          : null,
    }))

    // Sort by XP for the language list
    const sortedCourses = [...courses].sort((a, b) => b.xp - a.xp)
    // The course actually being studied, falling back to the most-XP one
    const active =
      sortedCourses.find((c) => c.id && c.id === user.currentCourseId) ||
      sortedCourses[0]
    const strip = ({ id: _id, ...rest }: (typeof courses)[number]) => rest

    return {
      username: user.username,
      streak: user.streak || 0,
      totalXp: user.totalXp || courses.reduce((sum, c) => sum + c.xp, 0),
      courses: sortedCourses.map(strip),
      currentCourse: active ? strip(active) : undefined,
      creationDate: user.creationDate,
      lastUpdated: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Duolingo fetch error:', error)
    return null
  }
})
