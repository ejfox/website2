/**
 * @file atlas.get.ts
 * @description GET /api/atlas. Base overlays for the Valley Atlas (/atlas):
 *   { places, repeaters, rides }, each a GeoJSON FeatureCollection.
 *   places = data/atlas/places.geojson (OSM); repeaters = data/atlas/repeaters.csv;
 *   rides = every non-draft content/processed/rides/*.json as a LineString.
 *   Sets Cache-Control 1h itself. Never throws: a missing file is an empty layer.
 *
 * Rides come from the same processed JSON /rides serves, so they carry the
 * same salted privacy trim, and drafts are never included.
 */
import { defineEventHandler } from 'h3'
import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = (...p: string[]) => resolve(process.cwd(), ...p)

const readJson = async (path: string) => {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch {
    return null
  }
}

// Minimal CSV parsing: quoted fields (with commas and "" escapes), and
// either \n or \r\n line endings
// No CSV dependency on purpose: the repeater list is small and simple.
const parseCsv = (text: string) => {
  const rows: string[][] = []
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue
    const cells: string[] = []
    let cur = ''
    let quoted = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"' && quoted && line[i + 1] === '"') {
        cur += '"'
        i++
      } else if (ch === '"') quoted = !quoted
      else if (ch === ',' && !quoted) {
        cells.push(cur)
        cur = ''
      } else cur += ch
    }
    cells.push(cur)
    rows.push(cells)
  }
  const [header = [], ...body] = rows
  return body.map((r) =>
    Object.fromEntries(header.map((h, i) => [h.trim(), r[i] ?? '']))
  )
}

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'public, max-age=3600')

  const places = await readJson(root('data/atlas/places.geojson'))

  let repeaters: unknown[] = []
  try {
    const csv = parseCsv(
      await readFile(root('data/atlas/repeaters.csv'), 'utf8')
    )
    repeaters = csv
      .filter((r) => r.Lat && r.Lon)
      .map((r) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [+r.Lon, +r.Lat] },
        properties: {
          name: r.Name,
          freq: r.Frequency,
          duplex: r.Duplex,
          offset: r.Offset,
          tone: r.Tone,
          mode: r.Mode,
          notes: r.Notes,
          source: r.Source,
        },
      }))
  } catch {
    // No repeaters file yet: the layer just stays empty
  }

  const rides: unknown[] = []
  const dir = root('content/processed/rides')
  for (const file of await readdir(dir).catch(() => [] as string[])) {
    if (
      !file.endsWith('.json') ||
      file === 'index.json' ||
      file === 'atlas.json'
    )
      continue
    const ride = await readJson(resolve(dir, file))
    if (!ride || ride.draft || !Array.isArray(ride.points)) continue
    rides.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: ride.points
          // Every other point: halves the payload, invisible at atlas zoom.
          .filter((_: unknown, i: number) => i % 2 === 0)
          .map((p: number[]) => [p[0], p[1]]),
      },
      properties: { slug: ride.slug, title: ride.title, date: ride.date },
    })
  }

  return {
    places: places ?? { type: 'FeatureCollection', features: [] },
    repeaters: { type: 'FeatureCollection', features: repeaters },
    rides: { type: 'FeatureCollection', features: rides },
  }
})
