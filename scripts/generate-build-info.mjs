#!/usr/bin/env node
/**
 * @file generate-build-info.mjs
 * @description Generate build info JSON with git commit, branch, and timestamp for deployment tracking
 * @usage node scripts/generate-build-info.mjs
 * @env None required - reads from git
 */

/* eslint-disable no-console */
import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const commit = execSync('git rev-parse --short HEAD').toString().trim()
const commitLong = execSync('git rev-parse HEAD').toString().trim()
const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
const date = new Date().toISOString()

const buildInfo = {
  commit,
  commitLong,
  branch,
  buildDate: date,
  buildTimestamp: Date.now(),
}

writeFileSync('.build-info.json', JSON.stringify(buildInfo, null, 2))
console.log(`✓ Build info: ${commit} on ${branch} at ${date}`)
