/**
 * @file useScrapPermalink.ts
 * @description Fetch one shared scrap for /scraps/<id> and /scraps/embed/<id>, 404 when the
 * API says no, plus the wall-label text split shared by both pages.
 */
export interface ScrapPermalink {
  id: string
  title: string | null
  summary: string | null
  url: string | null
  created_at: string
  published_at: string | null
  tags: string[]
  concept_tags: string[]
  type: string | null
  source: string | null
  content_type: string | null
  location: string | null
  screenshot_url: string | null
  relationships: number
  to_read: boolean
}

// Some vision-model summaries are runaway (raw **markdown**, "Group Group Group..." loops).
// Same budget as the card copy: strip markdown emphasis, collapse whitespace, cap ~700 chars.
const EXCERPT_MAX = 700

export function scrapExcerpt(text: string | null) {
  if (!text) return null
  const clean = text.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim()
  if (clean.length <= EXCERPT_MAX) return clean || null
  const cut = clean.slice(0, EXCERPT_MAX)
  const space = cut.lastIndexOf(' ')
  if (space > EXCERPT_MAX * 0.8) return `${cut.slice(0, space)}…`
  return `${cut}…`
}

/** The card splits "WHY KEPT — … ABOUT — …" out of the summary; the web label does the same. */
export function scrapLabelParts(summary: string | null) {
  const s = summary?.trim() || ''
  if (!s.toUpperCase().startsWith('WHY KEPT')) return { why: null, about: scrapExcerpt(s) }
  const body = s.slice('WHY KEPT'.length).replace(/^[\s—-]+/, '')
  const at = body.toUpperCase().indexOf('\nABOUT')
  if (at < 0) return { why: scrapExcerpt(body), about: null }
  const about = body.slice(at + '\nABOUT'.length).replace(/^[\s—-]+/, '')
  return { why: scrapExcerpt(body.slice(0, at)), about: scrapExcerpt(about) }
}

export async function useScrapPermalink() {
  const route = useRoute()
  const id = String((route.params as { id?: string }).id || '')
  const { data: scrap, error } = await useFetch<ScrapPermalink>(
    `/api/scraps/${encodeURIComponent(id)}`,
    { key: `scrap-${id}` }
  )
  if (error.value || !scrap.value) {
    throw createError({ statusCode: 404, statusMessage: 'No such scrap', fatal: true })
  }
  return scrap
}

/**
 * SEO for a fetched scrap. Call it from the page's <script setup> AFTER awaiting
 * useScrapPermalink(): only page setup gets the Nuxt context back after an await (E1001).
 */
export function useScrapSeo(scrap: ScrapPermalink) {
  const parts = scrapLabelParts(scrap.summary)
  usePageSeo({
    title: scrap.title || 'Scrap',
    description: parts.why || parts.about || 'A scrap from EJ Fox’s scrapbook',
    type: 'article',
    section: 'Scraps',
  })
}
