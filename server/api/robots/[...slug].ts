/**
 * @file robots/[...slug].ts
 * @description GET /api/robots lists robot notes (getRobotNotes() from
 *   composables/useProcessedMarkdown.ts); GET /api/robots/<slug...> returns one
 *   note's processed JSON from content/processed/robots/, falling back to
 *   content/blog/robots/. A note is served only if metadata.share is true and
 *   it isn't scheduled. No cache. Throws 400 without a slug, 404 otherwise.
 */
import { createRouter, defineEventHandler, useBase, createError } from 'h3'
import { useProcessedMarkdown } from '~/composables/useProcessedMarkdown'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { isScheduled } from '~/utils/postFilters'

const router = createRouter()

router.get(
  '/',
  defineEventHandler(async () => {
    const { getRobotNotes } = useProcessedMarkdown()
    return getRobotNotes()
  })
)

router.get(
  '/*',
  defineEventHandler(async (event) => {
    // Get the full path from the URL
    // Raw event.path: not decoded, includes any query string, and isn't
    // checked for '..'. The share flag below is what keeps other JSON from serving.
    const fullPath = event.path?.replace('/api/robots/', '') || ''

    if (!fullPath) {
      throw createError({
        statusCode: 400,
        message: 'Missing slug parameter',
      })
    }

    try {
      // Try both content/processed and content/blog paths
      const processedPath = path.join(
        process.cwd(),
        'content/processed/robots',
        `${fullPath}.json`
      )
      const blogPath = path.join(
        process.cwd(),
        'content/blog/robots',
        `${fullPath}.json`
      )

      let rawData
      if (existsSync(processedPath)) {
        rawData = await readFile(processedPath, 'utf-8')
      } else if (existsSync(blogPath)) {
        rawData = await readFile(blogPath, 'utf-8')
      } else {
        throw new Error(`No file found at ${processedPath} or ${blogPath}`)
      }

      const data = JSON.parse(rawData)

      // share is opt-in per note; draft/hidden flags aren't checked here.
      if (!data || !data.metadata?.share || isScheduled(data)) {
        throw createError({
          statusCode: 404,
          message: 'Robot note not found',
        })
      }

      return data
    } catch {
      throw createError({
        statusCode: 404,
        message: 'Robot note not found',
      })
    }
  })
)

export default useBase('/api/robots', router.handler)
