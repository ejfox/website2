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
  if (!event.context.params?.slug) {
    console.error('Missing slug parameter')
    throw createError({
      statusCode: 400,
      message: 'Missing slug parameter'
    })
  }

  const slug = event.context.params.slug
  const postPath = Array.isArray(slug) ? slug.join('/') : slug

  try {
    const post = await readPost(postPath)

    if (!post) {
      throw new Error('Post data is empty')
    }

    console.log('API Response TOC data:', {
      slug: postPath,
      hasToc: !!post.toc,
      tocLength: post.toc?.length,
      hasMetadataToc: !!post.metadata?.toc,
      metadataTocLength: post.metadata?.toc?.length,
      firstTocItem: post.metadata?.toc?.[0]
    })

    return post
  } catch (error) {
    console.error('Error reading post:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'
    throw createError({
      statusCode: 404,
      message: `Post not found: ${postPath} (${errorMessage})`
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
