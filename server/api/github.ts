import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = config.public.GITHUB_TOKEN

  if (!token) {
    throw createError({
      statusCode: 400,
      message: 'GitHub token not configured'
    })
  }

  const response = await $fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: {
      query: `
        query {
          viewer {
            contributionsCollection {
              contributionCalendar {
                totalContributions
                weeks {
                  contributionDays {
                    contributionCount
                    date
                  }
                }
              }
              pullRequestContributions(first: 100) {
                totalCount
                nodes {
                  pullRequest {
                    title
                    merged
                    mergedAt
                  }
                }
              }
            }
            repositories(first: 100, orderBy: {field: PUSHED_AT, direction: DESC}) {
              nodes {
                name
                primaryLanguage {
                  name
                }
                refs(refPrefix: "refs/heads/", first: 1) {
                  nodes {
                    name
                    target {
                      ... on Commit {
                        history(first: 100) {
                          nodes {
                            message
                            committedDate
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `
    }
  })

  return response
})
