import { defineEventHandler, createError, getQuery } from 'h3'

interface GistFile {
  filename: string
  type: string
  language: string
  raw_url: string
  size: number
}

interface Gist {
  id: string
  description: string
  created_at: string
  updated_at: string
  files: Record<string, GistFile>
  html_url: string
  content?: string // For single file gists
}

export default defineEventHandler(async (event): Promise<Gist[]> => {
  const config = useRuntimeConfig()
  const query = getQuery(event)

  const perPage = query.per_page || 64
  const page = query.page || 1

  // Get token (same logic as github.get.ts)
  let token = config.githubToken || config.GITHUB_TOKEN

  if (token === 'your_token_here') {
    const directEnvToken = process.env.GITHUB_TOKEN
    if (directEnvToken && directEnvToken !== 'your_token_here') {
      token = directEnvToken
    }
  }

  if (token) {
    token = token.trim()
  }

  if (!token) {
    throw createError({
      statusCode: 500,
      message: 'GitHub token not configured',
    })
  }

  try {
    const response = await $fetch<Gist[]>(
      `https://api.github.com/users/ejfox/gists`,
      {
        headers: {
          Authorization: `token ${token}`,
          'User-Agent': 'EJFox-Website/1.0',
        },
        query: {
          per_page: perPage,
          page: page,
        },
      }
    )

    // For single-file gists, fetch the content
    const gistsWithContent = await Promise.all(
      response.map(async (gist) => {
        const fileCount = Object.keys(gist.files).length
        if (fileCount === 1) {
          try {
            const file = Object.values(gist.files)[0]
            const content = await $fetch<string>(file.raw_url, {
              headers: {
                'User-Agent': 'EJFox-Website/1.0',
              },
            })
            return { ...gist, content }
          } catch (error) {
            console.warn(`Failed to fetch content for gist ${gist.id}:`, error)
            return gist
          }
        }
        return gist
      })
    )

    return gistsWithContent
  } catch (error: any) {
    console.error('Gists API Error:', error)

    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch gists',
    })
  }
})
