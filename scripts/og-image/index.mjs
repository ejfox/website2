#!/usr/bin/env node
/**
 * @file index.mjs
 * @description Generative OG image CLI: renders a post's content in four
 *   house styles, one per variant slot (STYLES below): Dither (floating
 *   cards in pseudo-3D, god rays, 1-bit texture), Academic (academic.css
 *   typographic card), Vulpes (OLED black + pink/teal glyph flow field) and
 *   Broadcast (Archivo Black lower-third). Every style is seeded by slug +
 *   batch and drawn from the post's real content (extract.mjs). No yarn
 *   script; run with node. The Dispatch app drives it too, passing
 *   `--slug <slug>:batchN` to reroll: a reroll re-seeds all four styles and
 *   keeps style i in slot i.
 *   Writes 4 variants + preview.html to data/og-previews/<slug-with-dashes>/
 *   (gitignored); --pick N without --upload writes <slug>-final.png there.
 *   --upload sends the picked variant to Cloudinary as og/<slug> (network,
 *   overwrites; needs env CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY,
 *   CLOUDINARY_API_SECRET). Nothing writes the result into post frontmatter.
 *   One post per run (--slug); there is no batch mode.
 *
 * Usage:
 *   node scripts/og-image/index.mjs --slug 2025/personal-apis              # 4 variants, preview
 *   node scripts/og-image/index.mjs --slug 2025/personal-apis --pick 2     # use variant 2
 *   node scripts/og-image/index.mjs --slug 2025/personal-apis --pick 2 --upload  # upload to Cloudinary
 *   node scripts/og-image/index.mjs --slug 2025/personal-apis --open       # also open preview.html (background)
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { extractContent } from './extract.mjs'
import { STYLES } from './styles.mjs'

const ROOT = path.resolve(import.meta.dirname, '../..')
const OUTPUT_DIR = path.join(ROOT, 'data', 'og-previews')

const args = process.argv.slice(2)
const slugIdx = args.indexOf('--slug')
const SLUG = slugIdx !== -1 ? args[slugIdx + 1] : null
const pickIdx = args.indexOf('--pick')
const PICK = pickIdx !== -1 ? Number.parseInt(args[pickIdx + 1]) : null
const UPLOAD = args.includes('--upload')
// Dispatch reads exactly variant-0..3; one slot per house style.
const VARIANTS = STYLES.length

/**
 * Slugs from Dispatch may carry a `:batchN` suffix used purely to vary
 * the random seed across rerolls. The actual post lives under the bare
 * slug; the suffix only travels into the layout seed.
 */
function splitBatch(rawSlug) {
  const m = rawSlug.match(/^(.+?):batch(\d+)$/)
  if (m) return { slug: m[1], batch: Number.parseInt(m[2], 10) }
  return { slug: rawSlug, batch: 0 }
}

async function generateVariants(rawSlug) {
  const { slug, batch } = splitBatch(rawSlug)
  console.log(
    `\n  Generating OG image for: ${slug}${batch ? ` (batch ${batch})` : ''}`
  )

  // Extract content from the real post — never with the :batchN suffix.
  const content = await extractContent(slug)
  console.log(
    `  Content: "${content.title}" — ${content.outline.length} headings, ${content.blockquotes.length} quotes, ${content.imageUrls.length} images, ${content.tags.length} tags, ${content.blocks.length} blocks`
  )

  // Seed varies per batch so rerolls produce visually different scenes.
  // Slot v always runs style v; only the seed moves between batches.
  const seedBase = batch ? `${slug}:batch${batch}` : slug

  const variants = []
  for (let v = 0; v < VARIANTS; v++) {
    const style = STYLES[v]
    const t0 = performance.now()
    const png = await style.render(content, `${seedBase}:v${v}`)
    variants.push(png)
    const ms = Math.round(performance.now() - t0)
    process.stdout.write(
      `  Variant ${v} (${style.name}): ${(png.length / 1024).toFixed(0)}KB in ${ms}ms\n`
    )
  }

  // Return the canonical slug so callers write to the right output dir.
  return { content, variants, slug }
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
${variants.map((_, i) => `<div class="variant" onclick="navigator.clipboard.writeText('node scripts/og-image/index.mjs --slug ${slug} --pick ${i} --upload')"><img src="variant-${i}.png"><div class="label">v${i} · ${STYLES[i].name}</div></div>`).join('\n')}
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
  if (!SLUG) {
    console.error(
      'Usage: node scripts/og-image/index.mjs --slug 2025/post-name ' +
        '[--pick N [--upload]] [--open]'
    )
    process.exit(1)
  }

  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  if (SLUG) {
    const { variants, slug } = await generateVariants(SLUG)

    if (PICK !== null) {
      // User picked a specific variant
      if (UPLOAD) {
        console.log(`\n  Uploading variant ${PICK} to Cloudinary...`)
        const url = await uploadToCloudinary(slug, variants[PICK])
        console.log(`  Uploaded: ${url}`)
      } else {
        const outPath = path.join(
          OUTPUT_DIR,
          `${slug.replace(/\//g, '-')}-final.png`
        )
        await fs.mkdir(path.dirname(outPath), { recursive: true })
        await fs.writeFile(outPath, variants[PICK])
        console.log(`  Saved: ${outPath}`)
      }
    } else {
      // Show all 4 variants for preview
      const { htmlPath } = await saveVariants(slug, variants)
      console.log(`\n  Preview: ${htmlPath}`)

      // Only with --open, and in the background (-g) so focus stays put.
      if (args.includes('--open')) {
        const { execFile } = await import('node:child_process')
        execFile('open', ['-g', htmlPath])
      }
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
