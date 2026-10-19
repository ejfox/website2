#!/usr/bin/env node
/**
 * Fail on component tags that resolve to nothing.
 *
 * Nuxt auto-imports components by folder + filename
 * (components/gear/Gear3DGallery.client.vue → <GearGear3DGallery>). A tag
 * that names an unregistered component compiles, renders as an empty
 * unknown element, and logs nothing in production — `yarn build` passes.
 * Four of these shipped unnoticed (2026-10-19), so this checks every
 * template tag against `.nuxt/components.d.ts` (written by `nuxt prepare`,
 * which postinstall runs) plus whatever each SFC imports locally.
 *
 * Usage: node scripts/meta/check-component-tags.mjs
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const DTS = join(ROOT, '.nuxt/components.d.ts')
const DIRS = ['components', 'pages', 'layouts', 'app.vue', 'error.vue']

// Vue/Nuxt built-ins that don't appear as auto-imported components.
const BUILTINS = new Set([
  'Component',
  'KeepAlive',
  'Suspense',
  'Teleport',
  'Transition',
  'TransitionGroup',
  'RouterLink',
  'RouterView',
  'Slot',
])

if (!existsSync(DTS)) {
  console.error('✗ .nuxt/components.d.ts missing — run `nuxt prepare` first')
  process.exit(2)
}

const registered = new Set(
  [...readFileSync(DTS, 'utf8').matchAll(/export const (\w+):/g)].map(
    (m) => m[1]
  )
)

const pascal = (tag) =>
  tag.includes('-')
    ? tag
        .split('-')
        .map((s) => s[0].toUpperCase() + s.slice(1))
        .join('')
    : tag

function vueFiles(p) {
  const abs = join(ROOT, p)
  if (!existsSync(abs)) return []
  if (statSync(abs).isFile()) return p.endsWith('.vue') ? [abs] : []
  return readdirSync(abs, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory()
      ? vueFiles(join(p, d.name))
      : d.name.endsWith('.vue')
        ? [join(abs, d.name)]
        : []
  )
}

const problems = []
for (const file of DIRS.flatMap(vueFiles)) {
  const src = readFileSync(file, 'utf8')
  const template = src.match(/<template[\s\S]*<\/template>/)?.[0] ?? ''
  const scripts = [...src.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)]
    .map((m) => m[1])
    .join('\n')
  // Anything bound in <script> (imports, defineAsyncComponent consts) is local.
  const local = new Set(
    [...scripts.matchAll(/\b(?:import\s+|const\s+|let\s+)(\w+)/g)].map(
      (m) => m[1]
    )
  )
  for (const imp of scripts.matchAll(/import\s*\{([^}]+)\}/g)) {
    for (const name of imp[1].split(','))
      local.add(
        name
          .trim()
          .split(/\s+as\s+/)
          .pop()
      )
  }

  const lines = template.split('\n')
  const offset = src.slice(0, src.indexOf(template)).split('\n').length - 1
  lines.forEach((line, i) => {
    // PascalCase tags, plus kebab tags that map onto a registered component.
    for (const [, tag] of line.matchAll(
      /<([A-Z]\w*|[a-z]+(?:-[a-z0-9]+)+)(?=[\s>/]|$)/g
    )) {
      const name = pascal(tag)
      const isPascalTag = /^[A-Z]/.test(tag)
      const known =
        registered.has(name) ||
        BUILTINS.has(name) ||
        local.has(name) ||
        local.has(tag)
      // Only PascalCase is unambiguous; kebab tags may be SVG/custom elements.
      if (!known && isPascalTag) {
        problems.push(`${relative(ROOT, file)}:${offset + i + 1}  <${tag}>`)
      }
    }
  })
}

if (problems.length) {
  console.error(
    `✗ ${problems.length} component tag(s) resolve to no registered component:\n`
  )
  for (const p of problems) console.error('  ' + p)
  console.error(
    '\nNuxt names components folder+filename: components/gear/Foo.vue → <GearFoo>.' +
      '\nCheck .nuxt/components.d.ts for the real name.'
  )
  process.exit(1)
}
console.log(`✓ component tags: all resolve (${registered.size} registered)`)
