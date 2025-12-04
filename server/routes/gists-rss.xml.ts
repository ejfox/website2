import { defineEventHandler } from 'h3'

const siteURL = 'https://ejfox.com'
const siteName = 'EJ Fox - Code Snippets & Gists'
const siteDescription =
  'A collection of useful code snippets, experiments, and tools.'
const CACHE_DURATION = 3600

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

    const response: any = await $fetch<any>('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: { query },
    })

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

    const gists: any[] = response.data.viewer.gists.nodes

    // Get the latest update time for ETag
    const lastBuildDate: Date = gists.reduce((latest: Date, gist: any) => {
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
    .map((gist: any) => {
      const title = gist.description || gist.files[0]?.name || 'Untitled Gist'
      const pubDate = new Date(gist.createdAt).toUTCString()
      const updateDate = new Date(gist.updatedAt).toUTCString()

      const filesContent = gist.files
        .map(
          (file: any) => `
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
    return rss
  } catch (error) {
    console.error(`Error generating gists RSS feed:`, error)
    event.node.res.statusCode = 500
    return '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Error</title><description>Error generating gists RSS feed</description></channel></rss>'
  }
})
