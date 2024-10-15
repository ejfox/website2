import { defineEventHandler } from 'h3' // Importing the event handler function from h3 framework
import { readFile } from 'fs/promises' // Using the promises API from 'fs' to read files asynchronously
import { resolve } from 'path' // To resolve file paths in a cross-platform way

/**
 * Endpoint handler to fetch and return the content of a post based on the provided slug.
 * The post content is read from a pre-processed JSON file stored in the 'dist/processed' directory.
 *
 * @param {Object} event - The event object representing the incoming request.
 * @returns {Promise<Object>} The post content as a JSON object, or an error message if the post is not found.
 */
export default defineEventHandler(async (event) => {
  try {
    const slugParts = event.context.params?.slug || ['index']
    const slug = Array.isArray(slugParts) ? slugParts.join('/') : slugParts

    console.log('Received request for slug:', slug)

    // Load the manifest-lite.json
    const manifestPath = resolve(process.cwd(), 'content/processed/manifest-lite.json')
    const manifestContent = await readFile(manifestPath, 'utf-8')
    const manifest = JSON.parse(manifestContent)

    // Special handling for the index page
    if (slug === 'index') {
      console.log('Fetching index page')
      const indexPath = resolve(process.cwd(), 'content', 'processed', 'index.json')
      const indexContent = await readFile(indexPath, 'utf-8')
      return JSON.parse(indexContent)
    }

    // Try to fetch the post directly first
    const postPath = resolve(process.cwd(), 'content', 'processed', `${slug}.json`)
    try {
      console.log('Attempting to fetch post directly:', postPath)
      const postContent = await readFile(postPath, 'utf-8')
      return JSON.parse(postContent)
    } catch (error) {
      console.log('Post not found directly, searching in manifest')
      // If not found, look for a match in the manifest
      const matchedPost = manifest.find((p: { slug: string }) => p.slug.endsWith(slug))

      if (matchedPost) {
        const year = matchedPost.slug.split('/')[0]
        const newSlug = `${year}/${slug}`
        if (newSlug !== slug) {
          console.log('Matched post in manifest, redirecting to:', `/blog/${newSlug}`)
          return {
            redirect: `/blog/${newSlug}`
          }
        } else {
          console.log('Matched post in manifest, but no redirection needed')
          const matchedPostPath = resolve(process.cwd(), 'content', 'processed', `${matchedPost.slug}.json`)
          const matchedPostContent = await readFile(matchedPostPath, 'utf-8')
          return JSON.parse(matchedPostContent)
        }
      }

      // If still not found, throw an error
      throw new Error('Post not found')
    }
  } catch (error) {
    console.error(`Error fetching post: ${(error as Error).message}`)
    event.node.res.statusCode = 404
    return { error: 'Post not found' }
  }
})
