/**
 * Build a clean meta / og:description.
 *
 * Prefer a hand-written dek. Otherwise take the content, strip its markup,
 * decode its entities, collapse its whitespace, and cut on a whole word —
 * never mid-syllable. When nothing usable is left, fall back to the title.
 */

const stripTags = (s: string): string => s.replace(/<[^>]*>/g, ' ')

const decodeEntities = (s: string): string =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')

interface OgDescriptionOptions {
  dek?: string | null
  title?: string | null
  max?: number
}

export function ogDescription(
  source: string | undefined | null,
  { dek, title, max = 155 }: OgDescriptionOptions = {}
): string {
  if (dek && dek.trim()) return dek.trim()

  // strip real tags, decode entities, then strip again — the second pass
  // catches markup that was entity-encoded in the source (e.g. &#x3C;img>).
  const text = stripTags(decodeEntities(stripTags(source || '')))
    .replace(/\s+/g, ' ')
    .trim()

  // nothing usable, or the content is just the title restated → name it plainly
  if (!text || text.toLowerCase() === (title || '').trim().toLowerCase()) {
    return title ? `${title} — EJ Fox` : 'EJ Fox'
  }

  // no trailing period on a single line of copy
  if (text.length <= max) return text.replace(/\.$/, '')

  // cut on a whole word
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return (
    (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:—–-]+$/, '') +
    '…'
  )
}
