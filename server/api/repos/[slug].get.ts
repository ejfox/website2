import { defineEventHandler, createError } from 'h3'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

interface RepoStats {
  stars: number
  forks: number
  watchers: number
  openIssues: number
}

interface RepoReadme {
  html: string
  raw: string
  excerpt: string
}

interface RepoData {
  name: string
  description: string
  url: string
  homepage: string | null
  stats: RepoStats
  language: string
  languageColor: string
  topics: string[]
  readme: RepoReadme
  createdAt: string
  updatedAt: string
  pushedAt: string
}

export default defineEventHandler(async (event): Promise<RepoData> => {
  const slug = event.context.params?.slug

  if (!slug) {
    throw createError({
      statusCode: 400,
      message: 'Repository slug is required',
    })
  }

  // Read from pre-generated JSON file
  const filePath = join(
    process.cwd(),
    'data',
    'github-repos',
    `${slug}.json`
  )

  if (!existsSync(filePath)) {
    throw createError({
      statusCode: 404,
      statusMessage: `Repository '${slug}' not found`,
    })
  }

  try {
    const fileContent = readFileSync(filePath, 'utf-8')
    const repoData: RepoData = JSON.parse(fileContent)

    return repoData
  } catch (error) {
    console.error(`Error reading repo data for ${slug}:`, error)
    throw createError({
      statusCode: 500,
      message: 'Failed to load repository data',
    })
  }
})
