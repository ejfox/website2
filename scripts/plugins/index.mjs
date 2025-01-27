// Remark plugins
export { remarkCustomElements } from './remarkCustomElements.mjs'
export { remarkEnhanceLinks } from './remarkEnhanceLinks.mjs'
export { remarkObsidianSupport } from './remarkObsidianSupport.mjs'
export { remarkExtractToc } from './remarkExtractToc.mjs'
export { remarkAi2htmlEmbed } from './remarkAi2htmlEmbed.mjs'

// Rehype plugins
export { rehypeAddClassToParagraphs } from './rehypeAddClassToParagraphs.mjs'

// Plugin configurations
export const DEFAULT_PLUGINS = [
  'remarkCustomElements',
  'remarkEnhanceLinks',
  'remarkObsidianSupport',
  'remarkExtractToc',
  'remarkAi2htmlEmbed',
  'rehypeAddClassToParagraphs'
]
