/**
 * @file gearUI.ts
 * @description Shared UI constants and helpers for gear components: type
 *   glyphs, priority pips, and slugifyGear (the gear URL slug).
 *   Auto-imported by Nuxt — components/gear/* call gearUI() or the bare
 *   exports. server/utils/gear-data.ts imports slugifyGear by path, so the
 *   page URLs and the API agree on slugs; change it and /gear/<slug> links move.
 */

export const TYPE_SYMBOLS: Record<string, string> = {
  Tech: '▲',
  Utility: '⬟',
  Comfort: '○',
  Sleep: '☽',
  Bag: '▣',
  Safety: '◆',
  Food: '⬢',
  Creativity: '✧',
}

export const PRIORITY_PIPS: Record<string, string> = {
  High: '●●●',
  Medium: '●●○',
  Low: '●○○',
}

export const slugifyGear = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export function gearUI() {
  return { TYPE_SYMBOLS, PRIORITY_PIPS, slugifyGear }
}
