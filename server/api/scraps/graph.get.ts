/**
 * @file scraps/graph.get.ts
 * @description GET /api/scraps/graph. Slim scraps list for /threads and /tag/*:
 *   [{ id, title, summary (120 chars), content (80 chars, only when no title or
 *   summary), tags, concept_tags, created_at }], newest 500. The full scraps
 *   route returns whole rows (~3.5MB) and both pages SSR-serialized all of it into
 *   their HTML payload. Reads Supabase (env SUPABASE_URL, SUPABASE_KEY).
 *   Cached 10 min. Returns [] without creds; throws 502 on a query error.
 */
import { createClient } from '@supabase/supabase-js'
import { serverEnv } from '~/server/utils/serverEnv'

const SUMMARY_CHARS = 120

export default defineCachedEventHandler(
  async () => {
    const supabaseUrl = serverEnv('SUPABASE_URL')
    const supabaseKey = serverEnv('SUPABASE_KEY')
    if (!supabaseUrl || !supabaseKey) return []

    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data, error } = await supabase
      .from('scraps')
      .select('id, title, summary, content, tags, concept_tags, created_at')
      // Privacy gate: only scraps EJ marked shared are public.
      .eq('shared', true)
      .order('created_at', { ascending: false })
      .limit(500)

    // Throw rather than return [] so a Supabase blip isn't cached for 10 min
    if (error) {
      console.error('❌ Scraps graph query error:', error.message)
      throw createError({ statusCode: 502, message: 'Failed to fetch scraps' })
    }

    return (data || []).map((s) => ({
      id: String(s.id),
      title: s.title || null,
      summary: s.summary ? String(s.summary).slice(0, SUMMARY_CHARS) : null,
      content:
        s.title || s.summary ? null : String(s.content || '').slice(0, 80),
      tags: Array.isArray(s.tags) ? s.tags : [],
      concept_tags: Array.isArray(s.concept_tags) ? s.concept_tags : [],
      created_at: s.created_at,
    }))
  },
  { maxAge: 600 }
)
