import type { H3Event } from 'h3'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { gzipSync } from 'zlib'

dotenv.config()

export default defineEventHandler(async (event) => {
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const supabaseKey = process.env.SUPABASE_KEY || ''
  const supabase = createClient(supabaseUrl, supabaseKey)
  const body = await readBody(event)
  const page = body?.page || 1
  const pageSize = body?.pageSize || 10 // Reduce the page size for smaller payloads
  const offset = (page - 1) * pageSize

  console.log({ page, pageSize, offset })

  // Exclude large fields like 'embedding' and select only necessary columns
  const {
    data: scraps,
    error,
    count
  } = await supabase
    .from('scraps')
    .select('id, source, content, summary, created_at, updated_at, tags, scrap_id', { count: 'exact' })
    .range(offset, offset + pageSize - 1)
    .order('created_at', { ascending: false })

  if (error) {
    return new Response(JSON.stringify(error), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    })
  }

  const returnObj = { scraps, count }
  
  // Log the response size for debugging
  const responseString = JSON.stringify(returnObj)
  console.log(`Response size: ${Buffer.byteLength(responseString, 'utf8')} bytes`)

  // Gzip the response to reduce payload size
  return new Response(gzipSync(responseString), {
    headers: { 
      'content-type': 'application/json', 
      'content-encoding': 'gzip' 
    }
  })
})
