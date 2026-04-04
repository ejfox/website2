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

  // Camera offset — varies per variant, gives each a different "viewpoint"
  const camOffsetX = randRange(rng, -120, 120)
  const camOffsetY = randRange(rng, -60, 60)

  // Title card — front and center, slightly elevated
  cards.push({
    type: 'title',
    text: content.title,
    x: camOffsetX + randRange(rng, -80, 80),
    y: camOffsetY + randRange(rng, -80, -10),
    z: randRange(rng, 0.3, 1.0),
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
      x: camOffsetX + randRange(rng, -450, 450),
      y: camOffsetY + randRange(rng, -250, 250),
      z: randRange(rng, 0.5, 4.0),
      width: 240 + heading.length * 2,
      height: 44,
      rotation: randRange(rng, -15, 15),
      importance: 0.6,
    })
  }

  // Blockquote cards
  for (const quote of content.blockquotes) {
    cards.push({
      type: 'quote',
      text: quote.slice(0, 80),
      x: camOffsetX + randRange(rng, -400, 400),
      y: camOffsetY + randRange(rng, -200, 200),
      z: randRange(rng, 0.8, 4.5),
      width: 260,
      height: 60,
      rotation: randRange(rng, -12, 12),
      importance: 0.5,
    })
  }

  // Image cards
  for (const url of content.imageUrls) {
    cards.push({
      type: 'image',
      text: '',
      imageUrl: url,
      x: camOffsetX + randRange(rng, -450, 450),
      y: camOffsetY + randRange(rng, -220, 220),
      z: randRange(rng, 0.4, 3.5),
      width: 160,
      height: 100,
      rotation: randRange(rng, -18, 18),
      importance: 0.4,
    })
  }

  // Tag pills
  for (const tag of content.tags) {
    cards.push({
      type: 'tag',
      text: tag,
      x: camOffsetX + randRange(rng, -500, 500),
      y: camOffsetY + randRange(rng, -280, 280),
      z: randRange(rng, 1.5, 5.0),
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
      x: camOffsetX + randRange(rng, -200, 200),
      y: camOffsetY + randRange(rng, 120, 250),
      z: randRange(rng, 2.0, 4.0),
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
