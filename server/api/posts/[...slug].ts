import { defineEventHandler } from 'h3'
import { readFile } from 'fs/promises'
import { resolve } from 'path'

export default defineEventHandler(async (event) => {
  try {
    let slugParts = event.context.params.slug
    if (typeof slugParts === 'string') {
      // Split by both comma and slash to handle different possible formats
      slugParts = slugParts.split(/[,\/]/)
    }
    const slug = slugParts.join('/')
    const postPath = resolve(process.cwd(), 'dist', 'processed', `${slug}.json`)

    console.log('Slug parts:', slugParts)
    console.log('Joined slug:', slug)
    console.log('Full post path:', postPath)

    const postContent = await readFile(postPath, 'utf-8')
    return JSON.parse(postContent)
  } catch (error) {
    console.error(`Error fetching post: ${error.message}`)
    event.res.statusCode = 404
    return { error: 'Post not found' }
  }
})
