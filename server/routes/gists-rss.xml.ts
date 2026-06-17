import { defineEventHandler } from 'h3'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'

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
// Disk-cache the last successful XML so the feed keeps serving when GitHub's
// API is down, the token is missing, or we're rate-limited.
const DISK_CACHE_PATH = join(process.cwd(), 'data/cache/gists-rss.xml')

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
    const etag = `"${lastBuildDate.getTime()}"`
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
  <title>${siteName}</title>
  <description>${siteDescription}</description>
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

      const filesContent = gist.files
        .map(
          (file: GistFile) => `
          <code:file>
            <code:filename>${file.name}</code:filename>
            <code:language>${file.language?.name || 'Unknown'}</code:language>
            <code:size>${file.size}</code:size>
            ${
              file.text
                ? `<content:encoded><![CDATA[${file.text}]]></content:encoded>`
                : ''
            }
          </code:file>
        `
        )
        .join('\n')

      return `<item>
      <title><![CDATA[${title}]]></title>
      <link>${gist.url}</link>
      <guid isPermaLink="true">${gist.url}</guid>
      <pubDate>${pubDate}</pubDate>
      <dc:creator>EJ Fox</dc:creator>
      <dc:modified>${updateDate}</dc:modified>
      <code:stargazers>${gist.stargazerCount}</code:stargazers>
      <description><![CDATA[${gist.description || ''}]]></description>
      <content:encoded><![CDATA[
        ${filesContent}
      ]]></content:encoded>
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
