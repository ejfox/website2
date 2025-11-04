// Check for resolved markets and update markdown files directly
import { promises as fs } from 'fs'
import path from 'path'
import matter from 'gray-matter'

const PREDICTIONS_DIR = path.join(process.cwd(), 'content/predictions')

export default defineEventHandler(async (event) => {
  const updates: string[] = []

  // Get all prediction files
  const files = await fs.readdir(PREDICTIONS_DIR)
  const mdFiles = files.filter(f => f.endsWith('.md'))

  for (const file of mdFiles) {
    const filePath = path.join(PREDICTIONS_DIR, file)
    const content = await fs.readFile(filePath, 'utf-8')
    const parsed = matter(content)
    const frontmatter = parsed.data

    // Skip if no market linked or not set to auto-resolve
    if (!frontmatter.market?.slug || !frontmatter.market?.autoResolve) {
      continue
    }

    // Skip if already resolved
    if (frontmatter.resolved) {
      continue
    }

    // Check market status
    try {
      const marketData = await $fetch(
        `/api/markets/${frontmatter.market.provider}?slug=${frontmatter.market.slug}`
      )

      if (marketData.resolved) {
        // Determine if prediction was correct
        const isCorrect = marketData.outcome === 'YES'

        // Update frontmatter
        frontmatter.resolved = true
        frontmatter.resolved_date = new Date().toISOString()
        frontmatter.status = isCorrect ? 'correct' : 'incorrect'
        frontmatter.resolution = `Auto-resolved via ${frontmatter.market.provider} market settlement`

        // Add market resolution data
        frontmatter.market.resolvedAt = marketData.lastUpdated
        frontmatter.market.finalProb = marketData.currentProb
        frontmatter.market.outcome = marketData.outcome

        // Write back to markdown file
        const newContent = matter.stringify(parsed.content, frontmatter)
        await fs.writeFile(filePath, newContent)

        updates.push(frontmatter.id || file)
        console.log(`✅ Resolved: ${frontmatter.statement}`)
      }
    } catch (error) {
      console.error(`Failed to check market for ${file}:`, error)
    }
  }

  return {
    checked: mdFiles.length,
    resolved: updates.length,
    updates
  }
})
