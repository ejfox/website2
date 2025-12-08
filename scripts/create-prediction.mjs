#!/usr/bin/env node
/* eslint-disable no-console */

import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import readline from 'node:readline'
import matter from 'gray-matter'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const question = (prompt) =>
  new Promise((resolve) => rl.question(prompt, resolve))

async function createPrediction() {
  console.log('🔮 Create a new prediction\n')

  const statement = await question('Statement: ')
  const confidence = Number.parseInt(await question('Confidence (0-100): '))
  const deadline = await question('Deadline (YYYY-MM-DD): ')
  const categoriesInput = await question('Categories (comma-separated): ')
  const categories = categoriesInput.split(',').map((c) => c.trim())
  const visibility =
    (await question('Visibility (public/private) [public]: ')) || 'public'

  console.log('\nEvidence and reasoning (press Enter twice to finish):')
  let evidence = ''
  let line = ''
  let emptyLineCount = 0

  while (emptyLineCount < 2) {
    line = await question('')
    if (line === '') {
      emptyLineCount++
    } else {
      emptyLineCount = 0
      evidence += line + '\n'
    }
  }

  const created = new Date().toISOString().split('T')[0]
  const filename =
    statement
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50) + '.md'

  const frontmatter = {
    statement,
    confidence,
    deadline,
    categories,
    visibility,
    created,
  }

  const content = matter.stringify(evidence.trim(), frontmatter)
  const filePath = join(process.cwd(), 'content/predictions', filename)

  await fs.writeFile(filePath, content)
  console.log(`\n✅ Created prediction: ${filePath}`)

  rl.close()
}

createPrediction().catch(console.error)
