#!/usr/bin/env node
/* eslint-disable no-console */

import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import chalk from 'chalk'

const execAsync = promisify(exec)

async function analyzePerformance(url = 'http://localhost:3002') {
  console.log('\n' + '='.repeat(80))
  console.log(
    chalk.red.bold("🚨 PERFORMANCE ANALYSIS - WHAT'S BREAKING YOUR SITE")
  )
  console.log('='.repeat(80))

  try {
    // Run full Lighthouse audit with detailed diagnostics
    const { stdout } = await execAsync(
      `npx lighthouse ${url} --output=json --quiet ` +
        `--chrome-flags="--headless --no-sandbox"`,
      { maxBuffer: 1024 * 1024 * 10 } // 10MB buffer
    )

    const report = JSON.parse(stdout)
    const lhr = report.lhr || report

    console.log(chalk.red.bold('\n🔥 CRITICAL ISSUES:'))

    // Check render-blocking resources
    const renderBlocking = lhr.audits['render-blocking-resources']
    if (renderBlocking && renderBlocking.score < 0.9) {
      console.log(chalk.red('❌ Render-blocking resources detected:'))
      renderBlocking.details?.items?.forEach((item) => {
        const wastedMs = item.wastedMs
        console.log(chalk.red(`   • ${item.url} (${wastedMs}ms blocked)`))
      })
    }

    // Check unused JavaScript
    const unusedJS = lhr.audits['unused-javascript']
    if (unusedJS && unusedJS.score < 0.9) {
      console.log(
        chalk.red(`❌ Unused JavaScript: ${unusedJS.displayValue} wasted`)
      )
      unusedJS.details.items?.slice(0, 5).forEach((item) => {
        const wastedKb = Math.round(item.wastedBytes / 1024)
        console.log(chalk.red(`   • ${item.url} (${wastedKb}KB unused)`))
      })
    }

    // Check unused CSS
    const unusedCSS = lhr.audits['unused-css-rules']
    if (unusedCSS && unusedCSS.score < 0.9) {
      console.log(chalk.red(`❌ Unused CSS: ${unusedCSS.displayValue} wasted`))
    }

    // Check main thread work
    const mainThread = lhr.audits['mainthread-work-breakdown']
    if (mainThread && mainThread.score < 0.9) {
      console.log(
        chalk.red(`❌ Excessive main thread work: ${mainThread.displayValue}`)
      )
      mainThread.details.items?.slice(0, 3).forEach((item) => {
        console.log(chalk.red(`   • ${item.groupLabel}: ${item.duration}ms`))
      })
    }

    // Check for large network payloads
    const networkPayloads = lhr.audits['total-byte-weight']
    if (networkPayloads && networkPayloads.score < 0.9) {
      console.log(
        chalk.red(`❌ Large network payload: ${networkPayloads.displayValue}`)
      )
    }

    // Check server response time
    const serverResponse = lhr.audits['server-response-time']
    if (serverResponse && serverResponse.score < 0.9) {
      console.log(
        chalk.red(`❌ Slow server response: ${serverResponse.displayValue}`)
      )
    }

    console.log(chalk.yellow('\n⚠️  PERFORMANCE OPPORTUNITIES:'))

    // Check image optimization
    const imageOptim = lhr.audits['uses-optimized-images']
    if (imageOptim.score < 1) {
      console.log(
        chalk.yellow(
          `• Image optimization could save ${imageOptim.displayValue}`
        )
      )
    }

    // Check image formats
    const imageFormats = lhr.audits['uses-webp-images']
    if (imageFormats.score < 1) {
      console.log(
        chalk.yellow(
          `• Modern image formats could save ${imageFormats.displayValue}`
        )
      )
    }

    // Check text compression
    const textCompression = lhr.audits['uses-text-compression']
    if (textCompression.score < 1) {
      console.log(
        chalk.yellow(
          `• Text compression could save ${textCompression.displayValue}`
        )
      )
    }

    console.log(chalk.green("\n✅ WHAT'S WORKING:"))

    // Check what's actually good
    const goodAudits = Object.values(lhr.audits)
      .filter(
        (audit) =>
          audit.score === 1 && audit.scoreDisplayMode !== 'notApplicable'
      )
      .slice(0, 5)

    goodAudits.forEach((audit) => {
      console.log(chalk.green(`• ${audit.title}`))
    })

    console.log('\n' + '='.repeat(80) + '\n')
  } catch (error) {
    const msg = chalk.red('⚠️  Performance analysis failed:')
    console.log(msg, error.message)
  }
}

// If run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const url = process.argv[2] || 'http://localhost:3002'
  analyzePerformance(url)
}

export { analyzePerformance }
