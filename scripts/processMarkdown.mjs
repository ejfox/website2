import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { visit } from 'unist-util-visit'
import matter from 'gray-matter'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const contentDir = path.join(__dirname, '..', 'content', 'blog')
const outputDir = path.join(__dirname, '..', 'dist', 'processed')

const CLOUDINARY_BASE_URL =
  'https://res.cloudinary.com/ejf/image/upload/w_900/dpr_auto/'

function remarkCustomElements() {
  return (tree) => {
    visit(tree, 'image', (node) => {
      if (!node.url.startsWith('http')) {
        const imageId = path.basename(node.url)
        node.url = `${CLOUDINARY_BASE_URL}${imageId}`
      }
    })

    visit(tree, 'code', (node) => {
      if (node.lang === 'mermaid') {
        node.type = 'html'
        node.value = `<div class="mermaid-diagram" data-mermaid-source="${encodeURIComponent(
          node.value
        )}">
          <pre>${node.value}</pre>
        </div>`
      } else if (node.meta === 'runnable') {
        node.type = 'html'
        node.value = `<div class="runnable-code" data-language="${
          node.lang
        }" data-source="${encodeURIComponent(node.value)}">
          <pre><code class="language-${node.lang}">${node.value}</code></pre>
        </div>`
      }
    })
  }
}

function extractHeadersAndToc(tree) {
  let firstH1 = null
  const toc = []
  let currentH2 = null

  visit(tree, 'heading', (node) => {
    if (node.children && node.children[0] && node.children[0].value) {
      const headingText = node.children[0].value
      const headingSlug = generateSlug(headingText)

      if (node.depth === 1 && !firstH1) {
        firstH1 = headingText
      } else if (node.depth === 2) {
        currentH2 = {
          text: headingText,
          slug: headingSlug,
          level: 'h2',
          children: []
        }
        toc.push(currentH2)
      } else if (node.depth === 3 && currentH2) {
        currentH2.children.push({
          text: headingText,
          slug: headingSlug,
          level: 'h3'
        })
      }
    }
  })

  return { firstH1, toc }
}

function generateSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

async function processMarkdown(filePath) {
  const fileContent = await fs.readFile(filePath, 'utf8')
  const { data: frontmatter, content } = matter(fileContent)

  const processor = unified()
    .use(remarkParse)
    .use(remarkCustomElements)
    .use(remarkRehype)
    .use(rehypeStringify)

  const ast = processor.parse(content)
  const { firstH1, toc } = extractHeadersAndToc(ast)
  const result = await processor.run(ast)

  const html = processor.stringify(result)

  const wordCount = content.split(/\s+/).length
  const readingTime = Math.ceil(wordCount / 200)
  const imageCount = (content.match(/!\[.*?\]\(.*?\)/g) || []).length
  const linkCount = (content.match(/\[.*?\]\(.*?\)/g) || []).length

  return {
    html,
    metadata: {
      ...frontmatter,
      title: frontmatter.title || firstH1 || path.basename(filePath, '.md'),
      toc,
      wordCount,
      readingTime,
      imageCount,
      linkCount
    }
  }
}

async function processAllFiles() {
  const manifestLite = []
  const files = await fs.readdir(contentDir)

  for (const file of files) {
    if (path.extname(file) === '.md') {
      const filePath = path.join(contentDir, file)
      const { html, metadata } = await processMarkdown(filePath)

      const slug = generateSlug(path.basename(file, '.md'))
      const outputPath = path.join(outputDir, `${slug}.json`)

      await fs.mkdir(outputDir, { recursive: true })

      await fs.writeFile(
        outputPath,
        JSON.stringify({ slug, ...metadata, content: html }, null, 2)
      )

      manifestLite.push({ slug, ...metadata })
    }
  }

  await fs.writeFile(
    path.join(outputDir, 'manifest-lite.json'),
    JSON.stringify(manifestLite, null, 2)
  )
}

processAllFiles().catch(console.error)
