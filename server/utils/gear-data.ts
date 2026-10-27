/**
 * @file gear-data.ts
 * @description Load data/gear.csv as typed rows with a URL slug, sorted by
 *   Name. Called (Nitro auto-import, no explicit import) by
 *   server/api/gear.get.ts and server/api/gear/[slug].get.ts.
 *   Rows without a Name are dropped. Column names are the CSV's own headers
 *   (Weight_oz, 'Parent Container' …); rename one there and fix GearItem here.
 */
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import * as d3 from 'd3'
// The page links with this same function; a second copy here kept the
// trailing '-' from names ending in ')' and those four items 404'd.
import { slugifyGear } from '../../utils/gearUI'

export interface GearItem {
  slug: string
  Name?: string
  Weight_oz?: string
  'Parent Container'?: string
  Type?: string
  Category?: string
  Subcategory?: string
  Priority?: string
  Waterproof?: string
  Worn?: string
  Qty?: string
  Consumable?: string
  Star?: string
  Notes?: string
  Tags?: string
  Condition?: string
  Amazon_URL?: string
  Last_Used?: string
  Purchase_Date?: string
  Purchase_Price?: string
  Photo_URL?: string
  Scan_3D_URL?: string
  Serial_Number?: string
  Model_Number?: string
  Brand?: string
  Location_Room?: string
  Location_Detail?: string
}

export async function loadGearItems(): Promise<GearItem[]> {
  const csvPath = resolve(process.cwd(), 'data/gear.csv')
  const csvText = await readFile(csvPath, 'utf-8')
  return (d3.csvParse(csvText) as Omit<GearItem, 'slug'>[])
    .filter((item) => item.Name?.trim())
    .map((item) => ({ ...item, slug: slugifyGear(item.Name!) }))
    .sort((a, b) => (a.Name || '').localeCompare(b.Name || ''))
}
