import { createRouter, defineEventHandler, useBase, createError } from 'h3'
import { useProcessedMarkdown } from '~/composables/useProcessedMarkdown'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const router = createRouter()

router.get(
  '/',
  defineEventHandler(async () => {
    const { getRobotNotes } = useProcessedMarkdown()
    return await getRobotNotes()
  })
)

router.get(
  '/*',
  defineEventHandler(async (event) => {
    // Get the full path from the URL
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

      if (!data || !data.metadata?.share) {
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
