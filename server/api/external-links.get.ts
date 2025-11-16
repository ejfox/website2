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
        if (!url) return

        const urlObj = new URL(url)
        const domain = urlObj.hostname
        const tldParts = domain.split('.')
        const tld = tldParts[tldParts.length - 1]

        const sources = sourcesStr ? sourcesStr.split(';') : []

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
            count: sources.length || 1
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

    return links
  } catch (error: any) {
    console.error('Error reading external links:', error)
    return []
  }
})
