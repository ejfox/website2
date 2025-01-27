import { visit } from 'unist-util-visit'
import fetch from 'node-fetch'
import { formatCloudinaryUrl, processLink } from '../utils/helpers.mjs'

export function remarkCustomElements() {
  const iconCache = {} // In-memory cache for icons

  async function getIconSVG(iconName) {
    if (iconCache[iconName]) {
      return iconCache[iconName]
    }

    const [prefix, name] = iconName.split(':')
    const url = `https://api.iconify.design/${prefix}/${name}.svg`
    try {
      const response = await fetch(url)
      if (response.ok) {
        const svg = await response.text()
        iconCache[iconName] = svg // Cache the SVG
        return svg
      } else {
        console.error(`Failed to fetch icon: ${iconName}`)
        return null
      }
    } catch (error) {
      console.error(`Error fetching icon ${iconName}:`, error)
      return null
    }
  }

  function getNodeText(node) {
    if (!node) return ''
    if (node.type === 'text') {
      return node.value
    } else if (node.children && node.children.length > 0) {
      return node.children.map(getNodeText).join('')
    } else {
      return ''
    }
  }

  return async (tree) => {
    const linkNodes = []

    // Collect link nodes
    visit(tree, 'link', (node) => {
      linkNodes.push(node)
    })

    // Process links
    for (const node of linkNodes) {
      const { href, icon } = processLink(node.url)
      node.url = href
      if (icon) {
        node.type = 'html'
        let iconHtml = ''
        if (icon) {
          const svg = await getIconSVG(icon)
          if (svg) {
            const styledSvg = svg.replace(
              '<svg',
              '<svg style="display: inline-block; vertical-align: middle; width: 0.7em; height: 0.7em; margin-left: 0.2rem; margin-right: 0.2rem; margin-top: -0.2em; opacity: 0.8;"'
            )
            iconHtml = `${styledSvg}`
          }
        }
        const linkText = getNodeText(node)
        node.value = `<a href="${href}">${linkText}${iconHtml}</a>`
      }
    }

    // Update remarkCustomElements to handle images
    visit(tree, 'image', (node) => {
      // Format Cloudinary URLs
      node.url = formatCloudinaryUrl(node.url)
    })
  }
}
