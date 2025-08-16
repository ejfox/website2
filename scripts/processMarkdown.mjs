// Markdown → HTML Processing Pipeline
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
// import rehypeMermaid from 'rehype-mermaid' // DELETED - 64MB bloat
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeRaw from 'rehype-raw'
import matter from 'gray-matter'
import { visit } from 'unist-util-visit'
import { transformerCopyButton } from '@rehype-pretty/transformers'
import dotenv from 'dotenv'
import * as shiki from 'shiki'
import chalk from 'chalk'
import ora from 'ora'
import { config } from './config.mjs'

import {
  remarkAi2htmlEmbed,
  remarkObsidianSupport,
  rehypeAddClassToParagraphs,
  remarkEnhanceLinks,
  remarkExtractToc
} from './plugins/index.mjs'

import { getPostType } from './utils/helpers.mjs'
import { processStats } from './utils/stats.mjs'
import { backupProcessedContent } from './utils/backup.mjs'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SOURCE_DIR = process.env.OBSIDIAN_VAULT_PATH || '/Users/ejfox/Library/Mobile Documents/iCloud~md~obsidian/Documents/ejfox/'

const paths = {
  contentDir: config.dirs.content,
  draftsDir: path.join(config.dirs.content, '../drafts'),
  outputDir: config.dirs.output,
  backupDir: config.dirs.backup
}

const highlighter = await shiki.createHighlighter({
  themes: ['github-dark'],
  langs: ['javascript', 'typescript', 'json', 'html', 'css', 'markdown']
})

const generateSlug = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const extractHeadersAndToc = (tree, maxDepth = 3) => {
  let firstHeading = null
  let firstHeadingNode = null
  const toc = []
  const headingStack = []

  visit(tree, 'heading', (node) => {
    if (node.depth > maxDepth) return

    const headingText = node.children
      .map((child) => child.type === 'text' ? child.value : 
                    child.type === 'image' ? child.alt || '' :
                    child.type === 'link' ? child.children.map(c => c.value || '').join('') : '')
      .join('')
      .trim()

    if (!headingText) return

    const headingItem = {
      text: headingText,
      slug: generateSlug(headingText),
      level: `h${node.depth}`,
      children: []
    }

    if (!firstHeading && (node.depth === 1 || node.depth === 2)) {
      firstHeading = headingText
      firstHeadingNode = node
    }

    while (headingStack.length > 0 && headingStack[headingStack.length - 1].level >= headingItem.level) {
      headingStack.pop()
    }

    if (headingStack.length === 0) {
      toc.push(headingItem)
    } else {
      headingStack[headingStack.length - 1].children.push(headingItem)
    }

    headingStack.push(headingItem)
  })

  return { firstHeading, toc, firstHeadingNode }
}

const removeFirstHeading = (tree, firstHeadingNode) => {
  if (firstHeadingNode) {
    const index = tree.children.indexOf(firstHeadingNode)
    if (index !== -1) tree.children.splice(index, 1)
  }
  return tree
}

const formatTitle = (filename) => {
  const baseName = filename.split('/').pop()
  return baseName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

const processor = unified()
  .use(remarkParse)
  .use(remarkExtractToc)
  .use(remarkObsidianSupport)
  .use(remarkGfm)
  .use(remarkEnhanceImages)
  .use(remarkEnhanceLinks)
  .use(remarkAi2htmlEmbed)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeAddClassToParagraphs)
  .use(rehypePrettyCode, {
    theme: JSON.parse(await fs.readFile('./themes/ayu-mirage.json', 'utf-8')),
    onVisitLine(node) {
      if (node.children.length === 0) node.children = [{ type: 'text', value: ' ' }]
    },
    onVisitHighlightedLine(node) {
      node.properties.className.push('highlighted')
    },
    onVisitHighlightedWord(node) {
      node.properties.className = ['word']
    },
    highlighter,
    transformers: [transformerCopyButton({ visibility: 'always', feedbackDuration: 3000 })]
  })
  // .use(rehypeMermaid, { strategy: 'inline-svg' }) // DELETED - 64MB bloat
  .use(rehypeSlug)
  .use(rehypeStringify, { allowDangerousHtml: true })

async function processMarkdown(content, filePath) {
  const filename = path.basename(filePath)
  try {
    const { data: frontmatter, content: markdownContent } = matter(content)
    let ast = processor.parse(markdownContent)

    const { firstHeading, toc, firstHeadingNode } = extractHeadersAndToc(ast)
    ast = removeFirstHeading(ast, firstHeadingNode)

    let result = await processor.run(ast)
    let html = processor.stringify(result)

    const extractedTitle = frontmatter.title || firstHeading || formatTitle(path.basename(filePath, '.md'))

    const stats = {
      words: markdownContent.split(/\s+/).length,
      images: (markdownContent.match(/!\[.*?\]\(.*?\)/g) || []).length,
      links: (markdownContent.match(/\[.*?\]\(.*?\)/g) || []).length,
      codeBlocks: (markdownContent.match(/```[\s\S]*?```/g) || []).length,
      headers: toc.reduce((acc, h) => {
        acc[h.level] = (acc[h.level] || 0) + 1
        return acc
      }, {})
    }

    process.stdout.write(`\r${chalk.gray(`Processing: ${filename.padEnd(50)}`)}${Math.round((processStats.filesProcessed / processStats.totalFiles) * 100)}%`)

    const sourcePath = SOURCE_DIR ? path.relative(SOURCE_DIR, filePath) : null
    const sourceInfo = SOURCE_DIR ? { sourcePath, sourceDir: SOURCE_DIR } : {}

    return {
      content: html,
      html,
      title: extractedTitle,
      metadata: {
        ...frontmatter,
        ...stats,
        toc: toc,
        type: frontmatter.type || getPostType(filePath),
        ...sourceInfo
      }
    }
  } catch (error) {
    console.error(chalk.red(`\n[ERROR] Failed processing ${filename}:`))
    console.error(chalk.red(error.message))
    throw error
  }
}

async function getFilesRecursively(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name.startsWith('.')) return null
        return getFilesRecursively(fullPath)
      } else if (entry.isFile() && path.extname(entry.name) === '.md') {
        return fullPath
      }
      return null
    })
  )
  return files.flat().filter(Boolean)
}

const extractExternalLinks = (content) => {
  const urlRegex = /https?:\/\/[^\s)\]"<>`]+/g
  const urls = content.match(urlRegex) || []
  const cleanedUrls = urls.map(url => url.replace(/[.,:;!?`>]+$/, ''))
  const externalUrls = cleanedUrls.filter(url => !url.includes('res.cloudinary.com') && !url.includes('ejfox.com'))
  return [...new Set(externalUrls)]
}

async function generateExternalLinksCSV(allFiles) {
  const spinner = ora('Extracting external links...').start()

  try {
    const linkToSources = new Map()

    for (const filePath of allFiles) {
      if (filePath.includes('content/blog/reading/')) continue
      const content = await fs.readFile(filePath, 'utf8')
      const links = extractExternalLinks(content)
      const slug = path.relative(paths.contentDir, filePath).replace(/\.md$/, '')

      links.forEach((link) => {
        if (!link.includes('amazon.com') && !link.includes('m.media-amazon.com')) {
          if (!linkToSources.has(link)) linkToSources.set(link, new Set())
          linkToSources.get(link).add(slug)
        }
      })
    }

    const csvRows = ['url,sources']
    Array.from(linkToSources.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([url, sources]) => {
        const sourcesString = Array.from(sources).join(';')
        const escapedUrl = url.includes(',') ? `"${url}"` : url
        csvRows.push(`${escapedUrl},"${sourcesString}"`)
      })

    const csvPath = path.join(process.cwd(), 'external_links_final.csv')
    await fs.writeFile(csvPath, csvRows.join('\n'))

    spinner.succeed(`Extracted ${linkToSources.size} external links to external_links_final.csv`)
    return Array.from(linkToSources.keys())
  } catch (error) {
    spinner.fail('Failed to extract external links')
    console.error(error)
    throw error
  }
}

const printSummary = (files) => {
  const stats = files.reduce((acc, file) => {
    acc.totalWords += file.metadata.words || 0
    acc.totalImages += file.metadata.images || 0
    acc.totalLinks += file.metadata.links || 0
    acc.totalCodeBlocks += file.metadata.codeBlocks || 0
    acc.h1 += file.metadata.headers?.h1 || 0
    acc.h2 += file.metadata.headers?.h2 || 0
    acc.h3 += file.metadata.headers?.h3 || 0
    acc.byType[file.metadata.type] = (acc.byType[file.metadata.type] || 0) + 1

    if (file.metadata?.tags && Array.isArray(file.metadata.tags)) {
      file.metadata.tags.forEach(tag => acc.tags[tag] = (acc.tags[tag] || 0) + 1)
    }

    return acc
  }, {
    totalWords: 0, totalImages: 0, totalLinks: 0, totalCodeBlocks: 0,
    h1: 0, h2: 0, h3: 0, byType: {}, tags: {}
  })

  console.log('\n📊 Content Analysis')
  console.log('=================')
  console.log(`📝 Total Files: ${files.length}`)
  console.log(`📚 Total Words: ${stats.totalWords.toLocaleString()}`)
  console.log(`🖼️  Total Images: ${stats.totalImages}`)
  console.log(`🔗 Total Links: ${stats.totalLinks}`)
  console.log(`💻 Code Blocks: ${stats.totalCodeBlocks}`)

  console.log('\n📑 Headers')
  console.log(`H1: ${stats.h1}, H2: ${stats.h2}, H3: ${stats.h3}`)

  console.log('\n📂 Content Types')
  Object.entries(stats.byType)
    .sort(([, a], [, b]) => b - a)
    .forEach(([type, count]) => console.log(`${type.padEnd(10)} ${count}`))

  console.log('\n🏷️  Top 10 Tags')
  Object.entries(stats.tags)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .forEach(([tag, count]) => console.log(`${tag.padEnd(20)} ${count}`))
}

const enhanceImageUrl = (url) => {
  if (!url.includes('cloudinary.com/ejf/')) return url
  url = url.replace(/^http:\/\//i, 'https://')
  const base = url.split('/upload/')[0] + '/upload/'
  const path = url.split('/upload/')[1]
  return {
    src: `${base}c_scale,f_auto,q_auto:good,w_800/${path}`,
    srcset: `${base}c_scale,f_auto,q_auto:good,w_400/${path} 400w, ${base}c_scale,f_auto,q_auto:good,w_800/${path} 800w, ${base}c_scale,f_auto,q_auto:good,w_1200/${path} 1200w`.trim(),
    sizes: '(min-width: 768px) 80vw, 100vw'
  }
}

function remarkEnhanceImages() {
  return (tree) => {
    visit(tree, 'image', (node) => {
      if (node.url) {
        const enhanced = enhanceImageUrl(node.url)
        if (enhanced !== node.url) {
          node.data = node.data || {}
          node.data.hProperties = node.data.hProperties || {}
          node.data.hProperties.srcset = enhanced.srcset
          node.data.hProperties.sizes = enhanced.sizes
          node.url = enhanced.src
          node.data.hProperties.loading = 'lazy'
          node.data.hProperties.decoding = 'async'
          node.data.hProperties.className = 'w-full max-w-full mx-auto'
          node.data.hProperties.crossorigin = 'anonymous'
          node.data.hProperties.style = 'display: block; max-width: 100%;'
        }
      }
    })
  }
}

async function processAllFiles() {
  const spinner = ora('Processing markdown files...').start()

  try {
    await backupProcessedContent(paths.outputDir, paths.backupDir)
    await fs.mkdir(paths.contentDir, { recursive: true })
    await fs.mkdir(paths.draftsDir, { recursive: true })

    const allFiles = [
      ...(await getFilesRecursively(paths.contentDir)),
      ...(await getFilesRecursively(paths.draftsDir))
    ]
    processStats.totalFiles = allFiles.length
    spinner.succeed(`Found ${allFiles.length} markdown files`)

    await generateExternalLinksCSV(allFiles)
    console.log('\nProcessing files...\n')

    const results = []
    for (const filePath of allFiles) {
      try {
        const result = await processMarkdown(await fs.readFile(filePath, 'utf8'), filePath)
        const relativePath = path.relative(paths.contentDir, filePath)

        process.stdout.write(`\r${chalk.gray(`Processing: ${path.basename(filePath).padEnd(40)}`)}${Math.round((processStats.filesProcessed / processStats.totalFiles) * 100)}%`)

        const outputPath = path.join(paths.outputDir, relativePath.replace(/\.md$/, '.json'))
        await fs.mkdir(path.dirname(outputPath), { recursive: true })
        await fs.writeFile(outputPath, JSON.stringify(result, null, 2))

        results.push(result)
        processStats.filesProcessed++
      } catch (error) {
        processStats.errors.push({ file: filePath, error: error.message })
      }
    }

    process.stdout.write('\r' + ' '.repeat(80) + '\r')
    printSummary(results)

    const manifestResults = results.map((entry, index) => {
      const cleanEntry = { ...entry }
      const originalFilePath = allFiles[index]

      delete cleanEntry.html
      delete cleanEntry.content
      delete cleanEntry.processedContent

      const slug = path.relative(paths.contentDir, originalFilePath).replace(/\.md$/, '')
      const type = cleanEntry.metadata?.type || getPostType(slug)

      return {
        slug,
        title: cleanEntry.metadata?.title || cleanEntry.title,
        date: cleanEntry.metadata?.date,
        type,
        hidden: cleanEntry.metadata?.hidden,
        draft: cleanEntry.metadata?.draft,
        dek: cleanEntry.metadata?.dek,
        modified: cleanEntry.metadata?.modified,
        tags: cleanEntry.metadata?.tags,
        toc: cleanEntry.metadata?.toc,
        metadata: { ...cleanEntry.metadata, slug, type }
      }
    })

    const manifestPath = path.join(paths.outputDir, 'manifest-lite.json')
    await fs.writeFile(manifestPath, JSON.stringify(manifestResults, null, 2))
    spinner.succeed('Manifest written successfully')

    return results
  } catch (error) {
    spinner.fail('Processing failed')
    console.error(error)
    throw error
  }
}

processAllFiles().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

export { processAllFiles, processMarkdown, getFilesRecursively }