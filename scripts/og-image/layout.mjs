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

  // Camera offset — slightly off-center for natural feel
  const camOffX = randRange(rng, -80, 80)
  const camOffY = randRange(rng, -30, 30)

  // The "room" — cards sit on virtual surfaces around the viewer:
  //   - Back wall: directly ahead, various x/y positions
  //   - Left wall: far left, angled inward
  //   - Right wall: far right, angled inward
  //   - Floor cards: below eye level, receding into depth
  //   - Ceiling floaters: above, further back
  //
  // Each surface has a base z-depth and x-range.

  const WALLS = {
    backCenter: { xMin: -200, xMax: 200, yMin: -120, yMax: 120, z: 0.8, zSpread: 0.4 },
    left:       { xMin: -700, xMax: -300, yMin: -180, yMax: 180, z: 0.5, zSpread: 0.6 },
    right:      { xMin: 300, xMax: 700, yMin: -180, yMax: 180, z: 0.5, zSpread: 0.6 },
    floor:      { xMin: -500, xMax: 500, yMin: 150, yMax: 350, z: 0.6, zSpread: 0.8 },
    ceiling:    { xMin: -400, xMax: 400, yMin: -350, yMax: -180, z: 1.0, zSpread: 0.5 },
    far:        { xMin: -600, xMax: 600, yMin: -250, yMax: 250, z: 1.8, zSpread: 0.8 },
  }

  const wallNames = Object.keys(WALLS)

  function placeOnWall(wallName) {
    const wall = wallName ? WALLS[wallName] : WALLS[randPick(rng, wallNames)]
    return {
      x: camOffX + randRange(rng, wall.xMin, wall.xMax),
      y: camOffY + randRange(rng, wall.yMin, wall.yMax),
      z: wall.z + randRange(rng, 0, wall.zSpread),
    }
  }

  // Title card — front and center on the back wall
  cards.push({
    type: 'title',
    text: content.title,
    ...placeOnWall('backCenter'),
    z: 0.15 + randRange(rng, 0, 0.1), // override: always closest
    width: 700,
    height: 140,
    rotation: randRange(rng, -3, 3),
    importance: 1.0,
  })

  // Image cards — BIG posters on left and right walls
  const imageWalls = ['left', 'right', 'backCenter', 'floor']
  for (let i = 0; i < content.imageUrls.length; i++) {
    const wall = imageWalls[i % imageWalls.length]
    cards.push({
      type: 'image',
      text: '',
      imageUrl: content.imageUrls[i],
      ...placeOnWall(wall),
      width: 320,
      height: 220,
      rotation: randRange(rng, -18, 18),
      importance: 0.4,
    })
  }

  // Heading cards — distributed across walls
  const headingWalls = ['left', 'right', 'ceiling', 'far', 'backCenter']
  for (let i = 0; i < content.headings.length; i++) {
    const wall = headingWalls[i % headingWalls.length]
    cards.push({
      type: 'heading',
      text: content.headings[i],
      ...placeOnWall(wall),
      width: 280 + content.headings[i].length * 3,
      height: 52,
      rotation: randRange(rng, -15, 15),
      importance: 0.6,
    })
  }

  // Blockquote cards — on the far wall or floor
  for (const quote of content.blockquotes) {
    const wall = rng() > 0.5 ? 'far' : 'floor'
    cards.push({
      type: 'quote',
      text: quote.slice(0, 80),
      ...placeOnWall(wall),
      width: 280,
      height: 65,
      rotation: randRange(rng, -12, 12),
      importance: 0.5,
    })
  }

  // Tag pills — scattered everywhere, mostly far
  const tagWalls = ['ceiling', 'floor', 'far', 'left', 'right']
  for (let i = 0; i < content.tags.length; i++) {
    const wall = tagWalls[i % tagWalls.length]
    cards.push({
      type: 'tag',
      text: content.tags[i],
      ...placeOnWall(wall),
      width: 80 + content.tags[i].length * 9,
      height: 30,
      rotation: randRange(rng, -6, 6),
      importance: 0.2,
    })
  }

  // Stats card — on the floor
  if (content.stats.words > 0) {
    const statsText = `${content.stats.words}w · ${content.stats.images}img · ${content.stats.links}links`
    cards.push({
      type: 'stats',
      text: statsText,
      ...placeOnWall('floor'),
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
