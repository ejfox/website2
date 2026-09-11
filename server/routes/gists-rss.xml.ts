import { defineEventHandler } from 'h3'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { escapeXml, cdata } from '~/server/utils/xml'

// GraphQL response types
interface GistFile {
  name: string
  language: { name: string } | null
  text: string | null
  size: number
}

interface Gist {
  name: string
  description: string | null
  url: string
  pushedAt: string
  updatedAt: string
  createdAt: string
  isPublic: boolean
  stargazerCount: number
  files: GistFile[]
}

interface GraphQLError {
  message: string
}

interface GistsGraphQLResponse {
  errors?: GraphQLError[]
  data?: {
    viewer?: {
      gists?: {
        nodes?: Gist[]
      }
    }
  }
}

const siteURL = 'https://ejfox.com'
const siteName = 'EJ Fox - Code Snippets & Gists'
const siteDescription =
  'A collection of useful code snippets, experiments, and tools.'
const CACHE_DURATION = 3600

// Gists include data files that run to megabytes. Inlining all of them produced
// a ~21MB feed that readers time out on, so cap the source we embed; the item
// still links to the full gist. Counted in UTF-16 code units, not bytes — a
// CJK- or emoji-heavy file yields more bytes than this number suggests.
const MAX_FILE_TEXT_CHARS = 16_000

// Bump whenever the emitted XML shape changes. This invalidates BOTH stale-serve
// paths at once — the disk-cache filename and the ETag — so a cache or a
// conditional request left over from an older serializer can never resurrect it.
const FEED_FORMAT_VERSION = 'v2'

// Disk-cache the last successful XML so the feed keeps serving when GitHub's
// API is down, the token is missing, or we're rate-limited. The stale-on-error
// path returns this file verbatim with a 200, so the version in the name is
// load-bearing: unversioned, the old serializer's invalid 20MB output would be
// re-served indefinitely the first time GitHub was unreachable after a deploy.
const DISK_CACHE_PATH = join(
  process.cwd(),
  `data/cache/gists-rss.${FEED_FORMAT_VERSION}.xml`
)

function readDiskCache(): string | null {
  try {
    return existsSync(DISK_CACHE_PATH)
      ? readFileSync(DISK_CACHE_PATH, 'utf-8')
      : null
  } catch {
    return null
  }
}

function writeDiskCache(xml: string): void {
  try {
    mkdirSync(dirname(DISK_CACHE_PATH), { recursive: true })
    writeFileSync(DISK_CACHE_PATH, xml)
  } catch {
    /* best effort */
  }
}

export default defineEventHandler(async (event): Promise<string> => {
  try {
    // Add cache control headers
    event.node.res.setHeader(
      'Cache-Control',
      `public, max-age=${CACHE_DURATION}`
    )

    const config = useRuntimeConfig()
    const token = config.githubToken || config.GITHUB_TOKEN

    if (!token) {
      throw new Error('GitHub token not configured')
    }

    // GraphQL query for gists
    const query = `
      query {
        viewer {
          gists(
            first: 100,
            privacy: PUBLIC,
            orderBy: {field: PUSHED_AT, direction: DESC}
          ) {
            nodes {
              name
              description
              url
              pushedAt
              updatedAt
              createdAt
              isPublic
              stargazerCount
              files {
                name
                language {
                  name
                }
                text
                size
              }
            }
          }
        }
      }
    `

    const response = await $fetch<GistsGraphQLResponse>(
      'https://api.github.com/graphql',
      {
        method: 'POST',
        headers: {
          Authorization: `bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: { query },
      }
    )

    // Handle GraphQL errors
    if (response?.errors) {
      console.error('GitHub GraphQL errors:', response.errors)
      throw new Error(
        `GitHub API error: ${response.errors[0]?.message || 'Unknown error'}`
      )
    }

    if (!response?.data?.viewer?.gists?.nodes) {
      console.error(
        'Unexpected GitHub response structure:',
        JSON.stringify(response, null, 2)
      )
      throw new Error('Invalid GitHub API response structure')
    }

    const gists: Gist[] = response.data.viewer.gists.nodes

    // Get the latest update time for ETag
    const lastBuildDate: Date = gists.reduce((latest: Date, gist: Gist) => {
      const gistDate = new Date(gist.pushedAt)
      return gistDate > latest ? gistDate : latest
    }, new Date(0))

    // ETag handling
    // Include the format version: the ETag is derived from gist timestamps,
    // which don't change when the serializer does. Without this, a reader or
    // CDN holding an ETag from the old broken output gets a 304 and keeps
    // serving that body even though the feed has been fixed.
    const etag = `"${FEED_FORMAT_VERSION}-${lastBuildDate.getTime()}"`
    event.node.res.setHeader('ETag', etag)
    if (event.node.req.headers['if-none-match'] === etag) {
      event.node.res.statusCode = 304
      return ''
    }

    const rss: string = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
  xmlns:atom="http://www.w3.org/2005/Atom" 
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:code="http://ejfox.com/ns/code/">
<channel>
  <title>${escapeXml(siteName)}</title>
  <description>${escapeXml(siteDescription)}</description>
  <link>${siteURL}/gists</link>
  <atom:link
    href="${siteURL}/gists-rss.xml"
    rel="self"
    type="application/rss+xml"
  />
  <lastBuildDate>${lastBuildDate.toUTCString()}</lastBuildDate>
  <ttl>${CACHE_DURATION / 60}</ttl>
  <generator>EJ Fox Gists RSS Generator</generator>
  ${gists
    .map((gist: Gist) => {
      const title = gist.description || gist.files[0]?.name || 'Untitled Gist'
      const pubDate = new Date(gist.createdAt).toUTCString()
      const updateDate = new Date(gist.updatedAt).toUTCString()

      // Structured per-file metadata, in our own `code:` namespace. These are
      // real child elements of <item> — they must NOT be nested inside
      // content:encoded's CDATA, which is what previously broke the XML.
      const fileElements = gist.files
        .map(
          (file: GistFile) => `
      <code:file>
        <code:filename>${escapeXml(file.name)}</code:filename>
        <code:language>${escapeXml(file.language?.name || 'Unknown')}</code:language>
        <code:size>${file.size}</code:size>
      </code:file>`
        )
        .join('')

      // content:encoded is what a reader actually renders, so give it HTML.
      const filesHtml = gist.files
        .map((file: GistFile) => {
          const heading = `<h3>${escapeXml(file.name)}</h3>`
          if (!file.text) return heading
          const truncated = file.text.length > MAX_FILE_TEXT_CHARS
          const text = truncated
            ? file.text.slice(0, MAX_FILE_TEXT_CHARS)
            : file.text
          const lang = file.language?.name?.toLowerCase() || ''
          const cls = lang ? ` class="language-${escapeXml(lang)}"` : ''
          const note = truncated
            ? `<p><em>Truncated — <a href="${escapeXml(gist.url)}">view the full gist</a>.</em></p>`
            : ''
          return `${heading}<pre><code${cls}>${escapeXml(text)}</code></pre>${note}`
        })
        .join('\n')

      return `<item>
      <title>${cdata(title)}</title>
      <link>${escapeXml(gist.url)}</link>
      <guid isPermaLink="true">${escapeXml(gist.url)}</guid>
      <pubDate>${pubDate}</pubDate>
      <dc:creator>EJ Fox</dc:creator>
      <dc:modified>${updateDate}</dc:modified>
      <code:stargazers>${gist.stargazerCount}</code:stargazers>${fileElements}
      <description>${cdata(gist.description || '')}</description>
      <content:encoded>${cdata(filesHtml)}</content:encoded>
    </item>`
    })
    .join('\n')}
</channel>
</rss>`

    event.node.res.setHeader('Content-Type', 'application/xml')
    // Persist a copy so future requests can serve it even if GitHub is down
    writeDiskCache(rss)
    return rss
  } catch (error) {
    console.error(`Error generating gists RSS feed:`, error)
    // Serve last known good copy if we have one (200, not 500)
    const cached = readDiskCache()
    if (cached) {
      event.node.res.setHeader('Content-Type', 'application/xml')
      event.node.res.setHeader('X-Gists-Cache', 'stale-on-error')
      return cached
    }
    event.node.res.statusCode = 503
    event.node.res.setHeader('Content-Type', 'application/xml')
    return '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Gists feed temporarily unavailable</title><description>Live GitHub data is currently unavailable and no cached copy exists yet. Try again shortly.</description></channel></rss>'
  }
})
