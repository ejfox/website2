/**
 * @file scraps/tags.get.ts
 * @description GET /api/scraps/tags. Sorted, deduped tag vocabulary from Supabase
 *   scraps (env SUPABASE_URL, SUPABASE_KEY). Public API, no on-site caller
 *   (allowlisted). No cache. Returns [] on missing creds or any error.
 */
import { defineEventHandler } from 'h3'
import { createClient } from '@supabase/supabase-js'
import { serverEnv } from '~/server/utils/serverEnv'

export default defineEventHandler(async (): Promise<string[]> => {
  try {
    const supabaseUrl = serverEnv('SUPABASE_URL')
    const supabaseKey = serverEnv('SUPABASE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      console.warn('❌ Supabase credentials not configured')
      return []
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch all scraps to extract unique tags
    const { data, error } = await supabase.from('scraps').select('tags')

    if (error) {
      console.error('❌ Supabase query error:', error)
      return []
    }

    // Extract and deduplicate tags
    const tagSet = new Set<string>()
    data?.forEach((scrap) => {
      if (scrap.tags && Array.isArray(scrap.tags)) {
        scrap.tags.forEach((tag) => tagSet.add(tag))
      }
    })

    const tags = Array.from(tagSet).sort()

    return tags
  } catch (error) {
    console.error('❌ Error fetching tags:', error)
    return []
  }
})
