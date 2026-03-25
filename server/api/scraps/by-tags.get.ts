/**
 * @file by-tags.get.ts
 * @description Returns scraps matching any of the provided tags
 * @endpoint GET /api/scraps/by-tags?tags=journalism,osint&limit=8
 */
import { defineEventHandler, getQuery } from 'h3'
import { createClient } from '@supabase/supabase-js'

// AI summarizer sometimes overwrites the title field with a summary prefix
const AI_TITLE_PREFIXES = [
  'Main Thesis:',
  'Breaking News:',
  'Summary:',
  'The article ',
  '**Summary',
  '• ',
]

function cleanTitle(title: string | null, url: string | null): string {
  if (!title) {
    if (!url) return ''
    try { return new URL(url).hostname.replace(/^www\./, '') } catch { return '' }
  }

  // If the title looks like an AI summary, fall back to hostname
  const isAiTitle = AI_TITLE_PREFIXES.some((p) => title.startsWith(p))
  if (isAiTitle && url) {
    try { return new URL(url).hostname.replace(/^www\./, '') } catch { /* */ }
  }

  return title
}

export default defineEventHandler(async (event) => {
  const { tags, limit = '8' } = getQuery(event) as { tags?: string; limit?: string }
  if (!tags) return []

  const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean)
  if (!tagList.length) return []

  const config = useRuntimeConfig()
  if (!config.SUPABASE_URL || !config.SUPABASE_KEY) return []

  try {
    const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_KEY)

    // Fetch recent scraps and filter server-side for tag overlap
    // Supabase array operators can be inconsistent across column types
    const { data, error } = await supabase
      .from('scraps')
      .select('title, url, tags, concept_tags, summary, created_at')
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) {
      console.error('Scraps by-tags query error:', error.message)
      return []
    }

    const tagSet = new Set(tagList)
    const maxResults = parseInt(limit) || 8
    const matched = (data || [])
      .filter((s) => {
        // Must have at least a title or URL to be displayable
        if (!s.title && !s.url) return false
        const sTags = s.tags || []
        return sTags.some((t: string) => tagSet.has(t))
      })
      .slice(0, maxResults)

    return matched.map((s) => {
      let hostname = ''
      if (s.url) {
        try { hostname = new URL(s.url).hostname.replace(/^www\./, '') } catch { /* */ }
      }
      return {
        title: cleanTitle(s.title, s.url),
        url: s.url,
        tags: (s.tags || []).filter((t: string) => !t.startsWith('!')),
        hostname,
        created_at: s.created_at,
      }
    })
  } catch (err) {
    console.error('Scraps by-tags error:', err)
    return []
  }
})
