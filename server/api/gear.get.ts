/**
 * @file gear.get.ts
 * @description GET /api/gear. Every gear item, sorted by name.
 *   Returns { items: GearItem[], count, lastUpdated } (lastUpdated is request time).
 *   Reads data/gear.csv via loadGearItems() in server/utils/gear-data.ts. No cache;
 *   throws 500 if the CSV is missing.
 */
export default defineEventHandler(async () => {
  const items = await loadGearItems()
  return { items, count: items.length, lastUpdated: new Date().toISOString() }
})
