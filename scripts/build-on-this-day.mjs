#!/usr/bin/env node
/**
 * Build on-this-day JSON files from various data sources
 * Aggregates tweets, mastodon posts, commits, scrobbles, and blog posts by date
 *
 * Usage: node scripts/build-on-this-day.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'csv-parse/sync'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '../data')
const OUTPUT_DIR = join(DATA_DIR, 'on-this-day')

// Ensure output directory exists
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true })
}

function loadJSON(filename) {
  try {
    const path = join(DATA_DIR, filename)
    if (!existsSync(path)) {
      console.log(`⚠️  ${filename} not found, skipping`)
      return null
    }
    return JSON.parse(readFileSync(path, 'utf-8'))
  } catch (error) {
    console.error(`Error loading ${filename}:`, error.message)
    return null
  }
}

function loadCSV(filename) {
  try {
    const path = join(DATA_DIR, filename)
    if (!existsSync(path)) {
      console.log(`⚠️  ${filename} not found, skipping`)
      return null
    }
    const content = readFileSync(path, 'utf-8')
    return parse(content, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
    })
  } catch (error) {
    console.error(`Error loading ${filename}:`, error.message)
    return null
  }
}

function getDateKey(dateStr) {
  const date = new Date(dateStr)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}-${day}`
}

function buildOnThisDay() {
  console.log('Building On This Day data...\n')

  // Initialize data structure for each day of the year
  const dayData = {}

  // Load source data
  const tweets = loadJSON('tweets.json')
  const mastodonPosts = loadJSON('mastodon-posts.json')
  const commits = loadJSON('github-commits.json')
  const scrobbles = loadCSV('lastfm-scrobbles.csv')
  const manifest = loadJSON('../content/processed/manifest-lite.json')

  // Process tweets
  if (tweets && Array.isArray(tweets)) {
    console.log(`Processing ${tweets.length} tweets...`)
    for (const tweet of tweets) {
      if (!tweet.created_at) continue

      const dateKey = getDateKey(tweet.created_at)
      if (!dayData[dateKey]) dayData[dateKey] = {}
      if (!dayData[dateKey].tweets) dayData[dateKey].tweets = []

      const date = new Date(tweet.created_at)
      dayData[dateKey].tweets.push({
        id: tweet.id_str || tweet.id,
        text: tweet.full_text || tweet.text,
        year: date.getFullYear(),
        date: tweet.created_at,
        favorites: tweet.favorite_count || 0,
        retweets: tweet.retweet_count || 0,
        replyTo: tweet.in_reply_to_screen_name || null,
      })
    }
  }

  // Process Mastodon posts
  if (mastodonPosts && Array.isArray(mastodonPosts)) {
    console.log(`Processing ${mastodonPosts.length} mastodon posts...`)
    for (const post of mastodonPosts) {
      if (!post.date) continue

      const dateKey = getDateKey(post.date)
      if (!dayData[dateKey]) dayData[dateKey] = {}
      if (!dayData[dateKey].mastodon) dayData[dateKey].mastodon = []

      dayData[dateKey].mastodon.push({
        id: post.id,
        text: post.text,
        year: post.year,
        date: post.date,
        url: post.url,
        replyTo: post.replyTo,
        favorites: post.favorites || 0,
        reblogs: post.reblogs || 0,
        visibility: post.visibility,
      })
    }
  }

  // Process commits
  if (commits && Array.isArray(commits)) {
    console.log(`Processing ${commits.length} commits...`)
    for (const commit of commits) {
      if (!commit.date) continue

      const dateKey = getDateKey(commit.date)
      if (!dayData[dateKey]) dayData[dateKey] = {}
      if (!dayData[dateKey].commits) dayData[dateKey].commits = []

      dayData[dateKey].commits.push({
        sha: commit.sha,
        message: commit.message,
        year: commit.year,
        date: commit.date,
        repo: commit.repo,
        repoUrl: commit.repoUrl,
      })
    }
  }

  // Process scrobbles
  if (scrobbles && Array.isArray(scrobbles)) {
    console.log(`Processing ${scrobbles.length} scrobbles...`)

    // Group scrobbles by date
    const scrobblesByDate = {}
    for (const scrobble of scrobbles) {
      if (!scrobble.date) continue

      const dateKey = getDateKey(scrobble.date)
      if (!scrobblesByDate[dateKey]) {
        scrobblesByDate[dateKey] = []
      }
      scrobblesByDate[dateKey].push(scrobble)
    }

    // Aggregate per year per day
    for (const [dateKey, dayScrobbles] of Object.entries(scrobblesByDate)) {
      const byYear = {}

      for (const scrobble of dayScrobbles) {
        const date = new Date(scrobble.date)
        const year = date.getFullYear()

        if (!byYear[year]) {
          byYear[year] = {
            tracks: [],
            artists: new Set(),
          }
        }

        const trackName = `${scrobble.artist} - ${scrobble.track}`
        byYear[year].tracks.push(trackName)
        byYear[year].artists.add(scrobble.artist)
      }

      // Create summary for each year
      if (!dayData[dateKey]) dayData[dateKey] = {}
      if (!dayData[dateKey].scrobbles) dayData[dateKey].scrobbles = []

      for (const [year, data] of Object.entries(byYear)) {
        // Count track frequencies
        const trackCounts = {}
        for (const track of data.tracks) {
          trackCounts[track] = (trackCounts[track] || 0) + 1
        }

        // Get top tracks
        const topTracks = Object.entries(trackCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([track]) => track)

        dayData[dateKey].scrobbles.push({
          year: parseInt(year),
          date: `${year}-${dateKey}`,
          count: data.tracks.length,
          topTracks,
          topArtists: Array.from(data.artists).slice(0, 3),
        })
      }
    }
  }

  // Process blog posts
  if (manifest && Array.isArray(manifest)) {
    console.log(`Processing ${manifest.length} blog posts...`)
    for (const post of manifest) {
      if (!post.metadata?.date || post.draft) continue

      const dateKey = getDateKey(post.metadata.date)
      if (!dayData[dateKey]) dayData[dateKey] = {}
      if (!dayData[dateKey].posts) dayData[dateKey].posts = []

      const date = new Date(post.metadata.date)
      dayData[dateKey].posts.push({
        slug: post.slug,
        title: post.metadata.title,
        dek: post.metadata.dek || null,
        year: date.getFullYear(),
        date: post.metadata.date,
      })
    }
  }

  // Write files
  console.log(`\nWriting ${Object.keys(dayData).length} day files...`)
  for (const [dateKey, data] of Object.entries(dayData)) {
    const filename = join(OUTPUT_DIR, `${dateKey}.json`)
    writeFileSync(filename, JSON.stringify(data, null, 2))
  }

  // Create index
  const index = Object.keys(dayData).sort()
  const indexPath = join(DATA_DIR, 'on-this-day-index.json')
  writeFileSync(indexPath, JSON.stringify(index, null, 2))

  // Stats
  const stats = {
    totalDays: Object.keys(dayData).length,
    totalTweets: Object.values(dayData).reduce(
      (sum, day) => sum + (day.tweets?.length || 0),
      0
    ),
    totalMastodon: Object.values(dayData).reduce(
      (sum, day) => sum + (day.mastodon?.length || 0),
      0
    ),
    totalCommits: Object.values(dayData).reduce(
      (sum, day) => sum + (day.commits?.length || 0),
      0
    ),
    totalScrobbles: Object.values(dayData).reduce(
      (sum, day) => sum + (day.scrobbles?.length || 0),
      0
    ),
    totalPosts: Object.values(dayData).reduce(
      (sum, day) => sum + (day.posts?.length || 0),
      0
    ),
  }

  console.log('\n✅ Done!\n')
  console.log('Stats:')
  console.log(`  ${stats.totalDays} days with data`)
  console.log(`  ${stats.totalTweets} tweets`)
  console.log(`  ${stats.totalMastodon} mastodon posts`)
  console.log(`  ${stats.totalCommits} commits`)
  console.log(`  ${stats.totalScrobbles} scrobble summaries`)
  console.log(`  ${stats.totalPosts} blog posts`)
}

buildOnThisDay()
