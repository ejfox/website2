/**
 * @file apple-health.get.ts
 * @description Fetches Apple Health statistics from health-webhook.tools.ejfox.com
 * @endpoint GET /api/apple-health
 * @returns Health stats including steps, heart rate, exercise, sleep data
 */
import { defineEventHandler } from 'h3'

interface HealthStats {
  today: {
    steps: number
    standHours: number
    exerciseMinutes: number
    distance: number
    calories: number
  }
  thisWeek: {
    steps: number
    exerciseMinutes: number
    distance: number
    calories: number
  }
  thisYear: {
    steps: number
    exerciseMinutes: number
    distance: number
    calories: number
    averageStepsPerDay: number
    averageExercisePerWeek: number
  }
  averages: {
    dailySteps: number
    dailyStandHours: number
    dailyExerciseMinutes: number
    dailyDistance: number
    restingHeartRate: number
  }
  heartRate: {
    resting: number
    walking: number
    current: number
    variability: number
  }
  activity: {
    monthlyDistance: number
    monthlyExerciseMinutes: number
    monthlySteps: number
    flightsClimbed: number
  }
  sensory: {
    bloodOxygenPct: number
    respiratoryRate: number
    daylightMinPerDay: number
    ambientDb: number
    mindfulMin30d: number
  }
  sleep: {
    lastNight: {
      date: string
      asleepHours: number
      inBedHours: number
      efficiency: number | null
      stages: { core: number; deep: number; rem: number; awake: number } | null
    } | null
    avgHours30d: number
    trend: { dates: string[]; hours: number[] }
  }
  trends: {
    daily: {
      dates: string[]
      steps: number[]
      exercise: number[]
      distance: number[]
    }
    weekly: {
      dates: string[]
      steps: number[]
      exercise: number[]
      distance: number[]
    }
    monthly: {
      dates: string[]
      steps: number[]
      exercise: number[]
      distance: number[]
    }
  }
  lastUpdated: string
}

interface MetricRecord {
  name: string
  date: string
  value: number
  units: string
  qty?: number
  avg?: number
  min?: number
  max?: number
  // sleep_analysis rows carry duration columns + a raw JSON stage breakdown
  asleep?: number
  in_bed?: number
  raw?: string
}

export default defineEventHandler(async (): Promise<HealthStats> => {
  const HEALTH_API = 'https://health-webhook.tools.ejfox.com'
  const config = useRuntimeConfig()
  const secret = (config.HEALTH_WEBHOOK_SECRET ||
    process.env.HEALTH_WEBHOOK_SECRET ||
    '') as string

  try {
    // Fetch metrics from health-webhook (auth required)
    const headers: Record<string, string> = {}
    if (secret) headers['x-webhook-secret'] = secret
    const response = await fetch(`${HEALTH_API}/api/metrics?days=30`, {
      headers,
    })
    if (!response.ok) {
      throw new Error(`Health API returned ${response.status}`)
    }

    const data = await response.json()
    const metrics: MetricRecord[] = data.metrics || []

    // The webhook returns `qty` (and `avg` for rate-style metrics). There is no
    // `value` field — reading it silently yielded 0 across every trend. One extractor.
    const val = (m: MetricRecord): number => m.value ?? m.qty ?? m.avg ?? 0
    // Steps/exercise/distance are additive: sum every same-name row on a UTC day,
    // not .find() a single hourly sample.
    const sumOnDay = (name: string, dateStr: string): number =>
      metrics
        .filter(
          (m: MetricRecord) => m.name === name && m.date.startsWith(dateStr)
        )
        .reduce((s: number, m: MetricRecord) => s + val(m), 0)

    // Helper to get latest value for a metric
    const getLatest = (name: string): number => {
      const found = metrics
        .filter((m: MetricRecord) => m.name === name)
        .sort(
          (a: MetricRecord, b: MetricRecord) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0]
      return found?.value || found?.qty || found?.avg || 0
    }

    // Helper to sum values for a metric within date range
    const sumMetric = (name: string, daysBack: number): number => {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - daysBack)
      return metrics
        .filter(
          (m: MetricRecord) => m.name === name && new Date(m.date) >= cutoff
        )
        .reduce(
          (sum: number, m: MetricRecord) => sum + (m.value || m.qty || 0),
          0
        )
    }

    // Average per DAY, not per sample-row. Sum within the window, divide by the
    // number of distinct days that actually have data — so "steps per day" reads
    // true (the old per-row mean reported ~225 for someone walking thousands).
    const avgMetric = (name: string, daysBack: number): number => {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - daysBack)
      const rows = metrics.filter(
        (m: MetricRecord) => m.name === name && new Date(m.date) >= cutoff
      )
      if (!rows.length) return 0
      const days = new Set(rows.map((m: MetricRecord) => m.date.slice(0, 10)))
      const total = rows.reduce((s: number, m: MetricRecord) => s + val(m), 0)
      return total / days.size
    }

    // Build trends (last 7 days for daily)
    const dailyDates: string[] = []
    const dailySteps: number[] = []
    const dailyExercise: number[] = []
    const dailyDistance: number[] = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      dailyDates.push(dateStr)

      dailySteps.push(sumOnDay('step_count', dateStr))
      dailyExercise.push(sumOnDay('apple_exercise_time', dateStr))
      dailyDistance.push(sumOnDay('walking_running_distance', dateStr))
    }

    // Build weekly trends (last 4 weeks)
    const weeklyDates: string[] = []
    const weeklySteps: number[] = []
    const weeklyExercise: number[] = []
    const weeklyDistance: number[] = []

    for (let w = 3; w >= 0; w--) {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - w * 7 - 6)
      const weekEnd = new Date()
      weekEnd.setDate(weekEnd.getDate() - w * 7)

      const weekLabel = `${weekStart.toISOString().split('T')[0]}`
      weeklyDates.push(weekLabel)

      const weekMetrics = metrics.filter((m: MetricRecord) => {
        const mDate = new Date(m.date)
        return mDate >= weekStart && mDate <= weekEnd
      })

      weeklySteps.push(
        weekMetrics
          .filter((m: MetricRecord) => m.name === 'step_count')
          .reduce((sum: number, m: MetricRecord) => sum + val(m), 0)
      )
      weeklyExercise.push(
        weekMetrics
          .filter((m: MetricRecord) => m.name === 'apple_exercise_time')
          .reduce((sum: number, m: MetricRecord) => sum + val(m), 0)
      )
      weeklyDistance.push(
        weekMetrics
          .filter((m: MetricRecord) => m.name === 'walking_running_distance')
          .reduce((sum: number, m: MetricRecord) => sum + val(m), 0)
      )
    }

    // Build monthly trends (limited by 30-day API window)
    const monthlyDates: string[] = []
    const monthlySteps: number[] = []
    const monthlyExercise: number[] = []
    const monthlyDistance: number[] = []

    const currentMonth = new Date()
    const monthLabel = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`
    monthlyDates.push(monthLabel)

    const monthMetrics = metrics.filter((m: MetricRecord) =>
      m.date.startsWith(monthLabel)
    )
    monthlySteps.push(
      monthMetrics
        .filter((m: MetricRecord) => m.name === 'step_count')
        .reduce((sum: number, m: MetricRecord) => sum + val(m), 0)
    )
    monthlyExercise.push(
      monthMetrics
        .filter((m: MetricRecord) => m.name === 'apple_exercise_time')
        .reduce((sum: number, m: MetricRecord) => sum + val(m), 0)
    )
    monthlyDistance.push(
      monthMetrics
        .filter((m: MetricRecord) => m.name === 'walking_running_distance')
        .reduce((sum: number, m: MetricRecord) => sum + val(m), 0)
    )

    // --- Sleep: latest night, stage breakdown from raw, 30-day avg, 7-night trend ---
    const sleepRows = metrics
      .filter((m: MetricRecord) => m.name === 'sleep_analysis')
      .sort(
        (a: MetricRecord, b: MetricRecord) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    const latestSleep = sleepRows[0]
    let latestStages: {
      core: number
      deep: number
      rem: number
      awake: number
    } | null = null
    try {
      if (latestSleep?.raw) {
        const r = JSON.parse(latestSleep.raw)
        latestStages = {
          core: r.core ?? 0,
          deep: r.deep ?? 0,
          rem: r.rem ?? 0,
          awake: r.awake ?? 0,
        }
      }
    } catch {
      latestStages = null
    }

    const sleepTrendDates: string[] = []
    const sleepTrendHours: number[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      sleepTrendDates.push(ds)
      const night = sleepRows.find((m: MetricRecord) => m.date.startsWith(ds))
      sleepTrendHours.push(night ? (night.asleep ?? night.qty ?? 0) : 0)
    }

    return {
      today: {
        steps: sumMetric('step_count', 1),
        standHours: sumMetric('apple_stand_hour', 1),
        exerciseMinutes: sumMetric('apple_exercise_time', 1),
        distance: sumMetric('walking_running_distance', 1),
        calories: sumMetric('active_energy', 1),
      },
      thisWeek: {
        steps: sumMetric('step_count', 7),
        exerciseMinutes: sumMetric('apple_exercise_time', 7),
        distance: sumMetric('walking_running_distance', 7),
        calories: sumMetric('active_energy', 7),
      },
      thisYear: {
        steps: sumMetric('step_count', 365),
        exerciseMinutes: sumMetric('apple_exercise_time', 365),
        distance: sumMetric('walking_running_distance', 365),
        calories: sumMetric('active_energy', 365),
        averageStepsPerDay: avgMetric('step_count', 365),
        averageExercisePerWeek: avgMetric('apple_exercise_time', 365) * 7,
      },
      averages: {
        dailySteps: avgMetric('step_count', 30),
        dailyStandHours: avgMetric('apple_stand_hour', 30),
        dailyExerciseMinutes: avgMetric('apple_exercise_time', 30),
        dailyDistance: avgMetric('walking_running_distance', 30),
        restingHeartRate: getLatest('resting_heart_rate'),
      },
      heartRate: {
        resting: getLatest('resting_heart_rate'),
        walking: getLatest('walking_heart_rate_average'),
        current: getLatest('heart_rate'),
        variability: getLatest('heart_rate_variability'),
      },
      activity: {
        monthlyDistance: sumMetric('walking_running_distance', 30),
        monthlyExerciseMinutes: sumMetric('apple_exercise_time', 30),
        monthlySteps: sumMetric('step_count', 30),
        flightsClimbed: sumMetric('flights_climbed', 30),
      },
      sensory: {
        bloodOxygenPct: getLatest('blood_oxygen_saturation'),
        respiratoryRate: getLatest('respiratory_rate'),
        daylightMinPerDay: avgMetric('time_in_daylight', 30),
        ambientDb: avgMetric('environmental_audio_exposure', 30),
        mindfulMin30d: sumMetric('mindful_minutes', 30),
      },
      sleep: {
        lastNight: latestSleep
          ? {
              date: latestSleep.date.slice(0, 10),
              asleepHours: latestSleep.asleep ?? latestSleep.qty ?? 0,
              inBedHours: latestSleep.in_bed ?? 0,
              efficiency:
                latestSleep.in_bed && latestSleep.asleep
                  ? latestSleep.asleep / latestSleep.in_bed
                  : null,
              stages: latestStages,
            }
          : null,
        avgHours30d: avgMetric('sleep_analysis', 30),
        trend: { dates: sleepTrendDates, hours: sleepTrendHours },
      },
      trends: {
        daily: {
          dates: dailyDates,
          steps: dailySteps,
          exercise: dailyExercise,
          distance: dailyDistance,
        },
        weekly: {
          dates: weeklyDates,
          steps: weeklySteps,
          exercise: weeklyExercise,
          distance: weeklyDistance,
        },
        monthly: {
          dates: monthlyDates,
          steps: monthlySteps,
          exercise: monthlyExercise,
          distance: monthlyDistance,
        },
      },
      lastUpdated: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Health API error:', error)
    throw error
  }
})
