/**
 * @file posts/[...slug].ts
 * @description Fetches blog post content from pre-processed JSON files with support for nested paths and year-based organization
 * @endpoint GET /api/posts/{slug}
 * @params slug: string[] - Dynamic path segments representing post location (e.g., ["2025", "post-name"])
 * @returns Post data with HTML content, metadata, title, and table of contents
 */
import { defineEventHandler, createError } from 'h3'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { existsSync } from 'node:fs'

interface TocItem {
  level: number
  text: string
  id: string
}

interface PostData {
  html?: string
  content?: string
  metadata?: {
    title?: string
    toc?: TocItem[]
  }
  title?: string
  toc?: TocItem[]
}

/**
 * Validate slug to prevent malformed requests
 * Rejects slugs with pipe characters, double dots, or other invalid patterns
 */
function isValidSlug(slug: string): boolean {
  // Reject empty slugs
  if (!slug || slug.trim() === '') return false
  // Reject slugs with pipe characters (malformed wikilinks)
  if (slug.includes('|')) return false
  // Reject path traversal attempts
  if (slug.includes('..')) return false
  // Reject slugs with null bytes or other control characters
  if (/[\x00-\x1f\x7f]/.test(slug)) return false
  // Only allow alphanumeric, hyphens, underscores, forward slashes
  if (!/^[\w\-\/]+$/.test(slug)) return false
  return true
}

/**
 * Endpoint handler to fetch and return post content by slug.
 * Post content is read from pre-processed JSON files
 * in the 'content/processed' directory.
 */
export default defineEventHandler(async (event) => {
  // console.log('API: Request received:', event.context.params)

  try {
    const slug = Array.isArray(event.context.params?.slug)
      ? event.context.params.slug.join('/')
      : event.context.params?.slug

    if (!slug) {
      throw new Error('Missing slug parameter')
    }

    // Validate slug format
    if (!isValidSlug(slug)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid slug format',
      })
    }

    const filePath = path.join(
      process.cwd(),
      'content/processed',
      `${slug}.json`
    )
    // console.log('API: Looking for file:', filePath)

    // Parse the JSON data
    const rawData = await readFile(filePath, 'utf-8')
    const data = JSON.parse(rawData)

    // console.log('API: Post data read:', {
    //   slug,
    //   hasToc: !!data.toc,
    //   hasMetadataToc: !!data.metadata?.toc,
    //   tocLength: data.toc?.length,
    //   metadataTocLength: data.metadata?.toc?.length,
    //   path: filePath
    // })

    return data
  } catch (error) {
    console.error('API Error:', error)
    throw createError({
      statusCode: 404,
      message: `Post not found: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    })
  }
})

async function _readPost(slug: string): Promise<PostData> {
  const filePath = path.join(process.cwd(), 'content/processed', `${slug}.json`)

  if (!existsSync(filePath)) {
    const [year, ...rest] = slug.split('/')
    const yearPath = path.join(
      process.cwd(),
      'content/processed',
      year,
      rest.join('/') + '.json'
    )

    if (!existsSync(yearPath)) {
      throw new Error(`No file found at ${filePath} or ${yearPath}`)
    }

    const content = await readFile(yearPath, 'utf-8')
    const data = JSON.parse(content)
    // console.log('API: Post data read from year directory:', {
    //   slug,
    //   hasToc: !!data?.toc,
    //   hasMetadataToc: !!data?.metadata?.toc,
    //   tocLength: data?.toc?.length,
    //   metadataTocLength: data?.metadata?.toc?.length,
    //   path: yearPath
    // })
    return validatePostData(data)
  }

  const content = await readFile(filePath, 'utf-8')
  const data = JSON.parse(content)
  // console.log('API: Post data read:', {
  //   slug,
  //   hasToc: !!data?.toc,
  //   hasMetadataToc: !!data?.metadata?.toc,
  //   tocLength: data?.toc?.length,
  //   metadataTocLength: data?.metadata?.toc?.length,
  //   path: filePath
  // })
  return validatePostData(data)
}

function validatePostData(data: unknown): PostData {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid post data format')
  }

  // Type guard to ensure data has the correct shape
  const postData = data as PostData
  if (!postData.html && !postData.content) {
    console.error('Post data has no content or HTML')
  }

  // Log validation of TOC data
  // console.log('API: Validating post data TOC:', {
  //   hasToc: !!postData.toc,
  //   hasMetadataToc: !!postData.metadata?.toc,
  //   tocLength: postData.toc?.length,
  //   metadataTocLength: postData.metadata?.toc?.length
  // })

  return postData
}
