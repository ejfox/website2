/**
 * @file plugins/index.mjs
 * @description Barrel for the remark/rehype plugins. The ORDER they run in is
 *   set by the `.use()` chain in scripts/build/processMarkdown.mjs (and
 *   scripts/author/markdownToHtml.mjs), not by this file.
 * @usage import { remarkEnhanceLinks, rehypeAddClassToParagraphs } from './scripts/plugins/index.mjs'
 */

// Remark plugins
export { remarkEnhanceLinks } from './remarkEnhanceLinks.mjs'
export { remarkObsidianSupport } from './remarkObsidianSupport.mjs'
export { remarkExtractToc, dropTitleHeading } from './remarkExtractToc.mjs'
export { remarkPredictionRef } from './remarkPredictionRef.mjs'
export { remarkEnhanceImages } from './remarkEnhanceImages.mjs'
export { remarkGearCard } from './remarkGearCard.mjs'
export { remarkHandDrawn } from './remarkHandDrawn.mjs'
export { remarkMermaid } from './remarkMermaid.mjs'

// Rehype plugins
export { rehypeAddClassToParagraphs } from './rehypeAddClassToParagraphs.mjs'
export { rehypeOptimizeImages } from './rehypeOptimizeImages.mjs'

// Plugin configurations
// NOTE: nothing imports DEFAULT_PLUGINS; it does not drive the pipeline.
export const DEFAULT_PLUGINS = [
  'remarkEnhanceLinks',
  'remarkObsidianSupport',
  'remarkExtractToc',
  'remarkEnhanceImages',
  'rehypeAddClassToParagraphs',
]
