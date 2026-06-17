/**
 * @file highlight.post.ts
 * @description Server-side syntax highlighting using Shiki with support for multiple languages and themes
 * @endpoint POST /api/highlight
 * @params code: string - Code to highlight, language: string - Language name (default: 'text'), theme: string - Theme name (default: 'github-light')
 * @returns Highlighted HTML code with language detection and fallback handling
 */
// SERVER-SIDE SYNTAX HIGHLIGHTING - Zeus almighty, no bundlin'
// Pre-calculate, pre-render, hit em with the flow slide

import { createHighlighter, type Highlighter } from 'shiki'

let highlighterInstance: Highlighter | null = null

async function getHighlighter() {
  if (!highlighterInstance) {
    highlighterInstance = await createHighlighter({
      themes: ['github-light', 'github-dark', 'vitesse-dark', 'one-dark-pro'],
      langs: [
        'javascript',
        'typescript',
        'json',
        'html',
        'css',
        'markdown',
        'bash',
        'python',
        'go',
        'rust',
        'java',
        'cpp',
        'vue',
        'jsx',
        'tsx',
        'sql',
        'yaml',
        'xml',
        'shell',
        'text',
        'csv',
        'ruby',
        'cypher',
        'r',
        'lua',
        'powershell',
        'dockerfile',
        'toml',
        'ini',
        'properties',
      ],
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
      html: '<pre><code></code></pre>',
    }
  }

  try {
    const highlighter = await getHighlighter()

    // Check if language is supported, fallback to 'text' if not
    const supportedLanguages = highlighter.getLoadedLanguages()
    const langToUse = supportedLanguages.includes(language) ? language : 'text'

    const html = highlighter.codeToHtml(code, {
      lang: langToUse,
      theme: theme,
    })

    return {
      html,
      language: langToUse,
      theme,
      originalLanguage: language,
    }
  } catch (error) {
    console.error('Highlighting error:', error)
    // Fallback - return plain HTML
    return {
      html: `<pre><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`,
      error: 'Failed to highlight',
      language: 'text',
    }
  }
})
