/**
 * @file dispatch-rss.xml.ts
 * @description RSS feed of public Dispatch pieces at /dispatch-rss.xml (named
 * like the other secondary feeds: week-notes-rss.xml, gists-rss.xml). Drafts,
 * unlisted, password and still-scheduled pieces never appear — the shared
 * `listDispatches()` gate handles all of them.
 */
import RSS from 'rss'
import { defineEventHandler, setHeader } from 'h3'
import { getDispatch, listDispatches } from '~/server/utils/dispatch'
import { escapeXml, stripInvalidXmlChars } from '~/server/utils/xml'

export default defineEventHandler(async (event) => {
  const siteUrl = 'https://ejfox.com'

  const feed = new RSS({
    title: 'EJ Fox · Dispatch',
    description: 'Short pieces of data journalism, with receipts.',
    feed_url: `${siteUrl}/dispatch-rss.xml`,
    site_url: `${siteUrl}/dispatch`,
    image_url: `${siteUrl}/icon.png`,
    language: 'en',
    pubDate: new Date().toUTCString(),
    copyright: `${new Date().getFullYear()} EJ Fox`,
    managingEditor: 'ej@ejfox.com (EJ Fox)',
    webMaster: 'ej@ejfox.com (EJ Fox)',
    ttl: 60,
  })

  // Feed is always public-only, even in dev.
  const pieces = await listDispatches({ preview: false })

  for (const meta of pieces.slice(0, 50)) {
    const piece = await getDispatch(meta.slug, { preview: false })
    if (!piece) continue
    const url = `${siteUrl}/dispatch/${piece.slug}`

    // Receipts travel with the piece: a feed reader gets the sources too.
    const sources = piece.sources.length
      ? `<h3>Sources</h3><ul>${piece.sources
          .map(
            (s) =>
              `<li><a href="${escapeXml(s.url)}">${escapeXml(s.title)}</a></li>`
          )
          .join('')}</ul>`
      : ''
    const image = piece.image
      ? `<p><img src="${escapeXml(piece.image)}" alt="${escapeXml(piece.image_alt || '')}"></p>`
      : ''

    feed.item({
      title: piece.title,
      description: piece.dek || piece.title,
      url,
      guid: url,
      categories: piece.tags,
      author: 'EJ Fox',
      date: piece.date ? new Date(piece.date) : new Date(),
      custom_elements: [
        {
          'content:encoded': {
            _cdata: stripInvalidXmlChars(image + piece.html + sources),
          },
        },
      ],
    })
  }

  setHeader(event, 'Content-Type', 'application/xml')
  setHeader(
    event,
    'Cache-Control',
    import.meta.dev ? 'no-cache' : 'public, max-age=3600, s-maxage=7200'
  )
  return feed.xml({ indent: true })
})
