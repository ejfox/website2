// Remark plugins
export { remarkEnhanceLinks } from './remarkEnhanceLinks.mjs'
export { remarkObsidianSupport } from './remarkObsidianSupport.mjs'
export { remarkObsidianEnhanced } from './remarkObsidianEnhanced.mjs'
export { remarkExtractToc } from './remarkExtractToc.mjs'
export { remarkAi2htmlEmbed } from './remarkAi2htmlEmbed.mjs'

// Rehype plugins
export { rehypeAddClassToParagraphs } from './rehypeAddClassToParagraphs.mjs'

// Plugin configurations
export const DEFAULT_PLUGINS = [
  'remarkEnhanceLinks',
  'remarkObsidianSupport',
  'remarkObsidianEnhanced', // Added enhanced support
  'remarkExtractToc',
  'remarkAi2htmlEmbed',
  'rehypeAddClassToParagraphs',
]
