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
    let slugParts = event.context.params.slug // Access the slug from the URL parameters
    if (typeof slugParts === 'string') {
      // Split the slug by comma or slash to handle cases where the slug is joined in different formats
      slugParts = slugParts.split(/[,\/]/)
    }

    // Join the slug parts back together with slashes to create a valid file path
    const slug = slugParts.join('/')
    // Resolve the absolute path to the JSON file for the post
    const postPath = resolve(process.cwd(), 'content', 'processed', `${slug}.json`)

    // Debug logs for clarity on the slug processing
    console.log('Slug parts:', slugParts) // Logs the individual parts of the slug after splitting
    console.log('Joined slug:', slug) // Logs the joined slug
    console.log('Full post path:', postPath) // Logs the resolved path to the post's JSON file

    // Read the content of the post's JSON file asynchronously
    const postContent = await readFile(postPath, 'utf-8')
    // Parse the JSON content and return it as the response
    return JSON.parse(postContent)
  } catch (error) {
    // Log the error message if there's an issue fetching or reading the post
    console.error(`Error fetching post: ${error.message}`)
    // Set the response status code to 404 to indicate that the post was not found
    event.res.statusCode = 404
    // Return an error message as JSON
    return { error: 'Post not found' }
  }
})
