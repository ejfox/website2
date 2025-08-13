// SERVER-SIDE SYNTAX HIGHLIGHTING - Zeus almighty, no bundlin'
// Pre-calculate, pre-render, hit em with the flow slide

import { createHighlighter } from 'shiki'

let highlighterInstance: any = null

async function getHighlighter() {
  if (!highlighterInstance) {
    highlighterInstance = await createHighlighter({
      themes: ['github-light', 'github-dark'],
      langs: [
        'javascript', 'typescript', 'json', 'html', 'css', 
        'markdown', 'bash', 'python', 'go', 'rust', 
        'java', 'cpp', 'vue', 'jsx', 'tsx', 'sql', 
        'yaml', 'xml', 'shell', 'text'
      ]
    })
  }
  return highlighterInstance
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { code, language = 'text', theme = 'github-light' } = body

  if (!code) {
    return {
      error: 'No code provided',
      html: '<pre><code></code></pre>'
    }
  }

  try {
    const highlighter = await getHighlighter()
    
    const html = highlighter.codeToHtml(code, {
      lang: language,
      theme: theme
    })

    return {
      html,
      language,
      theme
    }
  } catch (error) {
    console.error('Highlighting error:', error)
    // Fallback - return plain HTML
    return {
      html: `<pre><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`,
      error: 'Failed to highlight'
    }
  }
})