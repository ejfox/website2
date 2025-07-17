import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_KEY || ''
)

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { url, title, text, auth } = query as { url?: string; title?: string; text?: string; auth?: string }

  // Check authentication
  const validPassphrase = process.env.BOOKMARKLET_PASSPHRASE || 'your-secret-passphrase-here'
  if (auth !== validPassphrase) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid authentication'
    })
  }

  if (!url || !title) {
    throw createError({
      statusCode: 400,
      statusMessage: 'URL and title are required'
    })
  }

  try {
    // For now, let's implement basic tag suggestions based on existing tags
    // We'll enhance this with embeddings/vector search later
    
    let scrapsWithTags: any[] = []
    
    try {
      // Get all existing scraps with tags
      const { data, error: scrapsError } = await supabase
        .from('scraps')
        .select('tags, title, url, summary, content')
        .not('tags', 'is', null)
        .order('created_at', { ascending: false })
        .limit(500)

      if (scrapsError) {
        console.warn('Supabase scraps query failed:', scrapsError)
        // Continue with empty array if scraps table doesn't exist or is empty
      } else {
        scrapsWithTags = data || []
      }
    } catch (err) {
      console.warn('Supabase connection failed:', err)
      // Continue with empty scraps array
    }

    // Extract text content for analysis
    const content = `${title} ${text || ''}`.toLowerCase()
    
    // Count tag frequency across all scraps
    const tagFrequency = new Map<string, number>()
    const tagContexts = new Map<string, string[]>()
    
    scrapsWithTags?.forEach(scrap => {
      if (scrap.tags && Array.isArray(scrap.tags)) {
        scrap.tags.forEach((tag: string) => {
          tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1)
          
          // Store context for each tag
          if (!tagContexts.has(tag)) {
            tagContexts.set(tag, [])
          }
          const context = `${scrap.title || ''} ${scrap.summary || ''} ${scrap.content || ''}`.toLowerCase()
          tagContexts.get(tag)?.push(context)
        })
      }
    })

    // Score tags based on content similarity
    const tagScores = new Map<string, number>()
    
    // Filter out metadata/generic tags
    const bannedTags = [
      'block', 'image', 'link', 'text', 'channel', 'content', 'item', 'page', 'site', 'website', 'post', 'article',
      'menu', 'search', 'home', 'about', 'contact', 'help', 'support', 'login', 'signup', 'sign', 'click', 'here', 
      'more', 'read', 'view', 'show', 'hide', 'file', 'files', 'folder', 'document', 'docs', 'documentation'
    ]
    
    tagContexts.forEach((contexts, tag) => {
      // Skip banned tags
      if (bannedTags.includes(tag.toLowerCase())) {
        return
      }
      
      let score = 0
      
      // Check if tag appears in content
      if (content.includes(tag.toLowerCase())) {
        score += 5
      }
      
      // Check for common words between content and tag contexts
      const contentWords = content.split(/\s+/).filter(w => w.length > 3)
      contexts.forEach(context => {
        const contextWords = context.split(/\s+/).filter(w => w.length > 3)
        const commonWords = contentWords.filter(w => contextWords.includes(w))
        score += commonWords.length * 0.1
      })
      
      // Boost score by tag frequency (popular tags)
      score += Math.log(tagFrequency.get(tag) || 1)
      
      if (score > 0) {
        tagScores.set(tag, score)
      }
    })

    // Get top suggested tags with reasoning
    let suggestedTags = Array.from(tagScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, score]) => ({
        tag,
        score,
        reason: 'similarity',
        frequency: tagFrequency.get(tag) || 0,
        details: `Used ${tagFrequency.get(tag)} times in similar content`
      }))
    
    // If no suggestions from existing scraps, generate some based on content
    if (suggestedTags.length === 0) {
      const stopWords = [
        'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'any', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use',
        // Are.na / generic metadata terms
        'block', 'image', 'link', 'text', 'channel', 'content', 'item', 'page', 'site', 'website', 'post', 'article',
        // Common UI/navigation words
        'menu', 'search', 'home', 'about', 'contact', 'help', 'support', 'login', 'signup', 'sign', 'click', 'here', 'more', 'read', 'view', 'show', 'hide',
        // Generic tech terms that add no value
        'this', 'that', 'with', 'from', 'they', 'have', 'will', 'been', 'were', 'what', 'when', 'where', 'would', 'could', 'should', 'your', 'their', 'there', 'then', 'than', 'them', 'some', 'time', 'very', 'just', 'like', 'make', 'made', 'take', 'come', 'work', 'well', 'also', 'back', 'only', 'know', 'think', 'good', 'first', 'last', 'long', 'little', 'own', 'other', 'right', 'still', 'want', 'give', 'each', 'most', 'much', 'many', 'may', 'might'
      ]
      
      const contentWords = content.split(/\s+/)
        .filter(w => w.length > 3 && !stopWords.includes(w.toLowerCase()))
        .slice(0, 8)
      
      // Add some common tech/web tags based on URL patterns and TLD
      const urlLower = url.toLowerCase()
      const fallbackTags: string[] = []
      
      // Domain-specific tags
      if (urlLower.includes('github.com')) fallbackTags.push('github', 'code', 'development')
      if (urlLower.includes('npmjs.com')) fallbackTags.push('npm', 'javascript', 'package')
      if (urlLower.includes('stackoverflow.com')) fallbackTags.push('stackoverflow', 'programming', 'help')
      if (urlLower.includes('youtube.com')) fallbackTags.push('video', 'tutorial', 'youtube')
      if (urlLower.includes('medium.com')) fallbackTags.push('article', 'blog', 'medium')
      if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) fallbackTags.push('twitter', 'social')
      if (urlLower.includes('reddit.com')) fallbackTags.push('reddit', 'discussion', 'community')
      if (urlLower.includes('news.ycombinator.com')) fallbackTags.push('hackernews', 'tech', 'startup')
      if (urlLower.includes('wikipedia.org')) fallbackTags.push('wikipedia', 'reference', 'research')
      if (urlLower.includes('arxiv.org')) fallbackTags.push('arxiv', 'research', 'academic', 'paper')
      
      // TLD-based tags
      try {
        const urlObj = new URL(url)
        const hostname = urlObj.hostname.toLowerCase()
        const tld = hostname.split('.').pop()
        
        switch(tld) {
          case 'edu':
            fallbackTags.push('academic', 'education', 'university')
            break
          case 'gov':
            fallbackTags.push('government', 'official', 'policy')
            break
          case 'org':
            fallbackTags.push('organization', 'nonprofit', 'community')
            break
          case 'io':
            fallbackTags.push('tech', 'startup', 'saas')
            break
          case 'ai':
            fallbackTags.push('ai', 'artificial-intelligence', 'tech')
            break
          case 'dev':
            fallbackTags.push('development', 'programming', 'tech')
            break
          case 'blog':
            fallbackTags.push('blog', 'writing', 'content')
            break
          case 'news':
            fallbackTags.push('news', 'journalism', 'current-events')
            break
        }
      } catch (_e) {
        // Invalid URL, skip TLD analysis
      }
      
      // Create enhanced suggestions with reasoning
      const allFallbackTags = [...new Set([...fallbackTags, ...contentWords])].slice(0, 8)
      suggestedTags = allFallbackTags.map(tag => {
        let reason = 'content'
        let details = 'Found in page content'
        
        if (fallbackTags.includes(tag)) {
          if (urlLower.includes('github.com')) {
            reason = 'domain'
            details = 'GitHub repository detected'
          } else if (urlLower.includes('npmjs.com')) {
            reason = 'domain'
            details = 'NPM package detected'
          } else if (tag === 'tech' || tag === 'startup' || tag === 'saas') {
            reason = 'tld'
            details = `${new URL(url).hostname.split('.').pop()?.toUpperCase()} domain suggests tech content`
          } else {
            reason = 'domain'
            details = `Detected from ${new URL(url).hostname}`
          }
        }
        
        return {
          tag,
          score: fallbackTags.includes(tag) ? 5 : 1,
          reason,
          frequency: 0,
          details
        }
      })
    }

    // Find scraps that share tags with suggested tags
    const topSuggestedTagNames = suggestedTags.slice(0, 5).map(tagObj => 
      typeof tagObj === 'string' ? tagObj : tagObj.tag
    )
    
    const similarScraps = scrapsWithTags
      ?.map(scrap => {
        if (!scrap.title || !scrap.tags || !Array.isArray(scrap.tags)) return null
        
        // Count how many tags this scrap shares with our suggestions
        const sharedTags = scrap.tags.filter((tag: string) => topSuggestedTagNames.includes(tag))
        const score = sharedTags.length
        
        return {
          scrap,
          sharedTags,
          score
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null && item.score > 0) // Only items with shared tags
      .sort((a, b) => b.score - a.score) // Sort by most shared tags
      .slice(0, 4)
      .map(item => ({
        id: item.scrap.url || item.scrap.title || Math.random().toString(),
        title: item.scrap.title || 'Untitled',
        similarity_score: item.score,
        tags: item.sharedTags, // Only show the shared tags
        allTags: item.scrap.tags // Keep all tags for copying
      })) || []

    // TODO: Implement proper threads detection based on content similarity clusters
    // For now, just return empty array
    const activeThreads: any[] = []

    return {
      suggested_tags: suggestedTags,
      similar_scraps: similarScraps,
      active_threads: activeThreads,
      potential_connections: [], // Will be implemented with embeddings
      all_tags: Array.from(tagFrequency.keys()).sort() // For autocomplete
    }
  } catch (error) {
    console.error('Error in suggest endpoint:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate suggestions'
    })
  }
})