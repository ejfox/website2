#!/usr/bin/env node
/**
 * Build public/resume.pdf FROM public/resume.json — the JSON is the single
 * source of truth. The PDF used to be hand-made in Apple Pages (no source file
 * survives), so the two drifted: resume.json stopped at 2019.
 *
 *   yarn resume:build            # writes public/resume.pdf
 *   yarn resume:build --html     # also keeps the intermediate HTML for tweaking
 *
 * Renders an HTML page styled after the original Pages design (teal name,
 * illustration + contact column, uppercase section labels) and prints it with
 * headless Chrome. No new dependencies.
 */
import {
  readFile,
  writeFile,
  mkdtemp,
  rm,
  stat,
  copyFile,
} from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '../..')
const resume = JSON.parse(
  await readFile(path.join(root, 'public/resume.json'), 'utf8')
)
const keepHtml = process.argv.includes('--html')

const esc = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const years = (a, b) => {
  const y = (d) => (d ? String(d).slice(0, 4) : '')
  if (!a) return ''
  if (!b) return `${y(a)} - Present`
  return y(a) === y(b) ? y(a) : `${y(a)} - ${y(b)}`
}

const host = (url) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')

const { basics, work = [], projects = [], skills = [] } = resume
// Roles that ended by 2014 collapse into an "Early Career" list (as in the
// original Pages design) instead of full experience blocks.
const isEarly = (w) =>
  w.endDate && Number(String(w.endDate).slice(0, 4)) <= 2014
const mainWork = work.filter((w) => !isEarly(w))
const earlyWork = work.filter(isEarly)
const image = path.join(root, 'public/images/me_full.png')

const html = `<!doctype html><html><head><meta charset="utf-8">
<style>
  @page { size: Letter; margin: 0.5in 0.65in 0.5in 0.65in; }
  :root { --teal: #1f5a73; --rule: #8fb4c2; --ink: #2b2b2b; --muted: #5f6368; }
  * { box-sizing: border-box; }
  body { margin: 0; color: var(--ink); font: 9.4pt/1.38 'Avenir Next', 'Helvetica Neue', Helvetica, Arial, sans-serif; }
  h1 { margin: 0; color: var(--teal); font-size: 30pt; font-weight: 800; letter-spacing: 0.01em; text-transform: uppercase; }
  .top-rule { height: 4px; background: var(--rule); margin: 6px 0 22px; }
  .cols { display: grid; grid-template-columns: 1.75in 1fr; gap: 0.3in; }
  .side img { display: block; width: 0.85in; margin: 0 auto 14px; }
  .side p { margin: 0 0 3px; color: var(--muted); font-size: 9.5pt; }
  .side a { color: var(--muted); }
  .side .rule { height: 3px; background: var(--rule); margin-top: 12px; }
  h2 { margin: 13px 0 5px; color: var(--teal); font-size: 10pt; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
  h2:first-child { margin-top: 0; }
  .summary { margin: 0; }
  .skill { margin: 0 0 5px; }
  .skill b { font-weight: 700; }
  .job { margin: 0 0 8px; }
  .job h3, .job .meta { break-after: avoid; }
  li { break-inside: avoid; }
  .job h3 { margin: 0; font-size: 10.5pt; font-weight: 700; }
  .job .meta { margin: 1px 0 3px; color: var(--muted); font-style: italic; }
  .job .clients { margin: 0 0 3px; }
  ul { margin: 0; padding-left: 14px; }
  li { margin: 0 0 2px; }
  .proj { margin: 0 0 4px; break-inside: avoid; }
  .proj b { font-weight: 700; }
  .proj .yr { color: var(--muted); }
  a { color: inherit; text-decoration: none; }
</style></head><body>
  <h1>${esc(basics.name)}</h1>
  <div class="top-rule"></div>
  <div class="cols">
    <aside class="side">
      ${existsSync(image) ? `<img src="file://${image}" alt="">` : ''}
      <p>${esc(basics.email)}</p>
      ${basics.phone ? `<p>${esc(basics.phone)}</p>` : ''}
      ${(basics.profiles || []).map((p) => `<p><a href="${esc(p.url)}">${esc(host(p.url))}</a></p>`).join('')}
      <div class="rule"></div>
    </aside>
    <main>
      <h2>Profile</h2>
      <p class="summary">${esc(basics.summary)}</p>

      <h2>Technical Skills</h2>
      ${skills.map((s) => `<p class="skill"><b>${esc(s.name)}:</b> ${esc((s.keywords || []).join(', '))}</p>`).join('')}

      <h2>Experience</h2>
      ${mainWork
        .map(
          (w) => `<div class="job">
        <h3>${esc(w.position)}</h3>
        <p class="meta">${esc(w.name)} | ${esc(years(w.startDate, w.endDate))}</p>
        ${w.summary ? `<p class="clients">${esc(w.summary)}</p>` : ''}
        ${w.highlights?.length ? `<ul>${w.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
      </div>`
        )
        .join('')}
      ${
        earlyWork.length
          ? `<div class="job"><h3>Early Career</h3><ul>${earlyWork
              .map(
                (w) =>
                  `<li><i>${esc(w.name)} (${esc(String(w.startDate).slice(0, 4))})</i>: ${esc(w.highlights?.[0] || w.position)}</li>`
              )
              .join('')}</ul></div>`
          : ''
      }

      ${
        projects.length
          ? `<h2>Projects</h2>
      ${projects
        .map(
          (p) =>
            `<p class="proj"><b>${esc(p.name)}</b>${p.entity ? ` · ${esc(p.entity)}` : ''} <span class="yr">(${esc(years(p.startDate, p.endDate || p.startDate))})</span> — ${esc(p.description)}</p>`
        )
        .join('')}`
          : ''
      }
    </main>
  </div>
</body></html>`

const CHROME = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((p) => p && existsSync(p))
if (!CHROME) throw new Error('No Chrome found — set CHROME_PATH')

const dir = await mkdtemp(path.join(tmpdir(), 'resume-'))
const htmlPath = path.join(dir, 'resume.html')
const out = path.join(root, 'public/resume.pdf')
await writeFile(htmlPath, html)
// Headless Chrome on macOS often writes the PDF and then never exits, so don't
// wait for exit: print to a temp file, wait until its size stops changing,
// kill Chrome, then copy it into place (a half-written PDF never lands).
const tmpPdf = path.join(dir, 'resume.pdf')
const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-pdf-header-footer',
    `--user-data-dir=${path.join(dir, 'profile')}`,
    '--allow-file-access-from-files',
    `--print-to-pdf=${tmpPdf}`,
    `file://${htmlPath}`,
  ],
  { stdio: 'ignore' }
)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const size = async () => (await stat(tmpPdf).catch(() => null))?.size || 0
let last = -1
const deadline = Date.now() + 60_000
for (;;) {
  const now = await size()
  if (now > 0 && now === last) break
  if (Date.now() > deadline) {
    chrome.kill('SIGKILL')
    throw new Error('Chrome never produced a PDF')
  }
  last = now
  await sleep(500)
}
chrome.kill('SIGTERM')
await sleep(300)
if (chrome.exitCode === null) chrome.kill('SIGKILL')
await copyFile(tmpPdf, out)
if (keepHtml) {
  await writeFile(path.join(root, 'public/resume.html'), html)
  console.log('kept public/resume.html')
}
await rm(dir, { recursive: true, force: true })
console.log(`✓ wrote ${path.relative(root, out)} from public/resume.json`)
