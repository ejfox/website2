import { describe, it, expect, beforeAll } from 'vitest'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  buildInternalHref,
  fileToRoute,
  classifyInternalHref,
  buildValidRoutes,
  auditInternalLinks,
  suggestRoute,
} from '../internal-links.mjs'

describe('buildInternalHref (wikilink → route)', () => {
  it('routes blog/ prefixed targets', () => {
    expect(buildInternalHref('blog/2022/the-studio')).toBe(
      '/blog/2022/the-studio'
    )
  })
  it('routes reading/ and projects/ to their own namespaces', () => {
    expect(buildInternalHref('reading/dune')).toBe('/reading/dune')
    expect(buildInternalHref('projects/electology')).toBe(
      '/projects/electology'
    )
  })
  it('routes robots/ and week-notes/ under /blog', () => {
    expect(buildInternalHref('robots/morning-radio')).toBe(
      '/blog/robots/morning-radio'
    )
    expect(buildInternalHref('week-notes/2024-02')).toBe(
      '/blog/week-notes/2024-02'
    )
  })
  it('routes bare topic wikilinks to tag pages, not /blog', () => {
    expect(buildInternalHref('woodworking-setup')).toBe(
      '/tag/woodworking-setup'
    )
  })
  it('normalizes ../ and .md', () => {
    expect(buildInternalHref('../robots/quantified-self.md')).toBe(
      '/blog/robots/quantified-self'
    )
  })
})

describe('fileToRoute mirrors buildInternalHref for real files', () => {
  it('maps each namespace the same way a wikilink resolves', () => {
    expect(fileToRoute('2022/art-setup')).toBe('/blog/2022/art-setup')
    expect(fileToRoute('reading/dune')).toBe('/reading/dune')
    expect(fileToRoute('projects/electology')).toBe('/projects/electology')
    expect(fileToRoute('robots/someday/morning-radio')).toBe(
      '/blog/robots/someday/morning-radio'
    )
  })
})

describe('validity + audit over a temp content tree', () => {
  let dir
  beforeAll(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ilinks-'))
    const write = async (rel, frontmatter, body = '') => {
      const full = path.join(dir, rel)
      await fs.mkdir(path.dirname(full), { recursive: true })
      const fm = Object.entries(frontmatter)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n')
      await fs.writeFile(full, `---\n${fm}\n---\n\n${body}`)
    }

    // Published targets.
    await write('2022/the-studio.md', { title: 'Studio', hidden: true }) // 404s in prod
    await write(
      '2022/art-setup.md',
      { title: 'Art' },
      [
        'See [[blog/2022/the-studio]] and [[blog/2022/ghost-post]].',
        'A real one: [[blog/2022/art-setup]].',
        'A bare topic: [[woodworking]].',
        'Wrong folder: [[projects/connectology]].',
      ].join('\n\n')
    )
    await write('projects/connectology.md', { title: 'Connectology' })

    const files = await collect(dir)
    await buildValidRoutes(files, dir)
  })

  it('counts hidden targets as invalid (matches server 404 behavior)', () => {
    expect(classifyInternalHref('/blog/2022/the-studio')).toEqual({
      internal: true,
      valid: false,
    })
  })
  it('counts a real published post as valid', () => {
    expect(classifyInternalHref('/blog/2022/art-setup')).toEqual({
      internal: true,
      valid: true,
    })
  })
  it('treats tag + external links as not-flagged', () => {
    expect(classifyInternalHref('/tag/woodworking')).toEqual({
      internal: true,
      valid: true,
    })
    expect(classifyInternalHref('https://example.com')).toEqual({
      internal: false,
    })
  })
  it('suggests the wrong-folder slug, never the source itself', () => {
    // connectology lives at /projects, link said /blog/...; suggest the real one.
    expect(suggestRoute('/blog/projects/connectology')).toBe(
      '/projects/connectology'
    )
    // the-studio is hidden + not a typo → no misleading guess.
    expect(
      suggestRoute('/blog/2022/the-studio', '/blog/2022/art-setup')
    ).toBeNull()
  })

  it('audits dead links with line numbers, skipping valid/bare/self', async () => {
    const files = await collect(dir)
    const report = await auditInternalLinks(files, dir)
    const fromArt = report.dead.filter((d) => d.source === '2022/art-setup.md')
    const hrefs = fromArt.map((d) => d.href)

    expect(hrefs).toContain('/blog/2022/the-studio') // hidden
    expect(hrefs).toContain('/blog/2022/ghost-post') // missing
    expect(hrefs).not.toContain('/blog/2022/art-setup') // valid self-link
    expect(hrefs).not.toContain('/tag/woodworking') // bare topic
    for (const d of fromArt) expect(d.line).toBeGreaterThan(0)
  })
})

async function collect(dir) {
  const out = []
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...(await collect(full)))
    else if (e.name.endsWith('.md')) out.push(full)
  }
  return out
}
