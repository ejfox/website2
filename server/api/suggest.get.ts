import { defineEventHandler, getQuery, createError } from 'h3'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import NodeCache from 'node-cache'
import OpenAI from 'openai'
import { stripHtml, tokenize } from '~/server/utils/text-processing'

// ⚡ BLAZINGLY FAST cache for EJ's enlightener! *WHOOSH*
const cache = new NodeCache({
  stdTTL: 3600, // 1 hour cache - gotta be LIGHTNING fast! *zoom*
  checkperiod: 120 // Check every 2 minutes
})

interface SuggestResponse {
  suggested_tags: string[]
  summary: string
  similar_scraps: Array<{
    title: string
    slug: string
    url: string
    relevance_score: number
    tags: string[]
  }>
  active_threads: string[]
  processing_time_ms?: number
  cache_hit?: boolean
}

interface BlogPost {
  title: string
  content: string
  slug: string
  metadata?: {
    tags?: string[]
    date?: string
    type?: string
    words?: number
  }
}

// Calculate content similarity - THIS IS WHERE THE MAGIC HAPPENS! ⚡
function calculateSimilarity(inputText: string, blogPost: BlogPost): number {
  const inputTokens = tokenize(inputText)
  const postTokens = tokenize(blogPost.content + ' ' + blogPost.title)

  if (inputTokens.length === 0 || postTokens.length === 0) return 0

  // Simple Jaccard similarity with term frequency weighting *whoosh*
  const inputSet = new Set(inputTokens)
  const postSet = new Set(postTokens)

  const intersection = [...inputSet].filter((token) =>
    postSet.has(token)
  ).length
  const union = inputSet.size + postSet.size - intersection

  let score = intersection / union

  // Boost for tag overlap
  if (blogPost.metadata?.tags && Array.isArray(blogPost.metadata.tags)) {
    const tagTokens = blogPost.metadata.tags.flatMap((tag) =>
      tokenize(String(tag))
    )
    const tagMatches = inputTokens.filter((token) =>
      tagTokens.some((tagToken) => tagToken.includes(token))
    ).length
    score += tagMatches * 0.2 // Tag boost! *pew pew*
  }

  return score
}

// Load EJ's existing tags vocabulary *ZOOM*
async function loadTagsVocabulary(): Promise<string[]> {
  const cacheKey = 'tags_vocabulary'
  let tags = cache.get<string[]>(cacheKey)

  if (!tags) {
    try {
      // Try to load from local file first (faster! ⚡)
      const localTagsPath = path.join(process.cwd(), 'public/tags.json')
      try {
        const localTags = await readFile(localTagsPath, 'utf-8')
        tags = JSON.parse(localTags)
      } catch {
        // Fallback to fetching from the API
        const response = await $fetch<string[]>('https://ejfox.com/tags.json')
        tags = response
      }

      cache.set(cacheKey, tags, 3600) // Cache for 1 hour *swoosh*
    } catch (error) {
      console.error('Failed to load tags vocabulary:', error)
      // Fallback vocabulary based on EJ's interests
      tags = [
        'dataviz',
        'journalism',
        'coding',
        'vue',
        'javascript',
        'ai',
        'machinelearning',
        'politics',
        'activism',
        'design',
        'photography',
        'music',
        'art',
        'tools',
        'automation',
        'workflow',
        'productivity',
        'opensource',
        'github',
        'api',
        'web',
        'frontend',
        'backend',
        'database',
        'security',
        'privacy',
        'crypto',
        'blockchain',
        'startup',
        'tech',
        'innovation',
        'future'
      ]
    }
  }

  return tags || []
}

// Load EJ's blog posts for context *WHOOSH*
async function loadBlogPosts(): Promise<BlogPost[]> {
  const cacheKey = 'blog_posts_context'
  let posts = cache.get<BlogPost[]>(cacheKey)

  if (!posts) {
    posts = []
    const processedDir = path.join(process.cwd(), 'content/processed')

    try {
      await searchDirectory(processedDir, posts)
      cache.set(cacheKey, posts, 1800) // Cache for 30 minutes *zoom*
    } catch (error) {
      console.error('Failed to load blog posts:', error)
    }
  }

  return posts || []
}

async function searchDirectory(dir: string, posts: BlogPost[], basePath = '') {
  try {
    const items = await readdir(dir, { withFileTypes: true })

    for (const item of items) {
      const fullPath = path.join(dir, item.name)
      const relativePath = basePath ? `${basePath}/${item.name}` : item.name

      if (item.isDirectory()) {
        // Skip certain directories - keep it clean! *swoosh*
        if (
          ['backup', '_stale', 'week-notes', 'robots', 'prompts'].includes(
            item.name
          )
        )
          continue
        await searchDirectory(fullPath, posts, relativePath)
      } else if (
        item.name.endsWith('.json') &&
        item.name !== 'manifest-lite.json' &&
        item.name !== 'index.json'
      ) {
        try {
          const fileContent = await readFile(fullPath, 'utf-8')
          const data = JSON.parse(fileContent)

          // Filter out private/draft content
          if (
            !data.content ||
            data.metadata?.hidden ||
            data.metadata?.private === true ||
            data.metadata?.type === 'draft'
          )
            continue

          const slug = relativePath.replace('.json', '').replace(/\\/g, '/')

          posts.push({
            title: data.title || 'Untitled',
            content: stripHtml(data.content),
            slug,
            metadata: data.metadata
          })
        } catch {
          // Skip malformed files *whoosh*
        }
      }
    }
  } catch {
    // Directory might not exist, that's ok! *zoom*
  }
}

// AI-powered suggestion using OpenAI - THIS IS THE SMART PART! 🧠⚡
async function generateAISuggestions(
  content: string,
  availableTags: string[],
  similarPosts: BlogPost[]
): Promise<{ tags: string[]; summary: string; threads: string[] }> {
  const config = useRuntimeConfig()
  const openaiKey = config.OPENAI_API_KEY || process.env.OPENAI_API_KEY

  if (!openaiKey) {
    // Fallback to simple keyword matching *swoosh*
    const words = tokenize(content)
    const matchedTags = availableTags
      .filter((tag) =>
        words.some(
          (word) =>
            tag.toLowerCase().includes(word) || word.includes(tag.toLowerCase())
        )
      )
      .slice(0, 4)

    return {
      tags: matchedTags,
      summary: content.substring(0, 200) + '...',
      threads: []
    }
  }

  // Initialize OpenAI client - LIGHTNING FAST! ⚡
  const openai = new OpenAI({
    apiKey: openaiKey,
    timeout: 10000 // 10 second timeout for SPEED! *zoom*
  })

  // Build context from similar posts
  const contextPosts = similarPosts
    .slice(0, 3)
    .map((post) => {
      const tags = post.metadata?.tags?.join(', ') || 'none'
      return `"${post.title}" (tags: ${tags})`
    })
    .join('\n')

  const tagsStr = availableTags.slice(0, 50).join(', ')
  const contentTitle = content.split('\n')[0] || 'No title'
  const contentText = content.substring(0, 1000)

  const prompt = `You are EJ Fox's AI assistant helping to categorize
content for his digital scrapbook.

EJ writes about: data visualization, journalism, technology, coding
(especially Vue.js/JavaScript), AI/ML, politics, activism, creative
tools, photography, music production, automation, and digital culture.

Available tags (choose 3-4 from this exact list): ${tagsStr}

Similar existing content:
${contextPosts}

Content to analyze:
Title: ${contentTitle}
Text: ${contentText}

Please respond in this exact JSON format:
{
  "tags": ["tag1", "tag2", "tag3"],
  "summary": "A concise 2-sentence description of what this
  content is about and why it's interesting.",
  "threads": ["theme1", "theme2"]
}

Focus on tags that match EJ's interests and writing style.
The summary should be engaging and match his voice.`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Fast and cheap! *zoom*
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that returns valid JSON.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 300
    })

    const aiResponse = response.choices[0]?.message?.content
    if (aiResponse) {
      const parsed = JSON.parse(aiResponse)
      return {
        tags: parsed.tags?.slice(0, 4) || [],
        summary: parsed.summary || 'Interesting content worth exploring.',
        threads: parsed.threads || []
      }
    }
  } catch (error) {
    console.error('OpenAI API error:', error)
  }

  // Fallback if AI fails *swoosh*
  const words = tokenize(content)
  const matchedTags = availableTags
    .filter((tag) =>
      words.some(
        (word) =>
          tag.toLowerCase().includes(word) || word.includes(tag.toLowerCase())
      )
    )
    .slice(0, 3)

  return {
    tags: matchedTags,
    summary: 'Content added to your digital scrapbook.',
    threads: []
  }
}

export default defineEventHandler(async (event): Promise<SuggestResponse> => {
  const startTime = Date.now()

  try {
    const query = getQuery(event)
    const { url, title, text, auth } = query

    // Basic auth check - EJ's security! 🔒
    const config = useRuntimeConfig()
    const expectedAuth =
      config.scrapEnlightenerAuth || process.env.SCRAP_ENLIGHTENER_AUTH

    if (expectedAuth && auth !== expectedAuth) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: 'Invalid authentication token'
      })
    }

    if (!text && !title && !url) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'At least one of url, title, or text is required'
      })
    }

    // Combine all available content *WHOOSH*
    const combinedContent = [title, text].filter(Boolean).join('\n\n')

    // Create cache key for this exact request
    const cacheKey = `suggest:${Buffer.from(combinedContent + (url || ''))
      .toString('base64')
      .substring(0, 32)}`

    // Check cache first - LIGHTNING SPEED! ⚡
    let result = cache.get<SuggestResponse>(cacheKey)

    if (result) {
      result.processing_time_ms = Date.now() - startTime
      result.cache_hit = true
      return result
    }

    // Load data in parallel for MAXIMUM SPEED! *zoom* *swoosh*
    const results = await Promise.allSettled([
      loadTagsVocabulary(),
      loadBlogPosts()
    ])

    const availableTags = results[0].status === 'fulfilled' ? results[0].value : []
    const blogPosts = results[1].status === 'fulfilled' ? results[1].value : []

    // Find similar content
    const similarities = blogPosts
      .map((post) => ({
        ...post,
        similarity: calculateSimilarity(combinedContent, post)
      }))
      .filter((post) => post.similarity > 0.1) // Only meaningful similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5) // Top 5 similar posts

    // Get AI suggestions *WHOOSH*
    const aiSuggestions = await generateAISuggestions(
      combinedContent,
      availableTags,
      similarities
    )

    // Build response
    result = {
      suggested_tags: aiSuggestions.tags,
      summary: aiSuggestions.summary,
      similar_scraps: similarities.map((post) => ({
        title: post.title,
        slug: post.slug,
        url: `/blog/${post.slug}`,
        relevance_score: Math.round(post.similarity * 100) / 100,
        tags: Array.isArray(post.metadata?.tags)
          ? post.metadata.tags.slice(0, 3)
          : []
      })),
      active_threads: aiSuggestions.threads,
      processing_time_ms: Date.now() - startTime,
      cache_hit: false
    }

    // Cache the result for future SPEED! *pew pew*
    cache.set(cacheKey, result, 1800) // 30 minutes

    return result
  } catch (error: any) {
    console.error('Suggest endpoint error:', error)

    // Return graceful fallback
    return {
      suggested_tags: ['tools', 'web', 'automation'],
      summary:
        'Content has been processed and added to your digital scrapbook.',
      similar_scraps: [],
      active_threads: [],
      processing_time_ms: Date.now() - startTime,
      cache_hit: false
    }
  }
})
