#!/usr/bin/env node
/* eslint-disable no-console */

import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import matter from 'gray-matter'

function generateHash(content) {
  return createHash('sha256').update(content).digest('hex')
}

function getGitInfo() {
  try {
    const gitCommit = execSync('git rev-parse HEAD', {
      encoding: 'utf-8',
    }).trim()
    const gitDate = execSync('git log -1 --format=%aI', {
      encoding: 'utf-8',
    }).trim()

    return {
      commit: gitCommit,
      date: gitDate,
    }
  } catch (error) {
    console.warn('Could not get git info:', error.message)
    return null
  }
}

function signWithPGP(content) {
  try {
    // Check if GPG is available
    execSync('which gpg', { encoding: 'utf-8' })

    // Sign the content
    const signature = execSync('gpg --armor --detach-sign', {
      input: content,
      encoding: 'utf-8',
    })

    return signature
  } catch (error) {
    console.warn('Could not sign with PGP:', error.message)
    return null
  }
}

async function signPrediction(filePath) {
  try {
    // Read the file
    const fileContent = readFileSync(filePath, 'utf-8')
    const { data, content } = matter(fileContent)

    // Generate content hash
    const contentHash = generateHash(content)

    // Get git info
    const gitInfo = getGitInfo(filePath)

    // Create verification object
    const verification = {
      hash: contentHash,
      timestamp: new Date().toISOString(),
    }

    if (gitInfo) {
      verification.gitCommit = gitInfo.commit
      verification.gitDate = gitInfo.date
    }

    // Optionally sign with PGP
    if (process.argv.includes('--sign')) {
      const signature = signWithPGP(content)
      if (signature) {
        verification.signature = signature
      }
    }

    // Update frontmatter
    data.verification = verification

    // Write back to file
    const newContent = matter.stringify(content, data)
    writeFileSync(filePath, newContent)

    console.log(`✓ Signed prediction: ${filePath}`)
    console.log(`  Hash: ${contentHash.slice(0, 16)}...`)
    if (gitInfo) {
      console.log(`  Commit: ${gitInfo.commit.slice(0, 8)}`)
    }
    if (verification.signature) {
      console.log('  PGP signature: Added')
    }
  } catch (error) {
    console.error(`Error signing prediction ${filePath}:`, error)
    process.exit(1)
  }
}

// Main execution
const filePath = process.argv[2]

if (!filePath) {
  console.error('Usage: sign-prediction.mjs <prediction-file> [--sign]')
  process.exit(1)
}

signPrediction(filePath)
