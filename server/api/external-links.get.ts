/**
 * @file external-links.get.ts
 * @description Parses external_links_final.csv to extract and deduplicate external links with source tracking
 * @endpoint GET /api/external-links
 * @returns Array of external links with domain, TLD, sources, and usage counts, sorted by domain
 */
import { defineEventHandler } from 'h3'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { existsSync } from 'node:fs'

interface ExternalLink {
  url: string
  domain: string
  tld: string
  sources: string[]
  count: number
}

interface DomainStats {
  domain: string
  linkCount: number
  totalCitations: number
}

interface ExternalLinksResponse {
  links: ExternalLink[]
  stats: {
    totalLinks: number
    totalDomains: number
    totalCitations: number
    httpCount: number
    httpsCount: number
    topDomains: DomainStats[]
    tldBreakdown: { tld: string; count: number }[]
    oldestSource: string | null
    newestSource: string | null
  }
}

function parseCSVLine(line: string): [string, string] {
  // Simple CSV parser for our specific format
  const firstComma = line.indexOf(',')
  if (firstComma === -1) {
    // Handle old format (just URLs) or malformed lines
    let url = line.trim()
    // Clean trailing punctuation from URLs
    url = url.replace(/[.,:;!?`>]+$/, '')
    return [url, '']
  }

  let url = line.substring(0, firstComma).trim()
  let sources = line.substring(firstComma + 1).trim()

  // Remove quotes if present
  if (url.startsWith('"') && url.endsWith('"')) {
    url = url.slice(1, -1)
  }
  if (sources.startsWith('"') && sources.endsWith('"')) {
    sources = sources.slice(1, -1)
  }

  // Clean trailing punctuation from URLs
  url = url.replace(/[.,:;!?`>]+$/, '')

  return [url, sources]
}

export default defineEventHandler(async () => {
  try {
    const csvPath = resolve(process.cwd(), 'data/external_links_final.csv')

    if (!existsSync(csvPath)) {
      return []
    }

    const csvContent = await readFile(csvPath, 'utf8')
    const lines = csvContent.trim().split('\n').filter(Boolean)

    // Skip header row if present
    const dataLines = lines[0].includes('url,sources') ? lines.slice(1) : lines

    // Process URLs with source information
    const linkMap = new Map<string, ExternalLink>()

    dataLines.forEach((line) => {
      try {
        const [url, sourcesStr] = parseCSVLine(line)
        if (!url || url === 'https://' || url === 'http://') return

        const urlObj = new URL(url)
        let domain = urlObj.hostname

        // Skip URLs with no valid hostname
        if (!domain) return

        // Strip www. prefix for cleaner grouping
        if (domain.startsWith('www.')) {
          domain = domain.slice(4)
        }

        // Normalize x.com to twitter.com
        if (domain === 'x.com') {
          domain = 'twitter.com'
        }

        // Normalize youtu.be to youtube.com
        if (domain === 'youtu.be') {
          domain = 'youtube.com'
        }

        // Skip localhost URLs - these are internal development links
        if (
          domain === 'localhost' ||
          domain.startsWith('127.') ||
          domain === '0.0.0.0'
        ) {
          return
        }

        const tldParts = domain.split('.')
        const tld = tldParts[tldParts.length - 1]

        // Filter out week-notes and drafts sources - these contain internal/private content
        const allSources = sourcesStr ? sourcesStr.split(';') : []
        const sources = allSources.filter(
          (s) => !s.startsWith('week-notes/') && !s.startsWith('drafts/')
        )

        // Skip links that ONLY appeared in week-notes (no other sources)
        if (allSources.length > 0 && sources.length === 0) {
          return
        }

        if (linkMap.has(url)) {
          const existing = linkMap.get(url)!
          existing.count += sources.length
          existing.sources = [...new Set([...existing.sources, ...sources])]
        } else {
          linkMap.set(url, {
            url,
            domain,
            tld,
            sources,
            count: sources.length || 1,
          })
        }
      } catch {
        // Skip invalid URLs or malformed lines
        console.warn('Invalid line or URL:', line)
      }
    })

    // Convert to array and sort by domain, then URL
    const links = Array.from(linkMap.values()).sort((a, b) => {
      if (a.domain === b.domain) {
        return a.url.localeCompare(b.url)
      }
      return a.domain.localeCompare(b.domain)
    })

    // Compute aggregate stats
    const domainMap = new Map<
      string,
      { linkCount: number; totalCitations: number }
    >()
    const tldMap = new Map<string, number>()
    let httpCount = 0
    let httpsCount = 0
    let totalCitations = 0
    const allSources = new Set<string>()

    links.forEach((link) => {
      // Domain stats
      const existing = domainMap.get(link.domain) || {
        linkCount: 0,
        totalCitations: 0,
      }
      existing.linkCount += 1
      existing.totalCitations += link.sources.length
      domainMap.set(link.domain, existing)

      // TLD stats
      tldMap.set(link.tld, (tldMap.get(link.tld) || 0) + 1)

      // Protocol stats
      if (link.url.startsWith('https://')) {
        httpsCount++
      } else {
        httpCount++
      }

      // Citation count
      totalCitations += link.sources.length

      // Collect sources for temporal analysis
      link.sources.forEach((s) => allSources.add(s))
    })

    // Top domains by total citations
    const topDomains: DomainStats[] = Array.from(domainMap.entries())
      .map(([domain, stats]) => ({ domain, ...stats }))
      .sort((a, b) => b.totalCitations - a.totalCitations)
      .slice(0, 15)

    // TLD breakdown sorted by count
    const tldBreakdown = Array.from(tldMap.entries())
      .map(([tld, count]) => ({ tld, count }))
      .sort((a, b) => b.count - a.count)

    // Find oldest/newest sources by year prefix
    const sortedSources = Array.from(allSources).sort()
    const oldestSource = sortedSources[0] || null
    const newestSource = sortedSources[sortedSources.length - 1] || null

    const response: ExternalLinksResponse = {
      links,
      stats: {
        totalLinks: links.length,
        totalDomains: domainMap.size,
        totalCitations,
        httpCount,
        httpsCount,
        topDomains,
        tldBreakdown,
        oldestSource,
        newestSource,
      },
    }

    return response
  } catch (error) {
    console.error('Error reading external links:', error)
    return {
      links: [],
      stats: {
        totalLinks: 0,
        totalDomains: 0,
        totalCitations: 0,
        httpCount: 0,
        httpsCount: 0,
        topDomains: [],
        tldBreakdown: [],
        oldestSource: null,
        newestSource: null,
      },
    }
  }
})
