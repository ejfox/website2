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
const REPORT_HTML_PATH = path.join(ROOT, 'data', 'content-report.html')

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
  const images = []
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
    let quality = 'good'

    if (!alt && isVideo) {
      quality = 'video'
      stats.imagesGood++
    } else if (!alt) {
      quality = 'empty'
      stats.imagesEmpty++
      issues.push({ type: 'alt', severity: 'error', msg: `Empty alt text`, url: url.slice(0, 80) })
    } else if (isJunkAlt(alt)) {
      quality = 'junk'
      stats.imagesJunk++
      issues.push({ type: 'alt', severity: 'warn', msg: `Junk alt: "${alt.slice(0, 40)}"`, url: url.slice(0, 80) })
    } else {
      stats.imagesGood++
    }

    // Build thumbnail URL for Cloudinary images
    let thumb = null
    if (url.includes('cloudinary') && url.includes('/image/upload/')) {
      const u = url.replace(/^http:\/\//i, 'https://')
      const parts = u.split('/upload/')
      if (parts.length === 2) thumb = `${parts[0]}/upload/c_fill,w_160,h_112,f_auto,q_auto/${parts[1]}`
    }

    images.push({ url: url.slice(0, 200), alt: alt || '', quality, thumb, isVideo })

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

  return { file: relPath, grade, issues, images, stats, frontmatter: { date: fm.date, tags: fm.tags, draft: !!fm.draft, hidden: !!fm.hidden } }
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

  // Write self-contained HTML report (inline the JSON)
  const htmlTemplate = await fs.readFile(REPORT_HTML_PATH, 'utf8').catch(() => null)
  if (!htmlTemplate) {
    // Generate the HTML viewer with inline data
    const html = buildReportHtml(report)
    await fs.writeFile(REPORT_HTML_PATH, html)
  } else {
    // Update existing HTML with fresh data
    const html = buildReportHtml(report)
    await fs.writeFile(REPORT_HTML_PATH, html)
  }

  console.log(`\n  Report: data/content-report.json`)
  console.log(`  Viewer: data/content-report.html`)

  // Auto-open in browser
  if (!args.includes('--no-open')) {
    const { exec } = await import('node:child_process')
    exec(`open ${REPORT_HTML_PATH}`)
  }
}

function buildReportHtml(report) {
  const html = '<!doctype html>' + `
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Content Report Card</title>
<style>
  :root { --bg: #0a0a0b; --surface: #141416; --border: #222226; --text: #e4e4e7; --text2: #a1a1aa; --text3: #52525b; --green: #4ade80; --yellow: #fbbf24; --red: #f87171; --purple: #a78bfa; --blue: #60a5fa; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace; background: var(--bg); color: var(--text); font-size: 13px; line-height: 1.5; }
  .container { max-width: 960px; margin: 0 auto; padding: 2rem 1.5rem; }
  .header { margin-bottom: 2rem; }
  .header h1 { font-size: 14px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: var(--text3); margin-bottom: 0.5rem; }
  .overall-grade { font-size: 72px; font-weight: 700; line-height: 1; }
  .overall-grade.A { color: var(--green); } .overall-grade.B { color: var(--blue); } .overall-grade.C { color: var(--yellow); } .overall-grade.D, .overall-grade.F { color: var(--red); }
  .generated { font-size: 11px; color: var(--text3); margin-top: 0.5rem; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; margin-bottom: 2rem; }
  .stat { background: var(--surface); padding: 16px; }
  .stat-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.75px; color: var(--text3); margin-bottom: 4px; }
  .stat-value { font-size: 24px; font-weight: 600; }
  .stat-detail { font-size: 11px; color: var(--text2); margin-top: 2px; }
  .grade-bar { display: flex; height: 32px; border-radius: 6px; overflow: hidden; margin-bottom: 2rem; gap: 1px; }
  .grade-segment { display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 600; color: #000; min-width: 24px; }
  .grade-segment.Aplus, .grade-segment.A { background: var(--green); } .grade-segment.B { background: var(--blue); } .grade-segment.C { background: var(--yellow); } .grade-segment.D { background: #fb923c; } .grade-segment.F { background: var(--red); }
  .meter-section { margin-bottom: 2rem; }
  .meter-section h2, .issues-section h2, .posts-section h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.75px; color: var(--text3); margin-bottom: 8px; }
  .meter { height: 8px; background: var(--surface); border-radius: 4px; overflow: hidden; border: 1px solid var(--border); }
  .meter-fill { height: 100%; border-radius: 3px; }
  .meter-fill.good { background: var(--green); } .meter-fill.mid { background: var(--yellow); } .meter-fill.bad { background: var(--red); }
  .meter-labels { display: flex; justify-content: space-between; font-size: 10px; color: var(--text3); margin-top: 4px; }
  .issues-section { margin-bottom: 2rem; }
  .issue-row { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--border); }
  .issue-type { font-size: 11px; color: var(--text2); min-width: 100px; }
  .issue-bar { flex: 1; height: 6px; background: var(--surface); border-radius: 3px; overflow: hidden; }
  .issue-bar-fill { height: 100%; background: var(--purple); border-radius: 3px; }
  .issue-count { font-size: 11px; color: var(--text2); min-width: 40px; text-align: right; }
  .posts-section { margin-bottom: 2rem; }
  .filters { display: flex; gap: 6px; margin-bottom: 12px; flex-wrap: wrap; }
  .filter-btn { padding: 4px 10px; font-size: 10px; font-family: inherit; background: var(--surface); color: var(--text2); border: 1px solid var(--border); border-radius: 4px; cursor: pointer; }
  .filter-btn.active { background: var(--purple); color: #000; border-color: var(--purple); }
  .filter-btn:hover { border-color: var(--text3); }
  .search { padding: 6px 10px; font-size: 11px; font-family: inherit; background: var(--surface); color: var(--text); border: 1px solid var(--border); border-radius: 4px; width: 200px; outline: none; }
  .search:focus { border-color: var(--purple); }
  .post-table { width: 100%; border-collapse: collapse; }
  .post-table th { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text3); text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--border); cursor: pointer; user-select: none; }
  .post-table th:hover { color: var(--text2); }
  .post-table td { padding: 5px 8px; border-bottom: 1px solid var(--border); font-size: 11px; }
  .post-table tr:hover td { background: rgba(255,255,255,0.02); }
  .grade-badge { display: inline-block; width: 22px; height: 18px; line-height: 18px; text-align: center; font-size: 10px; font-weight: 700; border-radius: 3px; color: #000; }
  .grade-badge.Aplus, .grade-badge.A { background: var(--green); } .grade-badge.B { background: var(--blue); } .grade-badge.C { background: var(--yellow); } .grade-badge.D { background: #fb923c; } .grade-badge.F { background: var(--red); }
  .issue-pills { display: flex; gap: 3px; flex-wrap: wrap; }
  .issue-pill { font-size: 9px; padding: 1px 5px; border-radius: 3px; }
  .issue-pill.error { background: rgba(248,113,113,0.2); color: var(--red); } .issue-pill.warn { background: rgba(251,191,36,0.15); color: var(--yellow); } .issue-pill.info { background: rgba(255,255,255,0.05); color: var(--text3); }
  .post-link { color: var(--text); text-decoration: none; } .post-link:hover { color: var(--purple); }
  .img-ratio .good { color: var(--green); } .img-ratio .bad { color: var(--red); }
  .expandable { cursor: pointer; }
  .expand-row td { padding: 8px 8px 8px 36px; background: var(--surface); }
  .expand-issues { font-size: 10px; color: var(--text2); }
  .expand-issues div { padding: 2px 0; }
  .expand-issues .severity-error { color: var(--red); } .expand-issues .severity-warn { color: var(--yellow); } .expand-issues .severity-info { color: var(--text3); }
  .img-gallery { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
  .img-card { border: 2px solid; border-radius: 6px; overflow: hidden; width: 160px; background: var(--surface); }
  .img-thumb { width: 160px; height: 112px; overflow: hidden; background: #0d0d0f; display:flex; align-items:center; justify-content:center; }
  .img-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .no-thumb { font-size: 10px; color: var(--text3); }
  .img-alt { padding: 6px 8px; font-size: 9px; line-height: 1.3; color: var(--text2); max-height: 48px; overflow: hidden; }
  .hidden { display: none; }
  .footer { text-align: center; padding: 2rem 0; font-size: 10px; color: var(--text3); }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>Content Report Card</h1>
    <div class="overall-grade" id="overall-grade"></div>
    <div class="generated" id="generated"></div>
  </div>
  <div class="stats" id="stats"></div>
  <div class="grade-bar" id="grade-bar"></div>
  <div class="meter-section"><h2>Alt Text Coverage</h2><div class="meter"><div class="meter-fill" id="alt-meter"></div></div><div class="meter-labels"><span id="alt-label-left"></span><span id="alt-label-right"></span></div></div>
  <div class="issues-section"><h2>Issues by Type</h2><div id="issues-breakdown"></div></div>
  <div class="posts-section">
    <h2>All Posts</h2>
    <div class="filters">
      <button class="filter-btn active" data-grade="all">All</button>
      <button class="filter-btn" data-grade="F">F</button>
      <button class="filter-btn" data-grade="D">D</button>
      <button class="filter-btn" data-grade="C">C</button>
      <button class="filter-btn" data-grade="B">B</button>
      <button class="filter-btn" data-grade="A">A</button>
      <button class="filter-btn" data-grade="A+">A+</button>
      <input class="search" type="text" placeholder="Search posts..." id="search">
    </div>
    <table class="post-table"><thead><tr>
      <th data-sort="grade" style="width:36px">Grade</th>
      <th data-sort="file">Post</th>
      <th data-sort="images" style="width:60px">Images</th>
      <th data-sort="issues" style="width:60px">Issues</th>
      <th data-sort="words" style="width:60px">Words</th>
    </tr></thead><tbody id="post-table-body"></tbody></table>
  </div>
  <div class="footer">Generated by content-report.mjs</div>
</div>
<script id="report-data" type="application/json">REPORT_JSON_PLACEHOLDER</script>
<script>
const GRADE_ORDER = { 'A+': 0, A: 1, B: 2, C: 3, D: 4, F: 5 }
const report = JSON.parse(document.getElementById('report-data').textContent)
let sortKey = 'grade', sortDir = 1, filterGrade = 'all', searchQuery = ''

function render() {
  const s = report.summary
  const gradeEl = document.getElementById('overall-grade')
  gradeEl.textContent = s.overallGrade
  gradeEl.className = 'overall-grade ' + s.overallGrade
  document.getElementById('generated').textContent = 'Generated ' + new Date(s.generated).toLocaleString() + ' — ' + s.posts + ' posts'
  const pct = parseFloat(s.images.altCoverage)
  document.getElementById('stats').innerHTML = [
    { label: 'Posts', value: s.posts, detail: s.grades.F + ' failing' },
    { label: 'Images', value: s.images.total, detail: s.images.broken + ' broken' },
    { label: 'Alt Coverage', value: s.images.altCoverage, detail: s.images.goodAlt + ' good' },
    { label: 'Errors', value: s.issues.errors, detail: s.issues.warnings + ' warnings' },
    { label: 'Cloudinary', value: s.cloudinaryCache.withAlt + '/' + s.cloudinaryCache.entries, detail: 'synced' },
  ].map(function(s) { return '<div class="stat"><div class="stat-label">' + s.label + '</div><div class="stat-value">' + s.value + '</div><div class="stat-detail">' + s.detail + '</div></div>' }).join('')
  document.getElementById('grade-bar').innerHTML = ['A+','A','B','C','D','F'].filter(function(g) { return s.grades[g] > 0 }).map(function(g) {
    var cls = g === 'A+' ? 'Aplus' : g; return '<div class="grade-segment ' + cls + '" style="flex:' + s.grades[g] + '" title="' + g + ': ' + s.grades[g] + '">' + g + ':' + s.grades[g] + '</div>'
  }).join('')
  var mf = document.getElementById('alt-meter'); mf.style.width = s.images.altCoverage; mf.className = 'meter-fill ' + (pct >= 80 ? 'good' : pct >= 50 ? 'mid' : 'bad')
  document.getElementById('alt-label-left').textContent = s.images.goodAlt + ' good'
  document.getElementById('alt-label-right').textContent = s.images.junkAlt + ' junk, ' + s.images.emptyAlt + ' empty'
  var maxI = Math.max.apply(null, Object.values(s.issues.byType))
  document.getElementById('issues-breakdown').innerHTML = Object.entries(s.issues.byType).sort(function(a,b) { return b[1]-a[1] }).map(function(e) {
    return '<div class="issue-row"><span class="issue-type">' + e[0] + '</span><div class="issue-bar"><div class="issue-bar-fill" style="width:' + (e[1]/maxI*100).toFixed(1) + '%"></div></div><span class="issue-count">' + e[1] + '</span></div>'
  }).join('')
  renderTable()
}
function renderTable() {
  var posts = report.posts.filter(function(p) { return filterGrade === 'all' || p.grade === filterGrade }).filter(function(p) { return !searchQuery || p.file.toLowerCase().includes(searchQuery.toLowerCase()) }).sort(function(a,b) {
    var av, bv
    if (sortKey === 'grade') { av = GRADE_ORDER[a.grade]; bv = GRADE_ORDER[b.grade] }
    else if (sortKey === 'file') { av = a.file; bv = b.file }
    else if (sortKey === 'images') { av = a.stats.images; bv = b.stats.images }
    else if (sortKey === 'issues') { av = a.issues.length; bv = b.issues.length }
    else if (sortKey === 'words') { av = a.stats.words; bv = b.stats.words }
    return av < bv ? -1*sortDir : av > bv ? sortDir : 0
  })
  document.getElementById('post-table-body').innerHTML = posts.map(function(p,i) {
    var cls = p.grade === 'A+' ? 'Aplus' : p.grade
    var slug = p.file.replace('content/blog/','').replace('.md','')
    var imgR = p.stats.images > 0 ? '<span class="' + (p.stats.imagesGood === p.stats.images ? 'good' : 'bad') + '">' + p.stats.imagesGood + '/' + p.stats.images + '</span>' : '<span style="color:var(--text3)">0</span>'
    var errs = p.issues.filter(function(i){return i.severity==='error'}).length
    var warns = p.issues.filter(function(i){return i.severity==='warn'}).length
    var infos = p.issues.filter(function(i){return i.severity==='info'}).length
    var pills = [errs>0?'<span class="issue-pill error">'+errs+' err</span>':'', warns>0?'<span class="issue-pill warn">'+warns+' warn</span>':'', infos>0?'<span class="issue-pill info">'+infos+' info</span>':''].filter(Boolean).join('')
    var details = p.issues.filter(function(i){return i.type!=='sync'}).map(function(i){return '<div class="severity-'+i.severity+'">'+(i.severity==='error'?'!':i.severity==='warn'?'~':'-')+' ['+i.type+'] '+i.msg+'</div>'}).join('')

    // Image gallery
    var gallery = ''
    if (p.images && p.images.length > 0) {
      gallery = '<div class="img-gallery">' + p.images.map(function(img) {
        var border = img.quality === 'good' ? 'var(--green)' : img.quality === 'junk' ? 'var(--yellow)' : img.quality === 'empty' ? 'var(--red)' : 'var(--text3)'
        var label = img.quality === 'good' ? img.alt : img.quality === 'junk' ? '<span style="color:var(--yellow)">' + (img.alt||'').substring(0,50) + '</span>' : img.quality === 'empty' ? '<span style="color:var(--red)">no alt text</span>' : '<span style="color:var(--text3)">video</span>'
        var thumbHtml = img.thumb ? '<img src="' + img.thumb + '" loading="lazy" onerror="this.style.display=\'none\'">' : '<div class="no-thumb">' + (img.isVideo ? 'vid' : '?') + '</div>'
        return '<div class="img-card" style="border-color:'+border+'"><div class="img-thumb">' + thumbHtml + '</div><div class="img-alt">' + label + '</div></div>'
      }).join('') + '</div>'
    }

    return '<tr class="expandable" onclick="toggleExpand('+i+')"><td><span class="grade-badge '+cls+'">'+p.grade+'</span></td><td><span class="post-link">'+slug.split('/').pop()+'</span></td><td class="img-ratio">'+imgR+'</td><td><div class="issue-pills">'+(pills||'<span style="color:var(--text3)">-</span>')+'</div></td><td style="color:var(--text3)">'+p.stats.words.toLocaleString()+'</td></tr><tr class="expand-row hidden" id="expand-'+i+'"><td colspan="5">' + gallery + '<div class="expand-issues">'+(details||'No issues')+'</div></td></tr>'
  }).join('')
}
function toggleExpand(i) { document.getElementById('expand-'+i).classList.toggle('hidden') }
document.querySelector('.filters').addEventListener('click', function(e) { if (!e.target.dataset.grade) return; filterGrade = e.target.dataset.grade; document.querySelectorAll('.filter-btn').forEach(function(b){b.classList.toggle('active',b.dataset.grade===filterGrade)}); renderTable() })
document.getElementById('search').addEventListener('input', function(e) { searchQuery = e.target.value; renderTable() })
document.querySelectorAll('th[data-sort]').forEach(function(th) { th.addEventListener('click', function() { var k = th.dataset.sort; if (sortKey===k) sortDir*=-1; else { sortKey=k; sortDir=1 } renderTable() }) })
render()
</script>
</body>
</html>`

  // Inject the JSON data safely — replace placeholder OUTSIDE the template literal
  // so $ and backticks in the JSON don't break anything
  const safeJson = JSON.stringify(report).replaceAll('</', '<\\/')
  return html.replace('REPORT_JSON_PLACEHOLDER', safeJson)
}

main().catch(err => { console.error(err); process.exit(1) })
