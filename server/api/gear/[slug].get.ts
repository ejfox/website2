export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Slug is required' })

  const items = await loadGearItems()
  const item = items.find((g) => g.slug === slug)
  if (!item) throw createError({ statusCode: 404, statusMessage: 'Gear item not found' })

  return item
})
