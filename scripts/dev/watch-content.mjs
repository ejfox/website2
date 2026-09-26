#!/usr/bin/env node
/**
 * Watches content/blog for .md changes and reprocesses automatically.
 * Run alongside `yarn dev` in a second terminal:
 *   yarn content:watch
 *
 * Not true HMR — content is fetched data, not a Vue SFC, so Vite has
 * nothing to hot-swap. This just removes the manual `yarn blog:process`
 * step: save a file, the JSON regenerates in a few seconds, refresh the
 * browser tab yourself.
 */

import { watch } from 'node:fs'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../..')
const contentDir = path.join(root, 'content', 'blog')

const DEBOUNCE_MS = 400
let pending = false
let timer = null
let running = false

function log(msg) {
  console.log(`[content:watch] ${msg}`)
}

function runProcess() {
  if (running) {
    pending = true
    return
  }
  running = true
  const startedAt = Date.now()
  log('change detected, reprocessing...')

  const child = spawn('node', ['scripts/build/processMarkdown.mjs'], {
    cwd: root,
    env: { ...process.env, DEBUG: 'true' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  let errOutput = ''
  child.stderr.on('data', (chunk) => {
    errOutput += chunk.toString()
  })

  child.on('close', (code) => {
    const ms = Date.now() - startedAt
    if (code === 0) {
      log(`done in ${ms}ms — refresh your browser`)
    } else {
      log(`processMarkdown exited with code ${code}`)
      if (errOutput) process.stderr.write(errOutput)
    }
    running = false
    if (pending) {
      pending = false
      runProcess()
    }
  })
}

function scheduleRun() {
  if (timer) clearTimeout(timer)
  timer = setTimeout(runProcess, DEBOUNCE_MS)
}

log(`watching ${path.relative(root, contentDir)} for .md changes...`)

watch(contentDir, { recursive: true }, (_eventType, filename) => {
  if (!filename || !filename.endsWith('.md')) return
  if (filename.includes(`processed${path.sep}`)) return
  scheduleRun()
})

process.on('SIGINT', () => process.exit(0))
