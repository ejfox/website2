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
  relationships: unknown[] | null
  extraction_confidence: Record<string, unknown> | null
  financial_analysis: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
}

export default defineEventHandler(async (): Promise<Scrap[]> => {
  try {
    const config = useRuntimeConfig()

    // Check if Supabase credentials are configured
    if (!config.SUPABASE_URL || !config.SUPABASE_KEY) {
      console.warn('❌ Supabase credentials not configured')
      return []
    }

    console.info('🔗 Connecting to Supabase:', config.SUPABASE_URL)
    const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_KEY)

    // Fetch recent scraps with a limit to prevent timeout
    // The full dataset can be very large; most use cases only need recent items
    const { data, error } = await supabase
      .from('scraps')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) {
      console.error('❌ Supabase query error:', error)
      return []
    }

    console.info(`✅ Fetched ${data?.length || 0} scraps from Supabase`)

    // Map and clean the data, preserving all fields
    // Cast Supabase data to expected shape - the select('*') returns the table row
    const scraps: Scrap[] = (data || []).map((scrap) => ({
      id: String(scrap.id),
      title: (scrap.title as string) || null,
      summary: (scrap.summary as string) || null,
      url: (scrap.url as string) || null,
      content: (scrap.content as string) || null,
      created_at: scrap.created_at as string,
      updated_at: (scrap.updated_at as string) || null,
      published_at: (scrap.published_at as string) || null,
      tags: Array.isArray(scrap.tags) ? scrap.tags : null,
      concept_tags: Array.isArray(scrap.concept_tags)
        ? scrap.concept_tags
        : null,
      type: (scrap.type as string) || null,
      source: (scrap.source as string) || null,
      content_type: (scrap.content_type as string) || null,
      location: (scrap.location as string) || null,
      latitude: (scrap.latitude as number) || null,
      longitude: (scrap.longitude as number) || null,
      screenshot_url: (scrap.screenshot_url as string) || null,
      shared: Boolean(scrap.shared),
      relationships: (scrap.relationships as unknown[]) || null,
      extraction_confidence:
        (scrap.extraction_confidence as Record<string, unknown>) || null,
      financial_analysis:
        (scrap.financial_analysis as Record<string, unknown>) || null,
      metadata: (scrap.metadata as Record<string, unknown>) || null,
    }))

    return scraps
  } catch (error) {
    console.error('❌ Error fetching scraps:', error)
    return []
  }
})
