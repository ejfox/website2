import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkFrontmatter from 'remark-frontmatter'
import remarkExtractFrontmatter from 'remark-extract-frontmatter'
import { parse as yaml } from 'yaml'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import { rehypeDefaultClasses } from './plugins/rehypeDefaultClasses.mjs'

// ... in the processor setup
const _processor = unified()
  .use(remarkParse)
  .use(remarkFrontmatter)
  .use(remarkExtractFrontmatter, { yaml: yaml })
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw) // Handle HTML in markdown
  .use(rehypeDefaultClasses) // Make sure this is here
  .use(rehypeStringify)
