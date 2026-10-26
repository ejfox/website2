import { describe, it, expect, beforeAll } from 'vitest'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  BODY_END,
  BODY_START,
  readVueBody,
  statsFromHtml,
  toVueTemplateHtml,
  fromVueTemplateHtml,
} from '../vue-body.mjs'
import { compileTemplate } from '@vue/compiler-sfc'
import { auditInternalLinks, buildValidRoutes } from '../internal-links.mjs'

const page = (body) =>
  `<script setup>\n</script>\n<template>\n<div>\n${BODY_START}\n${body}\n${BODY_END}\n</div>\n</template>\n`

describe('vue-body', () => {
  let root
  let contentDir
  let files

  beforeAll(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'vuebody-'))
    contentDir = path.join(root, 'content', 'blog')
    await fs.mkdir(path.join(contentDir, '2025'), { recursive: true })
    await fs.mkdir(path.join(root, 'pages', 'blog', '2025'), {
      recursive: true,
    })
    await fs.writeFile(
      path.join(contentDir, '2025', 'big.md'),
      '---\ntitle: Big\nbody: vue\n---\n'
    )
    await fs.writeFile(
      path.join(contentDir, '2025', 'real.md'),
      '---\ntitle: Real\n---\nhi\n'
    )
    await fs.writeFile(
      path.join(root, 'pages', 'blog', '2025', 'big.vue'),
      page(
        '<p>See <a href="/blog/2025/real">this</a> and <a href="/blog/2025/gone">that</a>.</p>\n<SignalRange />'
      )
    )
    files = [
      path.join(contentDir, '2025', 'big.md'),
      path.join(contentDir, '2025', 'real.md'),
    ]
    await buildValidRoutes(files, contentDir)
  })

  it('reads only the marked region', () => {
    const body = readVueBody('2025/big', root)
    expect(body.html).toContain('<SignalRange />')
    expect(body.html).not.toContain('script setup')
  })

  it('returns null without a page or markers', () => {
    expect(readVueBody('2025/real', root)).toBeNull()
  })

  it('counts words and builds a TOC from rendered headings', () => {
    const { toc, stats } = statsFromHtml(
      '<h2 id="a">One <em>two</em></h2><p>three four</p><h3 id="b">Five</h3><img src="x">'
    )
    expect(stats.words).toBe(5)
    expect(stats.images).toBe(1)
    expect(toc).toEqual([
      {
        text: 'One two',
        slug: 'a',
        level: 'h2',
        children: [{ text: 'Five', slug: 'b', level: 'h3', children: [] }],
      },
    ])
  })

  it('escapes mustaches so Vue renders them as text', () => {
    expect(toVueTemplateHtml('<code>{{ x }}</code>')).toBe(
      '<code>&#123;&#123; x &#125;&#125;</code>'
    )
  })

  it('binds srcset so Nuxt does not turn Cloudinary commas into imports', () => {
    const src =
      '<img srcset="https://res.cloudinary.com/ejf/image/upload/c_scale,f_auto,w_640/x.png 640w, https://res.cloudinary.com/ejf/image/upload/c_scale,f_auto,w_960/x.png 960w">'
    const vue = toVueTemplateHtml(src)
    // Same options Nuxt uses: includeAbsolute turns static srcset into imports
    const { code } = compileTemplate({
      source: vue,
      filename: 'p.vue',
      id: 'p',
      transformAssetUrls: { includeAbsolute: true },
    })
    expect(code).not.toMatch(/import .* from '(?!vue)/)
    expect(fromVueTemplateHtml(vue)).toBe(src)
  })

  it('entity-encodes non-breaking spaces', () => {
    expect(toVueTemplateHtml('a\u00a0b')).toBe('a&#160;b')
  })

  it('audits links in the Vue page and points at the .vue file', async () => {
    const report = await auditInternalLinks(files, contentDir)
    expect(report.dead).toHaveLength(1)
    expect(report.dead[0].href).toBe('/blog/2025/gone')
    expect(report.dead[0].source).toMatch(/pages\/blog\/2025\/big\.vue$/)
    expect(report.dead[0].line).toBe(6)
  })
})
