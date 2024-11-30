// composables/useStats.ts
interface StatsData {
  metrics: {
    keystrokes: number
    musicHours: number
    chessGames: number
    steps: number
    photos: number
    linesOfCode: number
    hoursTracked: number
    activeDays: number
  }
  typing: {
    currentWPM: number
    productivityPulse: number
    bestWPM: number
    accuracy: number
    recentTests: any[]
    historicalWPM: number[]
  }
  music: {
    currentStreak: number
    topArtists: Array<{
      name: string
      plays: number
    }>
    recentTracks: any[]
    dailyMinutes: number[]
    favoriteGenres: string[]
    listenHistory: any[]
  }
  health: {
    sleepScore: number
    activeMinutes: number
    stepCount: number
    sleepHistory: number[]
    activityHeatmap: number[]
    workouts: any[]
    heartRate: {
      resting: number
      zones: number[]
    }
  }
  chess: {
    currentRating: number
    peakRating: number
    recentGames: any[]
    winRate: number
    accuracy: number
    openings: {
      white: any[]
      black: any[]
    }
    ratingHistory: number[]
  }
  code: {
    currentStreak: number
    prCount: number
    contributions: number[]
    languages: string[]
    repositories: any[]
    commitMessages: string[]
    activeHours: number[]
    hourlyDetails: {
      name: string
      count: number
    }[]
    dates: string[]
  }
  productivity: {
    dailyProductivityPulse: number
    topActivities: any[]
    focusedWork: {
      hours: number
      peak: string
      streak: number
    }
    distractions: {
      count: number
      topSources: string[]
      timeWasted: number
    }
    categories: any[]
    trends: {
      daily: number[]
      weekly: number[]
      monthly: number[]
    }
  }
  photography: {
    totalPhotos: number
    recentPhotos: Array<{
      id: string
      url: string
      uploaded_at: string
      width: number
      height: number
      format: string
    }>
    byMonth: Array<{
      month: string
      count: number
    }>
    byFormat: Array<{
      format: string
      count: number
    }>
    byAspectRatio: Array<{
      ratio: string
      count: number
    }>
    photos: Array<{
      public_id: string
      secure_url: string
      created_at: string
    }>
  }
  weather: {
    current: {
      temp: number
      feelsLike: number
      conditions: string
      windSpeed: number
    }
    history: Array<{
      date: string
      temp: number
      conditions: string
    }>
    extremes: {
      coldest: number
      windiest: number
      snowiest: number
    }
    trainingConditions: Array<{
      type: string
      count: number
      lastDate: string
    }>
  }
}

// Add these interfaces at the top
interface GitHubContributionDay {
  contributionCount: number
  date: string
}

interface GitHubRepo {
  name: string
  primaryLanguage?: {
    name: string
  }
  defaultBranchRef?: {
    target: {
      history: {
        nodes: Array<{
          message: string
          committedDate: string
        }>
      }
    }
  }
}

interface GitHubResponse {
  data: {
    viewer: {
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: number
          weeks: Array<{
            contributionDays: GitHubContributionDay[]
          }>
        }
        pullRequestContributions: {
          totalCount: number
          nodes: {
            pullRequest: {
              title: string
              merged: boolean
              mergedAt: string
            }
          }[]
        }
      }
      repositories: {
        nodes: GitHubRepo[]
      }
    }
  }
  errors?: Array<{ message: string }>
}

// Add to the interfaces section
interface CloudinaryPhoto {
  href: string
  public_id: string
  uploaded_at: string
  tags: string[]
  metadata: {
    camera?: string
    lens?: string
    aperture?: string
    iso?: string
    focal_length?: string
  }
}

// Update MonkeyType interfaces to match API
interface MonkeyTypeTest {
  wpm: number
  acc: number
  raw: number
  consistency: number
  timestamp: number
  mode: string
  mode2: string
  language: string
}

interface MonkeyTypeStats {
  timeTyping: number
  testsCompleted: number
  testsStarted: number
}

interface MonkeyTypeResponse {
  message: string
  data: {
    typingStats: MonkeyTypeStats
  }
}

export const useStats = () => {
  const config = useRuntimeConfig()
  const GITHUB_TOKEN = config.public.GITHUB_TOKEN

  const stats = reactive<StatsData>({
    metrics: {
      keystrokes: 0,
      musicHours: 0,
      chessGames: 0,
      steps: 0,
      photos: 0,
      linesOfCode: 0,
      hoursTracked: 0,
      activeDays: 0
    },
    typing: {
      currentWPM: 0,
      productivityPulse: 0,
      bestWPM: 0,
      accuracy: 0,
      recentTests: [],
      historicalWPM: []
    },
    music: {
      currentStreak: 0,
      topArtists: [],
      recentTracks: [],
      dailyMinutes: [],
      favoriteGenres: [],
      listenHistory: []
    },
    health: {
      sleepScore: 0,
      activeMinutes: 0,
      stepCount: 0,
      sleepHistory: [],
      activityHeatmap: [],
      workouts: [],
      heartRate: {
        resting: 0,
        zones: []
      }
    },
    chess: {
      currentRating: 0,
      peakRating: 0,
      recentGames: [],
      winRate: 0,
      accuracy: 0,
      openings: {
        white: [],
        black: []
      },
      ratingHistory: []
    },
    code: {
      currentStreak: 0,
      prCount: 0,
      contributions: [],
      languages: [],
      repositories: [],
      commitMessages: [],
      activeHours: [],
      hourlyDetails: [],
      dates: []
    },
    productivity: {
      dailyProductivityPulse: 0,
      topActivities: [],
      focusedWork: {
        hours: 0,
        peak: '',
        streak: 0
      },
      distractions: {
        count: 0,
        topSources: [],
        timeWasted: 0
      },
      categories: [],
      trends: {
        daily: [],
        weekly: [],
        monthly: []
      }
    },
    photography: {
      totalPhotos: 0,
      recentPhotos: [],
      byMonth: [],
      byFormat: [],
      byAspectRatio: [],
      photos: []
    },
    weather: {
      current: {
        temp: 0,
        feelsLike: 0,
        conditions: '',
        windSpeed: 0
      },
      history: [],
      extremes: {
        coldest: 0,
        windiest: 0,
        snowiest: 0
      },
      trainingConditions: []
    }
  })

  const isLoading = ref(true)
  const errors = reactive<Record<string, string>>({})

  const isReady = ref(false)

  const fetchAllStats = async () => {
    isLoading.value = true

    // Execute all fetches and track their results individually
    const results = await Promise.allSettled([
      fetchGitHub().catch((e) => {
        console.error('GitHub fetch failed:', e)
        errors.github = e?.message || 'Failed to fetch GitHub data'
      }),
      fetchPhotos().catch((e) => {
        console.error('Photos fetch failed:', e)
        errors.photos = e?.message || 'Failed to fetch photo data'
      }),
      fetchMonkeyType().catch((e) => {
        console.error('MonkeyType fetch failed:', e)
        errors.monkeyType = e?.message || 'Failed to fetch typing data'
      })
    ])

    // Log results for debugging
    results.forEach((result, index) => {
      const services = ['GitHub', 'Photos', 'MonkeyType']
      if (result.status === 'rejected') {
        console.warn(`${services[index]} fetch failed:`, result.reason)
      }
    })

    isLoading.value = false
  }

  onMounted(async () => {
    await fetchAllStats()
    // Set ready even if some services failed
    isReady.value = true
  })

  // Move fetchGitHub inside useStats to access stats and errors
  const fetchGitHub = async () => {
    try {
      console.log('GitHub Token Debug:', {
        hasToken: !!config.public.GITHUB_TOKEN,
        tokenLength: config.public.GITHUB_TOKEN?.length,
        tokenStart: config.public.GITHUB_TOKEN?.substring(0, 10),
        isPlaceholder: config.public.GITHUB_TOKEN === 'your_token_here',
        configKeys: Object.keys(config.public)
      })

      // Use our server proxy instead of direct GitHub API call
      const response = await fetch('/api/github')
      const data = await response.json()

      console.log('GitHub API response:', data)

      if (data.errors) {
        throw new Error(data.errors[0].message)
      }

      if (!data.data?.viewer) {
        throw new Error('Invalid GitHub API response')
      }

      const viewer = data.data.viewer
      const calendar = viewer.contributionsCollection.contributionCalendar
      const repos = viewer.repositories.nodes

      // Process contribution data
      const contributions = calendar.weeks.flatMap((week) =>
        week.contributionDays.map((day) => ({
          count: day.contributionCount,
          date: new Date(day.date)
        }))
      )

      // Calculate streak
      let currentStreak = 0
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      for (let i = contributions.length - 1; i >= 0; i--) {
        const contrib = contributions[i]
        if (contrib.count > 0) {
          currentStreak++
        } else {
          break
        }
      }

      // Get languages
      const languages = repos
        .map((repo) => repo.primaryLanguage?.name)
        .filter((name): name is string => !!name)

      // Get commit messages
      const commitMessages = repos
        .flatMap(
          (repo) =>
            repo.refs?.nodes?.[0]?.target?.history?.nodes?.map((commit) => ({
              message: commit.message,
              date: new Date(commit.committedDate),
              repo: repo.name
            })) ?? []
        )
        .sort((a, b) => b.date.getTime() - a.date.getTime())

      // Calculate active hours
      const activeHours = new Array(24).fill(0)
      const commitsByHour = new Array(24).fill(0).map(() => new Map())

      commitMessages.forEach((commit) => {
        const hour = commit.date.getHours()
        const repo = commit.repo

        // Increment total commits for this hour
        activeHours[hour]++

        // Track commits per repo for this hour
        const repoCount = commitsByHour[hour].get(repo) || 0
        commitsByHour[hour].set(repo, repoCount + 1)
      })

      // Format the data for the heatmap
      const hourlyDetails = commitsByHour.map((hourMap) =>
        Array.from(hourMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
      )

      // Update stats object
      stats.code = {
        currentStreak,
        prCount:
          viewer.contributionsCollection.pullRequestContributions.nodes.filter(
            (node) => node.pullRequest.merged
          ).length,
        contributions: contributions.map((c) => c.count),
        languages,
        repositories: repos.map((r) => r.name),
        commitMessages: commitMessages.map((c) => c.message),
        activeHours,
        hourlyDetails,
        dates: contributions.map((c) => c.date.toISOString().split('T')[0])
      }

      // Update metrics
      stats.metrics.linesOfCode = calendar.totalContributions
      stats.metrics.activeDays = contributions.filter((c) => c.count > 0).length

      console.log('GitHub data fetched successfully:', stats.code)
    } catch (e) {
      if (e instanceof Error) {
        errors.github = e.message
      }
      console.error('GitHub API error:', e)
    }
  }

  const fetchPhotos = async () => {
    try {
      console.log('Fetching photos...')
      const response = await fetch('/api/photos')
      const photos = await response.json()

      console.log('Raw photos response:', photos)
      console.log(`Processing ${photos.length} photos`)

      // Group photos by month
      const byMonth = new Map<string, number>()
      const byFormat = new Map<string, number>()
      const byAspectRatio = new Map<string, number>()

      // Log a sample photo to see its structure
      console.log('Sample photo structure:', photos[0])

      photos.forEach((photo) => {
        // Count by month
        const month = photo.uploaded_at.substring(0, 7) // YYYY-MM
        byMonth.set(month, (byMonth.get(month) || 0) + 1)

        // Count by format
        byFormat.set(photo.format, (byFormat.get(photo.format) || 0) + 1)

        // Count by aspect ratio
        const ratio = photo.width / photo.height
        const ratioKey =
          ratio === 1 ? 'square' : ratio > 1 ? 'landscape' : 'portrait'
        byAspectRatio.set(ratioKey, (byAspectRatio.get(ratioKey) || 0) + 1)
      })

      // Log the grouped data
      console.log('Photos by month:', Object.fromEntries(byMonth))
      console.log('Photos by format:', Object.fromEntries(byFormat))
      console.log('Photos by aspect ratio:', Object.fromEntries(byAspectRatio))

      // Update stats
      stats.photography = {
        totalPhotos: photos.length,
        recentPhotos: photos.slice(0, 10),
        byMonth: Array.from(byMonth.entries())
          .map(([month, count]) => ({ month, count }))
          .sort((a, b) => b.month.localeCompare(a.month)),
        byFormat: Array.from(byFormat.entries())
          .map(([format, count]) => ({ format, count }))
          .sort((a, b) => b.count - a.count),
        byAspectRatio: Array.from(byAspectRatio.entries())
          .map(([ratio, count]) => ({ ratio, count }))
          .sort((a, b) => b.count - a.count),
        photos // Add the photos array to fix TypeScript error
      }

      // Log the final processed stats
      console.log('Final photography stats:', {
        totalPhotos: stats.photography.totalPhotos,
        recentPhotosCount: stats.photography.recentPhotos.length,
        byMonth: stats.photography.byMonth,
        byFormat: stats.photography.byFormat,
        byAspectRatio: stats.photography.byAspectRatio
      })

      // Update metrics
      stats.metrics.photos = photos.length

      console.log(
        'Photo stats processed:',
        stats.photography,
        'from URL',
        response.url
      )
    } catch (e) {
      if (e instanceof Error) {
        errors.photos = e.message
      }
      console.error('Photo API error:', e)
    }
  }

  const fetchMonkeyType = async () => {
    try {
      console.log('Fetching MonkeyType stats...')
      const response = await fetch('/api/monkeytype')
      const data = await response.json()

      console.log('Raw MonkeyType response:', data)

      // Update validation to match our new structure
      if (!data?.Typing) {
        throw new Error(
          `Invalid MonkeyType API response: ${JSON.stringify(data)}`
        )
      }

      // Update stats with the new data structure
      stats.typing = {
        currentWPM: data.Typing.CurrentWPM,
        productivityPulse: Math.round(
          (data.Typing.Accuracy + data.Typing.CurrentWPM / 100) * 50
        ),
        bestWPM: data.Typing.BestWPM,
        accuracy: data.Typing.Accuracy,
        recentTests: data.Typing.TestHistory || [],
        historicalWPM: data.Typing.TestHistory?.map((test) => test.Wpm) || []
      }

      // Update metrics
      stats.metrics.keystrokes = data.Typing.TimeTyping * 5 // Rough estimate

      console.log('Processed MonkeyType stats:', stats.typing)
    } catch (e) {
      if (e instanceof Error) {
        errors.monkeyType = e.message
      }
      console.error('MonkeyType API error:', e)
    }
  }

  return {
    stats: readonly(stats),
    isLoading: readonly(isLoading),
    isReady: readonly(isReady),
    errors: readonly(errors),
    fetchAllStats
  }
}
