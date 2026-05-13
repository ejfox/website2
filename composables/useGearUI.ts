// Shared UI constants and helpers for gear components.
// Auto-imported by Nuxt — no explicit import needed in components.

export const TYPE_SYMBOLS: Record<string, string> = {
  Tech: '▲', Utility: '⬟', Comfort: '○', Sleep: '☽',
  Bag: '▣', Safety: '◆', Creativity: '✧',
}

export const PRIORITY_PIPS: Record<string, string> = {
  High: '●●●', Medium: '●●○', Low: '●○○',
}

export const slugifyGear = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export function useGearUI() {
  return { TYPE_SYMBOLS, PRIORITY_PIPS, slugifyGear }
}
