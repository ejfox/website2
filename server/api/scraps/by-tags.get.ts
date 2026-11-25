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
import {
  isUsableScrap,
  publicTags,
  cleanTitle,
  hostnameOf,
} from '~/server/utils/scrap-schema'

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
      .select(
        'scrap_id, source, shared, title, url, tags, concept_tags, summary, created_at'
      )
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
        // Sentinels and !hide rows never show (shared is enforced in the query)
        if (!isUsableScrap(s)) return false
        // Must have at least a title or URL to be displayable
        if (!s.title && !s.url) return false
        // Match on public tags only; !-tags are private control tags
        return publicTags(s.tags).some((t) => tagSet.has(t))
      })
      .slice(0, maxResults)

    return matched.map((s) => ({
      // Cleaned title, falling back to the hostname when nothing usable is left
      title: cleanTitle(s.title) || hostnameOf(s.url),
      url: s.url,
      tags: publicTags(s.tags),
      hostname: hostnameOf(s.url),
      created_at: s.created_at,
    }))
  } catch (err) {
    console.error('Scraps by-tags error:', err)
    return []
  }
})
