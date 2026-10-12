/**
 * Display title for a scrap/bookmark. Pinboard stores untitled bookmarks as
 * the literal "[no title]", so treat that (and blank) as missing and fall
 * back to the bare hostname. Shared by the scraps feed, /scraps and the post
 * sidebar's Research list so every surface agrees.
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
