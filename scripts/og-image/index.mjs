#!/usr/bin/env node
/**
 * Generative OG image generator.
 *
 * Renders floating content cards in pseudo-3D space for each blog post.
 * Monochrome with dithering, god rays, and depth of field.
 *
 * Usage:
 *   node scripts/og-image/index.mjs --slug 2025/personal-apis              # 4 variants, preview
 *   node scripts/og-image/index.mjs --slug 2025/personal-apis --pick 2     # use variant 2
 *   node scripts/og-image/index.mjs --slug 2025/personal-apis --pick 2 --upload  # upload to Cloudinary
 *   node scripts/og-image/index.mjs --all                                  # generate for all posts
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { extractContent } from './extract.mjs'
import { layoutCards } from './layout.mjs'
import { renderScene } from './render.mjs'

const ROOT = path.resolve(import.meta.dirname, '../..')
const OUTPUT_DIR = path.join(ROOT, 'data', 'og-previews')

const args = process.argv.slice(2)
const slugIdx = args.indexOf('--slug')
const SLUG = slugIdx !== -1 ? args[slugIdx + 1] : null
const pickIdx = args.indexOf('--pick')
const PICK = pickIdx !== -1 ? parseInt(args[pickIdx + 1]) : null
const UPLOAD = args.includes('--upload')
const ALL = args.includes('--all')
const VARIANTS = 4

async function generateVariants(slug) {
  console.log(`\n  Generating OG image for: ${slug}`)

  // Extract content
  const content = await extractContent(slug)
  console.log(`  Content: "${content.title}" — ${content.headings.length} headings, ${content.blockquotes.length} quotes, ${content.imageUrls.length} images, ${content.tags.length} tags`)

  // Generate 4 variants with different seeds
  const variants = []
  for (let v = 0; v < VARIANTS; v++) {
    const scene = layoutCards(`${slug}:v${v}`, content)
    const png = await renderScene(content, scene, slug, v)
    variants.push(png)
    process.stdout.write(`  Variant ${v}: ${(png.length / 1024).toFixed(0)}KB `)
    process.stdout.write('done\n')
  }

  return { content, variants }
}

async function saveVariants(slug, variants) {
  const slugDir = path.join(OUTPUT_DIR, slug.replace(/\//g, '-'))
  await fs.mkdir(slugDir, { recursive: true })

  const paths = []
  for (let i = 0; i < variants.length; i++) {
    const outPath = path.join(slugDir, `variant-${i}.png`)
    await fs.writeFile(outPath, variants[i])
    paths.push(outPath)
  }

  // Also write an HTML preview page to browse all 4
  const html = `<!doctype html>
<html><head><title>OG Preview: ${slug}</title>
<style>
  body { background: #0a0a0b; color: #e4e4e7; font-family: monospace; padding: 2rem; }
  h1 { font-size: 14px; color: #52525b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1rem; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; max-width: 1200px; }
  .variant { position: relative; cursor: pointer; border: 2px solid transparent; border-radius: 4px; overflow: hidden; transition: border-color 0.15s; }
  .variant:hover { border-color: #ef4444; }
  .variant img { width: 100%; display: block; }
  .variant .label { position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,0.7); padding: 2px 8px; font-size: 11px; border-radius: 3px; }
  .hint { font-size: 11px; color: #52525b; margin-top: 1rem; }
</style></head><body>
<h1>OG Variants: ${slug}</h1>
<div class="grid">
${variants.map((_, i) => `<div class="variant" onclick="navigator.clipboard.writeText('node scripts/og-image/index.mjs --slug ${slug} --pick ${i} --upload')"><img src="variant-${i}.png"><div class="label">v${i}</div></div>`).join('\n')}
</div>
<p class="hint">Click a variant to copy the upload command. Or: node scripts/og-image/index.mjs --slug ${slug} --pick N --upload</p>
</body></html>`

  const htmlPath = path.join(slugDir, 'preview.html')
  await fs.writeFile(htmlPath, html)

  return { paths, htmlPath }
}

async function uploadToCloudinary(slug, pngBuffer) {
  const { default: cloudinary } = await import('cloudinary')
  cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })

  const publicId = `og/${slug.replace(/\//g, '-')}`
  return new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      { public_id: publicId, overwrite: true, resource_type: 'image' },
      (err, result) => {
        if (err) reject(err)
        else resolve(result.secure_url)
      }
    )
    stream.end(pngBuffer)
  })
}

async function main() {
  if (!SLUG && !ALL) {
    console.error('Usage: node scripts/og-image/index.mjs --slug 2025/post-name')
    console.error('       node scripts/og-image/index.mjs --all')
    process.exit(1)
  }

  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  if (SLUG) {
    const { content, variants } = await generateVariants(SLUG)

    if (PICK !== null) {
      // User picked a specific variant
      if (UPLOAD) {
        console.log(`\n  Uploading variant ${PICK} to Cloudinary...`)
        const url = await uploadToCloudinary(SLUG, variants[PICK])
        console.log(`  Uploaded: ${url}`)
      } else {
        const outPath = path.join(OUTPUT_DIR, `${SLUG.replace(/\//g, '-')}-final.png`)
        await fs.mkdir(path.dirname(outPath), { recursive: true })
        await fs.writeFile(outPath, variants[PICK])
        console.log(`  Saved: ${outPath}`)
      }
    } else {
      // Show all 4 variants for preview
      const { htmlPath } = await saveVariants(SLUG, variants)
      console.log(`\n  Preview: ${htmlPath}`)

      // Auto-open
      const { exec } = await import('node:child_process')
      exec(`open "${htmlPath}"`)
    }
  }
}

main().catch(err => { console.error(err); process.exit(1) })
