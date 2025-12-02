#!/usr/bin/env node

import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import readline from 'node:readline'
import matter from 'gray-matter'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const question = (query) =>
  new Promise((resolve) => rl.question(query, resolve))

async function createPrediction() {
  console.log('Create a new prediction')
  console.log('----------------------')

  const statement = await question('Prediction statement: ')
  const confidence = Number.parseInt(await question('Confidence (0-100): '))
  const deadline = await question('Deadline (YYYY-MM-DD): ')
  const categoriesInput = await question('Categories (comma-separated): ')
  const categories = categoriesInput.split(',').map((c) => c.trim())
  const visibility =
    (await question('Visibility (public/private) [public]: ')) || 'public'

  console.log('\nEvidence/Reasoning (type "DONE" on a new line when finished):')
  const evidenceLines = []
  let line
  while ((line = await question('')) !== 'DONE') {
    evidenceLines.push(line)
  }
  const evidence = evidenceLines.join('\n')

  // Generate filename
  const date = new Date().toISOString().split('T')[0]
  const slug = statement
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50)

  const year = new Date().getFullYear()
  const dir = join(process.cwd(), 'content', 'predictions', year.toString())
  await fs.mkdir(dir, { recursive: true })

  const filename = `${slug}.md`
  const filepath = join(dir, filename)

  // Create frontmatter
  const frontmatter = {
    statement,
    confidence,
    deadline,
    categories,
    visibility,
    created: date,
  }

  // Create file content
  const content = matter.stringify(evidence, frontmatter)

  // Write file
  await fs.writeFile(filepath, content, 'utf-8')

  console.log(`\nPrediction created: ${filepath}`)
  rl.close()
}

createPrediction().catch(console.error)
