/**
 * @file scraps.get.ts
 * @description Fetches digital scrapbook entries from Supabase database with full metadata including tags, location, and relationships
 * @endpoint GET /api/scraps
 * @returns Array of scrap objects with content, tags, source info, geolocation, screenshots, and metadata, sorted by creation date descending
 */
import { defineEventHandler } from 'h3'
import { createClient } from '@supabase/supabase-js'

interface Scrap {
  id: string
  title: string | null
  summary: string | null
  url: string | null
  content: string | null
  created_at: string
  updated_at: string | null
  published_at: string | null
  tags: string[] | null
  concept_tags: string[] | null
  type: string | null
  source: string | null
  content_type: string | null
  location: string | null
  latitude: number | null
  longitude: number | null
  screenshot_url: string | null
  shared: boolean
  relationships: any[] | null
  extraction_confidence: any | null
  financial_analysis: any | null
  metadata: any | null
}

export default defineEventHandler(async (): Promise<Scrap[]> => {
  try {
    const config = useRuntimeConfig()

    // Check if Supabase credentials are configured
    if (!config.SUPABASE_URL || !config.SUPABASE_KEY) {
      console.warn('❌ Supabase credentials not configured')
      return []
    }

    console.log('🔗 Connecting to Supabase:', config.SUPABASE_URL)
    const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_KEY)

    // Fetch ALL available scrap data from Supabase
    const { data, error } = await supabase
      .from('scraps')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Supabase query error:', error)
      return []
    }

    console.log(`✅ Fetched ${data?.length || 0} scraps from Supabase`)

    // Map and clean the data, preserving all fields
    const scraps = (data || []).map((scrap: any) => ({
      id: scrap.id,
      title: scrap.title || null,
      summary: scrap.summary || null,
      url: scrap.url || null,
      content: scrap.content || null,
      created_at: scrap.created_at,
      updated_at: scrap.updated_at || null,
      published_at: scrap.published_at || null,
      tags: Array.isArray(scrap.tags) ? scrap.tags : null,
      concept_tags: Array.isArray(scrap.concept_tags)
        ? scrap.concept_tags
        : null,
      type: scrap.type || null,
      source: scrap.source || null,
      content_type: scrap.content_type || null,
      location: scrap.location || null,
      latitude: scrap.latitude || null,
      longitude: scrap.longitude || null,
      screenshot_url: scrap.screenshot_url || null,
      shared: scrap.shared || false,
      relationships: scrap.relationships || null,
      extraction_confidence: scrap.extraction_confidence || null,
      financial_analysis: scrap.financial_analysis || null,
      metadata: scrap.metadata || null,
    }))

    return scraps
  } catch (error) {
    console.error('❌ Error fetching scraps:', error)
    return []
  }
})
