/**
 * MOBILE ACCESSIBILITY UTILITIES
 * 
 * Tools for validating thumb zone accessibility and mobile usability
 * Based on iOS Human Interface Guidelines and Material Design specs
 */

// Thumb zone mapping based on device ergonomics research
export const THUMB_ZONES = {
  // Easy reach zone (natural thumb position)
  easy: {
    minHeight: 0.6, // Bottom 40% of screen
    description: 'Primary navigation and actions should be here'
  },
  
  // Stretch zone (requires thumb extension)
  stretch: {
    minHeight: 0.3,
    maxHeight: 0.6,
    description: 'Secondary actions, acceptable for less frequent use'
  },
  
  // Hard reach zone (difficult to reach one-handed)
  hard: {
    maxHeight: 0.3, // Top 30% of screen  
    description: 'Avoid placing critical actions here'
  }
}

// Minimum touch target sizes (accessibility standards)
export const TOUCH_TARGETS = {
  ios: 44, // iOS minimum in points
  android: 48, // Android minimum in dp
  recommended: 48, // Generally recommended minimum
  comfortable: 56 // Comfortable target size
}

/**
 * Validate touch target sizes for accessibility
 */
export function validateTouchTargets(): Array<{element: Element, issue: string, size: {width: number, height: number}}> {
  const issues: Array<{element: Element, issue: string, size: {width: number, height: number}}> = []
  
  // Check all interactive elements
  const interactiveElements = document.querySelectorAll(
    'button, a, input[type="button"], input[type="submit"], [role="button"], .btn, .personality-button'
  )
  
  interactiveElements.forEach(el => {
    const rect = el.getBoundingClientRect()
    const size = { width: rect.width, height: rect.height }
    
    if (rect.width < TOUCH_TARGETS.recommended || rect.height < TOUCH_TARGETS.recommended) {
      issues.push({
        element: el,
        issue: `Touch target too small: ${Math.round(rect.width)}x${Math.round(rect.height)}px (minimum: ${TOUCH_TARGETS.recommended}px)`,
        size
      })
    }
  })
  
  return issues
}

/**
 * Analyze thumb zone placement of interactive elements
 */
export function analyzeThumbZones(): {
  easy: Element[],
  stretch: Element[], 
  hard: Element[],
  recommendations: string[]
} {
  const screenHeight = window.innerHeight
  const recommendations: string[] = []
  
  const zones = {
    easy: [] as Element[],
    stretch: [] as Element[],
    hard: [] as Element[]
  }
  
  const interactiveElements = document.querySelectorAll(
    'button, a, input[type="button"], input[type="submit"], [role="button"], .btn, .personality-button'
  )
  
  interactiveElements.forEach(el => {
    const rect = el.getBoundingClientRect()
    const elementCenter = rect.top + rect.height / 2
    const relativePosition = elementCenter / screenHeight
    
    if (relativePosition >= THUMB_ZONES.easy.minHeight) {
      zones.easy.push(el)
    } else if (relativePosition >= THUMB_ZONES.stretch.minHeight && relativePosition < THUMB_ZONES.stretch.maxHeight) {
      zones.stretch.push(el)
    } else {
      zones.hard.push(el)
    }
  })
  
  // Generate recommendations
  if (zones.hard.length > 0) {
    recommendations.push(`${zones.hard.length} critical interactive elements are in the hard-to-reach zone. Consider moving to bottom 60% of screen.`)
  }
  
  if (zones.easy.length === 0) {
    recommendations.push('No interactive elements in the easy thumb zone. Consider adding primary actions to the bottom area.')
  }
  
  return { ...zones, recommendations }
}

/**
 * Mobile accessibility audit - run this in dev mode
 */
export function auditMobileAccessibility() {
  if (!window.matchMedia('(max-width: 767px)').matches) {
    console.log('📱 Mobile accessibility audit should be run on mobile viewport')
    return
  }
  
  console.group('📱 Mobile Accessibility Audit')
  
  // Touch target validation
  const touchIssues = validateTouchTargets()
  if (touchIssues.length > 0) {
    console.warn(`🎯 Touch Target Issues (${touchIssues.length}):`)
    touchIssues.forEach(issue => {
      console.warn(`- ${issue.issue}`, issue.element)
    })
  } else {
    console.log('✅ All touch targets meet minimum size requirements')
  }
  
  // Thumb zone analysis
  const thumbAnalysis = analyzeThumbZones()
  console.log('👍 Thumb Zone Distribution:')
  console.log(`- Easy reach: ${thumbAnalysis.easy.length} elements`)
  console.log(`- Stretch zone: ${thumbAnalysis.stretch.length} elements`) 
  console.log(`- Hard reach: ${thumbAnalysis.hard.length} elements`)
  
  if (thumbAnalysis.recommendations.length > 0) {
    console.warn('💡 Recommendations:')
    thumbAnalysis.recommendations.forEach(rec => console.warn(`- ${rec}`))
  }
  
  // Overall score
  const score = calculateMobileUXScore(touchIssues, thumbAnalysis)
  console.log(`📊 Mobile UX Score: ${score}/10`)
  
  console.groupEnd()
  
  return {
    touchIssues,
    thumbAnalysis,
    score
  }
}

/**
 * Calculate overall mobile UX score (1-10)
 */
function calculateMobileUXScore(
  touchIssues: ReturnType<typeof validateTouchTargets>,
  thumbAnalysis: ReturnType<typeof analyzeThumbZones>
): number {
  let score = 10
  
  // Deduct points for touch target issues
  score -= Math.min(touchIssues.length * 0.5, 3)
  
  // Deduct points for poor thumb zone distribution
  const totalElements = thumbAnalysis.easy.length + thumbAnalysis.stretch.length + thumbAnalysis.hard.length
  
  if (totalElements > 0) {
    const hardReachRatio = thumbAnalysis.hard.length / totalElements
    score -= hardReachRatio * 3 // Up to 3 points off for elements in hard reach
    
    const easyReachRatio = thumbAnalysis.easy.length / totalElements
    if (easyReachRatio < 0.3) { // Less than 30% in easy reach
      score -= 2
    }
  }
  
  return Math.max(Math.round(score * 10) / 10, 1) // Round to 1 decimal, minimum 1
}