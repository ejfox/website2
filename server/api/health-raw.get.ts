import { defineEventHandler, createError } from 'h3'
import { createClient } from '@supabase/supabase-js'
import {
  format,
  subDays,
  startOfWeek,
  startOfYear,
  parseISO,
  isValid
} from 'date-fns'
import { group } from 'd3-array'

// Define types for health data
interface HealthDataRecord {
  id: string
  date: string
  metric_type: string
  data: {
    value: number
    [key: string]: any
  }
  [key: string]: any
}

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
  aggregatedMetrics: {
    availableMetricTypes: string[]
    sleepSummary?: {
      averageDuration: number
      averageQuality?: number
      totalRecords: number
      lastRecordDate: string
    }
    workoutSummary?: {
      totalWorkouts: number
      totalDuration: number
      totalDistance?: number
      totalCalories?: number
      lastWorkoutDate: string
      workoutTypes: string[]
    }
    mindfulnessSummary?: {
      totalSessions: number
      totalMinutes: number
      lastSessionDate: string
    }
  }
  lastUpdated: string
}

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_KEY || ''
)

// Helper functions for data normalization
const normalize = {
  distance: (meters: number) => Math.round((meters / 1000) * 100) / 100, // km with 2 decimals
  steps: (steps: number) => Math.round(steps), // whole numbers only
  minutes: (mins: number) => Math.round(mins),
  calories: (cal: number) => Math.round(cal)
}

// Get metrics for a specific date
const getMetricsForDate = (data: HealthDataRecord[], dateStr: string) => {
  const dayData = data.filter((d) => d.date.startsWith(dateStr))

  // Handle stand hours by counting distinct hours with value >= 1
  const hourlyStand = new Set()
  dayData
    .filter((d) => d.metric_type === 'apple_stand_hour' && d.data?.value >= 1)
    .forEach((d) => {
      const hour = new Date(d.date).getHours()
      hourlyStand.add(hour)
    })

  // Get step count (use the highest value for the day)
  const steps = dayData
    .filter((d) => d.metric_type === 'step_count')
    .reduce((max, curr) => Math.max(max, curr.data?.value || 0), 0)

  // Sum exercise minutes
  const exerciseMinutes = dayData
    .filter((d) => d.metric_type === 'apple_exercise_time')
    .reduce((sum, curr) => sum + (curr.data?.value || 0), 0)

  // Sum distance
  const distance = dayData
    .filter((d) => d.metric_type === 'walking_running_distance')
    .reduce((sum, curr) => sum + (curr.data?.value || 0), 0)

  // Sum active calories
  const calories = dayData
    .filter((d) => d.metric_type === 'active_energy')
    .reduce((sum, curr) => sum + (curr.data?.value || 0), 0)

  return {
    steps: normalize.steps(steps),
    standHours: hourlyStand.size,
    exerciseMinutes: normalize.minutes(exerciseMinutes),
    distance: normalize.distance(distance),
    calories: normalize.calories(calories)
  }
}

// Get latest value for a metric type
const getLatestValue = (
  data: HealthDataRecord[],
  metricType: string
): number => {
  const metrics = data.filter((d) => d.metric_type === metricType)
  if (!metrics.length) return 0

  // Sort by date descending and take the first (most recent)
  metrics.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  return metrics[0].data?.value || 0
}

// Get average value for a metric type
const getAverageValue = (
  data: HealthDataRecord[],
  metricType: string
): number => {
  const metrics = data.filter((d) => d.metric_type === metricType)
  if (!metrics.length) return 0

  const sum = metrics.reduce((acc, curr) => acc + (curr.data?.value || 0), 0)
  return sum / metrics.length
}

// Process sleep data in a simplified way
const processSleepData = (data: HealthDataRecord[]) => {
  const sleepData = data.filter(
    (d) =>
      d.metric_type === 'sleep_analysis' ||
      d.metric_type === 'apple_sleep' ||
      d.metric_type?.includes('sleep')
  )

  if (sleepData.length === 0) return null

  // Calculate average duration
  let totalDuration = 0
  let recordsWithDuration = 0

  sleepData.forEach((record) => {
    let duration = 0

    if (record.data?.duration) {
      duration = record.data.duration
      recordsWithDuration++
    } else if (record.data?.value) {
      // If units are in hours, convert to minutes
      if (record.data?.units === 'hr') {
        duration = record.data.value * 60
      } else {
        duration = record.data.value
      }
      recordsWithDuration++
    }

    totalDuration += duration
  })

  // Get most recent date
  const validDates = sleepData
    .map((record) => new Date(record.date))
    .filter((date) => date <= new Date() && date.getFullYear() > 2000)

  const lastRecordDate =
    validDates.length > 0
      ? new Date(Math.max(...validDates.map((d) => d.getTime()))).toISOString()
      : new Date().toISOString()

  return {
    averageDuration:
      recordsWithDuration > 0
        ? Math.round(totalDuration / recordsWithDuration)
        : 0,
    averageQuality: undefined, // Simplified, remove quality calculation for now
    totalRecords: sleepData.length,
    lastRecordDate: format(new Date(lastRecordDate), 'yyyy-MM-dd')
  }
}

export default defineEventHandler(async (event) => {
  try {
    const { data, error } = await supabase
      .from('health_daily_summary')
      .select('*')
      .order('day', { ascending: false })
    if (error) throw error
    return { days: data }
  } catch (error: any) {
    console.error('Health data fetch error:', error)
    throw createError({
      statusCode: 500,
      message: `Failed to fetch health data: ${error.message}`
    })
  }
})
