// Ghost Chen's Performance Monitor - "Enhanced logging" for third-party bottlenecks
// Because what you can't measure, attackers will exploit

interface ResourceTiming {
  name: string
  duration: number
  blocked: number
  dns: number
  connect: number
  request: number
  response: number
  size: number
  type: string
  isThirdParty: boolean
}

interface PerformanceMetrics {
  fcp: number
  lcp: number
  cls: number
  fid: number
  ttfb: number
  resources: ResourceTiming[]
  thirdPartyImpact: {
    totalDuration: number
    blockedTime: number
    transferSize: number
    count: number
  }
}

// Security-focused domain classification
const TRUSTED_DOMAINS = new Set([
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'umami.tools.ejfox.com',
  'res.cloudinary.com'
])

const SECURITY_RISK_DOMAINS = new Set([
  // Common tracking/analytics that might be problematic
  'google-analytics.com',
  'googletagmanager.com',
  'facebook.com',
  'twitter.com',
  'doubleclick.net',
  'googlesyndication.com'
])

function isThirdParty(url: string): boolean {
  try {
    const domain = new URL(url).hostname
    return !domain.includes(window.location.hostname)
  } catch {
    return false
  }
}

function getDomainRiskLevel(url: string): 'trusted' | 'risky' | 'unknown' {
  try {
    const domain = new URL(url).hostname
    if (TRUSTED_DOMAINS.has(domain)) return 'trusted'
    if (SECURITY_RISK_DOMAINS.has(domain)) return 'risky'
    return 'unknown'
  } catch {
    return 'unknown'
  }
}

function analyzeResourceTiming(): ResourceTiming[] {
  if (!window.performance?.getEntriesByType) return []
  
  const resources = window.performance.getEntriesByType('resource') as PerformanceResourceTiming[]
  
  return resources.map(resource => {
    const isTP = isThirdParty(resource.name)
    
    return {
      name: resource.name,
      duration: resource.duration,
      blocked: resource.domainLookupStart - resource.fetchStart,
      dns: resource.domainLookupEnd - resource.domainLookupStart,
      connect: resource.connectEnd - resource.connectStart,
      request: resource.responseStart - resource.requestStart,
      response: resource.responseEnd - resource.responseStart,
      size: resource.transferSize || 0,
      type: resource.initiatorType,
      isThirdParty: isTP
    }
  })
}

function getWebVitals(): Promise<Partial<PerformanceMetrics>> {
  return new Promise(resolve => {
    const metrics: Partial<PerformanceMetrics> = {}
    
    // TTFB
    if (window.performance?.timing) {
      const timing = window.performance.timing
      metrics.ttfb = timing.responseStart - timing.navigationStart
    }
    
    // FCP
    if (window.performance?.getEntriesByType) {
      const fcpEntry = window.performance
        .getEntriesByType('paint')
        .find(entry => entry.name === 'first-contentful-paint')
      if (fcpEntry) {
        metrics.fcp = fcpEntry.startTime
      }
    }
    
    // Use PerformanceObserver for LCP, CLS, FID if available
    if (window.PerformanceObserver) {
      let resolveCount = 0
      const resolveIfComplete = () => {
        resolveCount++
        if (resolveCount >= 3) {
          resolve(metrics)
        }
      }
      
      // LCP
      try {
        const lcpObserver = new PerformanceObserver(list => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as any
          if (lastEntry) {
            metrics.lcp = lastEntry.startTime
          }
          resolveIfComplete()
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      } catch {
        resolveIfComplete()
      }
      
      // CLS
      try {
        let clsValue = 0
        const clsObserver = new PerformanceObserver(list => {
          for (const entry of list.getEntries() as any[]) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
            }
          }
          metrics.cls = clsValue
          resolveIfComplete()
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
      } catch {
        resolveIfComplete()
      }
      
      // FID
      try {
        const fidObserver = new PerformanceObserver(list => {
          const entries = list.getEntries()
          const firstEntry = entries[0] as any
          if (firstEntry) {
            metrics.fid = firstEntry.processingStart - firstEntry.startTime
          }
          resolveIfComplete()
        })
        fidObserver.observe({ entryTypes: ['first-input'] })
      } catch {
        resolveIfComplete()
      }
      
      setTimeout(() => resolve(metrics), 5000) // Timeout after 5s
    } else {
      resolve(metrics)
    }
  })
}

export async function getPerformanceReport(): Promise<PerformanceMetrics> {
  const resources = analyzeResourceTiming()
  const webVitals = await getWebVitals()
  
  // Calculate third-party impact
  const thirdPartyResources = resources.filter(r => r.isThirdParty)
  const thirdPartyImpact = {
    totalDuration: thirdPartyResources.reduce((sum, r) => sum + r.duration, 0),
    blockedTime: thirdPartyResources.reduce((sum, r) => sum + r.blocked, 0),
    transferSize: thirdPartyResources.reduce((sum, r) => sum + r.size, 0),
    count: thirdPartyResources.length
  }
  
  return {
    fcp: webVitals.fcp || 0,
    lcp: webVitals.lcp || 0,
    cls: webVitals.cls || 0,
    fid: webVitals.fid || 0,
    ttfb: webVitals.ttfb || 0,
    resources,
    thirdPartyImpact
  }
}

// Security audit for third-party resources
export function auditThirdPartyResources(): {
  trusted: string[]
  risky: string[]
  unknown: string[]
  recommendations: string[]
} {
  const resources = analyzeResourceTiming()
  const thirdPartyResources = resources.filter(r => r.isThirdParty)
  
  const trusted: string[] = []
  const risky: string[] = []
  const unknown: string[] = []
  const recommendations: string[] = []
  
  thirdPartyResources.forEach(resource => {
    const risk = getDomainRiskLevel(resource.name)
    const domain = new URL(resource.name).hostname
    
    switch (risk) {
      case 'trusted':
        trusted.push(domain)
        break
      case 'risky':
        risky.push(domain)
        recommendations.push(`Consider removing or replacing ${domain}`)
        break
      case 'unknown':
        unknown.push(domain)
        recommendations.push(`Audit ${domain} for necessity and security`)
        break
    }
  })
  
  // Performance recommendations
  const slowResources = resources
    .filter(r => r.duration > 1000)
    .map(r => new URL(r.name).hostname)
  
  slowResources.forEach(domain => {
    recommendations.push(`${domain} is loading slowly (>1s) - consider optimization`)
  })
  
  return {
    trusted: [...new Set(trusted)],
    risky: [...new Set(risky)],
    unknown: [...new Set(unknown)],
    recommendations: [...new Set(recommendations)]
  }
}

// Real-time monitoring for development
export function startPerformanceMonitoring(onReport?: (report: PerformanceMetrics) => void) {
  if (typeof window === 'undefined' || !window.performance) return
  
  let reportSent = false
  
  const generateReport = async () => {
    if (reportSent) return
    
    try {
      const report = await getPerformanceReport()
      reportSent = true
      
      if (onReport) {
        onReport(report)
      } else {
        console.group('🔍 Performance Report')
        console.log('Web Vitals:', {
          FCP: `${report.fcp.toFixed(0)}ms`,
          LCP: `${report.lcp.toFixed(0)}ms`,
          CLS: report.cls.toFixed(3),
          FID: `${report.fid.toFixed(0)}ms`,
          TTFB: `${report.ttfb.toFixed(0)}ms`
        })
        console.log('Third-party Impact:', {
          Duration: `${report.thirdPartyImpact.totalDuration.toFixed(0)}ms`,
          Resources: report.thirdPartyImpact.count,
          Size: `${(report.thirdPartyImpact.transferSize / 1024).toFixed(1)}KB`
        })
        
        const audit = auditThirdPartyResources()
        if (audit.risky.length > 0) {
          console.warn('⚠️ Risky third-party domains:', audit.risky)
        }
        if (audit.recommendations.length > 0) {
          console.info('💡 Recommendations:', audit.recommendations)
        }
        console.groupEnd()
      }
    } catch (error) {
      console.debug('Performance monitoring error:', error)
    }
  }
  
  // Generate report when page load is complete
  if (document.readyState === 'complete') {
    setTimeout(generateReport, 2000)
  } else {
    window.addEventListener('load', () => {
      setTimeout(generateReport, 2000)
    })
  }
}

// Development helper - only runs in dev mode with debug flag
if (process.env.NODE_ENV === 'development' && process.env.DEBUG) {
  startPerformanceMonitoring()
}