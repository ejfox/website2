// Shared plumbing for the hand-drawn kit, used by <HandDrawn>, <HandDrawnAnnotation>,
// and the content-enhancement plugin. The 500KB of traced geometry lives once in
// /public/hand-drawn/sprite.svg as <g id="hd-ink">; every mark is a viewBox crop
// that <use>s it and inherits currentColor.
import manifest from '~/assets/hand-drawn/manifest.json'

export interface HandDrawnAsset {
  name: string
  group: string
  sub: string
  desc: string
  x: number
  y: number
  w: number
  h: number
}

export const handDrawnAssets = manifest as HandDrawnAsset[]
const byName = new Map(handDrawnAssets.map((a) => [a.name, a]))

export function findHandDrawnAsset(name: string): HandDrawnAsset | undefined {
  return byName.get(name)
}

export function handDrawnViewBox(a: HandDrawnAsset): string {
  return `${a.x} ${a.y} ${a.w} ${a.h}`
}

let spriteState: 'idle' | 'loading' | 'ready' = 'idle'

/** Inject the shared geometry into the document once (client only, idempotent). */
export function ensureHandDrawnSprite(): void {
  if (typeof document === 'undefined') return
  if (spriteState !== 'idle' || document.getElementById('hd-sprite-root')) {
    spriteState = 'ready'
    return
  }
  spriteState = 'loading'
  fetch('/hand-drawn/sprite.svg')
    .then((r) => r.text())
    .then((svg) => {
      if (document.getElementById('hd-sprite-root')) return
      const holder = document.createElement('div')
      holder.id = 'hd-sprite-root'
      holder.setAttribute('aria-hidden', 'true')
      holder.style.cssText =
        'position:absolute;width:0;height:0;overflow:hidden'
      holder.innerHTML = svg
      document.body.appendChild(holder)
      spriteState = 'ready'
    })
    .catch(() => {
      spriteState = 'idle'
    })
}

const SVG_NS = 'http://www.w3.org/2000/svg'

/**
 * Build a standalone inline <svg> for a named asset (for the DOM-enhancement
 * plugin, where there's no Vue component to mount). Height drives size; width
 * follows the aspect ratio. Inherits currentColor.
 */
export function createHandDrawnEl(
  name: string,
  opts: { size?: string; className?: string; title?: string } = {}
): SVGSVGElement | null {
  const a = findHandDrawnAsset(name)
  if (!a) return null
  ensureHandDrawnSprite()
  const size = opts.size ?? '1.1em'
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('viewBox', handDrawnViewBox(a))
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
  svg.setAttribute(
    'class',
    `hand-drawn${opts.className ? ' ' + opts.className : ''}`
  )
  svg.style.height = size
  svg.style.width = `calc(${size} * ${a.w / a.h})`
  svg.style.display = 'inline-block'
  svg.style.verticalAlign = '-0.18em'
  svg.style.overflow = 'hidden'
  svg.style.clipPath = 'inset(0)' // Safari: clip out-of-viewBox <use> content
  svg.style.color = 'inherit'
  if (opts.title) {
    svg.setAttribute('role', 'img')
    svg.setAttribute('aria-label', opts.title)
  } else {
    svg.setAttribute('aria-hidden', 'true')
  }
  const use = document.createElementNS(SVG_NS, 'use')
  use.setAttribute('href', '#hd-ink')
  svg.appendChild(use)
  return svg
}
