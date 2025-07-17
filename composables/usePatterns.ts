// import { scaleLinear } from 'd3-scale' // Unused
import {
  mean,
  quantile,
  deviation,
  // extent,
  // ascending, // Unused
  sum,
  min,
  max
} from 'd3-array'
// import { range } from 'd3-array' // Unused

export const usePatterns = () => {
  const { stats } = useStats()

  interface Pattern {
    id: string
    title: string
    description: string
    score: number // How interesting is this pattern (0-1)
    confidence: number // How statistically significant (0-1)
    lastSeen: Date // Most recent occurrence
    frequency: number // Times observed per week
    type:
      | 'correlation'
      | 'rhythm'
      | 'streak'
      | 'milestone'
      | 'anomaly'
      | 'trend'
    viz: 'line' | 'scatter' | 'calendar' | 'heatmap'
    data: any
    metadata?: {
      sampleSize?: number
      pValue?: number
      threshold?: number
      relatedPatterns?: string[]
      dataStreams: string[] // Which data streams are involved
    }
  }

  // Define all available data streams
  interface DataStream {
    id: string
    path: string[] // Path to data in stats object
    type: 'numeric' | 'temporal' | 'categorical'
    resolution: 'hourly' | 'daily' | 'weekly'
    transform?: (data: any) => number[] // Optional transformation function
  }

  const dataStreams: DataStream[] = [
    {
      id: 'typing-wpm',
      path: ['typing', 'historicalWPM'],
      type: 'numeric',
      resolution: 'daily'
    },
    {
      id: 'music-minutes',
      path: ['music', 'dailyMinutes'],
      type: 'numeric',
      resolution: 'daily'
    },
    {
      id: 'sleep-score',
      path: ['health', 'sleepHistory'],
      type: 'numeric',
      resolution: 'daily'
    },
    {
      id: 'activity-level',
      path: ['health', 'activityHeatmap'],
      type: 'numeric',
      resolution: 'hourly'
    },
    {
      id: 'chess-rating',
      path: ['chess', 'ratingHistory'],
      type: 'numeric',
      resolution: 'daily'
    },
    {
      id: 'code-commits',
      path: ['code', 'contributions'],
      type: 'numeric',
      resolution: 'daily'
    },
    {
      id: 'productivity',
      path: ['productivity', 'trends', 'daily'],
      type: 'numeric',
      resolution: 'daily'
    },
    {
      id: 'weather-temp',
      path: ['weather', 'history'],
      type: 'numeric',
      resolution: 'daily',
      transform: (data) => data.map((d: any) => d.temp)
    }
    // Add more data streams as needed
  ]

  // Get data from a stream
  const getStreamData = (stream: DataStream): number[] => {
    let data: any = stats
    for (const key of stream.path) {
      data = data?.[key]
    }
    if (stream.transform) {
      data = stream.transform(data)
    }
    return Array.isArray(data) ? data : []
  }

  // Find patterns across all data streams
  const findPatterns = computed(() => {
    const patterns: Pattern[] = []
    const _now = new Date()

    // Compare each data stream with every other stream
    for (let i = 0; i < dataStreams.length; i++) {
      for (let j = i + 1; j < dataStreams.length; j++) {
        const stream1 = dataStreams[i]
        const stream2 = dataStreams[j]

        // Skip if resolutions don't match
        if (stream1.resolution !== stream2.resolution) continue

        const data1 = getStreamData(stream1)
        const data2 = getStreamData(stream2)

        if (!data1.length || !data2.length) continue

        // Look for different types of patterns
        const patterns1 = analyzeStream(data1, stream1)
        const patterns2 = analyzeStream(data2, stream2)
        const sharedPatterns = findSharedPatterns(
          data1,
          data2,
          stream1,
          stream2
        )

        patterns.push(...patterns1, ...patterns2, ...sharedPatterns)
      }
    }

    return patterns
      .filter((p) => p.confidence > 0.7) // Only keep high-confidence patterns
      .sort((a, b) => b.score - a.score)
      .slice(0, 3) // Keep top 3 most interesting patterns
  })

  // Analyze a single data stream for patterns
  const analyzeStream = (data: number[], stream: DataStream): Pattern[] => {
    const patterns: Pattern[] = []
    const stats = calculateStreamStats(data)

    // Look for anomalies
    const anomalies = findAnomalies(data, stats)
    if (anomalies.length) {
      patterns.push(createPattern('anomaly', stream, { anomalies, stats }))
    }

    // Look for trends
    const trend = findTrend(data)
    if (trend.significance > 0.7) {
      patterns.push(createPattern('trend', stream, { trend }))
    }

    // Look for cycles
    const cycles = findCycles(data)
    if (cycles.length) {
      patterns.push(createPattern('rhythm', stream, { cycles }))
    }

    return patterns
  }

  // Find patterns between two streams
  const findSharedPatterns = (
    data1: number[],
    data2: number[],
    stream1: DataStream,
    stream2: DataStream
  ): Pattern[] => {
    const patterns: Pattern[] = []

    // Correlation analysis
    const { correlation, pValue } = calculateCorrelation(data1, data2)
    if (Math.abs(correlation) > 0.6 && pValue < 0.05) {
      patterns.push(
        createCorrelationPattern(stream1, stream2, correlation, pValue)
      )
    }

    // Phase relationship
    const phaseShift = findPhaseShift(data1, data2)
    if (phaseShift.significance > 0.7) {
      patterns.push(createPhasePattern(stream1, stream2, phaseShift))
    }

    return patterns
  }

  // Helper functions for pattern creation and analysis
  const calculateStreamStats = (data: number[]) => ({
    mean: mean(data) || 0,
    std: deviation(data) || 0,
    quantiles: [0.25, 0.5, 0.75].map((q) => quantile(data, q) || 0)
  })

  const findAnomalies = (data: number[], stats: any) => {
    return data
      .map((v, i) => ({ value: v, index: i }))
      .filter(({ value }) => Math.abs(value - stats.mean) > 2 * stats.std)
  }

  const findTrend = (data: number[]) => {
    // Simple linear trend analysis
    const x = Array.from({ length: data.length }, (_, i) => i)
    const slope = calculateSlope(x, data)
    return {
      slope,
      significance: Math.abs(slope) / (deviation(data) || 1)
    }
  }

  const findCycles = (_data: number[]) => {
    // Implement cycle detection (e.g., FFT or autocorrelation)
    return []
  }

  const findPhaseShift = (_data1: number[], _data2: number[]) => {
    // Implement phase shift detection
    return { shift: 0, significance: 0 }
  }

  // Create pattern objects
  const createPattern = (
    type: Pattern['type'],
    stream: DataStream,
    data: any
  ): Pattern => {
    const _now = new Date()
    const id = `${type}-${stream.id}-${_now.getTime()}`

    return {
      id,
      title: generateTitle(type, stream, data),
      description: generateDescription(type, stream, data),
      score: calculatePatternScore(type, data),
      confidence: calculateConfidence(type, data),
      lastSeen: _now,
      frequency: calculateFrequency(data),
      type,
      viz: determineVisualization(type, data),
      data,
      metadata: {
        sampleSize: data.values?.length || 0,
        threshold: data.stats?.threshold,
        dataStreams: [stream.id]
      }
    }
  }

  const createCorrelationPattern = (
    stream1: DataStream,
    stream2: DataStream,
    correlation: number,
    pValue: number
  ): Pattern => {
    const _now = new Date()
    return {
      id: `correlation-${stream1.id}-${stream2.id}-${now.getTime()}`,
      title: `${stream1.id} × ${stream2.id} Correlation`,
      description: generateCorrelationDescription(
        correlation,
        stream1.id,
        stream2.id
      ),
      score: Math.abs(correlation),
      confidence: 1 - pValue,
      lastSeen: _now,
      frequency: 1, // Updated by pattern history
      type: 'correlation',
      viz: 'scatter',
      data: { correlation, pValue },
      metadata: {
        dataStreams: [stream1.id, stream2.id]
      }
    }
  }

  const createPhasePattern = (
    stream1: DataStream,
    stream2: DataStream,
    phaseShift: { shift: number; significance: number }
  ): Pattern => {
    const _now = new Date()
    return {
      id: `phase-${stream1.id}-${stream2.id}-${now.getTime()}`,
      title: `${stream1.id} Leads ${stream2.id}`,
      description: `${stream1.id} changes typically precede ${stream2.id} by ${phaseShift.shift} periods`,
      score: phaseShift.significance,
      confidence: phaseShift.significance,
      lastSeen: _now,
      frequency: 1,
      type: 'rhythm',
      viz: 'line',
      data: phaseShift,
      metadata: {
        dataStreams: [stream1.id, stream2.id]
      }
    }
  }

  // Statistical analysis functions
  const calculateCorrelation = (
    series1: number[],
    series2: number[]
  ): { correlation: number; pValue: number } => {
    if (series1.length !== series2.length || series1.length < 2) {
      return { correlation: 0, pValue: 1 }
    }

    // Calculate Pearson correlation coefficient
    const mean1 = mean(series1) || 0
    const mean2 = mean(series2) || 0
    const std1 = deviation(series1) || 1
    const std2 = deviation(series2) || 1

    const n = series1.length
    let sum = 0
    for (let i = 0; i < n; i++) {
      sum += ((series1[i] - mean1) / std1) * ((series2[i] - mean2) / std2)
    }
    const correlation = sum / (n - 1)

    // Calculate p-value using t-distribution approximation
    const t = correlation * Math.sqrt((n - 2) / (1 - correlation * correlation))
    const pValue = 2 * (1 - studentT(Math.abs(t), n - 2))

    return { correlation, pValue }
  }

  // Student's t-distribution (simplified approximation)
  const studentT = (t: number, df: number): number => {
    const x = df / (df + t * t)
    return 1 - 0.5 * Math.pow(x, df / 2)
  }

  // Find peaks using simple algorithm
  const findSignificantPeaks = (
    data: number[]
  ): { peaks: number[]; valleys: number[]; confidence: number } => {
    const peaks: number[] = []
    const valleys: number[] = []
    const windowSize = Math.max(3, Math.floor(data.length / 20))

    for (let i = windowSize; i < data.length - windowSize; i++) {
      const window = data.slice(i - windowSize, i + windowSize + 1)
      const localMax = max(window) || 0
      const localMin = min(window) || 0

      if (data[i] === localMax) {
        peaks.push(i)
      } else if (data[i] === localMin) {
        valleys.push(i)
      }
    }

    // Calculate confidence based on peak prominence
    const prominence = calculatePeakProminence(data, peaks)
    const confidence = Math.min(1, prominence / (max(data) || 1))

    return { peaks, valleys, confidence }
  }

  const calculatePeakProminence = (data: number[], peaks: number[]): number => {
    if (!peaks.length) return 0

    return (
      peaks.reduce((sum, peak) => {
        const peakValue = data[peak]
        const leftMin =
          min(data.slice(Math.max(0, peak - 5), peak)) || peakValue
        const rightMin = min(data.slice(peak + 1, peak + 6)) || peakValue
        return sum + (peakValue - Math.max(leftMin, rightMin))
      }, 0) / peaks.length
    )
  }

  const calculateSlope = (x: number[], y: number[]): number => {
    const n = x.length
    const sumX = sum(x)
    const sumY = sum(y)
    const sumXY = sum(x.map((xi, i) => xi * y[i]))
    const sumXX = sum(x.map((xi) => xi * xi))

    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  }

  // Pattern scoring and description
  const calculatePatternScore = (type: Pattern['type'], data: any): number => {
    switch (type) {
      case 'correlation':
        return Math.abs(data.correlation)
      case 'rhythm':
        return data.cycles ? data.cycles.length / 10 : 0
      case 'streak':
        return data.duration / 30 // Normalize to 0-1 for month-long streaks
      case 'anomaly':
        return data.anomalies.length / data.values.length
      default:
        return 0.5
    }
  }

  const calculateConfidence = (type: Pattern['type'], data: any): number => {
    switch (type) {
      case 'correlation':
        return 1 - (data.pValue || 0)
      case 'rhythm':
        return data.significance || 0
      case 'streak':
        return data.consistency || 0
      case 'anomaly':
        return data.significance || 0
      default:
        return 0.5
    }
  }

  const determineVisualization = (
    type: Pattern['type'],
    data: any
  ): Pattern['viz'] => {
    switch (type) {
      case 'correlation':
        return 'scatter'
      case 'rhythm':
        return 'line'
      case 'streak':
        return 'calendar'
      case 'anomaly':
        return 'line'
      default:
        return 'line'
    }
  }

  const generateTitle = (
    type: Pattern['type'],
    stream: DataStream,
    data: any
  ): string => {
    switch (type) {
      case 'anomaly':
        return `Unusual ${stream.id} Pattern`
      case 'trend':
        return `${stream.id} Trend`
      case 'rhythm':
        return `${stream.id} Cycle`
      default:
        return `${stream.id} Pattern`
    }
  }

  const generateDescription = (
    type: Pattern['type'],
    stream: DataStream,
    data: any
  ): string => {
    switch (type) {
      case 'anomaly':
        return `Found ${data.anomalies.length} unusual values`
      case 'trend':
        return `${data.slope > 0 ? 'Increasing' : 'Decreasing'} trend detected`
      case 'rhythm':
        return `Regular pattern every ${data.cycles?.[0]?.period || 'N'} days`
      default:
        return 'Interesting pattern detected'
    }
  }

  const calculateFrequency = (data: any): number => {
    // Stub implementation
    return Math.random() * 7 // Random frequency between 0-7 times per week
  }

  const generateCorrelationDescription = (
    correlation: number,
    series1: string,
    series2: string
  ): string => {
    const strength = Math.abs(correlation) > 0.8 ? 'strong' : 'moderate'
    const direction = correlation > 0 ? 'increases' : 'decreases'
    return `As ${series1} ${direction}, ${series2} tends to follow - ${strength} correlation`
  }

  return {
    findPatterns,
    dataStreams // Expose for debugging
  }
}
