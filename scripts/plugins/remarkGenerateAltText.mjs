// Alt text generation using Gemini Vision API
// Generates accessibility descriptions for images automatically
// Caches results in alt-text-cache.json for fast rebuilds

import { visit } from 'unist-util-visit'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import fetch from 'node-fetch'

const CACHE_FILE = path.join(process.cwd(), 'alt-text-cache.json')
const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY
const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent'

let altTextCache = {}

// Load existing cache
async function loadCache() {
  try {
    const data = await fs.readFile(CACHE_FILE, 'utf-8')
    altTextCache = JSON.parse(data)
  } catch {
    altTextCache = {}
  }
}

// Save cache to file
async function saveCache() {
  await fs.writeFile(CACHE_FILE, JSON.stringify(altTextCache, null, 2))
}

// Convert image URL to base64 for Gemini Vision API
async function imageUrlToBase64(url) {
  try {
    // If it's a Cloudinary URL, we can use it directly
    // Otherwise fetch and convert to base64
    if (url.includes('cloudinary.com')) {
      // Use Cloudinary URL directly
      return { url, type: 'cloudinary' }
    }

    const response = await fetch(url, { timeout: 10000 })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const buffer = await response.buffer()
    const base64 = buffer.toString('base64')

    // Detect MIME type from URL or default to jpeg
    let mimeType = 'image/jpeg'
    if (url.includes('.png')) mimeType = 'image/png'
    if (url.includes('.gif')) mimeType = 'image/gif'
    if (url.includes('.webp')) mimeType = 'image/webp'

    return { base64, mimeType, type: 'base64' }
  } catch (error) {
    console.warn(`  ⚠️  Failed to fetch image: ${url}`)
    return null
  }
}

// Call Gemini Vision API to generate alt text
async function generateAltTextWithGemini(imageData) {
  if (!GEMINI_API_KEY) {
    console.warn(
      '  ⚠️  GOOGLE_AI_API_KEY not set - skipping alt text generation'
    )
    return null
  }

  try {
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `You are writing accessibility descriptions for a personal blog focused on design, data visualization, reflections, and technical insights.

Generate a single concise sentence (max 160 characters) for this image that:
- Describes what's actually shown (not generic like "screenshot" or "image")
- Highlights visually interesting or relevant details
- Reads naturally as alt text (no "image of..." prefix)
- Matches a thoughtful, design-aware tone
- Is useful for someone who cannot see the image

Return ONLY the alt text sentence, nothing else.`
            },
            imageData.type === 'cloudinary'
              ? { text: `Image URL: ${imageData.url}` }
              : {
                  inlineData: {
                    mimeType: imageData.mimeType,
                    data: imageData.base64
                  }
                }
          ]
        }
      ]
    }

    const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      timeout: 30000
    })

    if (!response.ok) {
      const error = await response.text()
      console.warn(`  ⚠️  Gemini API error: ${response.status}`)
      return null
    }

    const data = await response.json()
    const altText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

    return altText || null
  } catch (error) {
    console.warn(`  ⚠️  Error generating alt text: ${error.message}`)
    return null
  }
}

// Main remark plugin
export default function remarkGenerateAltText() {
  return async (tree) => {
    // Load cache at start of processing
    await loadCache()

    const imagesToProcess = []

    // First pass: collect all images
    visit(tree, 'image', (node) => {
      if (node.url && !node.alt) {
        imagesToProcess.push(node)
      }
    })

    if (imagesToProcess.length === 0) return

    // Process images
    for (const node of imagesToProcess) {
      const cacheKey = node.url

      // Check if we already have alt text cached
      if (altTextCache[cacheKey]) {
        node.alt = altTextCache[cacheKey]
        continue
      }

      // Generate new alt text
      const imageData = await imageUrlToBase64(node.url)
      if (!imageData) {
        node.alt = 'Image'
        continue
      }

      const altText = await generateAltTextWithGemini(imageData)
      if (altText) {
        node.alt = altText
        altTextCache[cacheKey] = altText
      } else {
        node.alt = 'Image'
      }
    }

    // Save updated cache
    await saveCache()
  }
}

// Export cache stats for reporting
export function getAltTextStats() {
  return {
    cached: Object.keys(altTextCache).length,
    entries: altTextCache
  }
}
