import { defineEventHandler, createError } from 'h3'
import { createClient } from '@supabase/supabase-js'
import {
  format,
  subDays,
  startOfWeek,
  startOfYear,
  isValid,
  parseISO
} from 'date-fns'
import { group } from 'd3-array'

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_KEY || ''
)

interface HealthResponse {
  today: {
    steps: number
    standHours: number
    exerciseMinutes: number
    distance: number // in km
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

// Add some helper functions for data cleaning
const normalizeDistance = (meters: number) =>
  Math.round((meters / 1000) * 100) / 100 // km with 2 decimals
const normalizeSteps = (steps: number) => Math.round(steps) // whole numbers only
const normalizeMinutes = (mins: number) => Math.round(mins)

const aggregateMetrics = (data: any[], date: string) => {
  // Group by hour to handle stand hours correctly
  const hourlyStand = data
    .filter(
      (d) => d.metric_type === 'apple_stand_hour' && d.date.startsWith(date)
    )
    .reduce((acc, curr) => {
      const hour = new Date(curr.date).getHours()
      acc[hour] = Math.max(acc[hour] || 0, curr.data?.value || 0)
      return acc
    }, {})

  // Sum stand hours (count distinct hours stood)
  const standHours = Object.values(hourlyStand).filter((v) => v >= 1).length

  // Get highest-confidence step count for the day
  const steps = data
    .filter((d) => d.metric_type === 'step_count' && d.date.startsWith(date))
    .reduce((max, curr) => {
      return curr.data?.value > max ? curr.data.value : max
    }, 0)

  // Sum exercise minutes (avoiding overlaps)
  const exerciseMinutes = data
    .filter(
      (d) => d.metric_type === 'apple_exercise_time' && d.date.startsWith(date)
    )
    .reduce((sum, curr) => {
      return sum + (curr.data?.value || 0)
    }, 0)

  // Use walking_running_distance for most accurate distance
  const distance = data
    .filter(
      (d) =>
        d.metric_type === 'walking_running_distance' && d.date.startsWith(date)
    )
    .reduce((sum, curr) => {
      return sum + (curr.data?.value || 0)
    }, 0)

  return {
    steps: Math.round(steps),
    standHours,
    exerciseMinutes: Math.round(exerciseMinutes),
    distance: Math.round(distance / 10) / 100, // Convert to km with 2 decimals
    calories: Math.round(
      data
        .filter(
          (d) => d.metric_type === 'active_energy' && d.date.startsWith(date)
        )
        .reduce((sum, curr) => sum + (curr.data?.value || 0), 0)
    )
  }
}

export default defineEventHandler(async (event) => {
  try {
    const today = new Date()
    const thirtyDaysAgo = subDays(today, 30)

    const { data: healthData, error } = await supabase
      .from('health_data')
      .select('*')
      .gte('date', thirtyDaysAgo.toISOString())
      .lte('date', today.toISOString())
      .in('metric_type', [
        'step_count',
        'apple_stand_hour',
        'apple_exercise_time',
        'walking_running_distance',
        'active_energy',
        'heart_rate',
        'resting_heart_rate',
        'walking_heart_rate_average',
        'heart_rate_variability',
        'flights_climbed'
      ])
      .order('date', { ascending: true })

    if (error) throw error

    // Filter out invalid dates and future dates
    const validHealthData = healthData.filter((d) => {
      const date = parseISO(d.date)
      return isValid(date) && date <= today
    })

    // Group by date using D3
    const dailyGroups = group(validHealthData, (d) => d.date.split('T')[0])
    const dailyData = Object.fromEntries(
      Array.from(dailyGroups, ([date, metrics]) => {
        const metricsObj: Record<string, number> = {}
        metrics.forEach((m) => {
          metricsObj[m.metric_type] = m.data?.value || 0
        })
        return [date, metricsObj]
      })
    )

    // Weekly aggregation using D3
    const weeklyGroups = group(validHealthData, (d) =>
      format(startOfWeek(new Date(d.date)), 'yyyy-MM-dd')
    )
    const weeklyData = Object.fromEntries(
      Array.from(weeklyGroups, ([weekStart, metrics]) => {
        const weekMetrics = {
          steps: 0,
          exercise: 0,
          distance: 0,
          calories: 0,
          standDays: new Set()
        }

        metrics.forEach((m) => {
          if (m.metric_type === 'step_count')
            weekMetrics.steps += m.data?.value || 0
          if (m.metric_type === 'apple_exercise_time')
            weekMetrics.exercise += m.data?.value || 0
          if (m.metric_type === 'walking_running_distance')
            weekMetrics.distance += m.data?.value || 0
          if (m.metric_type === 'active_energy')
            weekMetrics.calories += m.data?.value || 0
          if (m.metric_type === 'apple_stand_hour' && m.data?.value > 0) {
            weekMetrics.standDays.add(m.date.split('T')[0])
          }
        })

        return [
          weekStart,
          {
            ...weekMetrics,
            standDays: weekMetrics.standDays.size
          }
        ]
      })
    )

    // Calculate this week's totals
    const thisWeekKey = format(startOfWeek(today), 'yyyy-MM-dd')
    const thisWeek = weeklyData[thisWeekKey] || {
      steps: 0,
      exercise: 0,
      distance: 0,
      calories: 0
    }

    // Calculate this year's totals
    const yearTotals = Object.values(dailyData).reduce(
      (acc: any, day: any) => ({
        steps: acc.steps + (day.step_count || 0),
        exercise: acc.exercise + (day.apple_exercise_time || 0),
        distance: acc.distance + (day.walking_running_distance || 0) / 1000,
        calories: acc.calories + (day.active_energy || 0)
      }),
      { steps: 0, exercise: 0, distance: 0, calories: 0 }
    )

    const daysThisYear = Object.keys(dailyData).length
    const weeksThisYear = Object.keys(weeklyData).length

    // Helper to get latest value for a metric
    const getLatestMetric = (type: string) => {
      const metric = healthData.find((d) => d.metric_type === type)
      return metric?.data?.value || 0
    }

    // Helper to get average for a metric
    const getAverageMetric = (type: string) => {
      const metrics = healthData.filter((d) => d.metric_type === type)
      if (!metrics.length) return 0
      return (
        metrics.reduce((sum, m) => sum + (m.data?.value || 0), 0) /
        metrics.length
      )
    }

    // Calculate monthly totals
    const getMonthlyTotal = (type: string) => {
      return healthData
        .filter((d) => d.metric_type === type)
        .reduce((sum, m) => sum + (m.data?.value || 0), 0)
    }

    // Monthly aggregation using D3
    const monthlyGroups = group(validHealthData, (d) =>
      format(new Date(d.date), 'yyyy-MM')
    )
    const monthlyData = Object.fromEntries(
      Array.from(monthlyGroups, ([monthStart, metrics]) => {
        const monthMetrics = {
          steps: 0,
          exercise: 0,
          distance: 0,
          calories: 0,
          standDays: new Set()
        }

        metrics.forEach((m) => {
          if (m.metric_type === 'step_count')
            monthMetrics.steps += m.data?.value || 0
          if (m.metric_type === 'apple_exercise_time')
            monthMetrics.exercise += m.data?.value || 0
          if (m.metric_type === 'walking_running_distance')
            monthMetrics.distance += m.data?.value || 0
          if (m.metric_type === 'active_energy')
            monthMetrics.calories += m.data?.value || 0
          if (m.metric_type === 'apple_stand_hour' && m.data?.value > 0) {
            monthMetrics.standDays.add(m.date.split('T')[0])
          }
        })

        return [
          monthStart,
          {
            ...monthMetrics,
            standDays: monthMetrics.standDays.size
          }
        ]
      })
    )

    const response: HealthResponse = {
      today: aggregateMetrics(
        healthData.filter((d) =>
          d.date.startsWith(format(today, 'yyyy-MM-dd'))
        ),
        format(today, 'yyyy-MM-dd')
      ),
      thisWeek: {
        steps: normalizeSteps(thisWeek.steps),
        exerciseMinutes: normalizeMinutes(thisWeek.exercise),
        distance: normalizeDistance(thisWeek.distance),
        calories: Math.round(thisWeek.calories)
      },
      thisYear: {
        steps: normalizeSteps(yearTotals.steps),
        exerciseMinutes: normalizeMinutes(yearTotals.exercise),
        distance: normalizeDistance(yearTotals.distance),
        calories: Math.round(yearTotals.calories),
        averageStepsPerDay: normalizeSteps(yearTotals.steps / daysThisYear),
        averageExercisePerWeek: normalizeMinutes(
          yearTotals.exercise / weeksThisYear
        )
      },
      averages: {
        dailySteps: Math.round(getAverageMetric('step_count')),
        dailyStandHours: Math.round(getAverageMetric('apple_stand_hour')),
        dailyExerciseMinutes: Math.round(
          getAverageMetric('apple_exercise_time')
        ),
        dailyDistance:
          Math.round(getAverageMetric('walking_running_distance') / 100) / 10,
        restingHeartRate: Math.round(getAverageMetric('resting_heart_rate'))
      },
      heartRate: {
        resting: Math.round(getLatestMetric('resting_heart_rate')),
        walking: Math.round(getLatestMetric('walking_heart_rate_average')),
        current: Math.round(getLatestMetric('heart_rate')),
        variability: Math.round(getLatestMetric('heart_rate_variability'))
      },
      activity: {
        monthlyDistance:
          Math.round(getMonthlyTotal('walking_running_distance') / 100) / 10,
        monthlyExerciseMinutes: Math.round(
          getMonthlyTotal('apple_exercise_time')
        ),
        monthlySteps: getMonthlyTotal('step_count'),
        flightsClimbed: getMonthlyTotal('flights_climbed')
      },
      trends: {
        daily: {
          dates: Object.keys(dailyData).sort(),
          steps: Object.values(dailyData).map((d: any) =>
            normalizeSteps(d.step_count || 0)
          ),
          exercise: Object.values(dailyData).map((d: any) =>
            normalizeMinutes(d.apple_exercise_time || 0)
          ),
          distance: Object.values(dailyData).map((d: any) =>
            normalizeDistance(d.walking_running_distance || 0)
          )
        },
        weekly: {
          dates: Object.keys(weeklyData).sort(),
          steps: Object.values(weeklyData).map((w: any) =>
            normalizeSteps(w.steps)
          ),
          exercise: Object.values(weeklyData).map((w: any) =>
            normalizeMinutes(w.exercise)
          ),
          distance: Object.values(weeklyData).map((w: any) =>
            normalizeDistance(w.distance)
          )
        },
        monthly: {
          dates: Object.keys(monthlyData),
          steps: Object.values(monthlyData).map((m) => normalizeSteps(m.steps)),
          exercise: Object.values(monthlyData).map((m) =>
            normalizeMinutes(m.exercise)
          ),
          distance: Object.values(monthlyData).map((m) =>
            normalizeDistance(m.distance)
          )
        }
      },
      lastUpdated: new Date().toISOString()
    }

    return response
  } catch (error: any) {
    console.error('Health data fetch error:', error)
    throw createError({
      statusCode: 500,
      message: `Failed to fetch health data: ${error.message}`
    })
  }
})
