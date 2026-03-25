/**
 * @file temporal-context.get.ts
 * @description Returns cross-referenced context for a given date: what was being read,
 *   active predictions, scraps saved, and git activity from the same period.
 * @endpoint GET /api/temporal-context?date=2023-10-15
 */
import { defineEventHandler, getQuery } from 'h3'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import matter from 'gray-matter'
import { glob } from 'glob'
import { createClient } from '@supabase/supabase-js'

const WINDOW_DAYS = 30 // ±30 days from the target date

function withinWindow(target: Date, candidate: string | undefined, days = WINDOW_DAYS): boolean {
  if (!candidate) return false
  try {
    const d = new Date(candidate)
    if (isNaN(d.getTime())) return false
    const diff = Math.abs(target.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
    return diff <= days
  } catch {
    return false
  }
}

export default defineEventHandler(async (event) => {
  const { date } = getQuery(event) as { date?: string }
  if (!date) return { error: 'date parameter required' }

  const targetDate = new Date(date)
  if (isNaN(targetDate.getTime())) return { error: 'invalid date' }

  const results: {
    reading: Array<{ title: string; author: string; slug: string; highlights: number }>
    predictions: Array<{ statement: string; confidence: number; status: string; slug: string }>
    scraps: Array<{ title: string; tags: string[]; url: string | null }>
    commits: number | null
  } = {
    reading: [],
    predictions: [],
    scraps: [],
    commits: null,
  }

  // --- Reading: books annotated around this time ---
  try {
    const readingDir = join(process.cwd(), 'content/processed/reading')
    const files = await fs.readdir(readingDir)
    const jsonFiles = files.filter((f) => f.endsWith('.json'))

    for (const file of jsonFiles) {
      try {
        const raw = await fs.readFile(join(readingDir, file), 'utf-8')
        const book = JSON.parse(raw)
        const annotatedDate = book.metadata?.['kindle-sync']?.lastAnnotatedDate
        if (withinWindow(targetDate, annotatedDate, 60)) {
          results.reading.push({
            title: book.metadata?.['kindle-sync']?.title || book.title || file.replace('.json', ''),
            author: book.metadata?.['kindle-sync']?.author || '',
            slug: file.replace('.json', ''),
            highlights: book.metadata?.['kindle-sync']?.highlightsCount || 0,
          })
        }
      } catch { /* skip bad files */ }
    }
    // Sort by highlights descending, take top 3
    results.reading.sort((a, b) => b.highlights - a.highlights)
    results.reading = results.reading.slice(0, 3)
  } catch { /* reading dir may not exist */ }

  // --- Predictions: active or recently resolved around this time ---
  try {
    const predictionsDir = join(process.cwd(), 'content', 'predictions')
    const predFiles = await glob('**/*.md', { cwd: predictionsDir })

    for (const file of predFiles) {
      try {
        const raw = await fs.readFile(join(predictionsDir, file), 'utf-8')
        const { data } = matter(raw)
        if (data.visibility !== 'public') continue

        const created = data.created
        const deadline = data.deadline
        const resolved = data.resolved_date

        // Was this prediction active around the target date?
        // Active means: created before target AND (deadline after target OR resolved near target)
        const createdDate = created ? new Date(created) : null
        const deadlineDate = deadline ? new Date(deadline) : null
        const wasCreatedBefore = createdDate && createdDate.getTime() <= targetDate.getTime() + (WINDOW_DAYS * 86400000)
        const deadlineAfter = deadlineDate && deadlineDate.getTime() >= targetDate.getTime() - (WINDOW_DAYS * 86400000)
        const resolvedNear = withinWindow(targetDate, resolved, 60)

        if (wasCreatedBefore && (deadlineAfter || resolvedNear || !deadline)) {
          results.predictions.push({
            statement: data.statement || '',
            confidence: data.confidence || 0,
            status: data.status || (data.resolved ? 'resolved' : 'active'),
            slug: file.replace(/\.md$/, ''),
          })
        }
      } catch { /* skip */ }
    }
    results.predictions = results.predictions.slice(0, 3)
  } catch { /* predictions dir may not exist */ }

  // --- Scraps: bookmarks/clippings saved around this time ---
  try {
    const config = useRuntimeConfig()
    if (config.SUPABASE_URL && config.SUPABASE_KEY) {
      const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_KEY)
      const windowStart = new Date(targetDate.getTime() - (WINDOW_DAYS * 86400000)).toISOString()
      const windowEnd = new Date(targetDate.getTime() + (WINDOW_DAYS * 86400000)).toISOString()

      const { data: scraps } = await supabase
        .from('scraps')
        .select('title, tags, url, created_at')
        .gte('created_at', windowStart)
        .lte('created_at', windowEnd)
        .order('created_at', { ascending: false })
        .limit(5)

      if (scraps?.length) {
        results.scraps = scraps
          .filter((s) => s.title || s.url) // skip scraps with no title and no URL
          .map((s) => {
            // Clean AI-generated title prefixes
            let title = s.title || ''
            const aiPrefixes = ['Main Thesis:', 'Breaking News:', 'Summary:', 'The article ', '**Summary', '• ']
            const isAiTitle = aiPrefixes.some((p) => title.startsWith(p))
            if (!title || isAiTitle) {
              try { title = s.url ? new URL(s.url).hostname.replace(/^www\./, '') : 'Untitled' } catch { title = 'Untitled' }
            }
            return {
              title,
              tags: (s.tags || []).filter((t: string) => !t.startsWith('!')).slice(0, 3),
              url: s.url,
            }
          })
      }
    }
  } catch { /* supabase may not be configured */ }

  // --- Git commits: count for that month ---
  try {
    const commitsPath = join(process.cwd(), 'data/github-commits.json')
    const raw = await fs.readFile(commitsPath, 'utf-8')
    const commits = JSON.parse(raw)
    const targetMonth = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`

    if (Array.isArray(commits)) {
      results.commits = commits.filter((c: { date?: string }) => {
        return c.date?.startsWith(targetMonth)
      }).length
    }
  } catch { /* commits file may not exist */ }

  return results
})
