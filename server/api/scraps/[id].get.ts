/**
 * @file [id].get.ts
 * @description One shared scrap by id: the permalink behind /scraps/<id> (and the QR on
 * Scrapworld card backs, 2026-10-29)
 * @endpoint GET /api/scraps/:id
 * @returns The scrap, or 404 when the id is malformed, missing, or not shared
 *
 * Same rules as /api/scraps: only shared rows (the public-visibility flag), explicit
 * slim columns (never the jsonb embeddings), cached per id for an hour.
 */
import { createClient } from '@supabase/supabase-js'
import { serverEnv } from '~/server/utils/serverEnv'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

const COLUMNS = [
  'id',
  'title',
  'summary',
  'url',
  'created_at',
  'published_at',
  'tags',
  'concept_tags',
  'type',
  'source',
  'content_type',
  'location',
  'screenshot_url',
  'relationships',
  'metadata',
].join(', ')

function scrapId(event: Parameters<typeof getRouterParam>[0]) {
  return String(getRouterParam(event, 'id') || '').toLowerCase()
}

export default defineCachedEventHandler(
  async (event) => {
    const id = scrapId(event)
    if (!UUID.test(id)) {
      throw createError({ statusCode: 404, message: 'No such scrap' })
    }

    const supabaseUrl = serverEnv('SUPABASE_URL')
    const supabaseKey = serverEnv('SUPABASE_KEY')
    if (!supabaseUrl || !supabaseKey) {
      throw createError({ statusCode: 503, message: 'Scraps unavailable' })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data, error } = await supabase
      .from('scraps')
      .select(COLUMNS)
      .eq('id', id)
      .eq('shared', true)
      .maybeSingle()

    // Throw rather than cache an empty answer for an hour on a Supabase blip
    if (error) {
      console.error('❌ Supabase query error:', error)
      throw createError({ statusCode: 502, message: 'Failed to fetch scrap' })
    }
    if (!data) {
      throw createError({ statusCode: 404, message: 'No such scrap' })
    }

    const s = data as unknown as Record<string, unknown>
    const meta = (s.metadata as Record<string, unknown>) || {}
    return {
      id: String(s.id),
      title: (s.title as string) || null,
      summary: (s.summary as string) || null,
      url: (s.url as string) || null,
      created_at: s.created_at as string,
      published_at: (s.published_at as string) || null,
      tags: Array.isArray(s.tags) ? (s.tags as string[]) : [],
      concept_tags: Array.isArray(s.concept_tags) ? (s.concept_tags as string[]) : [],
      type: (s.type as string) || null,
      source: (s.source as string) || null,
      content_type: (s.content_type as string) || null,
      location: (s.location as string) || null,
      screenshot_url: (s.screenshot_url as string) || null,
      relationships: Array.isArray(s.relationships) ? s.relationships.length : 0,
      to_read: Boolean(meta.toread),
    }
  },
  { maxAge: 3600, getKey: (event) => `scrap-${scrapId(event)}` }
)
