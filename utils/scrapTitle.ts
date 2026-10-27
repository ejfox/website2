/**
 * @file scrapTitle.ts
 * @description Display title for a scrap/bookmark. Pinboard stores untitled
 *   bookmarks as the literal "[no title]", so treat that (and blank) as
 *   missing and fall back to the bare hostname. Imported by
 *   server/routes/scraps-rss.xml.ts and pages/scraps/index.vue.
 *   Gotcha: server/api/scraps/by-tags.get.ts (the post sidebar's Research
 *   list) and server/api/temporal-context.get.ts re-implement the same
 *   "[no title]" check inline rather than calling this.
 */
export function scrapHostname(url: string | null | undefined): string {
  if (!url) return ''
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

export function scrapDisplayTitle(
  title: string | null | undefined,
  url: string | null | undefined,
  fallback = 'Untitled scrap'
): string {
  const t = title?.trim()
  if (t && t !== '[no title]') return t
  return scrapHostname(url) || fallback
}
