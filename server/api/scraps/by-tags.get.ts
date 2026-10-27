/**
 * @file scraps/by-tags.get.ts
 * @description GET /api/scraps/by-tags?tags=journalism,osint&limit=8. Shared
 *   scraps whose tags overlap the list: [{ title, url, tags, hostname, created_at }].
 *   Used for related-scraps on blog and tag pages. Reads Supabase (env
 *   SUPABASE_URL, SUPABASE_KEY). No cache in this file, so each call pulls
 *   500 rows. Returns [] on no tags, missing creds or any error.
 */
import { defineEventHandler, getQuery } from 'h3'
import { createClient } from '@supabase/supabase-js'
import { serverEnv } from '~/server/utils/serverEnv'

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
  // Pinboard stores untitled bookmarks as the literal "[no title]"
  if (!title || title.trim() === '[no title]') {
    if (!url) return ''
    try {
      return new URL(url).hostname.replace(/^www\./, '')
    } catch {
      return ''
    }
  }

  // If the title looks like an AI summary, fall back to hostname
  const isAiTitle = AI_TITLE_PREFIXES.some((p) => title.startsWith(p))
  if (isAiTitle && url) {
    try {
      return new URL(url).hostname.replace(/^www\./, '')
    } catch {
      /* */
    }
  }

  return title
}

export default defineEventHandler(async (event) => {
  const { tags, limit = '8' } = getQuery(event) as {
    tags?: string
    limit?: string
  }
  if (!tags) return []

  const tagList = tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
  if (!tagList.length) return []

  const supabaseUrl = serverEnv('SUPABASE_URL')
  const supabaseKey = serverEnv('SUPABASE_KEY')
  if (!supabaseUrl || !supabaseKey) return []

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch recent scraps and filter server-side for tag overlap
    // Supabase array operators can be inconsistent across column types
    const { data, error } = await supabase
      .from('scraps')
      .select('title, url, tags, concept_tags, summary, created_at')
      // Privacy gate: only scraps EJ marked shared are public.
      .eq('shared', true)
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) {
      console.error('Scraps by-tags query error:', error.message)
      return []
    }

    const tagSet = new Set(tagList)
    const maxResults = Number.parseInt(limit) || 8
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
        try {
          hostname = new URL(s.url).hostname.replace(/^www\./, '')
        } catch {
          /* */
        }
      }
      return {
        title: cleanTitle(s.title, s.url),
        url: s.url,
        // !-prefixed tags are special meta tags (see server/routes/tags.json.ts).
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
