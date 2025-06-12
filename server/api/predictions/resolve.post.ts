import { promises as fs } from 'fs'
import { join } from 'path'
import matter from 'gray-matter'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { id, correct, explanation, date } = body
  
  try {
    const predictionsDir = join(process.cwd(), 'content', 'predictions')
    const filePath = join(predictionsDir, `${id.replace(/-/g, '/')}.md`)
    
    // Read the existing file
    const content = await fs.readFile(filePath, 'utf-8')
    const { data, content: body } = matter(content)
    
    // Update the frontmatter with resolution data
    data.resolved = {
      date,
      correct,
      explanation
    }
    
    // Reconstruct the file
    const newContent = matter.stringify(body, data)
    
    // Write back to disk
    await fs.writeFile(filePath, newContent, 'utf-8')
    
    // Return the updated prediction
    return {
      id,
      slug: id.replace(/-/g, '/'),
      statement: data.statement,
      confidence: data.confidence,
      deadline: data.deadline,
      categories: data.categories || [],
      visibility: data.visibility || 'public',
      created: data.created,
      resolved: data.resolved,
      evidence: body.trim()
    }
  } catch (error) {
    console.error('Error resolving prediction:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to resolve prediction'
    })
  }
})