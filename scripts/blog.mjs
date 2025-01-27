import { rehypeDefaultClasses } from './plugins/rehypeDefaultClasses.mjs'

// ... in the processor setup
const processor = unified()
  .use(remarkParse)
  .use(remarkFrontmatter)
  .use(remarkExtractFrontmatter, { yaml: yaml.parse })
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw) // Handle HTML in markdown
  .use(rehypeDefaultClasses) // Make sure this is here
  .use(rehypeStringify)
