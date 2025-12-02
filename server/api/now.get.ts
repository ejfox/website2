import { readFile } from 'node:fs/promises'
import matter from 'gray-matter'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import path from 'node:path'

export default defineEventHandler(async () => {
  try {
    const filePath = path.resolve(process.cwd(), 'content/now.md')
    const fileContent = await readFile(filePath, 'utf-8')
    const { content, data } = matter(fileContent)

    const processor = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeStringify, { allowDangerousHtml: true })

    const result = await processor.process(content)

    return {
      title: data.title || 'Now',
      html: String(result),
      description: data.description,
      date: data.date,
      ...data,
    }
  } catch (error) {
    console.error('Error loading now page:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load now page',
    })
  }
})
