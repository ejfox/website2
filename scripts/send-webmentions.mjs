#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Send Webmentions Script
 *
 * Scans blog posts for external links and sends webmentions
 * to sites that support them. Run after publishing new content.
 *
 * Usage:
 *   yarn webmentions          # Send for posts modified in last 7 days
 *   yarn webmentions --all    # Send for all posts (careful - rate limits!)
 *   yarn webmentions --dry    # Show what would be sent without sending
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SITE_URL = 'https://ejfox.com'
const PROCESSED_DIR = path.join(__dirname, '../content/processed')
const SENT_FILE = path.join(__dirname, '../.webmentions-sent.json')

// Parse args
const args = process.argv.slice(2)
const sendAll = args.includes('--all')
const dryRun = args.includes('--dry')
const days = sendAll ? 9999 : 7

console.log(`\n🔗 Webmention Sender`)
console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`)
console.log(
  `   Scope: ${sendAll ? 'All posts' : `Posts from last ${days} days`}\n`
)

// Load already-sent webmentions to avoid duplicates
function loadSentWebmentions() {
  try {
    if (fs.existsSync(SENT_FILE)) {
      return JSON.parse(fs.readFileSync(SENT_FILE, 'utf-8'))
    }
  } catch (e) {
    console.warn('Could not load sent webmentions cache:', e.message)
  }
  return {}
}

function saveSentWebmentions(sent) {
  fs.writeFileSync(SENT_FILE, JSON.stringify(sent, null, 2))
}

// Extract external links from HTML
function extractExternalLinks(html) {
  if (!html) return []
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi
  const links = []
  let match

  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1]
    // Only external links, skip internal/anchor/mailto/tel
    if (
      url.startsWith('http') &&
      !url.includes('ejfox.com') &&
      !url.includes('localhost')
    ) {
      links.push(url)
    }
  }

  return [...new Set(links)] // Dedupe
}

// Discover webmention endpoint for a URL
async function discoverWebmentionEndpoint(targetUrl) {
  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: { Accept: 'text/html' },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    })

    // Check Link header first
    const linkHeader = response.headers.get('link')
    if (linkHeader) {
      const webmentionMatch = linkHeader.match(
        /<([^>]+)>;\s*rel=["']?webmention["']?/i
      )
      if (webmentionMatch) {
        return new URL(webmentionMatch[1], targetUrl).href
      }
    }

    // Check HTML for <link rel="webmention">
    const html = await response.text()
    const htmlMatch =
      html.match(/<link[^>]+rel=["']?webmention[^>]+href=["']([^"']+)["']/i) ||
      html.match(
        /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']?webmention["']?/i
      )
    if (htmlMatch) {
      return new URL(htmlMatch[1], targetUrl).href
    }

    return null
  } catch {
    // Site unreachable or timeout - skip silently
    return null
  }
}

// Send a webmention
async function sendWebmention(endpoint, source, target) {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:
        `source=${encodeURIComponent(source)}` +
        `&target=${encodeURIComponent(target)}`,
      signal: AbortSignal.timeout(15000),
    })

    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
    }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

// Get recent posts from processed JSON
function getRecentPosts(daysAgo) {
  const posts = []
  const cutoff = Date.now() - daysAgo * 24 * 60 * 60 * 1000

  // Walk through year directories
  const years = fs.readdirSync(PROCESSED_DIR).filter((f) => /^\d{4}$/.test(f))

  for (const year of years) {
    const yearDir = path.join(PROCESSED_DIR, year)
    const files = fs.readdirSync(yearDir).filter((f) => f.endsWith('.json'))

    for (const file of files) {
      try {
        const content = JSON.parse(
          fs.readFileSync(path.join(yearDir, file), 'utf-8')
        )
        const postDate = new Date(
          content.metadata?.date || content.metadata?.modified || 0
        )

        if (postDate.getTime() > cutoff) {
          // IndieWeb reply-to URLs from frontmatter (can be string or array)
          const replyToRaw =
            content.metadata?.replyTo ||
            content.metadata?.['in-reply-to'] ||
            null
          const replyTo = replyToRaw
            ? Array.isArray(replyToRaw)
              ? replyToRaw
              : [replyToRaw]
            : []

          posts.push({
            slug: `${year}/${file.replace('.json', '')}`,
            html: content.html,
            date: postDate,
            title: content.title || content.metadata?.title || file,
            replyTo,
          })
        }
      } catch {
        // Skip invalid JSON
      }
    }
  }

  return posts.sort((a, b) => b.date - a.date)
}

// Main
async function main() {
  const sent = loadSentWebmentions()
  const posts = getRecentPosts(days)

  console.log(`Found ${posts.length} posts to scan\n`)

  let totalLinks = 0
  let totalSent = 0
  let totalSkipped = 0
  let totalFailed = 0

  for (const post of posts) {
    const sourceUrl = `${SITE_URL}/blog/${post.slug}`
    const links = extractExternalLinks(post.html)

    // Add reply-to URLs if present (IndieWeb reply posts) - now supports arrays
    for (const replyUrl of post.replyTo) {
      if (!links.includes(replyUrl)) {
        links.unshift(replyUrl) // Put reply-to first (most important)
      }
    }

    if (links.length === 0) continue

    console.log(`📝 ${post.title}`)
    if (post.replyTo.length > 0) {
      const domains = post.replyTo.map((url) => {
        try {
          return new URL(url).hostname
        } catch {
          return url
        }
      })
      console.log(`   ↩️  Reply to: ${domains.join(', ')}`)
    }
    console.log(`   ${links.length} external links`)

    for (const targetUrl of links) {
      totalLinks++
      const cacheKey = `${sourceUrl}|${targetUrl}`

      // Skip if already sent
      if (sent[cacheKey]) {
        totalSkipped++
        continue
      }

      // Discover endpoint
      const endpoint = await discoverWebmentionEndpoint(targetUrl)

      if (!endpoint) {
        // No webmention support - skip silently
        continue
      }

      console.log(`   → ${new URL(targetUrl).hostname}`)

      if (dryRun) {
        console.log(`     [DRY] Would send to ${endpoint}`)
        totalSent++
      } else {
        const result = await sendWebmention(endpoint, sourceUrl, targetUrl)

        if (result.success) {
          console.log(`     ✓ Sent (${result.status})`)
          sent[cacheKey] = { sentAt: new Date().toISOString(), endpoint }
          totalSent++
        } else {
          console.log(`     ✗ Failed: ${result.error || result.statusText}`)
          totalFailed++
        }

        // Rate limit: wait 1s between sends
        await new Promise((r) => setTimeout(r, 1000))
      }
    }
  }

  // Save sent cache
  if (!dryRun) {
    saveSentWebmentions(sent)
  }

  console.log(`\n📊 Summary:`)
  console.log(`   Links scanned: ${totalLinks}`)
  console.log(`   Webmentions sent: ${totalSent}`)
  console.log(`   Already sent (skipped): ${totalSkipped}`)
  console.log(`   Failed: ${totalFailed}`)

  if (dryRun) {
    console.log(`\n   Run without --dry to actually send webmentions`)
  }
}

main().catch(console.error)
