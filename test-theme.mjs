import { createHighlighter } from 'shiki'
import { readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function test() {
  try {
    const themePath = join(__dirname, 'themes', 'vulpes-reddish.json')
    console.log('Loading theme from:', themePath)

    const vulpesTheme = JSON.parse(await readFile(themePath, 'utf-8'))
    console.log('✓ Theme loaded:', vulpesTheme.name)
    console.log('✓ Type:', vulpesTheme.type)
    console.log('✓ Token colors:', vulpesTheme.tokenColors.length)

    const highlighter = await createHighlighter({
      themes: [vulpesTheme],
      langs: ['javascript', 'typescript']
    })
    console.log('✓ Highlighter created')

    const testCode = 'const vulpes = "reddish"'
    const html = highlighter.codeToHtml(testCode, {
      lang: 'javascript',
      theme: 'Vulpes Reddish'
    })

    console.log('✓ Code highlighted successfully')
    console.log('✓ HTML output length:', html.length, 'chars')
    console.log('✓ Contains ff268c (hotpink):', html.includes('ff268c'))
    console.log('✓ Contains ff9b8a (salmon):', html.includes('ff9b8a'))
    console.log('\n--- Sample HTML (first 500 chars) ---')
    console.log(html.substring(0, 500))
  } catch (error) {
    console.error('✗ Error:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

test()
