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

  // Camera look direction — varies per variant
  const camRotX = randRange(rng, -0.15, 0.15)
  const camRotY = randRange(rng, -0.2, 0.2)

  // Helper: place a card somewhere AROUND the viewer
  // Uses spherical-ish coordinates so cards surround you
  function placeAround(opts) {
    // angle: where around you (radians, -PI to PI)
    // elevation: up/down (-1 to 1)
    // distance: how far (z-depth)
    const angle = opts.angle || randRange(rng, -Math.PI, Math.PI)
    const elevation = opts.elevation || randRange(rng, -0.8, 0.8)
    const distance = opts.distance || randRange(rng, 0.3, 2.0)

    return {
      // Convert to screen-space: angle drives x, elevation drives y
      x: Math.sin(angle + camRotY) * distance * 800,
      y: elevation * distance * 400 + camRotX * 200,
      z: Math.cos(angle) * distance * 0.5 + distance * 0.5,
    }
  }

  // Title card — dead center, closest
  const titlePos = placeAround({ angle: randRange(rng, -0.3, 0.3), elevation: randRange(rng, -0.15, 0.15), distance: 0.15 })
  cards.push({
    type: 'title',
    text: content.title,
    ...titlePos,
    width: 700,
    height: 140,
    rotation: randRange(rng, -4, 4),
    importance: 1.0,
  })

  // Heading cards — scattered around the room
  for (const heading of content.headings) {
    const pos = placeAround({ distance: randRange(rng, 0.4, 1.5) })
    cards.push({
      type: 'heading',
      text: heading,
      ...pos,
      width: 280 + heading.length * 3,
      height: 52,
      rotation: randRange(rng, -20, 20),
      importance: 0.6,
    })
  }

  // Blockquote cards
  for (const quote of content.blockquotes) {
    const pos = placeAround({ distance: randRange(rng, 0.5, 1.8) })
    cards.push({
      type: 'quote',
      text: quote.slice(0, 80),
      ...pos,
      width: 280,
      height: 65,
      rotation: randRange(rng, -15, 15),
      importance: 0.5,
    })
  }

  // Image cards — BIG, like posters on the walls
  for (const url of content.imageUrls) {
    const pos = placeAround({ distance: randRange(rng, 0.3, 1.2) })
    cards.push({
      type: 'image',
      text: '',
      imageUrl: url,
      ...pos,
      width: 320,
      height: 220,
      rotation: randRange(rng, -22, 22),
      importance: 0.4,
    })
  }

  // Tag pills — floating at various depths
  for (const tag of content.tags) {
    const pos = placeAround({ distance: randRange(rng, 0.6, 2.5) })
    cards.push({
      type: 'tag',
      text: tag,
      ...pos,
      width: 80 + tag.length * 9,
      height: 30,
      rotation: randRange(rng, -8, 8),
      importance: 0.2,
    })
  }

  // Stats card
  if (content.stats.words > 0) {
    const statsText = `${content.stats.words}w · ${content.stats.images}img · ${content.stats.links}links`
    const pos = placeAround({ elevation: randRange(rng, 0.4, 0.9), distance: randRange(rng, 0.8, 1.5) })
    cards.push({
      type: 'stats',
      text: statsText,
      ...pos,
      width: 220,
      height: 28,
      rotation: randRange(rng, -3, 3),
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
