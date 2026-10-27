/**
 * @file d3.d.ts
 * @description Minimal local module declarations for d3-format (used by
 *   utils/numberFormat.ts and components/ui/AnimatedNumber.vue) and
 *   d3-time-format (no importer found). Call shapes only.
 */
declare module 'd3-format' {
  export function format(specifier: string): (n: number) => string
}

declare module 'd3-time-format' {
  export function timeFormat(specifier: string): (date: Date) => string
}
