/**
 * @file highlight.post.ts
 * @description POST /api/highlight. Server-side Shiki highlighting for
 *   GistPreview.vue, so the client never bundles Shiki.
 *   Body: { code, language = 'text', theme = 'github-light' }.
 *   Returns { html, language, theme, originalLanguage }. An unloaded language
 *   falls back to 'text'. Missing code or a Shiki error (e.g. an unknown
 *   theme) returns 200 with { error, html } (escaped plain <pre>); a
 *   non-string `code` throws a 500 from the fallback itself.
 */
// SERVER-SIDE SYNTAX HIGHLIGHTING - Zeus almighty, no bundlin'
// Pre-calculate, pre-render, hit em with the flow slide

import { createHighlighter, type Highlighter } from 'shiki'

// One highlighter per process: createHighlighter loads every grammar and theme
// below, which is slow, so it's built on first request and reused.
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
    // codeToHtml throws on an unloaded language; degrade to plain text instead.
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
      html: `<pre><code>${String(code)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')}</code></pre>`,
      error: 'Failed to highlight',
      language: 'text',
    }
  }
})
