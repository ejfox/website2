#!/usr/bin/env node
/**
 * Export Mastodon posts to JSON for on-this-day feature
 * Uses Mastodon API to fetch all posts by user
 *
 * Usage: MASTODON_INSTANCE=https://mastodon.social MASTODON_TOKEN=xxx node scripts/export-mastodon.mjs
 */

import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_FILE = join(__dirname, '../data/mastodon-posts.json')

const MASTODON_INSTANCE =
  process.env.MASTODON_INSTANCE || 'https://mastodon.social'
const MASTODON_TOKEN = process.env.MASTODON_TOKEN

if (!MASTODON_TOKEN) {
  console.error('Error: MASTODON_TOKEN environment variable is required')
  console.error(
    'Get a token from: ' + MASTODON_INSTANCE + '/settings/applications'
  )
  process.exit(1)
}

async function fetchPosts() {
  const allPosts = []
  let maxId = null
  let hasMore = true

  console.log(`Fetching posts from ${MASTODON_INSTANCE}...`)

  while (hasMore) {
    try {
      const url = new URL(`${MASTODON_INSTANCE}/api/v1/accounts/verify_credentials`)
      const verifyResponse = await fetch(url, {
        headers: {
          Authorization: `Bearer ${MASTODON_TOKEN}`,
        },
      })

      if (!verifyResponse.ok) {
        throw new Error(`Failed to verify credentials: ${verifyResponse.statusText}`)
      }

      const account = await verifyResponse.json()
      const accountId = account.id

      // Fetch statuses
      const statusUrl = new URL(
        `${MASTODON_INSTANCE}/api/v1/accounts/${accountId}/statuses`
      )
      statusUrl.searchParams.set('limit', '40')
      statusUrl.searchParams.set('exclude_replies', 'false')
      statusUrl.searchParams.set('exclude_reblogs', 'true')
      if (maxId) statusUrl.searchParams.set('max_id', maxId)

      const response = await fetch(statusUrl, {
        headers: {
          Authorization: `Bearer ${MASTODON_TOKEN}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.statusText}`)
      }

      const posts = await response.json()

      if (posts.length === 0) {
        hasMore = false
        break
      }

      for (const post of posts) {
        const date = new Date(post.created_at)

        // Strip HTML from content
        const content = post.content
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<\/?[^>]+(>|$)/g, '')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')

        allPosts.push({
          id: post.id,
          text: content,
          date: post.created_at,
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          day: date.getDate(),
          url: post.url,
          replyTo: post.in_reply_to_id,
          favorites: post.favourites_count,
          reblogs: post.reblogs_count,
          visibility: post.visibility,
        })
      }

      console.log(
        `  Fetched ${posts.length} posts (total: ${allPosts.length})`
      )

      // Get the ID of the last post for pagination
      maxId = posts[posts.length - 1].id

      // Rate limit: Be nice to the server
      await new Promise((r) => setTimeout(r, 1000))
    } catch (error) {
      console.error(`Error fetching posts:`, error.message)
      hasMore = false
    }
  }

  return allPosts
}

async function main() {
  console.log('Mastodon Post Export')
  console.log('====================\n')

  const posts = await fetchPosts()

  // Sort by date
  posts.sort((a, b) => new Date(b.date) - new Date(a.date))

  // Write to file
  writeFileSync(OUTPUT_FILE, JSON.stringify(posts, null, 2))

  // Stats
  const years = [...new Set(posts.map((p) => p.year))].sort((a, b) => b - a)
  const repliesCount = posts.filter((p) => p.replyTo).length
  const postsCount = posts.length - repliesCount

  console.log(`\nExported ${posts.length} posts`)
  console.log(`  ${postsCount} original posts`)
  console.log(`  ${repliesCount} replies`)
  console.log(`Years: ${years.join(', ')}`)
  console.log(`Output: ${OUTPUT_FILE}`)
}

main().catch(console.error)
