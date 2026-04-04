/**
 * Generate 3D positions for floating content cards.
 * Uses seeded PRNG so the same slug always produces the same layout.
 */

import { createRng, randRange } from './seed.mjs'

/**
 * @param {string} slug
 * @param {object} content - from extract.mjs
 * @returns {Array} cards with 3D positions
 */
export function layoutCards(slug, content) {
  const rng = createRng(slug)
  const cards = []

  // Title card — front and center, slightly elevated
  cards.push({
    type: 'title',
    text: content.title,
    x: randRange(rng, -40, 40),
    y: randRange(rng, -60, -20),
    z: randRange(rng, 0.6, 1.2),
    width: 420,
    height: 80,
    rotation: randRange(rng, -3, 3),
    importance: 1.0, // highest — gets the red accent
  })

  // Heading cards
  for (const heading of content.headings) {
    cards.push({
      type: 'heading',
      text: heading,
      x: randRange(rng, -300, 300),
      y: randRange(rng, -180, 180),
      z: randRange(rng, 1.0, 3.5),
      width: 240 + heading.length * 2,
      height: 44,
      rotation: randRange(rng, -6, 6),
      importance: 0.6,
    })
  }

  // Blockquote cards
  for (const quote of content.blockquotes) {
    cards.push({
      type: 'quote',
      text: quote.slice(0, 80),
      x: randRange(rng, -280, 280),
      y: randRange(rng, -140, 140),
      z: randRange(rng, 1.5, 4.0),
      width: 260,
      height: 60,
      rotation: randRange(rng, -4, 4),
      importance: 0.5,
    })
  }

  // Image cards
  for (const url of content.imageUrls) {
    cards.push({
      type: 'image',
      text: '',
      imageUrl: url,
      x: randRange(rng, -320, 320),
      y: randRange(rng, -160, 160),
      z: randRange(rng, 0.8, 3.0),
      width: 160,
      height: 100,
      rotation: randRange(rng, -8, 8),
      importance: 0.4,
    })
  }

  // Tag pills
  for (const tag of content.tags) {
    cards.push({
      type: 'tag',
      text: tag,
      x: randRange(rng, -350, 350),
      y: randRange(rng, -200, 200),
      z: randRange(rng, 2.0, 4.5),
      width: 60 + tag.length * 7,
      height: 22,
      rotation: randRange(rng, -5, 5),
      importance: 0.2,
    })
  }

  // Stats card — bottom, far back
  if (content.stats.words > 0) {
    const statsText = `${content.stats.words}w · ${content.stats.images}img · ${content.stats.links}links`
    cards.push({
      type: 'stats',
      text: statsText,
      x: randRange(rng, -100, 100),
      y: randRange(rng, 100, 180),
      z: randRange(rng, 2.5, 3.5),
      width: 220,
      height: 28,
      rotation: randRange(rng, -2, 2),
      importance: 0.1,
    })
  }

  // Connecting lines between nearby cards (thin network edges)
  const connections = []
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const dx = cards[i].x - cards[j].x
      const dy = cards[i].y - cards[j].y
      const dz = cards[i].z - cards[j].z
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
      // Connect nearby cards with some randomness
      if (dist < 300 && rng() > 0.5) {
        connections.push({ from: i, to: j })
      }
    }
  }

  return { cards, connections }
}
