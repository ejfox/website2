/**
 * @file letterboxd.get.ts
 * @description Fetches Letterboxd film diary via RSS feed (the official data access method)
 * @endpoint GET /api/letterboxd
 * @returns Film data with watched films, ratings, poster images, TMDB IDs, and computed statistics
 *
 * Letterboxd API is invite-only and not available for personal projects.
 * RSS feed at https://letterboxd.com/ejfox/rss/ is the supported access method.
 * Feed includes letterboxd: and tmdb: namespaced elements with rich metadata.
 */

import NodeCache from 'node-cache'
import { XMLParser } from 'fast-xml-parser'

// Cache RSS results for 15 minutes
const cache = new NodeCache({ stdTTL: 900, checkperiod: 120 })
const CACHE_KEY = 'letterboxd-rss'
const RSS_URL = 'https://letterboxd.com/ejfox/rss/'

const parser = new XMLParser({
  ignoreAttributes: false,
  processEntities: true,
  // Preserve namespace prefixes so we get letterboxd:filmTitle etc.
  removeNSPrefix: false,
})

interface LetterboxdFilm {
  title: string
  year: string
  slug: string
  rating: number | null
  liked: boolean
  isRewatch: boolean
  watchedDate: string | null
  letterboxdUrl: string
  tmdbId: string | null
  posterUrl: string | null
}

function extractPosterFromHtml(description: string | undefined): string | null {
  if (!description || typeof description !== 'string') return null
  // The description CDATA contains an <img> tag with the poster
  const doc = description.split('src="')[1]
  if (!doc) return null
  const url = doc.split('"')[0]
  return url || null
}

function extractSlug(link: string | undefined): string {
  if (!link) return ''
  const parts = link.split('/film/')
  if (parts.length < 2) return ''
  return parts[1].replace(/\/$/, '')
}

function parseItem(item: Record<string, unknown>): LetterboxdFilm | null {
  const filmTitle = item['letterboxd:filmTitle']
  if (!filmTitle || typeof filmTitle !== 'string') return null

  const filmYear = String(item['letterboxd:filmYear'] || '')
  const link = String(item['link'] || '')
  const slug = extractSlug(link)

  const ratingVal = item['letterboxd:memberRating']
  const rating = ratingVal !== undefined ? Number(ratingVal) : null

  return {
    title: filmYear ? `${filmTitle} (${filmYear})` : filmTitle,
    year: filmYear,
    slug,
    rating: rating !== null && !Number.isNaN(rating) ? rating : null,
    liked: item['letterboxd:memberLike'] === 'Yes',
    isRewatch: item['letterboxd:rewatch'] === 'Yes',
    watchedDate: item['letterboxd:watchedDate'] ? String(item['letterboxd:watchedDate']) : null,
    letterboxdUrl: link || `https://letterboxd.com/film/${slug}/`,
    tmdbId: item['tmdb:movieId'] !== undefined ? String(item['tmdb:movieId']) : null,
    posterUrl: extractPosterFromHtml(item['description'] as string),
  }
}

function computeStats(films: LetterboxdFilm[]) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  const thisYear = films.filter(
    (f) => f.watchedDate && new Date(f.watchedDate).getFullYear() === currentYear
  ).length

  const thisMonth = films.filter((f) => {
    if (!f.watchedDate) return false
    const d = new Date(f.watchedDate)
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth
  }).length

  const ratedFilms = films.filter((f) => f.rating !== null)
  const averageRating =
    ratedFilms.length > 0
      ? ratedFilms.reduce((sum, f) => sum + (f.rating || 0), 0) / ratedFilms.length
      : 0

  return {
    totalFilms: films.length,
    thisYear,
    thisMonth,
    averageRating: Math.round(averageRating * 10) / 10,
    rewatches: films.filter((f) => f.isRewatch).length,
    liked: films.filter((f) => f.liked).length,
    topRatedFilms: films.filter((f) => f.rating && f.rating >= 4),
    recentFilms: films.slice(0, 10),
    filmsByMonth: {} as Record<string, number>,
  }
}

export default defineEventHandler(async (_event) => {
  const cached = cache.get(CACHE_KEY)
  if (cached) return cached

  try {
    const xml = await $fetch<string>(RSS_URL, {
      responseType: 'text',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EJFox Website Bot)' },
    })

    const parsed = parser.parse(xml)
    const rawItems = parsed?.rss?.channel?.item
    // Normalize to array (single item comes back as object, not array)
    const items: Record<string, unknown>[] = Array.isArray(rawItems)
      ? rawItems
      : rawItems
        ? [rawItems]
        : []

    const films: LetterboxdFilm[] = items
      .map(parseItem)
      .filter((f): f is LetterboxdFilm => f !== null)

    const result = {
      films,
      stats: computeStats(films),
      lastUpdated: new Date().toISOString(),
      source: 'RSS feed',
    }

    cache.set(CACHE_KEY, result)
    return result
  } catch (error) {
    console.error('Letterboxd RSS error:', error)

    return {
      films: [],
      stats: {
        totalFilms: 0,
        thisYear: 0,
        thisMonth: 0,
        averageRating: 0,
        rewatches: 0,
        liked: 0,
        topRatedFilms: [],
        recentFilms: [],
        filmsByMonth: {},
      },
      lastUpdated: new Date().toISOString(),
      error: 'RSS parsing failed - ' + (error instanceof Error ? error.message : 'Unknown error'),
      source: 'RSS feed',
    }
  }
})
