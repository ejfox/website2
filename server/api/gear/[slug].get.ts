/**
 * @file gear/[slug].get.ts
 * @description GET /api/gear/:slug. One gear item by slug (slugifyGear of Name,
 *   the same function pages link with). Reads data/gear.csv via loadGearItems().
 *   Throws 400 without a slug, 404 if no item matches.
 */
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug)
    throw createError({ statusCode: 400, statusMessage: 'Slug is required' })

  const items = await loadGearItems()
  const item = items.find((g) => g.slug === slug)
  if (!item)
    throw createError({ statusCode: 404, statusMessage: 'Gear item not found' })

  return item
})
