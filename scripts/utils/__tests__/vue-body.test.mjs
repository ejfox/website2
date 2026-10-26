import { describe, it, expect, beforeAll } from 'vitest'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { compileTemplate } from '@vue/compiler-sfc'
import {
  assertVueBodiesArePublic,
  fromVueTemplateHtml,
  readVueBody,
  statsFromHtml,
  toVueTemplateHtml,
  vueBodyProblem,
} from '../vue-body.mjs'
import { auditInternalLinks, buildValidRoutes } from '../internal-links.mjs'

describe('vue-body', () => {
  let root
  let contentDir
  let files

  beforeAll(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'vuebody-'))
    contentDir = path.join(root, 'content', 'blog')
    await fs.mkdir(path.join(contentDir, '2025'), { recursive: true })
    const write = (f, s) => fs.writeFile(path.join(contentDir, f), s)
    await write('2025/big.md', '---\ntitle: Big\n---\n')
    await write(
      '2025/big.vue',
      '<script setup>\n</script>\n\n<template>\n  <p>See <a href="/blog/2025/real">this</a>\n  and <a href="/blog/2025/gone">that</a>.</p>\n  <SignalRange />\n</template>\n'
    )
    await write('2025/real.md', '---\ntitle: Real\n---\nhi\n')
    files = ['2025/big.md', '2025/real.md'].map((f) => path.join(contentDir, f))
    await buildValidRoutes(files, contentDir)
  })

  it('reads the .vue <template> next to a post', () => {
    const body = readVueBody('2025/big', root)
    expect(body.html).toContain('<SignalRange />')
    expect(body.html).not.toContain('script setup')
    expect(readVueBody('2025/real', root)).toBeNull()
  })

  it('only allows .vue bodies on public posts', () => {
    expect(vueBodyProblem('2025/x', {})).toBeNull()
    expect(vueBodyProblem('2025/x', { draft: true })).toMatch(/draft/)
    expect(vueBodyProblem('private/x', {})).toMatch(/sealed/)
    expect(vueBodyProblem('2025/x', { date: '2999-01-01' })).toMatch(
      /scheduled/
    )
    expect(() =>
      assertVueBodiesArePublic(
        [path.join(contentDir, '2025/nope.vue')],
        contentDir
      )
    ).toThrow(/no 2025\/nope\.md/)
  })

  it('counts words and builds a TOC from rendered headings', () => {
    const { toc, words, images } = statsFromHtml(
      '<h2 id="a">One <em>two</em></h2><p>three four</p><h3 id="b">Five</h3><img src="x">'
    )
    expect(words).toBe(5)
    expect(images).toBe(1)
    expect(toc).toEqual([
      {
        text: 'One two',
        slug: 'a',
        level: 'h2',
        children: [{ text: 'Five', slug: 'b', level: 'h3', children: [] }],
      },
    ])
  })

  it('makes HTML safe for a Vue template, and back for feeds', () => {
    const img =
      '<img srcset="https://res.cloudinary.com/ejf/image/upload/c_scale,f_auto,w_640/x.png 640w, https://res.cloudinary.com/ejf/image/upload/c_scale,f_auto,w_960/x.png 960w">'
    const vue = toVueTemplateHtml(
      `<p>{{ x }}\u00A0</p>${img}<style>.x{}</style>`
    )
    // Nuxt's options: includeAbsolute would turn a static srcset into imports
    const { code, errors } = compileTemplate({
      source: vue,
      filename: 'p.vue',
      id: 'p',
      transformAssetUrls: { includeAbsolute: true },
    })
    expect(errors).toEqual([])
    expect(code).not.toMatch(/import .* from '(?!vue)/)
    expect(fromVueTemplateHtml(vue)).toBe(
      `<p>&#123;&#123; x &#125;&#125;&#160;</p>${img}<style>.x{}</style>`
    )
    expect(
      fromVueTemplateHtml(
        '<p>a</p><Chart :x="1" /><component\n  is="style"\n>.y{}</component\n>'
      )
    ).toBe('<p>a</p><style\n>.y{}</style>')
  })

  it('audits links in the .vue and points at the .vue file', async () => {
    const report = await auditInternalLinks(files, contentDir)
    expect(report.dead).toHaveLength(1)
    expect(report.dead[0].href).toBe('/blog/2025/gone')
    expect(report.dead[0].source).toMatch(/content\/blog\/2025\/big\.vue$/)
    expect(report.dead[0].line).toBe(6)
  })
})
