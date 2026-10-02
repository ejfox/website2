#!/usr/bin/env node
// Builds data/atlas/records.json for the Valley Atlas records layer:
// public institutions and sites from the FOIL docket on archive.ejfox.com.
//
//   node scripts/build/atlas-records.mjs            geocode new sites, write, check
//   node scripts/build/atlas-records.mjs --refresh  re-geocode every site
//   node scripts/build/atlas-records.mjs --check    validate the existing file only
//
// Pin agencies and public facilities only, never a person: a request about an
// officer is pinned at the department. Coordinates already in the output are
// reused, so Nominatim is only hit for new entries (1 req/s, per its policy).
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const OUT = resolve(process.cwd(), 'data/atlas/records.json')
const WIKI = 'https://archive.ejfox.com/wiki/'
const UA = 'ejfox-valley-atlas/0.1 (https://ejfox.com)'
const BOUNDS = { west: -75.6, east: -72.6, south: 40.7, north: 42.9 }

const wikiUrl = (title) => WIKI + encodeURIComponent(title.replaceAll(' ', '_'))

const SITES = [
  {
    name: 'Orange County Correctional Facility',
    kind: 'detention',
    precision: 'address',
    q: '110 Wells Farm Road, Goshen, NY',
    page: 'Orange County Correctional Facility',
    summary:
      "The Orange County jail in Goshen, run by the Sheriff's Office, has held ICE detainees under an intergovernmental service agreement since 2008",
    foil: [
      'FOIL: DHS + Orange County Jail',
      'FOIL: DHS + Orange County Jail (Department of Homeland Security)',
      'FOIL: Meta OCNY ICE FOIL re: Redactions',
    ],
  },
  {
    name: '29 Elizabeth Drive (Chester ICE Facility)',
    kind: 'site',
    precision: 'address',
    q: '29 Elizabeth Drive, Chester, NY',
    page: 'Chester ICE Facility',
    summary:
      'A vacant former Pep Boys warehouse that DHS proposed converting into an ICE processing facility in January 2026, then dropped on February 20',
    foil: [
      'FOIL: Chester Warehouse Records',
      'FOIL: Chester Warehouse Records (District Attorney)',
    ],
  },
  {
    name: 'New Windsor ICE Office',
    kind: 'agency',
    precision: 'address',
    q: '843 Union Avenue, New Windsor, NY',
    page: 'New Windsor ICE Office',
    summary:
      'Office space at 843 Union Avenue near Stewart International Airport that the General Services Administration leases for ICE',
    foil: ['FOIL: Chester Warehouse Records'],
  },
  {
    name: 'Orange County Government Center',
    kind: 'agency',
    precision: 'facility',
    q: 'Orange County Government Center, Goshen, NY',
    page: 'FOIL: Chester Warehouse Records',
    summary:
      'Orange County released 172 pages of records showing how it prepared to resist the proposed Chester ICE facility',
    foil: ['FOIL: Chester Warehouse Records', 'FOIL: ICE Meta-FOIL'],
  },
  {
    name: 'Orange County District Attorney',
    kind: 'agency',
    precision: 'address',
    q: '40 Matthews Street, Goshen, NY',
    page: 'FOIL: Chester Warehouse Records (District Attorney)',
    summary:
      'A request for county communications mentioning the Chester warehouse, filed with the District Attorney in March 2026, awaits a response',
    foil: ['FOIL: Chester Warehouse Records (District Attorney)'],
  },
  {
    name: 'Hudson Valley Crime Analysis Center',
    kind: 'police',
    precision: 'facility',
    q: '22 Wells Farm Road, Goshen, NY',
    page: 'FOIL: NY Crime Analysis Centers',
    summary:
      'One of the eleven state-supported crime analysis centers, housed at Orange County Emergency Services and covering six Hudson Valley counties',
    foil: ['FOIL: NY Crime Analysis Centers'],
  },
  {
    name: 'Dragon Springs',
    kind: 'site',
    precision: 'address',
    q: '140 Galley Hill Road, Cuddebackville, NY',
    page: 'Dragon Springs construction and regulatory timeline',
    summary:
      'A 423-acre property in Cuddebackville operated as a place of worship with temple buildings and two religious schools',
    foil: [
      'FOIL: Dragon Springs Buddhist Inc. — Building Permits, Violations & Fines 2016–2025',
      'FOIL: Dragon Springs inspections (Town of Deerpark)',
      'FOIL: NYSDEC + Dragon Springs Wetlands',
    ],
  },
  {
    name: 'Deerpark Town Hall',
    kind: 'agency',
    precision: 'facility',
    q: 'Deerpark Town Hall, Huguenot, NY',
    page: 'Town Of Deerpark',
    summary:
      'The Town of Deerpark released 1,906 pages of building permit, violation and fine records on the Dragon Springs property',
    foil: [
      'FOIL: Dragon Springs Buddhist Inc. — Building Permits, Violations & Fines 2016–2025',
      'FOIL: Dragon Springs inspections (Town of Deerpark)',
    ],
  },
  {
    name: 'Kiryas Joel annexation',
    kind: 'site',
    precision: 'town',
    q: 'Village of Kiryas Joel, NY',
    page: 'Kiryas Joel annexation',
    summary:
      'Two 2015 petitions sought to annex about 507 and 165 acres of the Town of Monroe into the Village of Kiryas Joel',
    foil: [],
  },
  {
    name: 'NYSP Troop F',
    kind: 'police',
    precision: 'facility',
    q: '55 Crystal Run Road, Middletown, NY',
    page: 'FOIL: Troop F Officer-Involved Vehicle Crashes 2023–2025',
    summary:
      'Crash reports involving State Police Troop F vehicles since 2023 were requested in November 2025; the request awaits a fix',
    foil: ['FOIL: Troop F Officer-Involved Vehicle Crashes 2023–2025'],
  },
  {
    name: 'NYSP Troop K',
    kind: 'police',
    precision: 'facility',
    q: 'State Police, Salt Point, NY',
    page: 'FOIL: Troop K Officer-Involved Vehicle Crashes 2023–2025',
    summary:
      'Crash reports involving State Police Troop K vehicles since 2023 were requested in November 2025; the request awaits payment',
    foil: ['FOIL: Troop K Officer-Involved Vehicle Crashes 2023–2025'],
  },
  {
    name: 'East Fishkill Police Department',
    kind: 'police',
    precision: 'facility',
    q: 'East Fishkill Police, Hopewell Junction, NY',
    page: 'FOIL: Fatal Crash Involving East Fishkill Police Officer — December 2023',
    summary:
      'State Police records of a December 2023 fatal crash involving an East Fishkill officer have been requested twice and not released',
    foil: [
      'FOIL: Fatal Crash Involving East Fishkill Police Officer — December 2023',
    ],
  },
  {
    name: 'Kingston Police Department',
    kind: 'police',
    precision: 'facility',
    q: 'Kingston Police Department, 1 Garraghan Drive, Kingston, NY',
    page: 'Kingston Police Department',
    summary:
      'The municipal police department for the City of Kingston, which released correspondence on a request about one of its officers',
    foil: ['FOIL: Kingston PD: Anthony Simon'],
  },
  {
    name: 'Central Hudson Gas & Electric',
    kind: 'utility',
    precision: 'address',
    q: '284 South Avenue, Poughkeepsie, NY',
    page: 'FOIL: PSC Enforcement Actions',
    summary:
      "The state utility regulator answered requests on Central Hudson's enforcement record by pointing to 13 public docket numbers",
    foil: [
      'FOIL: PSC Enforcement Actions',
      'FOIL: Central Hudson Metadata',
      'FOIL: State Government Central Hudson Expenditures',
    ],
  },
  {
    name: 'New York State Police headquarters',
    kind: 'police',
    precision: 'facility',
    q: 'New York State Police, 1220 Washington Avenue, Albany, NY',
    page: 'FOIL: NYSP Drone Flights 2025',
    summary:
      'The State Police released a log of 9,376 drone flights flown in 2025 and rejected a request for its agreements with ICE',
    foil: [
      'FOIL: NYSP Drone Flights 2025',
      'FOIL: NYSP + ICE Coordination',
      'FOIL: NYSP + ICE (v2) — Visitor Logs',
      'FOIL: NYSP — Memoranda Agreements',
      'FOIL: NYSP Databases',
      'FOIL: NYSP Meta-FOIA',
    ],
  },
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const geocode = async (q) => {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.search = new URLSearchParams({ format: 'json', limit: '1', q })
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  const [hit] = await res.json()
  await sleep(1100)
  if (!hit) throw new Error(`No geocode for "${q}"`)
  return [+(+hit.lon).toFixed(5), +(+hit.lat).toFixed(5)]
}

const build = async (refresh) => {
  const cached = new Map()
  if (!refresh) {
    const prev = JSON.parse(await readFile(OUT, 'utf8').catch(() => '{}'))
    for (const f of prev.features ?? [])
      cached.set(f.properties.name, f.geometry.coordinates)
  }
  const features = []
  for (const s of SITES) {
    const coordinates = cached.get(s.name) ?? (await geocode(s.q))
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates },
      properties: {
        name: s.name,
        kind: s.kind,
        summary: s.summary,
        wiki: wikiUrl(s.page),
        foil: s.foil,
        precision: s.precision,
      },
    })
  }
  await writeFile(
    OUT,
    JSON.stringify({ type: 'FeatureCollection', features }, null, 2) + '\n'
  )
  console.log(`wrote ${features.length} records → ${OUT}`)
}

const status = async (url) => {
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  return res.status
}

const check = async () => {
  const { features } = JSON.parse(await readFile(OUT, 'utf8'))
  const kinds = new Set(['detention', 'police', 'agency', 'utility', 'site'])
  const precisions = new Set(['address', 'facility', 'town'])
  let bad = 0
  const rows = []
  for (const f of features) {
    const p = f.properties
    const [lon, lat] = f.geometry.coordinates
    const problems = []
    if (
      lon < BOUNDS.west ||
      lon > BOUNDS.east ||
      lat < BOUNDS.south ||
      lat > BOUNDS.north
    )
      problems.push('out of bounds')
    if (!kinds.has(p.kind)) problems.push(`kind ${p.kind}`)
    if (!precisions.has(p.precision)) problems.push(`precision ${p.precision}`)
    if (!p.summary || p.summary.endsWith('.')) problems.push('summary')
    const wiki = await status(p.wiki)
    if (wiki !== 200) problems.push(`wiki ${wiki}`)
    for (const t of p.foil) {
      const s = await status(wikiUrl(t))
      if (s !== 200) problems.push(`${t} ${s}`)
    }
    if (problems.length) bad++
    rows.push({
      name: p.name,
      kind: p.kind,
      precision: p.precision,
      lon,
      lat,
      wiki,
      foil: p.foil.length,
      ok: problems.join('; ') || 'ok',
    })
  }
  console.table(rows)
  if (bad) {
    console.error(`${bad} record(s) failed validation`)
    process.exit(1)
  }
}

const args = process.argv.slice(2)
if (!args.includes('--check')) await build(args.includes('--refresh'))
await check()
