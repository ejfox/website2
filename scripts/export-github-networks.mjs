#!/usr/bin/env node
/**
 * @file export-github-networks.mjs
 * @description For each JS/TS/Vue repo, shallow-clones it and runs ejfox/code-network-gen
 *              to produce a function-call graph. Output goes to data/github-repos/<name>.network.json.
 *              Smart-cached on pushedAt so re-runs only re-process changed repos.
 * @usage node scripts/export-github-networks.mjs
 */

import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  rmSync,
  readdirSync,
} from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync, spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPOS_DIR = join(__dirname, '../data/github-repos')
const TOOL_CACHE = join(__dirname, '../data/_tool-cache/code-network-gen')
const TOOL_REPO = 'https://github.com/ejfox/code-network-gen.git'
const GITHUB_OWNER = 'ejfox'

// Languages code-network-gen can analyze
const ELIGIBLE_LANGUAGES = new Set([
  'JavaScript',
  'TypeScript',
  'Vue',
  'Svelte',
])

function ensureTool() {
  if (existsSync(join(TOOL_CACHE, 'index.js'))) {
    // already cloned — pull latest to keep it fresh
    try {
      execSync('git pull --quiet', { cwd: TOOL_CACHE, stdio: 'pipe' })
    } catch {
      /* network failure is fine; keep cached version */
    }
  } else {
    mkdirSync(dirname(TOOL_CACHE), { recursive: true })
    console.log('Cloning code-network-gen tool...')
    execSync(`git clone --depth 1 ${TOOL_REPO} ${TOOL_CACHE}`, {
      stdio: 'inherit',
    })
  }
  if (!existsSync(join(TOOL_CACHE, 'node_modules'))) {
    console.log('Installing code-network-gen dependencies...')
    execSync('npm install --no-audit --no-fund --silent', {
      cwd: TOOL_CACHE,
      stdio: 'inherit',
    })
  }

  // Patch the tool to emit full repo-relative paths instead of just basenames.
  // We don't own code-network-gen, so this is a local string-replace re-applied
  // after every clone/pull. Idempotent via the sentinel comment.
  const SENTINEL = '/* website2-patch:relative-path */'
  const indexPath = join(TOOL_CACHE, 'index.js')
  let src = readFileSync(indexPath, 'utf-8')
  if (!src.includes(SENTINEL)) {
    src = src.replace(
      /const fileName = path\.basename\(filePath\);/g,
      `const fileName = (function(){ ${SENTINEL} const rel = path.relative(process.cwd(), filePath); return rel && !rel.startsWith('..') ? rel : path.basename(filePath); })();`
    )
    writeFileSync(indexPath, src)
  }
}

function parseCsv(text) {
  // tool emits quoted-field CSVs with no embedded quotes in our fields
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
  return lines.slice(1).map((line) => {
    const values = line
      .split(/","|^"|"$/)
      .filter((v) => v !== '')
      .map((v) => v.replace(/^"|"$/g, ''))
    const row = {}
    headers.forEach((h, i) => (row[h] = values[i] ?? ''))
    return row
  })
}

function analyzeRepo(repoName, pushedAt) {
  const outPath = join(REPOS_DIR, `${repoName}.network.json`)

  // Cache hit?
  if (existsSync(outPath)) {
    try {
      const cached = JSON.parse(readFileSync(outPath, 'utf-8'))
      if (cached.meta?.pushedAt === pushedAt) {
        return { name: repoName, cached: true, nodes: cached.meta.nodeCount }
      }
    } catch {
      /* fall through and rebuild */
    }
  }

  const cloneDir = join(tmpdir(), `code-net-${repoName}-${Date.now()}`)
  const outBase = join(cloneDir, '_network')

  try {
    execSync(
      `git clone --depth 1 --quiet https://github.com/${GITHUB_OWNER}/${repoName}.git ${cloneDir}`,
      { stdio: 'pipe' }
    )

    const result = spawnSync(
      'node',
      [join(TOOL_CACHE, 'index.js'), '--path', '.', '-o', outBase],
      { cwd: cloneDir, stdio: 'pipe', timeout: 60_000 }
    )

    if (result.status !== 0) {
      console.warn(
        `  ⚠️  ${repoName}: tool exited ${result.status} — ${result.stderr?.toString().split('\n')[0]}`
      )
      return { name: repoName, cached: false, nodes: 0, skipped: true }
    }

    const nodesCsv = `${outBase}_nodes.csv`
    const edgesCsv = `${outBase}_edges.csv`
    if (!existsSync(nodesCsv) || !existsSync(edgesCsv)) {
      return { name: repoName, cached: false, nodes: 0, skipped: true }
    }

    const nodes = parseCsv(readFileSync(nodesCsv, 'utf-8')).map((n) => ({
      id: n.id,
      label: n.label,
      type: n.type,
      lines: n.lines,
      file: (n.id || '').split(':')[0],
    }))
    const edges = parseCsv(readFileSync(edgesCsv, 'utf-8')).map((e) => ({
      source: e.source,
      target: e.target,
      type: e.type,
    }))

    const payload = {
      meta: {
        pushedAt,
        generatedAt: new Date().toISOString(),
        nodeCount: nodes.length,
        edgeCount: edges.length,
      },
      nodes,
      edges,
    }

    writeFileSync(outPath, JSON.stringify(payload))
    return { name: repoName, cached: false, nodes: nodes.length }
  } catch (err) {
    console.warn(`  ⚠️  ${repoName}: ${err.message.split('\n')[0]}`)
    return { name: repoName, cached: false, nodes: 0, skipped: true }
  } finally {
    if (existsSync(cloneDir)) rmSync(cloneDir, { recursive: true, force: true })
  }
}

async function main() {
  console.log('GitHub Code Network Export')
  console.log('==========================\n')

  if (!existsSync(REPOS_DIR)) {
    console.error('No data/github-repos directory — run github:export first.')
    process.exit(1)
  }

  ensureTool()

  const repoFiles = readdirSync(REPOS_DIR).filter(
    (f) => f.endsWith('.json') && !f.endsWith('.network.json')
  )

  const eligible = []
  for (const f of repoFiles) {
    try {
      const r = JSON.parse(readFileSync(join(REPOS_DIR, f), 'utf-8'))
      if (ELIGIBLE_LANGUAGES.has(r.language)) {
        eligible.push({ name: r.name, pushedAt: r.pushedAt })
      }
    } catch {
      /* skip malformed */
    }
  }

  console.log(
    `Found ${eligible.length} eligible repos (JS/TS/Vue/Svelte) out of ${repoFiles.length}\n`
  )

  let cachedCount = 0
  let analyzedCount = 0
  let skippedCount = 0
  let totalNodes = 0

  for (const { name, pushedAt } of eligible) {
    process.stdout.write(`  ${name}... `)
    const r = analyzeRepo(name, pushedAt)
    if (r.cached) {
      cachedCount++
      process.stdout.write(`cached (${r.nodes} nodes)\n`)
    } else if (r.skipped) {
      skippedCount++
      process.stdout.write('skipped\n')
    } else {
      analyzedCount++
      totalNodes += r.nodes
      process.stdout.write(`✓ ${r.nodes} nodes\n`)
    }
  }

  console.log(`\n✅ Done.`)
  console.log(
    `🚀 ${cachedCount} cached, ${analyzedCount} analyzed, ${skippedCount} skipped`
  )
  console.log(`Total nodes across newly-analyzed repos: ${totalNodes}`)
}

main().catch((err) => {
  console.error('❌ Fatal:', err.message)
  process.exit(1)
})
