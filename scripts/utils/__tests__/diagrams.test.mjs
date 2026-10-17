import { describe, it, expect } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import { remarkMermaid } from '../../plugins/remarkMermaid.mjs'

const toHtml = async (md) =>
  String(
    await unified()
      .use(remarkParse)
      .use(remarkMermaid)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeRaw)
      .use(rehypeStringify)
      .process(md)
  )

const fence = (src) => '```mermaid\n' + src + '\n```\n'

describe('remarkMermaid (Pele, build-time SVG)', () => {
  it('renders a flowchart to inline SVG with no client hook left behind', async () => {
    const html = await toHtml(fence('flowchart TD\n  A[Start] --> B[End]'))
    expect(html).toContain('class="diagram"')
    expect(html).toMatch(/<svg[^>]*class="pele pele-flowchart/)
    expect(html).toContain('viewBox')
    expect(html).not.toContain('<pre class="mermaid"')
  })

  it('ships a narrow re-layout for wide diagrams', async () => {
    const wide =
      'flowchart LR\n' +
      '  A[Obsidian vault] --> B[processMarkdown] --> C[(content/processed)] --> D[Nuxt server] --> E([ejfox.com])'
    const html = await toHtml(fence(wide))
    expect(html).toContain('diagram-responsive')
    expect(html.match(/<svg/g)).toHaveLength(2)
  })

  it('gives each diagram on a page unique ids', async () => {
    const src = 'flowchart TD\n  accTitle: Same\n  A --> B'
    const html = await toHtml(fence(src) + '\n' + fence(src))
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])
    expect(ids.length).toBeGreaterThan(0)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('falls back to escaped source on a parse error instead of failing', async () => {
    const html = await toHtml(fence('flowchart TD\n  A[<b>x</b> --> '))
    expect(html).toContain('class="diagram-error"')
    expect(html).not.toContain('<b>x</b>')
  })
})
