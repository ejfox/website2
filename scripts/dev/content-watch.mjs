/**
 * @file content-watch.mjs
 * @description Dev-server content HMR: rerun processMarkdown on .md edits,
 *   then ping the browser. Not a CLI and no yarn script: nuxt.config.ts
 *   imports watchContentAndReload() and calls it from its vite:serverCreated
 *   hook (client build) during `yarn dev`. Client half: plugins/content-hmr.client.ts.
 *   Writes content/processed/ (via the processor); no network, no git.
 */
import { spawn } from 'node:child_process'
import { watch } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
)
// One watcher per process, even if vite:serverCreated is called again.
let started = false

/**
 * Dev only: watches content/blog for .md edits, reruns processMarkdown.mjs,
 * then sends a custom Vite HMR event over the dev server's own websocket —
 * paired with plugins/content-hmr.client.ts, which calls refreshNuxtData()
 * on that event. So editing a project/blog source file in nvim updates the
 * open tab in place, no manual `yarn blog:process` and no hard reload.
 *
 * @param {{ ws: { send: (payload: { type: string, event?: string, path?: string }) => void } }} viteServer
 */
export function watchContentAndReload(viteServer) {
  if (started) return
  started = true

  const contentDir = path.join(rootDir, 'content', 'blog')
  const DEBOUNCE_MS = 400
  let timer = null
  let running = false
  let pending = false

  // One processor run at a time; edits during a run queue exactly one rerun.
  function runProcess() {
    if (running) {
      pending = true
      return
    }
    running = true
    const startedAt = Date.now()
    console.log('[content-watch] change detected, reprocessing...')

    const child = spawn('node', ['scripts/build/processMarkdown.mjs'], {
      cwd: rootDir,
      env: { ...process.env, DEBUG: 'true' },
      stdio: ['ignore', 'ignore', 'pipe'],
    })

    let errOutput = ''
    child.stderr.on('data', (chunk) => {
      errOutput += chunk.toString()
    })

    child.on('close', (code) => {
      const ms = Date.now() - startedAt
      running = false
      if (code === 0) {
        console.log(`[content-watch] done in ${ms}ms, refreshing data`)
        viteServer.ws.send({ type: 'custom', event: 'content:updated' })
      } else {
        console.error(
          `[content-watch] processMarkdown exited with code ${code}`
        )
        if (errOutput) console.error(errOutput)
      }
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

  watch(contentDir, { recursive: true }, (_eventType, filename) => {
    if (!filename || !filename.endsWith('.md')) return
    scheduleRun()
  })

  console.log(
    `[content-watch] watching ${path.relative(rootDir, contentDir)} for .md changes...`
  )
}
