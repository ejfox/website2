#!/usr/bin/env node
/**
 * Crown a post: its body becomes a Vue file you write in directly.
 *
 *   yarn crown 2025/hidden-networks-of-warmth
 *
 * Writes content/blog/<slug>.vue (the post's rendered HTML as a <template>)
 * and trims <slug>.md to its frontmatter. The post page renders the .vue in
 * place of the markdown, so add components, a <script setup> or a <style>
 * right next to the prose. See scripts/utils/vue-body.mjs.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import * as prettier from 'prettier'
import matter from 'gray-matter'
import {
  toVueTemplateHtml,
  vueBodyPath,
  vueBodyProblem,
} from '../utils/vue-body.mjs'

const fail = (msg) => {
  console.error(msg)
  process.exit(1)
}

const slug = process.argv[2] // extra args (Dispatch's old --hue) are ignored
if (!slug) fail('Usage: yarn crown <YYYY/slug>')

const mdPath = `content/blog/${slug}.md`
const vuePath = vueBodyPath(slug)
const jsonPath = `content/processed/${slug}.json`
if (!existsSync(mdPath)) fail(`No such post: ${mdPath}`)
if (existsSync(vuePath)) fail(`Already crowned: ${vuePath}`)

const source = readFileSync(mdPath, 'utf8')
const fm = matter(source).data
const problem = vueBodyProblem(slug, fm)
if (problem) fail(`Not crowning ${slug}: ${problem}.`)

if (!existsSync(jsonPath)) fail(`No ${jsonPath} yet; run yarn blog:process.`)
const processed = JSON.parse(readFileSync(jsonPath, 'utf8'))
if (!processed.html?.trim()) fail(`${jsonPath} has no HTML.`)
if (/<script\b/i.test(processed.html)) {
  fail('The post has a <script> tag; move it into the .vue by hand.')
}

const html = toVueTemplateHtml(processed.html.replace(/ class=""/g, ''))
let vue = `<template>\n${html}\n</template>\n`
try {
  // Prettier as a library, not npx: Dispatch runs this with a bare PATH.
  const options = (await prettier.resolveConfig(vuePath)) || {}
  vue = await prettier.format(vue, { ...options, filepath: vuePath })
} catch (error) {
  console.warn(`(prettier failed, left unformatted: ${error.message})`)
}
writeFileSync(vuePath, vue)

// Frontmatter kept verbatim (no re-serialization drift). A title that came
// from the body's first heading would vanish with the body, so pin it.
const fmEnd = source.indexOf('\n---', 3)
const title = fm.title ? '' : `\ntitle: ${JSON.stringify(processed.title)}`
writeFileSync(mdPath, `${source.slice(0, fmEnd)}${title}\n---\n`)

console.log(`Crowned: write in ${vuePath} (${mdPath} keeps the frontmatter)`)
