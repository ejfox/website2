import { visit } from 'unist-util-visit'

export function remarkAi2htmlEmbed() {
  return (tree) => {
    visit(tree, 'paragraph', (node) => {
      if (node.children.length === 1 && node.children[0].type === 'text') {
        const match = node.children[0].value.match(/^::ai2html\{(.+)\}$/)
        if (match) {
          const projectName = match[1]
          node.type = 'html'
          node.value =
            `
<div class="ai2html-responsive-embed" data-project="${projectName}">
  <iframe src="/ai2html/${projectName}/index.html" width="100%" ` +
            `style="border: none;" scrolling="no"></iframe>
</div>`
        }
      }
    })
  }
}
