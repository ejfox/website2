// Markdown → HTML Processing Pipeline
import { promises as fs } from 'node:fs'
import path from 'node:path'
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
import fetch from 'node-fetch'
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

const SOURCE_DIR =
  process.env.OBSIDIAN_VAULT_PATH ||
  '/Users/ejfox/Library/Mobile Documents/iCloud~md~obsidian/Documents/' +
    'ejfox/'

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

const formatTitle = (filename) => {
  const baseName = filename.split('/').pop()
  return baseName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const normalizeSlug = (slug) => {
  // Strip leading 'blog/' prefix if it exists
  return slug.startsWith('blog/') ? slug.slice(5) : slug
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm) // Process footnotes FIRST before other plugins
  .use(remarkExtractToc)
  .use(remarkObsidianSupport)
  .use(remarkEnhanceImages)
  .use(remarkEnhanceLinks)
  .use(remarkAi2htmlEmbed)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeAddClassToParagraphs)
  .use(rehypePrettyCode, {
    theme: JSON.parse(await fs.readFile('./themes/ayu-mirage.json', 'utf-8')),
    onVisitLine(node) {
      if (node.children.length === 0)
        node.children = [{ type: 'text', value: ' ' }]
    },
    onVisitHighlightedLine(node) {
      node.properties.className.push('highlighted')
    },
    onVisitHighlightedWord(node) {
      node.properties.className = ['word']
    },
    highlighter,
    transformers: [
      transformerCopyButton({ visibility: 'always', feedbackDuration: 3000 })
    ]
  })
  // .use(rehypeMermaid, { strategy: 'inline-svg' }) // DELETED - 64MB bloat
  .use(rehypeSlug)
  .use(rehypeStringify, { allowDangerousHtml: true })

async function processMarkdown(content, filePath) {
  const filename = path.basename(filePath)
  try {
    const { data: frontmatter, content: markdownContent } = matter(content)
    let ast = processor.parse(markdownContent)

    // Process through unified pipeline
    // (TOC extraction happens in remarkExtractToc plugin)
    let result = await processor.run(ast)

    // Get TOC data from plugin
    const toc = result.data?.toc || []
    const firstHeading = result.data?.firstHeading
    const firstHeadingNode = result.data?.firstHeadingNode

    // Remove first heading if it exists
    if (firstHeadingNode) {
      const index = result.children.indexOf(firstHeadingNode)
      if (index !== -1) {
        result.children.splice(index, 1)
      }
    }

    let html = processor.stringify(result)

    const extractedTitle =
      frontmatter.title ||
      firstHeading ||
      formatTitle(path.basename(filePath, '.md'))

    // Extract detailed image stats
    const imageMatches = markdownContent.match(/!\[.*?\]\(.*?\)/g) || []
    const imageStats = imageMatches.map((img) => {
      const urlMatch = img.match(/\(([^)]+)\)/)
      if (urlMatch && urlMatch[1].includes('cloudinary')) {
        const widthMatch = urlMatch[1].match(/w_(\d+)/)
        const heightMatch = urlMatch[1].match(/h_(\d+)/)
        return {
          hasCloudinary: true,
          width: widthMatch ? Number.parseInt(widthMatch[1]) : null,
          height: heightMatch ? Number.parseInt(heightMatch[1]) : null
        }
      }
      return { hasCloudinary: false }
    })

    const stats = {
      words: markdownContent.split(/\s+/).length,
      images: imageMatches.length,
      imageDetails: {
        total: imageMatches.length,
        cloudinary: imageStats.filter((i) => i.hasCloudinary).length,
        withDimensions: imageStats.filter((i) => i.width && i.height).length
      },
      links: (markdownContent.match(/\[.*?\]\(.*?\)/g) || []).length,
      codeBlocks: (markdownContent.match(/```[\s\S]*?```/g) || []).length,
      headers: toc.reduce((acc, h) => {
        acc[h.level] = (acc[h.level] || 0) + 1
        return acc
      }, {})
    }

    const pct = Math.round(
      (processStats.filesProcessed / processStats.totalFiles) * 100
    )
    process.stdout.write(
      `\r${chalk.gray(`Processing: ${filename.padEnd(50)}`)}${pct}%`
    )

    const sourcePath = SOURCE_DIR ? path.relative(SOURCE_DIR, filePath) : null
    const sourceInfo = SOURCE_DIR ? { sourcePath, sourceDir: SOURCE_DIR } : {}

    return {
      html,
      title: extractedTitle,
      metadata: {
        ...frontmatter,
        ...stats,
        toc,
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
        if (
          entry.name === 'node_modules' ||
          entry.name === '.git' ||
          entry.name.startsWith('.')
        )
          return null
        return getFilesRecursively(fullPath)
      } else if (
        entry.isFile() &&
        entry.name.endsWith('.md') &&
        !entry.name.startsWith('!')
      ) {
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
  const cleanedUrls = urls.map((url) => url.replace(/[.,:;!?`>]+$/, ''))
  const externalUrls = cleanedUrls.filter(
    (url) => !url.includes('res.cloudinary.com') && !url.includes('ejfox.com')
  )
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
      const slug = normalizeSlug(
        path.relative(paths.contentDir, filePath).replace(/\.md$/, '')
      )

      links.forEach((link) => {
        if (
          !link.includes('amazon.com') &&
          !link.includes('m.media-amazon.com')
        ) {
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

    const csvPath = path.join(process.cwd(), 'data/external_links_final.csv')
    await fs.writeFile(csvPath, csvRows.join('\n'))

    spinner.succeed(
      `Extracted ${linkToSources.size} external links to ` +
        'data/external_links_final.csv'
    )
    return { links: Array.from(linkToSources.keys()), linkToSources }
  } catch (error) {
    spinner.fail('Failed to extract external links')
    console.error(error)
    throw error
  }
}

// Check Wayback Machine for archived version
async function findArchivedVersion(url) {
  try {
    const apiUrl = `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; LinkChecker/1.0; +https://ejfox.com)'
      }
    })

    if (!response.ok) return null

    const data = await response.json()
    const archived = data?.archived_snapshots?.closest

    if (archived?.available && archived?.url) {
      return {
        url: archived.url,
        timestamp: archived.timestamp,
        status: archived.status
      }
    }

    return null
  } catch {
    return null
  }
}

// Link health checking (behind CHECK_LINKS flag)
async function checkLinkHealth(url, timeout = 10000) {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; LinkChecker/1.0; +https://ejfox.com)'
      }
    })

    clearTimeout(timeoutId)

    return {
      url,
      status: response.status,
      ok: response.ok,
      finalUrl: response.url
    }
  } catch (error) {
    return {
      url,
      status: 0,
      ok: false,
      error: error.name === 'AbortError' ? 'Timeout' : error.message
    }
  }
}

async function checkAllLinks(links, linkToSources, maxConcurrent = 5) {
  const spinner = ora(`Checking health of ${links.length} links...`).start()

  try {
    const results = []

    // Check links in batches to avoid overwhelming servers
    for (let i = 0; i < links.length; i += maxConcurrent) {
      const batch = links.slice(i, i + maxConcurrent)
      const batchResults = await Promise.all(
        batch.map((link) => checkLinkHealth(link))
      )
      results.push(...batchResults)

      // Update progress
      spinner.text = `Checking links... ${i + batch.length}/${links.length}`
    }

    // Categorize results
    const working = results.filter((r) => r.ok)
    const broken = results.filter((r) => !r.ok && !r.error)
    const errors = results.filter((r) => r.error)

    spinner.succeed(`Checked ${results.length} links`)

    // Check archive.org for broken links if AUTO_FIX flag is set
    const brokenWithArchives = []
    if (process.env.AUTO_FIX_LINKS === 'true' && broken.length > 0) {
      const archiveSpinner = ora(
        `Searching archive.org for ${broken.length} broken links...`
      ).start()

      for (let i = 0; i < broken.length; i++) {
        const brokenLink = broken[i]
        archiveSpinner.text = `Searching archives... ${i + 1}/${broken.length}`

        const archived = await findArchivedVersion(brokenLink.url)
        brokenWithArchives.push({
          ...brokenLink,
          archived,
          sources: Array.from(linkToSources.get(brokenLink.url) || [])
        })

        // Be polite to archive.org API
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      archiveSpinner.succeed(
        `Found ${brokenWithArchives.filter((b) => b.archived).length} archived versions`
      )
    }

    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: results.length,
        working: working.length,
        broken: broken.length,
        errors: errors.length,
        archived: brokenWithArchives.filter((b) => b.archived).length
      },
      broken:
        brokenWithArchives.length > 0
          ? brokenWithArchives
          : broken.map((r) => ({
              url: r.url,
              status: r.status,
              sources: Array.from(linkToSources.get(r.url) || [])
            })),
      errors: errors.map((r) => ({
        url: r.url,
        error: r.error,
        sources: Array.from(linkToSources.get(r.url) || [])
      }))
    }

    // Save report
    const reportPath = path.join(process.cwd(), 'data/linkrot-report.json')
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2))

    // Print summary
    console.log(chalk.bold('\n📊 Link Health Summary'))
    console.log(`  ${chalk.green('✓')} Working:   ${working.length}`)
    console.log(`  ${chalk.red('✗')} Broken:    ${broken.length}`)
    console.log(`  ${chalk.gray('⏱')} Errors:    ${errors.length}`)
    if (brokenWithArchives.length > 0) {
      console.log(
        `  ${chalk.cyan('📦')} Archived:  ${brokenWithArchives.filter((b) => b.archived).length}`
      )
    }

    if (broken.length > 0) {
      console.log(chalk.red.bold(`\n🚨 ${broken.length} Broken Links Found`))
      const displayLinks =
        brokenWithArchives.length > 0 ? brokenWithArchives : broken
      displayLinks.slice(0, 5).forEach((link) => {
        console.log(chalk.red(`  ${link.status} - ${link.url}`))
        if (link.archived) {
          console.log(
            chalk.cyan(
              `    📦 Archived: ${link.archived.url.substring(0, 60)}...`
            )
          )
        }
        const sources = Array.from(
          linkToSources.get(link.url) || link.sources || []
        )
        sources.slice(0, 2).forEach((source) => {
          console.log(chalk.gray(`    → ${source}`))
        })
      })
      if (broken.length > 5) {
        console.log(chalk.gray(`  ... and ${broken.length - 5} more`))
      }
    }

    console.log(chalk.gray(`\n  Full report: data/linkrot-report.json\n`))

    // Auto-fix broken links if flag is set
    if (
      process.env.AUTO_FIX_LINKS === 'true' &&
      brokenWithArchives.some((b) => b.archived)
    ) {
      await autoFixBrokenLinks(brokenWithArchives.filter((b) => b.archived))
    }

    return report
  } catch (error) {
    spinner.fail('Failed to check link health')
    console.error(error)
    throw error
  }
}

// Auto-fix broken links by replacing with archive.org versions
async function autoFixBrokenLinks(brokenLinks) {
  const spinner = ora('Auto-fixing broken links...').start()

  try {
    let totalFixed = 0
    const fixedByFile = {}

    for (const link of brokenLinks) {
      if (!link.archived) continue

      const archivedUrl = link.archived.url
      const archivedDate = link.archived.timestamp.substring(0, 8) // YYYYMMDD

      // Format date as YYYY-MM-DD
      const formattedDate = `${archivedDate.substring(0, 4)}-${archivedDate.substring(4, 6)}-${archivedDate.substring(6, 8)}`

      for (const source of link.sources) {
        const filePath = path.join(paths.contentDir, `${source}.md`)

        try {
          let content = await fs.readFile(filePath, 'utf-8')
          const originalContent = content

          // Replace the broken link with archived version + indicator
          // Match both markdown links [text](url) and bare URLs
          const escapedUrl = link.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

          // Replace in markdown links [text](broken-url)
          const mdLinkRegex = new RegExp(
            `(\\[[^\\]]+\\])\\(${escapedUrl}\\)`,
            'g'
          )
          content = content.replace(
            mdLinkRegex,
            `$1(${archivedUrl}) *[archived ${formattedDate}]*`
          )

          // Replace bare URLs
          const bareUrlRegex = new RegExp(`(?<!\\()${escapedUrl}(?!\\))`, 'g')
          content = content.replace(
            bareUrlRegex,
            `${archivedUrl} *[archived ${formattedDate}]*`
          )

          // Only write if content changed
          if (content !== originalContent) {
            await fs.writeFile(filePath, content, 'utf-8')
            totalFixed++
            fixedByFile[source] = (fixedByFile[source] || 0) + 1
          }
        } catch {
          // Skip files we can't fix
          continue
        }
      }
    }

    spinner.succeed(
      `Auto-fixed ${totalFixed} broken links across ${Object.keys(fixedByFile).length} files`
    )

    if (Object.keys(fixedByFile).length > 0) {
      console.log(chalk.cyan('\n📦 Files updated with archived links:'))
      Object.entries(fixedByFile)
        .slice(0, 10)
        .forEach(([file, count]) => {
          console.log(
            chalk.gray(`  ${file} (${count} link${count > 1 ? 's' : ''})`)
          )
        })
      if (Object.keys(fixedByFile).length > 10) {
        console.log(
          chalk.gray(`  ... and ${Object.keys(fixedByFile).length - 10} more`)
        )
      }
      console.log(
        chalk.yellow(
          '\n  ⚠️  Review changes before committing - check git diff\n'
        )
      )
    }

    return fixedByFile
  } catch (error) {
    spinner.fail('Failed to auto-fix links')
    console.error(error)
    throw error
  }
}

const printSummary = (files) => {
  const stats = files.reduce(
    (acc, file) => {
      acc.totalWords += file.metadata.words || 0
      acc.totalImages += file.metadata.images || 0
      acc.cloudinaryImages += file.metadata.imageDetails?.cloudinary || 0
      acc.imagesWithDimensions +=
        file.metadata.imageDetails?.withDimensions || 0
      acc.totalLinks += file.metadata.links || 0
      acc.totalCodeBlocks += file.metadata.codeBlocks || 0
      acc.h1 += file.metadata.headers?.h1 || 0
      acc.h2 += file.metadata.headers?.h2 || 0
      acc.h3 += file.metadata.headers?.h3 || 0
      acc.byType[file.metadata.type] = (acc.byType[file.metadata.type] || 0) + 1

      if (file.metadata?.tags && Array.isArray(file.metadata.tags)) {
        file.metadata.tags.forEach(
          (tag) => (acc.tags[tag] = (acc.tags[tag] || 0) + 1)
        )
      }

      return acc
    },
    {
      totalWords: 0,
      totalImages: 0,
      cloudinaryImages: 0,
      imagesWithDimensions: 0,
      totalLinks: 0,
      totalCodeBlocks: 0,
      h1: 0,
      h2: 0,
      h3: 0,
      byType: {},
      tags: {}
    }
  )

  console.log('\n📊 Content Analysis')
  console.log('=================')
  console.log(`📝 Total Files: ${files.length}`)
  console.log(`📚 Total Words: ${stats.totalWords.toLocaleString()}`)
  console.log(
    `🖼️  Total Images: ${stats.totalImages} ` +
      `(${stats.cloudinaryImages} optimized, ` +
      `${stats.imagesWithDimensions} with dimensions)`
  )
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

  // Extract dimensions from URL if present (e.g., w_1920,h_1080)
  const widthMatch = url.match(/w_(\d+)/)
  const heightMatch = url.match(/h_(\d+)/)
  const width = widthMatch ? Number.parseInt(widthMatch[1]) : null
  const height = heightMatch ? Number.parseInt(heightMatch[1]) : null

  const srcset = [
    `${base}c_scale,f_auto,q_auto:good,w_400/${path} 400w`,
    `${base}c_scale,f_auto,q_auto:good,w_800/${path} 800w`,
    `${base}c_scale,f_auto,q_auto:good,w_1200/${path} 1200w`
  ].join(', ')

  return {
    src: `${base}c_scale,f_auto,q_auto:good,w_800/${path}`,
    srcset,
    sizes: '(min-width: 768px) 80vw, 100vw',
    // Removed blur placeholder - user doesn't want blurred images
    // placeholder: `${base}c_scale,f_auto,q_1,w_20,e_blur:1000/${path}`,
    width,
    height
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

          // Grid-based image classes
          const classes = ['img-full', 'my-8', 'rounded-sm']

          // Detect aspect ratio from dimensions
          if (enhanced.width && enhanced.height) {
            const ratio = enhanced.width / enhanced.height
            node.data.hProperties['data-dimensions'] =
              `${enhanced.width}×${enhanced.height}`

            if (Math.abs(ratio - 1) < 0.1) {
              classes.push('aspect-square')
            } else if (Math.abs(ratio - 16 / 9) < 0.1) {
              classes.push('aspect-video')
            } else if (Math.abs(ratio - 3 / 4) < 0.1) {
              classes.push('aspect-[3/4]')
            }
          }

          // Removed blur placeholder - user doesn't want blurred images
          // if (enhanced.placeholder) {
          //   node.data.hProperties['data-placeholder'] = enhanced.placeholder
          //   node.data.hProperties['data-loading'] = 'lazy'
          // }

          node.data.hProperties.className = classes.join(' ')
          node.data.hProperties.crossorigin = 'anonymous'

          // Add dimensions if available
          if (enhanced.width) node.data.hProperties.width = enhanced.width
          if (enhanced.height) node.data.hProperties.height = enhanced.height
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

    const { links, linkToSources } = await generateExternalLinksCSV(allFiles)

    // Check link health if CHECK_LINKS flag is set
    if (process.env.CHECK_LINKS === 'true') {
      await checkAllLinks(links, linkToSources)
    }

    console.log('\nProcessing files...\n')

    const results = []
    for (const filePath of allFiles) {
      try {
        const result = await processMarkdown(
          await fs.readFile(filePath, 'utf8'),
          filePath
        )
        const relativePath = path.relative(paths.contentDir, filePath)

        const baseName = path.basename(filePath).padEnd(40)
        const pct2 = Math.round(
          (processStats.filesProcessed / processStats.totalFiles) * 100
        )
        process.stdout.write(
          `\r${chalk.gray(`Processing: ${baseName}`)}${pct2}%`
        )

        // Only write JSON files for non-draft content
        if (result.metadata?.draft !== true) {
          const normalizedPath = normalizeSlug(
            relativePath.replace(/\.md$/, '')
          )
          const outputPath = path.join(
            paths.outputDir,
            `${normalizedPath}.json`
          )
          await fs.mkdir(path.dirname(outputPath), { recursive: true })
          await fs.writeFile(outputPath, JSON.stringify(result, null, 2))
        }

        results.push(result)
        processStats.filesProcessed++
      } catch (error) {
        processStats.errors.push({ file: filePath, error: error.message })
      }
    }

    process.stdout.write('\r' + ' '.repeat(80) + '\r')
    printSummary(results)

    // Filter out draft posts from manifest
    const nonDraftResults = results.filter(
      (entry) => entry.metadata?.draft !== true
    )
    const nonDraftFiles = allFiles.filter(
      (_, index) => results[index]?.metadata?.draft !== true
    )

    // Clean up orphaned processed files
    // (files that exist in output but not in source)
    const currentSlugs = new Set()
    allFiles.forEach((filePath) => {
      const slug = normalizeSlug(
        path.relative(paths.contentDir, filePath).replace(/\.md$/, '')
      )
      currentSlugs.add(slug)
    })

    // Find and remove orphaned processed files
    const outputFiles = await getFilesRecursively(paths.outputDir, '.json')
    for (const outputFile of outputFiles) {
      const relativePath = path.relative(paths.outputDir, outputFile)
      const outputSlug = relativePath.replace(/\.json$/, '')

      if (
        !currentSlugs.has(outputSlug) &&
        !relativePath.includes('manifest-lite.json')
      ) {
        try {
          await fs.unlink(outputFile)
          console.log(`🗑️  Removed orphaned: ${relativePath}`)
        } catch (error) {
          const warnMsg = `⚠️  Could not remove ${relativePath}:`
          console.warn(warnMsg, error.message)
        }
      }
    }

    const manifestResults = nonDraftResults.map((entry, index) => {
      const cleanEntry = { ...entry }
      const originalFilePath = nonDraftFiles[index]

      delete cleanEntry.html
      delete cleanEntry.content
      delete cleanEntry.processedContent

      const slug = normalizeSlug(
        path.relative(paths.contentDir, originalFilePath).replace(/\.md$/, '')
      )
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

    // Extract tags with usage counts from content
    // and write to public/content-tags.json
    const tagUsage = {}
    nonDraftResults.forEach((result) => {
      if (result.metadata?.tags && Array.isArray(result.metadata.tags)) {
        result.metadata.tags.forEach((tag) => {
          if (typeof tag === 'string' && tag.trim()) {
            const cleanTag = tag.trim()
            tagUsage[cleanTag] = (tagUsage[cleanTag] || 0) + 1
          }
        })
      }
    })

    if (Object.keys(tagUsage).length > 0) {
      const contentTagsPath = path.join(
        process.cwd(),
        'public/content-tags.json'
      )
      await fs.writeFile(contentTagsPath, JSON.stringify(tagUsage, null, 2))
      const tagCount = Object.keys(tagUsage).length
      console.log(
        `\n🏷️  Extracted ${tagCount} unique content tags ` +
          'with usage counts to public/content-tags.json'
      )
    }

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
