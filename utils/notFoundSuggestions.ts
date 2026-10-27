/**
 * @file notFoundSuggestions.ts
 * @description "Maybe you meant" for the 404 page (error.vue): match the
 * missing path's words against each published post's slug and title.
 *
 * Path structure (blog, projects, years) is not content: counting it is what
 * made every dead /projects/* URL suggest three random projects. A suggestion
 * needs a real word in common, or nothing is shown.
 */

export interface SuggestableItem {
  slug?: string
  title?: string
}

export interface Suggestion {
  title: string
  path: string
}

const STOPWORDS = new Set([
  // route structure
  'blog',
  'projects',
  'project',
  'reading',
  'tag',
  'tags',
  'drafts',
  'index',
  'week',
  'notes',
  'html',
  'www',
  // filler
  'the',
  'and',
  'for',
  'with',
  'from',
  'into',
  'about',
  'your',
  'you',
  'our',
  'how',
  'why',
  'what',
  'when',
  'using',
  'use',
  'my',
  'its',
  'are',
  'was',
  'this',
  'that',
  'not',
  'all',
  'new',
  'more',
  'some',
])

// ── Tokens + fuzzy word match ───────────────────────────────
export function tokenize(text: string): string[] {
  return (text || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w) && !/^\d+$/.test(w))
}

/** Levenshtein distance, bailing out above `max` */
function editDistance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
    }
    prev = cur
  }
  return prev[b.length]
}

/** 1 exact, 0.9 plural/stem (tool ~ tools), 0.8 one typo (radioz ~ radios) */
function wordMatch(q: string, t: string): number {
  if (q === t) return 1
  const [short, long] = q.length <= t.length ? [q, t] : [t, q]
  if (
    short.length >= 4 &&
    long.startsWith(short) &&
    long.length - short.length <= 2
  )
    return 0.9
  if (short.length >= 5 && editDistance(q, t, 1) <= 1) return 0.8
  return 0
}

// ── Scoring ─────────────────────────────────────────────────
export function itemPath(slug: string): string {
  if (slug.startsWith('projects/') || slug.startsWith('reading/'))
    return `/${slug}`
  return `/blog/${slug}`
}

export function suggestForPath(
  path: string,
  items: SuggestableItem[],
  limit = 3
): Suggestion[] {
  const clean = decodeURIComponentSafe(path || '').toLowerCase()
  if (!clean || clean.length > 120) return []
  const query = [...new Set(tokenize(clean))]
  if (!query.length) return []

  const wantsReading = /^\/?reading\//.test(clean)

  const candidates = items
    .filter((item) => item.slug && item.title)
    .filter((item) => wantsReading || !item.slug!.startsWith('reading/'))
    .map((item) => ({
      item,
      words: new Set([
        ...tokenize(item.slug!.split('/').pop() || ''),
        ...tokenize(item.title!),
      ]),
    }))

  // A word in many titles ("data") says little about which post was meant
  const common = Math.max(5, candidates.length * 0.04)
  const weight = (q: string) =>
    candidates.filter((c) => c.words.has(q)).length > common ? 0.5 : 1

  const scored = candidates
    .map(({ item, words }) => {
      let score = 0
      for (const q of query) {
        let best = 0
        for (const w of words) best = Math.max(best, wordMatch(q, w))
        score += best * weight(q)
      }
      return { title: item.title!, path: itemPath(item.slug!), score }
    })
    .filter((s) => s.score >= 0.8)
    .sort((a, b) => b.score - a.score)

  if (!scored.length) return []
  // Only near-best matches: one shared generic word ("tool") shouldn't ride
  // along with a post that shares the specific one ("cloudinary")
  const floor = scored[0].score * 0.6
  return scored
    .filter((s) => s.score >= floor)
    .slice(0, limit)
    .map(({ title, path }) => ({ title, path }))
}

function decodeURIComponentSafe(s: string): string {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}
