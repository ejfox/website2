import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'

export const useMarkdown = () => {
  const markdownToHtml = async (markdown: string): Promise<string> => {
    if (!markdown) return ''

    try {
      const processor = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeStringify, { allowDangerousHtml: true })

      const result = await processor.process(markdown)
      return String(result)
    } catch (error) {
      console.error('Error processing markdown:', error)
      return markdown
    }
  }

  return {
    markdownToHtml
  }
}
