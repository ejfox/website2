import type { H3Event } from 'h3'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

interface ScrapFilters {
  type?: string
  source?: string
  shared?: boolean
}

interface QueryParams {
  page?: number
  limit?: number
  filters?: ScrapFilters
  sortBy?: 'newest' | 'oldest' | 'updated'
}

export default defineEventHandler(async (event) => {
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const supabaseKey = process.env.SUPABASE_KEY || ''
  const supabase = createClient(supabaseUrl, supabaseKey)

  const body = await readBody<QueryParams>(event)
  const page = body?.page || 1
  const limit = body?.limit || 50
  const offset = (page - 1) * limit
  const filters = body?.filters || {}
  const sortBy = body?.sortBy || 'newest'

  // Start building the query
  let query = supabase.from('scraps').select('*', { count: 'exact' })

  // Apply filters
  if (filters.type) {
    query = query.eq('type', filters.type)
  }
  if (filters.source) {
    query = query.eq('source', filters.source)
  }
  if (typeof filters.shared !== 'undefined') {
    query = query.eq('shared', filters.shared)
  }

  // Apply sorting
  switch (sortBy) {
    case 'oldest':
      query = query.order('created_at', { ascending: true })
      break
    case 'updated':
      query = query
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false })
      break
    case 'newest':
    default:
      // Sort by most relevant timestamp, cascading through options
      query = query
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false })
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1)

  // Execute query
  const { data: scraps, error, count } = await query

  if (error) {
    console.error('Supabase error:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch scraps',
      cause: error
    })
  }

  // Post-process scraps to handle dates
  const processedScraps = scraps?.map((scrap) => ({
    ...scrap,
    // Ensure dates are not in the future
    created_at:
      new Date(scrap.created_at) > new Date()
        ? new Date().toISOString()
        : scrap.created_at,
    published_at:
      scrap.published_at && new Date(scrap.published_at) > new Date()
        ? new Date().toISOString()
        : scrap.published_at
  }))

  return {
    scraps: processedScraps,
    count,
    page,
    limit,
    totalPages: count ? Math.ceil(count / limit) : 0
  }
})
