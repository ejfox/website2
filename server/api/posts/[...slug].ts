import { defineEventHandler } from 'h3'
import { readFile } from 'fs/promises'
import { resolve } from 'path'

export default defineEventHandler(async (event) => {
  try {
    const slug = event.context.params.slug
    const postPath = resolve(process.cwd(), `dist/processed/${slug}.json`)
    const postContent = await readFile(postPath, 'utf-8')
    return JSON.parse(postContent)
  } catch (error) {
    console.error(`Error fetching post: ${error.message}`)
    event.res.statusCode = 404
    return { error: 'Post not found' }
  }
})
