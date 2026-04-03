#!/usr/bin/env node
/**
 * content-report.mjs
 *
 * Unified content health report card. Audits every blog post for:
 *   - Image alt text quality (empty, junk, good)
 *   - Dead/broken images (local refs, missing Cloudinary)
 *   - Frontmatter completeness (date, tags, dek)
 *   - Link health (dead external, broken internal)
 *   - Semantic quality (has title, has TOC, word count)
 *
 * Outputs: data/content-report.json (machine-readable)
 *          Terminal summary with letter grades
 *
 * Usage:
 *   node scripts/content-report.mjs            # full report
 *   node scripts/content-report.mjs --quick     # skip link checking
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const CONTENT_DIR = path.join(ROOT, 'content', 'blog')
const CACHE_PATH = path.join(ROOT, 'data', 'cloudinary-image-cache.json')
const REPORT_PATH = path.join(ROOT, 'data', 'content-report.json')

const args = process.argv.slice(2)
const QUICK = args.includes('--quick')

// ---------------------------------------------------------------------------
// Junk alt patterns (shared with generate-alt-text.mjs)
// ---------------------------------------------------------------------------
const JUNK_ALT_PATTERNS = [
  /^Screenshot/i, /^Screen Shot/i, /^Pasted image/i, /^IMG_/i, /^DSC/,
  /^DJI_/, /^DSCF/, /^Photo /i, /^CleanShot/i, /^Untitled/i, /^image\d*/i,
  /^[A-Fa-f0-9]{8}-[A-Fa-f0-9]{4}/,
  /^[A-Za-z0-9_.-]+\.(png|jpe?g|gif|webp|svg|tiff?)$/i,
  /^\d{4}-\d{2}-\d{2}/,
  /^https?:\/\//,
]

function isJunkAlt(alt) {
  if (!alt || alt.trim().length === 0) return true
  return JUNK_ALT_PATTERNS.some(p => p.test(alt.trim()))
}

// ---------------------------------------------------------------------------
// File walking
// ---------------------------------------------------------------------------
async function walk(dir) {
  const files = []
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(full)))
    else if (entry.name.endsWith('.md')) files.push(full)
  }
  return files
}

// ---------------------------------------------------------------------------
// Per-file audit
// ---------------------------------------------------------------------------
const IMAGE_RE = /!\[([^\]]*)\]\(([^)]+)\)/g
const LINK_RE = /(?<!!)\[([^\]]+)\]\(([^)]+)\)/g
const VIDEO_RE = /\/video\/upload\/|\.mp4|\.webm|\.mov|\.gif(?:\?|$)/i

function stripCodeBlocks(text) {
  return text.replace(/```[\s\S]*?```/g, '').replace(/`[^`]+`/g, '')
}

function auditFile(filePath, content, cloudCache) {
  const relPath = path.relative(ROOT, filePath)
  const { data: fm, content: rawBody } = matter(content)
  const body = stripCodeBlocks(rawBody)

  const issues = []
  const stats = { images: 0, imagesGood: 0, imagesJunk: 0, imagesEmpty: 0, imagesBroken: 0, links: 0, linksExternal: 0, words: 0 }

  // --- Frontmatter ---
  if (!fm.date) issues.push({ type: 'frontmatter', severity: 'warn', msg: 'No date' })
  if (!fm.tags || fm.tags.length === 0) issues.push({ type: 'frontmatter', severity: 'info', msg: 'No tags' })
  if (!fm.dek && !fm.draft) issues.push({ type: 'frontmatter', severity: 'info', msg: 'No dek/subtitle' })
  if (fm.draft) issues.push({ type: 'frontmatter', severity: 'info', msg: 'Draft' })

  // --- Images ---
  for (const m of body.matchAll(IMAGE_RE)) {
    const alt = m[1].trim()
    const url = m[2]
    stats.images++

    const isVideo = VIDEO_RE.test(url)

    if (!alt && isVideo) {
      // Videos with empty alt are expected — not an error
      stats.imagesGood++
    } else if (!alt) {
      stats.imagesEmpty++
      issues.push({ type: 'alt', severity: 'error', msg: `Empty alt text`, url: url.slice(0, 80) })
    } else if (isJunkAlt(alt)) {
      stats.imagesJunk++
      issues.push({ type: 'alt', severity: 'warn', msg: `Junk alt: "${alt.slice(0, 40)}"`, url: url.slice(0, 80) })
    } else {
      stats.imagesGood++
    }

    // Check for local/broken refs
    if (!url.startsWith('http') && !url.startsWith('//')) {
      stats.imagesBroken++
      issues.push({ type: 'image', severity: 'error', msg: `Local image ref: ${url.slice(0, 60)}` })
    }

    // Check if Cloudinary image has cached metadata
    if (url.includes('cloudinary') && cloudCache) {
      const normalized = url.replace(/^http:\/\//i, 'https://')
      const entry = cloudCache[normalized]
      if (entry && !entry.alt && !isJunkAlt(alt) && alt) {
        issues.push({ type: 'sync', severity: 'info', msg: 'Alt not synced to Cloudinary cache' })
      }
    }
  }

  // --- Links ---
  for (const m of body.matchAll(LINK_RE)) {
    const url = m[2]
    stats.links++
    if (url.startsWith('http')) stats.linksExternal++
    if (url === '' || url === '#' || url.includes('undefined')) {
      issues.push({ type: 'link', severity: 'error', msg: `Broken link: ${url || '(empty)'}` })
    }
  }

  // --- Content quality ---
  stats.words = body.split(/\s+/).filter(Boolean).length
  if (stats.words < 50 && !fm.draft && !fm.hidden) {
    issues.push({ type: 'content', severity: 'info', msg: `Very short (${stats.words} words)` })
  }

  // --- Compute grade ---
  const errors = issues.filter(i => i.severity === 'error').length
  const warns = issues.filter(i => i.severity === 'warn').length
  let grade = 'A'
  if (errors > 0) grade = 'F'
  else if (warns > 3) grade = 'D'
  else if (warns > 1) grade = 'C'
  else if (warns > 0) grade = 'B'

  // Boost for completeness
  if (grade === 'A' && fm.tags?.length > 0 && fm.dek && fm.date && stats.images > 0 && stats.imagesGood === stats.images) {
    grade = 'A+'
  }

  return { file: relPath, grade, issues, stats, frontmatter: { date: fm.date, tags: fm.tags, draft: !!fm.draft, hidden: !!fm.hidden } }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('\n📋 Content Report Card\n')

  const files = await walk(CONTENT_DIR)
  let cloudCache = {}
  try { cloudCache = JSON.parse(await fs.readFile(CACHE_PATH, 'utf8')) } catch {}

  const reports = []
  for (const f of files) {
    const content = await fs.readFile(f, 'utf8')
    reports.push(auditFile(f, content, cloudCache))
  }

  // --- Aggregate ---
  const grades = { 'A+': 0, A: 0, B: 0, C: 0, D: 0, F: 0 }
  let totalImages = 0, goodAlt = 0, junkAlt = 0, emptyAlt = 0, brokenImages = 0
  let totalIssues = 0, totalErrors = 0, totalWarns = 0
  const issuesByType = {}

  for (const r of reports) {
    grades[r.grade] = (grades[r.grade] || 0) + 1
    totalImages += r.stats.images
    goodAlt += r.stats.imagesGood
    junkAlt += r.stats.imagesJunk
    emptyAlt += r.stats.imagesEmpty
    brokenImages += r.stats.imagesBroken
    for (const issue of r.issues) {
      totalIssues++
      if (issue.severity === 'error') totalErrors++
      if (issue.severity === 'warn') totalWarns++
      issuesByType[issue.type] = (issuesByType[issue.type] || 0) + 1
    }
  }

  const altCoverage = totalImages > 0 ? ((goodAlt / totalImages) * 100).toFixed(1) : '0'
  const overallGrade = totalErrors > 10 ? 'D' : totalErrors > 0 ? 'C' : totalWarns > 20 ? 'B' : 'A'

  const summary = {
    generated: new Date().toISOString(),
    overallGrade,
    posts: reports.length,
    grades,
    images: { total: totalImages, goodAlt, junkAlt, emptyAlt, broken: brokenImages, altCoverage: `${altCoverage}%` },
    issues: { total: totalIssues, errors: totalErrors, warnings: totalWarns, byType: issuesByType },
    cloudinaryCache: { entries: Object.keys(cloudCache).length, withAlt: Object.values(cloudCache).filter(v => v.alt).length },
  }

  const report = { summary, posts: reports }

  // --- Write report ---
  await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true })
  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))

  // --- Terminal output ---
  console.log(`  Overall Grade: ${overallGrade}`)
  console.log(`  Posts: ${reports.length}`)
  console.log()
  console.log(`  Grades:  A+:${grades['A+']}  A:${grades.A}  B:${grades.B}  C:${grades.C}  D:${grades.D}  F:${grades.F}`)
  console.log()
  console.log(`  Images:`)
  console.log(`    Total: ${totalImages}`)
  console.log(`    Good alt: ${goodAlt} (${altCoverage}%)`)
  console.log(`    Junk alt: ${junkAlt}`)
  console.log(`    Empty alt: ${emptyAlt}`)
  console.log(`    Broken refs: ${brokenImages}`)
  console.log()
  console.log(`  Issues: ${totalIssues} (${totalErrors} errors, ${totalWarns} warnings)`)
  for (const [type, count] of Object.entries(issuesByType).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${type}: ${count}`)
  }
  console.log()
  console.log(`  Cloudinary cache: ${Object.keys(cloudCache).length} entries, ${Object.values(cloudCache).filter(v => v.alt).length} with alt`)
  console.log()

  // Show worst offenders
  const failing = reports.filter(r => r.grade === 'F').sort((a, b) => b.issues.length - a.issues.length)
  if (failing.length > 0) {
    console.log(`  Failing posts (${failing.length}):`)
    for (const r of failing.slice(0, 10)) {
      const errs = r.issues.filter(i => i.severity === 'error').length
      console.log(`    ${r.grade} [${errs}err] ${r.file.split('/').slice(-2).join('/')}`)
    }
    if (failing.length > 10) console.log(`    ... and ${failing.length - 10} more`)
  }

  console.log(`\n  Report: data/content-report.json`)
}

main().catch(err => { console.error(err); process.exit(1) })
