declare module 'd3-format' {
  export function format(specifier: string): (n: number) => string
}

declare module 'd3-time-format' {
  export function timeFormat(specifier: string): (date: Date) => string
}
