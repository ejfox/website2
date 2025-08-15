#!/usr/bin/env node

// Ghost Chen's Security-Performance Audit Script
// "Operational monitoring" that happens to catch security issues

const fs = require('fs')
const path = require('path')

// Third-party domains that should be audited
const AUDIT_PATTERNS = {
  // Analytics and tracking
  analytics: /google-analytics|gtag|ga-|googletagmanager|facebook\.com|twitter\.com|doubleclick/i,
  
  // CDNs and external resources
  cdn: /fonts\.googleapis\.com|fonts\.gstatic\.com|res\.cloudinary\.com|cdnjs|jsdelivr/i,
  
  // Payment and forms
  payments: /stripe|paypal|checkout/i,
  
  // Social and widgets
  social: /instagram|facebook|twitter|linkedin|youtube/i,
  
  // Ads and monetization
  ads: /adsense|googlesyndication|amazon-adsystem/i
}

// Security risk levels
const RISK_LEVELS = {
  HIGH: ['googlesyndication', 'doubleclick', 'facebook.com', 'amazon-adsystem'],
  MEDIUM: ['google-analytics', 'googletagmanager', 'twitter.com'],
  LOW: ['fonts.googleapis.com', 'fonts.gstatic.com', 'res.cloudinary.com']
}

function findThirdPartyReferences(dir, results = []) {
  const files = fs.readdirSync(dir, { withFileTypes: true })
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name)
    
    if (file.isDirectory()) {
      // Skip common directories we don't need to audit
      if (['node_modules', '.git', '.nuxt', 'dist', '.output'].includes(file.name)) {
        continue
      }
      findThirdPartyReferences(fullPath, results)
    } else if (file.isFile()) {
      // Only check relevant file types
      if (!/\.(js|ts|vue|html|css|json)$/.test(file.name)) {
        continue
      }
      
      try {
        const content = fs.readFileSync(fullPath, 'utf8')
        const lines = content.split('\n')
        
        lines.forEach((line, index) => {
          // Check for URLs, domains, and script references
          const urlMatches = line.match(/https?:\/\/[^\s'"<>]+/g) || []
          
          urlMatches.forEach(url => {
            // Skip template literals and invalid URLs
            if (url.includes('${') || url.includes('`') || url.includes('undefined')) {
              return
            }
            
            try {
              // Validate URL before processing
              new URL(url)
              
              let riskLevel = 'UNKNOWN'
              let category = 'other'
              
              // Determine risk level
              for (const level of Object.keys(RISK_LEVELS)) {
                if (RISK_LEVELS[level].some(domain => url.includes(domain))) {
                  riskLevel = level
                  break
                }
              }
              
              // Determine category
              for (const [cat, pattern] of Object.entries(AUDIT_PATTERNS)) {
                if (pattern.test(url)) {
                  category = cat
                  break
                }
              }
              
              results.push({
                file: path.relative(process.cwd(), fullPath),
                line: index + 1,
                url,
                category,
                riskLevel,
                context: line.trim()
              })
            } catch {
              // Skip invalid URLs
              return
            }
          })
        })
      } catch (error) {
        console.warn(`Could not read file: ${fullPath}`)
      }
    }
  }
  
  return results
}

function generateSecurityReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalReferences: results.length,
      uniqueDomains: new Set(results.map(r => new URL(r.url).hostname)).size,
      byRiskLevel: {},
      byCategory: {}
    },
    findings: results,
    recommendations: []
  }
  
  // Calculate risk distribution
  for (const level of ['HIGH', 'MEDIUM', 'LOW', 'UNKNOWN']) {
    report.summary.byRiskLevel[level] = results.filter(r => r.riskLevel === level).length
  }
  
  // Calculate category distribution
  for (const category of Object.keys(AUDIT_PATTERNS)) {
    report.summary.byCategory[category] = results.filter(r => r.category === category).length
  }
  
  // Generate recommendations
  if (report.summary.byRiskLevel.HIGH > 0) {
    report.recommendations.push('⚠️ HIGH RISK: Remove or replace high-risk third-party domains')
  }
  
  if (report.summary.uniqueDomains > 5) {
    report.recommendations.push('📊 PERFORMANCE: Consider reducing third-party domains for better performance')
  }
  
  const adReferences = results.filter(r => r.category === 'ads')
  if (adReferences.length > 0) {
    report.recommendations.push('🛡️ PRIVACY: Ad networks detected - ensure compliance with privacy policies')
  }
  
  const analyticsReferences = results.filter(r => r.category === 'analytics')
  if (analyticsReferences.length > 2) {
    report.recommendations.push('🎯 OPTIMIZATION: Multiple analytics tools detected - consolidate for better performance')
  }
  
  return report
}

function printReport(report) {
  console.log('\n🔍 SECURITY-PERFORMANCE AUDIT REPORT')
  console.log('=====================================')
  
  console.log('\n📊 SUMMARY:')
  console.log(`Total third-party references: ${report.summary.totalReferences}`)
  console.log(`Unique domains: ${report.summary.uniqueDomains}`)
  
  console.log('\n🚨 RISK LEVELS:')
  for (const [level, count] of Object.entries(report.summary.byRiskLevel)) {
    if (count > 0) {
      const icon = level === 'HIGH' ? '🔴' : level === 'MEDIUM' ? '🟡' : level === 'LOW' ? '🟢' : '⚪'
      console.log(`${icon} ${level}: ${count}`)
    }
  }
  
  console.log('\n📂 CATEGORIES:')
  for (const [category, count] of Object.entries(report.summary.byCategory)) {
    if (count > 0) {
      console.log(`  ${category}: ${count}`)
    }
  }
  
  if (report.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:')
    report.recommendations.forEach(rec => console.log(`  ${rec}`))
  }
  
  // Show high-risk findings
  const highRisk = report.findings.filter(f => f.riskLevel === 'HIGH')
  if (highRisk.length > 0) {
    console.log('\n🚨 HIGH RISK FINDINGS:')
    highRisk.forEach(finding => {
      console.log(`  📄 ${finding.file}:${finding.line}`)
      console.log(`  🔗 ${finding.url}`)
      console.log(`  💭 ${finding.context}`)
      console.log('')
    })
  }
  
  // Show unique domains summary
  const domains = [...new Set(report.findings.map(f => new URL(f.url).hostname))]
  if (domains.length > 0) {
    console.log('\n🌐 THIRD-PARTY DOMAINS:')
    domains.sort().forEach(domain => {
      const domainFindings = report.findings.filter(f => new URL(f.url).hostname === domain)
      const riskLevel = domainFindings[0]?.riskLevel || 'UNKNOWN'
      const icon = riskLevel === 'HIGH' ? '🔴' : riskLevel === 'MEDIUM' ? '🟡' : riskLevel === 'LOW' ? '🟢' : '⚪'
      console.log(`  ${icon} ${domain} (${domainFindings.length} references)`)
    })
  }
}

// Main execution
console.log('🔍 Starting security-performance audit...')

const results = findThirdPartyReferences(process.cwd())
const report = generateSecurityReport(results)

printReport(report)

// Save detailed report
const reportPath = path.join(process.cwd(), 'security-performance-audit.json')
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
console.log(`\n📁 Detailed report saved to: ${reportPath}`)

// Exit with appropriate code
const hasHighRisk = report.summary.byRiskLevel.HIGH > 0
process.exit(hasHighRisk ? 1 : 0)