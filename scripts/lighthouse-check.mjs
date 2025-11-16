#!/usr/bin/env node

import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import chalk from 'chalk'

const execAsync = promisify(exec)

async function quickLighthouseCheck(url = 'http://localhost:3002') {
  console.log('\n' + '='.repeat(80))
  console.log(chalk.blue.bold('🚀 LIGHTHOUSE PERFORMANCE CHECK'))
  console.log('='.repeat(80))

  try {
    const { stdout, stderr } = await execAsync(
      `npx lighthouse ${url} --only-categories=performance --output=json --quiet --chrome-flags="--headless --no-sandbox"`,
      { maxBuffer: 1024 * 1024 * 10 } // 10MB buffer
    )

    if (!stdout.trim()) {
      throw new Error(`No output from Lighthouse. stderr: ${stderr}`)
    }

    const report = JSON.parse(stdout)

    // Handle both CLI and CI report formats
    const lhr = report.lhr || report
    if (!lhr.categories || !lhr.audits) {
      throw new Error('Invalid Lighthouse report structure')
    }

    const performance = lhr.categories.performance
    const score = Math.round(performance.score * 100)

    // Core Web Vitals
    const fcp = lhr.audits['first-contentful-paint']
    const lcp = lhr.audits['largest-contentful-paint']
    const cls = lhr.audits['cumulative-layout-shift']
    const tbt = lhr.audits['total-blocking-time']
    const si = lhr.audits['speed-index']

    console.log(
      `📊 ${chalk.bold('Performance Score:')} ${getScoreDisplay(score)}`
    )
    console.log(
      `⚡ ${chalk.bold('First Contentful Paint:')} ${getMetricDisplay(fcp.displayValue, fcp.score)}`
    )
    console.log(
      `🎯 ${chalk.bold('Largest Contentful Paint:')} ${getMetricDisplay(lcp.displayValue, lcp.score)}`
    )
    console.log(
      `📐 ${chalk.bold('Cumulative Layout Shift:')} ${getMetricDisplay(cls.displayValue, cls.score)}`
    )
    console.log(
      `⏱️  ${chalk.bold('Total Blocking Time:')} ${getMetricDisplay(tbt.displayValue, tbt.score)}`
    )
    console.log(
      `🏃 ${chalk.bold('Speed Index:')} ${getMetricDisplay(si.displayValue, si.score)}`
    )

    console.log(
      '\n' + chalk.dim(`Last checked: ${new Date().toLocaleTimeString()}`)
    )
    console.log('='.repeat(80) + '\n')

    // Return data for other scripts to use
    return {
      score,
      metrics: {
        fcp: Math.round(fcp.numericValue),
        lcp: Math.round(lcp.numericValue),
        cls: Math.round(cls.numericValue * 1000) / 1000,
        tbt: Math.round(tbt.numericValue),
        si: Math.round(si.numericValue)
      }
    }
  } catch (error) {
    console.log(chalk.red('⚠️  Lighthouse check failed:'), error.message)
    return null
  }
}

function getScoreDisplay(score) {
  const emoji = score >= 90 ? '🟢' : score >= 50 ? '🟡' : '🔴'
  const color =
    score >= 90 ? chalk.green : score >= 50 ? chalk.yellow : chalk.red
  return `${color.bold(score)}/100 ${emoji}`
}

function getMetricDisplay(displayValue, score) {
  const emoji = score >= 0.9 ? '✅' : score >= 0.5 ? '⚠️' : '❌'
  const color =
    score >= 0.9 ? chalk.green : score >= 0.5 ? chalk.yellow : chalk.red
  return `${color(displayValue)} ${emoji}`
}

// If run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const url = process.argv[2] || 'http://localhost:3002'
  quickLighthouseCheck(url)
}

export { quickLighthouseCheck }
