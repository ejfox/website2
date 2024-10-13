import type { H3Event } from 'h3'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

export default defineEventHandler(async (event) => {
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const supabaseKey = process.env.SUPABASE_KEY || ''
  const supabase = createClient(supabaseUrl, supabaseKey)
  const body = await readBody(event)
  const page = body?.page || 1
  const pageSize = body?.pageSize || 32
  const offset = (page - 1) * pageSize

  console.log({ page, pageSize, offset })

  const {
    data: scraps,
    error,
    count
  } = await supabase
    .from('scraps')
    .select('id, source, content, summary, created_at, updated_at, tags, relationships, metadata, scrap_id, graph_imported', { count: 'exact' }) // Exclude embedding
    .range(offset, offset + pageSize - 1)
    .order('created_at', { ascending: false })

  // console.log('scraps', scraps)

  if (error) {
    return new Response(JSON.stringify(error), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    })
  }

  const returnObj = { scraps, count }
  console.log('returnObj', returnObj)

  return new Response(JSON.stringify(returnObj), {
    headers: { 'content-type': 'application/json' }
  })
})
