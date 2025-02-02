import { createRouter, defineEventHandler, useBase, createError } from 'h3'
import { useProcessedMarkdown } from '~/composables/useProcessedMarkdown'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

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

    console.log('Robot API: Fetching note:', {
      path: event.path,
      fullPath
    })

    if (!fullPath) {
      throw createError({
        statusCode: 400,
        message: 'Missing slug parameter'
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

      console.log('Robot API: Looking for file at:', {
        processedPath,
        blogPath,
        processedExists: existsSync(processedPath),
        blogExists: existsSync(blogPath),
        cwd: process.cwd()
      })

      let rawData
      if (existsSync(processedPath)) {
        rawData = await readFile(processedPath, 'utf-8')
        console.log('Robot API: Found file in processed path')
      } else if (existsSync(blogPath)) {
        rawData = await readFile(blogPath, 'utf-8')
        console.log('Robot API: Found file in blog path')
      } else {
        console.log('Robot API: No file found in either location')
        throw new Error(`No file found at ${processedPath} or ${blogPath}`)
      }

      const data = JSON.parse(rawData)

      console.log('Robot API: Found post:', {
        fullPath,
        hasPost: !!data,
        isShared: data?.metadata?.share,
        metadata: data?.metadata
      })

      if (!data || !data.metadata?.share) {
        throw createError({
          statusCode: 404,
          message: 'Robot note not found'
        })
      }

      return data
    } catch (error) {
      console.error('Robot API Error:', error)
      throw createError({
        statusCode: 404,
        message: 'Robot note not found'
      })
    }
  })
)

export default useBase('/api/robots', router.handler)
