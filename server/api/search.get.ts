/**
 * @file search.get.ts
 * @description Full-text search across processed blog content with TF-IDF relevance scoring and snippet extraction
 * @endpoint GET /api/search
 * @params q: string - Search query, limit: number - Maximum results (default: 20, max: 50)
 * @returns Search results with snippets, relevance scores, tags, and metadata, sorted by relevance
 */
import { defineEventHandler, getQuery } from 'h3'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { stripHtml, tokenize } from '~/server/utils/text-processing'

const BM25_CONFIG = {
  k1: 1.5,
  b: 0.75,
}

function calculateBm25Score({
  termFreqs,
  docFreqs,
  docLength,
  avgDocLength,
  docCount,
  searchTerms,
}: {
  termFreqs: Record<string, number>
  docFreqs: Record<string, number>
  docLength: number
  avgDocLength: number
  docCount: number
  searchTerms: string[]
}): number {
  let score = 0

  for (const term of searchTerms) {
    const tf = termFreqs[term] || 0
    if (tf === 0) continue

    const df = docFreqs[term] || 0
    const idf = Math.log(1 + (docCount - df + 0.5) / (df + 0.5))
    const normalization =
      BM25_CONFIG.k1 *
      (1 - BM25_CONFIG.b + BM25_CONFIG.b * (docLength / avgDocLength))
    const termScore = idf * ((tf * (BM25_CONFIG.k1 + 1)) / (tf + normalization))

    score += termScore
  }

  return score
}

// Extract text snippet around search terms
function extractSnippet(
  content: string,
  searchTerms: string[],
  maxLength = 300
): string {
  const text = stripHtml(content)
  const lowerText = text.toLowerCase()
  const lowerTerms = searchTerms.map((term) => term.toLowerCase())

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
  lowerTerms.forEach((term) => {
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
        message: 'Search query must be at least 2 characters long',
      }
    }

    const rawTerms = tokenize(searchQuery)
    const searchTerms = Array.from(new Set(rawTerms))
    if (searchTerms.length === 0) {
      return {
        query: searchQuery,
        results: [],
        total: 0,
        message: 'No valid search terms found',
      }
    }

    // Read processed content directory
    const processedDir = path.join(process.cwd(), 'content/processed')

    interface SearchResult {
      title: string
      slug: string
      url: string
      snippet: string
      score: number
      date?: string
      tags: string[]
      type: string
      words: number
    }
    const results: SearchResult[] = []
    const docFreqs: Record<string, number> = {}
    const documents: Array<{
      title: string
      slug: string
      url: string
      content: string
      textContent: string
      tags: string[]
      date?: string
      type: string
      words: number
      docLength: number
      termFreqs: Record<string, number>
      titleTokens: string[]
      tagTokens: string[]
    }> = []
    let totalDocLength = 0

    // Function to recursively search directories
    async function searchDirectory(dir: string, basePath = '') {
      const items = await readdir(dir, { withFileTypes: true })

      for (const item of items) {
        const fullPath = path.join(dir, item.name)
        const relativePath = basePath ? `${basePath}/${item.name}` : item.name

        if (item.isDirectory()) {
          // Skip certain directories - be more restrictive
          if (
            [
              'backup',
              'drafts',
              '_stale',
              'week-notes',
              'robots',
              'prompts',
            ].includes(item.name)
          )
            continue
          await searchDirectory(fullPath, relativePath)
        } else if (
          item.name.endsWith('.json') &&
          item.name !== 'manifest-lite.json' &&
          item.name !== 'index.json'
        ) {
          try {
            const fileContent = await readFile(fullPath, 'utf-8')
            const data = JSON.parse(fileContent)

            const contentSource = data.content || data.html || ''

            // Skip if no content, hidden, or private content types
            if (!contentSource || data.metadata?.hidden) continue

            // Additional content filtering
            const slug = relativePath.replace('.json', '').replace(/\\/g, '/')
            if (
              slug.includes('week-notes/') ||
              slug.includes('drafts/') ||
              slug.includes('robots/') ||
              slug.includes('prompts/') ||
              slug.includes('_stale/') ||
              data.metadata?.type === 'private' ||
              data.metadata?.type === 'draft' ||
              data.metadata?.private === true ||
              data.metadata?.inprogress === true
            )
              continue

            const textContent = stripHtml(contentSource)
            const title = data.title || 'Untitled'
            const tags = Array.isArray(data.metadata?.tags)
              ? data.metadata?.tags
              : []
            const titleTokens = tokenize(title)
            const tagTokens = tags.flatMap((tag) => tokenize(tag))
            const contentTokens = tokenize(textContent)
            const docTokens = [...titleTokens, ...tagTokens, ...contentTokens]
            const termFreqs: Record<string, number> = {}
            let hasTermMatch = false

            for (const token of docTokens) {
              for (const term of searchTerms) {
                if (!token.includes(term)) continue
                termFreqs[term] = (termFreqs[term] || 0) + 1
                hasTermMatch = true
              }
            }

            if (!hasTermMatch) continue

            for (const term of searchTerms) {
              if (termFreqs[term]) {
                docFreqs[term] = (docFreqs[term] || 0) + 1
              }
            }

            const docLength = docTokens.length || 1
            totalDocLength += docLength

            documents.push({
              title,
              slug,
              url: `/blog/${slug}`,
              content: contentSource,
              textContent,
              tags,
              date: data.metadata?.date,
              type: data.metadata?.type || 'post',
              words: data.metadata?.words || 0,
              docLength,
              termFreqs,
              titleTokens,
              tagTokens,
            })
          } catch (error) {
            console.error(`Error processing ${fullPath}:`, error)
          }
        }
      }
    }

    await searchDirectory(processedDir)

    const docCount = documents.length
    const avgDocLength = docCount > 0 ? totalDocLength / docCount : 1

    for (const doc of documents) {
      let score = calculateBm25Score({
        termFreqs: doc.termFreqs,
        docFreqs,
        docLength: doc.docLength,
        avgDocLength,
        docCount,
        searchTerms,
      })

      // Boost title and tag matches to keep intent obvious
      for (const term of searchTerms) {
        const titleMatches = doc.titleTokens.filter((token) =>
          token.includes(term)
        ).length
        const tagMatches = doc.tagTokens.filter((token) =>
          token.includes(term)
        ).length

        if (titleMatches > 0) score += titleMatches * 1.5
        if (tagMatches > 0) score += tagMatches * 1.25
        if (doc.title.toLowerCase().includes(term)) score += 0.75
      }

      if (score <= 0) continue

      results.push({
        title: doc.title,
        slug: doc.slug,
        url: doc.url,
        snippet: extractSnippet(doc.content, searchTerms),
        score,
        date: doc.date,
        tags: doc.tags.slice(0, 5),
        type: doc.type,
        words: doc.words,
      })
    }

    // Sort by relevance score (descending)
    results.sort((a, b) => b.score - a.score)

    // Limit results
    const limit = Math.min(Number.parseInt(query.limit as string) || 20, 50)
    const limitedResults = results.slice(0, limit)

    return {
      query: searchQuery,
      results: limitedResults,
      total: results.length,
      searchTerms,
      message:
        results.length === 0
          ? 'No results found'
          : `Found ${results.length} results`,
    }
  } catch (error) {
    console.error('Search error:', error)
    return {
      query: '',
      results: [],
      total: 0,
      error: 'An error occurred while searching',
      message: 'Search temporarily unavailable',
    }
  }
})
