import { defineEventHandler, getQuery } from 'h3'
import { readFile, readdir } from 'fs/promises'
import path from 'path'

// Simple text extraction from HTML
function stripHtml(html: string): string {
  if (!html) return ''
  return html
    .replace(/<[^>]*>/g, ' ') // Remove HTML tags
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim()
}

// Tokenize text for search
function tokenize(text: string): string[] {
  if (!text) return []
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .split(/\s+/)
    .filter(word => word.length > 2) // Filter out short words
}

// Calculate TF-IDF-like scoring
function calculateRelevanceScore(
  searchTerms: string[],
  content: string,
  title: string,
  tags: string[] = []
): number {
  const contentTokens = tokenize(content)
  const titleTokens = tokenize(title)
  const tagTokens = tags.flatMap(tag => tokenize(tag))
  
  let score = 0
  
  searchTerms.forEach(term => {
    // Title matches are worth more
    const titleMatches = titleTokens.filter(token => token.includes(term)).length
    score += titleMatches * 10
    
    // Tag matches are worth more than content
    const tagMatches = tagTokens.filter(token => token.includes(term)).length
    score += tagMatches * 5
    
    // Content matches
    const contentMatches = contentTokens.filter(token => token.includes(term)).length
    score += contentMatches
    
    // Exact phrase bonus
    if (content.toLowerCase().includes(term)) {
      score += 2
    }
    if (title.toLowerCase().includes(term)) {
      score += 5
    }
  })
  
  // Boost for shorter content (density matters)
  if (contentTokens.length > 0) {
    score = score / Math.log(contentTokens.length + 1)
  }
  
  return score
}

// Extract text snippet around search terms
function extractSnippet(content: string, searchTerms: string[], maxLength = 300): string {
  const text = stripHtml(content)
  const lowerText = text.toLowerCase()
  const lowerTerms = searchTerms.map(term => term.toLowerCase())
  
  // Find first occurrence of any search term
  let firstMatchIndex = -1
  let _matchedTerm = ''
  
  for (const term of lowerTerms) {
    const index = lowerText.indexOf(term)
    if (index !== -1 && (firstMatchIndex === -1 || index < firstMatchIndex)) {
      firstMatchIndex = index
      _matchedTerm = term
    }
  }
  
  if (firstMatchIndex === -1) {
    // No matches found, return beginning
    return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '')
  }
  
  // Extract snippet around the match
  const start = Math.max(0, firstMatchIndex - 100)
  const end = Math.min(text.length, start + maxLength)
  let snippet = text.substring(start, end)
  
  // Add ellipsis if needed
  if (start > 0) snippet = '...' + snippet
  if (end < text.length) snippet = snippet + '...'
  
  // Highlight search terms (simple bold markup)
  lowerTerms.forEach(term => {
    const regex = new RegExp(`(${term})`, 'gi')
    snippet = snippet.replace(regex, '**$1**')
  })
  
  return snippet
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const searchQuery = query.q as string
    
    if (!searchQuery || searchQuery.length < 2) {
      return {
        query: searchQuery,
        results: [],
        total: 0,
        message: 'Search query must be at least 2 characters long'
      }
    }
    
    const searchTerms = tokenize(searchQuery)
    if (searchTerms.length === 0) {
      return {
        query: searchQuery,
        results: [],
        total: 0,
        message: 'No valid search terms found'
      }
    }
    
    // Read processed content directory
    const processedDir = path.join(process.cwd(), 'content/processed')
    const results: any[] = []
    
    // Function to recursively search directories
    async function searchDirectory(dir: string, basePath = '') {
      const items = await readdir(dir, { withFileTypes: true })
      
      for (const item of items) {
        const fullPath = path.join(dir, item.name)
        const relativePath = basePath ? `${basePath}/${item.name}` : item.name
        
        if (item.isDirectory()) {
          // Skip certain directories - be more restrictive
          if (['backup', 'drafts', '_stale', 'week-notes', 'robots', 'prompts'].includes(item.name)) continue
          await searchDirectory(fullPath, relativePath)
        } else if (item.name.endsWith('.json') && item.name !== 'manifest-lite.json' && item.name !== 'index.json') {
          try {
            const fileContent = await readFile(fullPath, 'utf-8')
            const data = JSON.parse(fileContent)
            
            // Skip if no content, hidden, or private content types
            if (!data.content || data.metadata?.hidden) continue
            
            // Additional content filtering
            const slug = relativePath.replace('.json', '').replace(/\\/g, '/')
            if (slug.includes('week-notes/') || 
                slug.includes('drafts/') || 
                slug.includes('robots/') || 
                slug.includes('prompts/') ||
                slug.includes('_stale/') ||
                data.metadata?.type === 'private' ||
                data.metadata?.type === 'draft' ||
                data.metadata?.private === true ||
                data.metadata?.inprogress === true) continue
            
            const textContent = stripHtml(data.content)
            const title = data.title || 'Untitled'
            const tags = data.metadata?.tags || []
            
            // Calculate relevance score
            const score = calculateRelevanceScore(searchTerms, textContent, title, tags)
            
            if (score > 0) {
              results.push({
                title,
                slug,
                url: `/blog/${slug}`,
                snippet: extractSnippet(data.content, searchTerms),
                score,
                date: data.metadata?.date,
                tags: tags.slice(0, 5), // Limit tags shown
                type: data.metadata?.type || 'post',
                words: data.metadata?.words || 0
              })
            }
          } catch (error) {
            console.error(`Error processing ${fullPath}:`, error)
          }
        }
      }
    }
    
    await searchDirectory(processedDir)
    
    // Sort by relevance score (descending)
    results.sort((a, b) => b.score - a.score)
    
    // Limit results
    const limit = Math.min(parseInt(query.limit as string) || 20, 50)
    const limitedResults = results.slice(0, limit)
    
    return {
      query: searchQuery,
      results: limitedResults,
      total: results.length,
      searchTerms,
      message: results.length === 0 ? 'No results found' : `Found ${results.length} results`
    }
    
  } catch (error) {
    console.error('Search error:', error)
    return {
      query: '',
      results: [],
      total: 0,
      error: 'An error occurred while searching',
      message: 'Search temporarily unavailable'
    }
  }
})