/**
 * @file decodeEntities.ts
 * @description Decode HTML entities in text scraped from other sites' <meta>
 * tags (used by /api/og link previews).
 */

// Named entities that actually turn up in titles/descriptions. Numeric
// entities (&#8217; &#x2019;) are handled generically below — WordPress
// emits curly quotes that way, which is how "Microsoft&#8217;s" got through.
const NAMED_ENTITIES: Record<string, string> = {
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  lsquo: '\u2018',
  rsquo: '\u2019',
  ldquo: '\u201C',
  rdquo: '\u201D',
  ndash: '\u2013',
  mdash: '\u2014',
  hellip: '\u2026',
  middot: '\u00B7',
  bull: '\u2022',
  copy: '\u00A9',
  reg: '\u00AE',
  trade: '\u2122',
}

/** Decode HTML entities in scraped text. &amp; goes last so "&amp;#8217;"
 * (double-encoded) decodes once, to "&#8217;", not all the way through. */
export function decodeEntities(str: string): string {
  return str
    .replace(/&#(\d+);/g, (m, dec) => safeFromCodePoint(Number(dec)) ?? m)
    .replace(
      /&#x([0-9a-f]+);/gi,
      (m, hex) => safeFromCodePoint(Number.parseInt(hex, 16)) ?? m
    )
    .replace(/&([a-z]+);/gi, (m, name) =>
      name.toLowerCase() === 'amp' ? m : (NAMED_ENTITIES[name] ?? m)
    )
    .replace(/&amp;/gi, '&')
}

function safeFromCodePoint(cp: number): string | null {
  return Number.isInteger(cp) && cp > 0 && cp <= 0x10ffff
    ? String.fromCodePoint(cp)
    : null
}
