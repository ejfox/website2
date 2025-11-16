#!/usr/bin/env node

import { promises as fs } from 'node:fs'
import { createHash } from 'node:crypto'
import { execSync } from 'node:child_process'
import matter from 'gray-matter'
import path from 'node:path'

const filePath = process.argv[2]

if (!filePath) {
  console.error('Usage: node sign-prediction.mjs <prediction-file.md>')
  process.exit(1)
}

async function signPrediction() {
  try {
    // Read the prediction file
    const content = await fs.readFile(filePath, 'utf-8')
    const { data, content: body } = matter(content)

    // Generate content hash
    const hashContent = [
      data.statement,
      data.confidence,
      data.deadline,
      (data.categories || []).join(','),
      data.created
    ].join('|')

    const hash = createHash('sha256').update(hashContent).digest('hex')
    console.log(`Generated hash: ${hash}`)

    // Get current git commit (if in git repo)
    let gitCommit = null
    try {
      gitCommit = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim()
      console.log(`Git commit: ${gitCommit}`)
    } catch {
      console.log('Not in a git repository or git command failed')
    }

    // Update frontmatter
    data.hash = hash
    if (gitCommit) {
      data.gitCommit = gitCommit
    }
    data.signed = new Date().toISOString()

    // Optional: Sign with PGP (requires gpg installed)
    let pgpSignature = null
    const usePgp = process.argv.includes('--pgp')

    if (usePgp) {
      try {
        const signCommand = `echo "${hashContent}" | gpg --armor --detach-sign`
        pgpSignature = execSync(signCommand, { encoding: 'utf-8' })
        data.pgpSignature = pgpSignature
        console.log('Added PGP signature')
      } catch (e) {
        console.error('PGP signing failed:', e.message)
      }
    }

    // Rebuild the file
    const newContent = matter.stringify(body, data)
    await fs.writeFile(filePath, newContent)

    console.log(`✅ Signed prediction: ${filePath}`)
    console.log(`\nTo verify this prediction later:`)
    console.log(`- SHA-256 hash: ${hash}`)
    if (gitCommit) {
      console.log(`- Git commit: ${gitCommit}`)
    }

    // Create a commitment record
    const commitmentRecord = {
      file: path.basename(filePath),
      hash,
      gitCommit,
      signed: data.signed,
      statement: data.statement.substring(0, 100) + '...'
    }

    // Append to commitment log
    const logPath = path.join(
      process.cwd(),
      'public/data/prediction-commitments.json'
    )
    let commitments = []

    try {
      const existingLog = await fs.readFile(logPath, 'utf-8')
      commitments = JSON.parse(existingLog)
    } catch {
      // File doesn't exist, start with empty array
    }

    commitments.push(commitmentRecord)
    await fs.writeFile(logPath, JSON.stringify(commitments, null, 2))

    console.log(`\n✅ Added to public commitment log`)
  } catch (error) {
    console.error('Error signing prediction:', error)
    process.exit(1)
  }
}

signPrediction()
