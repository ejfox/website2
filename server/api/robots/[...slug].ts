import { createRouter, defineEventHandler, useBase } from 'h3'
import { useProcessedMarkdown } from '~/composables/useProcessedMarkdown'

const router = createRouter()

router.get('/', defineEventHandler(async () => {
  const { getRobotNotes } = useProcessedMarkdown()
  return await getRobotNotes()
}))

router.get('/:slug', defineEventHandler(async (event) => {
  const { getPostBySlug } = useProcessedMarkdown()
  const slug = event.context.params?.slug
  
  try {
    const post = await getPostBySlug(`robots/${slug}`)
    
    if (!post || !post.share) {
      throw createError({
        statusCode: 404,
        message: 'Robot note not found'
      })
    }

    return post
  } catch (error) {
    throw createError({
      statusCode: 404,
      message: 'Robot note not found'
    })
  }
}))

export default useBase('/api/robots', router.handler) 