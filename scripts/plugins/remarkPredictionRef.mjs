/**
 * @file plugins/remarkPredictionRef.mjs
 * @description Remark plugin that converts :prediction{id="..."} / ::prediction{id="..."} directives
 *   into HTML with embedded payload + static readable fallback. Client-side plugin upgrades
 *   these into mounted Vue components.
 * @usage .use(remarkDirective).use(remarkPredictionRef)
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { visit } from 'unist-util-visit'
import matter from 'gray-matter'

const PREDICTIONS_DIR = path.join(process.cwd(), 'content/predictions')

// Cache file loads across a single build run
const predictionCache = new Map()

async function loadPrediction(id) {
  if (predictionCache.has(id)) return predictionCache.get(id)

  const tryPaths = [
    path.join(PREDICTIONS_DIR, `${id}.md`),
  ]
  // Support year-prefixed ids: 2025-foo-bar → content/predictions/2025/foo-bar.md
  if (/^\d{4}-/.test(id)) {
    const [year, ...rest] = id.split('-')
    tryPaths.push(path.join(PREDICTIONS_DIR, year, `${rest.join('-')}.md`))
  }

  for (const p of tryPaths) {
    try {
      const raw = await fs.readFile(p, 'utf-8')
      const { data } = matter(raw)
      predictionCache.set(id, data)
      return data
    } catch {
      // try next path
    }
  }

  predictionCache.set(id, null)
  return null
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function statusGlyph(data) {
  if (!data.resolved) return '◌'
  if (data.status === 'correct') return '✓'
  if (data.status === 'incorrect') return '✗'
  return '·'
}

function truncate(str, n = 80) {
  if (!str) return ''
  const clean = String(str).replace(/\s+/g, ' ').trim()
  return clean.length > n ? clean.slice(0, n - 1) + '…' : clean
}

// Trim the payload we embed so the HTML doesn't bloat
function buildPayload(id, data) {
  return {
    id: data.id || id,
    statement: data.statement,
    confidence: data.confidence,
    deadline: data.deadline,
    resolved: data.resolved ?? false,
    status: data.status,
    resolution: data.resolution,
    resolved_date: data.resolved_date,
    hash: data.hash,
    gitCommit: data.gitCommit,
    updates: data.updates || [],
    categories: data.categories || [],
  }
}

function renderInlineHtml(id, data) {
  const payload = buildPayload(id, data)
  const payloadJson = escapeHtml(JSON.stringify(payload))
  const glyph = statusGlyph(data)
  const confidence = typeof data.confidence === 'number' ? `${data.confidence}%` : ''
  const statement = truncate(data.statement, 60)
  const resolvedWrong = data.resolved && data.status === 'incorrect'
  const classes = [
    'prediction-ref',
    `prediction-ref--${data.resolved ? data.status || 'resolved' : 'pending'}`,
    resolvedWrong ? 'prediction-ref--wrong' : '',
  ].filter(Boolean).join(' ')

  return `<a href="/predictions/${escapeHtml(payload.id)}" class="${classes}" data-prediction-ref="inline" data-payload="${payloadJson}"><span class="prediction-ref__glyph">${glyph}</span><span class="prediction-ref__confidence">${escapeHtml(confidence)}</span><span class="prediction-ref__statement">${escapeHtml(statement)}</span></a>`
}

function renderBlockHtml(id, data) {
  const payload = buildPayload(id, data)
  const payloadJson = escapeHtml(JSON.stringify(payload))
  const glyph = statusGlyph(data)
  const confidence = typeof data.confidence === 'number' ? `${data.confidence}%` : ''
  const statement = escapeHtml(data.statement || '')
  const resolution = data.resolved
    ? escapeHtml(truncate(data.resolution, 240))
    : `Awaiting ${data.deadline ? escapeHtml(String(data.deadline).slice(0, 10)) : 'resolution'}`

  return `<aside class="prediction-card prediction-card--${data.resolved ? data.status || 'resolved' : 'pending'}" data-prediction-ref="block" data-payload="${payloadJson}">
  <div class="prediction-card__header">
    <span class="prediction-card__glyph">${glyph}</span>
    <span class="prediction-card__confidence">${escapeHtml(confidence)}</span>
    <a class="prediction-card__link" href="/predictions/${escapeHtml(payload.id)}">prediction</a>
  </div>
  <p class="prediction-card__statement">${statement}</p>
  <p class="prediction-card__resolution">${resolution}</p>
</aside>`
}

function renderMissingHtml(id, display) {
  const tag = display === 'block' ? 'aside' : 'span'
  return `<${tag} class="prediction-ref-missing">[prediction: ${escapeHtml(id)} not found]</${tag}>`
}

export function remarkPredictionRef() {
  return async (tree, file) => {
    // Collect all directive nodes first, then resolve async
    const targets = []

    visit(tree, (node) => {
      const isInline = node.type === 'textDirective'
      const isBlock = node.type === 'leafDirective' || node.type === 'containerDirective'
      if (!isInline && !isBlock) return
      if (node.name !== 'prediction') return
      const id = node.attributes?.id
      if (!id) return
      targets.push({ node, id, display: isBlock ? 'block' : 'inline' })
    })

    for (const { node, id, display } of targets) {
      const data = await loadPrediction(id)
      if (!data) {
        // eslint-disable-next-line no-console
        console.warn(`[remarkPredictionRef] prediction not found: ${id} (in ${file?.path || 'unknown'})`)
        node.type = 'html'
        node.value = renderMissingHtml(id, display)
        node.children = []
        continue
      }
      node.type = 'html'
      node.value = display === 'block' ? renderBlockHtml(id, data) : renderInlineHtml(id, data)
      node.children = []
    }
  }
}
