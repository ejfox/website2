export default defineEventHandler(async () => {
  const items = await loadGearItems()
  return { items, count: items.length, lastUpdated: new Date().toISOString() }
})
