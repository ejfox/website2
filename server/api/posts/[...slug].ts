import { defineEventHandler, createError } from 'h3'
import { readFile } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

interface PostData {
  html?: string
  content?: string
  metadata?: {
    title?: string
    toc?: any[]
  }
  title?: string
  toc?: any[]
}

/**
 * Endpoint handler to fetch and return the content of a post based on the provided slug.
 * The post content is read from a pre-processed JSON file stored in the 'content/processed' directory.
 */
export default defineEventHandler(async (event) => {
  console.log('API: Request received:', event.context.params)

  try {
    const slug = Array.isArray(event.context.params?.slug)
      ? event.context.params.slug.join('/')
      : event.context.params?.slug

    if (!slug) {
      throw new Error('Missing slug parameter')
    }

    const filePath = path.join(
      process.cwd(),
      'content/processed',
      `${slug}.json`
    )
    console.log('API: Looking for file:', filePath)

    // Parse the JSON data
    const rawData = await readFile(filePath, 'utf-8')
    const data = JSON.parse(rawData)

    console.log('API: Post data read:', {
      slug,
      hasToc: !!data.toc,
      hasMetadataToc: !!data.metadata?.toc,
      tocLength: data.toc?.length,
      metadataTocLength: data.metadata?.toc?.length,
      path: filePath
    })

    return data
  } catch (error) {
    console.error('API Error:', error)
    throw createError({
      statusCode: 404,
      message: `Post not found: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    })
  }
})

async function readPost(slug: string): Promise<PostData> {
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
    console.log('API: Post data read from year directory:', {
      slug,
      hasToc: !!data?.toc,
      hasMetadataToc: !!data?.metadata?.toc,
      tocLength: data?.toc?.length,
      metadataTocLength: data?.metadata?.toc?.length,
      path: yearPath
    })
    return validatePostData(data)
  }

  const content = await readFile(filePath, 'utf-8')
  const data = JSON.parse(content)
  console.log('API: Post data read:', {
    slug,
    hasToc: !!data?.toc,
    hasMetadataToc: !!data?.metadata?.toc,
    tocLength: data?.toc?.length,
    metadataTocLength: data?.metadata?.toc?.length,
    path: filePath
  })
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
  console.log('API: Validating post data TOC:', {
    hasToc: !!postData.toc,
    hasMetadataToc: !!postData.metadata?.toc,
    tocLength: postData.toc?.length,
    metadataTocLength: postData.metadata?.toc?.length
  })

  return postData
}
