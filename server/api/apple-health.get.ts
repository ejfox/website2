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
}

export default defineEventHandler(async (): Promise<HealthStats> => {
  const HEALTH_API = 'https://health-webhook.tools.ejfox.com'

  try {
    // Fetch metrics from health-webhook
    const response = await fetch(`${HEALTH_API}/api/metrics?days=30`)
    if (!response.ok) {
      throw new Error(`Health API returned ${response.status}`)
    }

    const data = await response.json()
    const metrics: MetricRecord[] = data.metrics || []

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

    // Helper to average values for a metric
    const avgMetric = (name: string, daysBack: number): number => {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - daysBack)
      const values = metrics
        .filter(
          (m: MetricRecord) => m.name === name && new Date(m.date) >= cutoff
        )
        .map((m: MetricRecord) => m.value || m.qty || m.avg || 0)
      return values.length
        ? values.reduce((a: number, b: number) => a + b, 0) / values.length
        : 0
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

      const dayMetrics = metrics.filter((m: MetricRecord) =>
        m.date.startsWith(dateStr)
      )
      dailySteps.push(
        dayMetrics.find((m: MetricRecord) => m.name === 'step_count')?.value ||
          0
      )
      dailyExercise.push(
        dayMetrics.find((m: MetricRecord) => m.name === 'apple_exercise_time')
          ?.value || 0
      )
      dailyDistance.push(
        dayMetrics.find(
          (m: MetricRecord) => m.name === 'walking_running_distance'
        )?.value || 0
      )
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
          .reduce((sum: number, m: MetricRecord) => sum + (m.value || 0), 0)
      )
      weeklyExercise.push(
        weekMetrics
          .filter((m: MetricRecord) => m.name === 'apple_exercise_time')
          .reduce((sum: number, m: MetricRecord) => sum + (m.value || 0), 0)
      )
      weeklyDistance.push(
        weekMetrics
          .filter((m: MetricRecord) => m.name === 'walking_running_distance')
          .reduce((sum: number, m: MetricRecord) => sum + (m.value || 0), 0)
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
        .reduce((sum: number, m: MetricRecord) => sum + (m.value || 0), 0)
    )
    monthlyExercise.push(
      monthMetrics
        .filter((m: MetricRecord) => m.name === 'apple_exercise_time')
        .reduce((sum: number, m: MetricRecord) => sum + (m.value || 0), 0)
    )
    monthlyDistance.push(
      monthMetrics
        .filter((m: MetricRecord) => m.name === 'walking_running_distance')
        .reduce((sum: number, m: MetricRecord) => sum + (m.value || 0), 0)
    )

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
