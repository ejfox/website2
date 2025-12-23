/**
 * @file scraps/tags.get.ts
 * @description Extracts and deduplicates all unique tags from Supabase scraps collection
 * @endpoint GET /api/scraps/tags
 * @returns Sorted array of unique tag strings from all scraps
 */
import { defineEventHandler } from 'h3'
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (): Promise<string[]> => {
  try {
    const config = useRuntimeConfig()

    if (!config.SUPABASE_URL || !config.SUPABASE_KEY) {
      console.warn('❌ Supabase credentials not configured')
      return []
    }

    console.info('🔗 Fetching unique tags from Supabase')
    const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_KEY)

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
    console.info(`✅ Fetched ${tags.length} unique tags`)

    return tags
  } catch (error) {
    console.error('❌ Error fetching tags:', error)
    return []
  }
})
