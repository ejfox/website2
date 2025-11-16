#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { quickLighthouseCheck } from './lighthouse-check.mjs'
import chalk from 'chalk'

console.log(
  chalk.blue.bold('\n🚀 Starting Dev Server with Performance Monitoring\n')
)

// Start the dev server
const devServer = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
})

// Wait for server to start, then run initial performance check
setTimeout(async () => {
  console.log(chalk.yellow('\n⚡ Running initial performance check...\n'))
  await quickLighthouseCheck('http://localhost:3002')

  // Run performance check every 2 minutes
  setInterval(async () => {
    console.log(chalk.yellow('\n⚡ Periodic performance check...\n'))
    await quickLighthouseCheck('http://localhost:3002')
  }, 120000) // 2 minutes
}, 10000) // Wait 10 seconds for server to start

// Handle cleanup
process.on('SIGINT', () => {
  console.log(
    chalk.red('\n🛑 Shutting down dev server and performance monitoring\n')
  )
  devServer.kill('SIGINT')
  process.exit(0)
})

devServer.on('exit', (code) => {
  console.log(chalk.red(`\n🛑 Dev server exited with code ${code}\n`))
  process.exit(code)
})
