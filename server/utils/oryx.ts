/**
 * @file oryx.ts
 * @description Fetches a ZSA Oryx layout over its public GraphQL API and
 * normalizes every key to display glyphs for /keymap.
 *
 * Privacy: macros can type arbitrary text, so their key sequences are NEVER
 * emitted. A macro shows its Oryx customLabel (which EJ writes as a label) or
 * the word "macro". Only the layout itself is public on Oryx.
 *
 * Importers: server/api/keymap.get.ts (fetchOryxLayout); pages/keymap.vue and
 * components/keymap/KeymapBoard.vue import TYPES only. Keep it free of
 * server-only imports so those type imports stay harmless.
 * Tests: server/utils/__tests__/oryx.test.ts.
 */

// ── Output + Oryx shapes ────────────────────────────────────────────────────

export interface KeymapKey {
  t?: string // tap
  h?: string // hold
  d?: string // double-tap
  L?: { op: string; to: number } // layer switch
  x?: true // blocked: does nothing on this layer
}

export interface KeymapLayer {
  name: string
  color: string | null
  keys: (KeymapKey | null)[] // null = transparent, falls through to base
}

export interface Keymap {
  title: string
  geometry: string
  revision: string
  updated: string
  url: string
  layers: KeymapLayer[]
}

interface OryxAction {
  code?: string | null
  layer?: number | null
  macro?: unknown
  modifiers?: Record<string, boolean> | null
}

export interface OryxKey {
  tap?: OryxAction | null
  hold?: OryxAction | null
  doubleTap?: OryxAction | null
  customLabel?: string | null
}

// ── Glyph tables ────────────────────────────────────────────────────────────

// QMK keycode (KC_ prefix stripped) → what the board shows.
const GLYPHS: Record<string, string> = {
  LEFT: '←',
  RIGHT: '→',
  UP: '↑',
  DOWN: '↓',
  BSPC: '⌫',
  DELETE: '⌦',
  ENTER: '⏎',
  KP_ENTER: '⏎',
  SPACE: '␣',
  TAB: '⇥',
  ESCAPE: 'esc',
  LEFT_SHIFT: '⇧',
  RIGHT_SHIFT: '⇧',
  LEFT_GUI: '⌘',
  RIGHT_GUI: '⌘',
  LEFT_ALT: '⌥',
  RIGHT_ALT: '⌥',
  LEFT_CTRL: '⌃',
  RIGHT_CTRL: '⌃',
  MINUS: '-',
  EQUAL: '=',
  LBRC: '[',
  RBRC: ']',
  BSLS: '\\',
  GRAVE: '`',
  SCLN: ';',
  QUOTE: "'",
  COMMA: ',',
  DOT: '.',
  SLASH: '/',
  EXLM: '!',
  AT: '@',
  HASH: '#',
  DLR: '$',
  PERC: '%',
  CIRC: '^',
  AMPR: '&',
  ASTR: '*',
  LPRN: '(',
  RPRN: ')',
  UNDS: '_',
  PLUS: '+',
  LCBR: '{',
  RCBR: '}',
  PIPE: '|',
  COLN: ':',
  DQUO: '"',
  LABK: '<',
  RABK: '>',
  QUES: '?',
  TILD: '~',
  KP_PLUS: '+',
  KP_MINUS: '−',
  KP_SLASH: '/',
  KP_ASTERISK: '*',
  KP_DOT: '.',
  KP_EQUAL: '=',
  MAC_COPY: '⌘C',
  MAC_PASTE: '⌘V',
  MAC_CUT: '⌘X',
  MAC_UNDO: '⌘Z',
  AUDIO_VOL_UP: 'vol+',
  AUDIO_VOL_DOWN: 'vol−',
  AUDIO_MUTE: 'mute',
  MEDIA_PLAY_PAUSE: '⏯',
  PAUSE: '⏯',
  PAGE_UP: 'pg↑',
  PGDN: 'pg↓',
  HOME: '⇱',
  END: '⇲',
  SYSTEM_SLEEP: 'sleep',
  TOGGLE_LAYER_COLOR: 'led',
  MS_UP: 'm↑',
  MS_DOWN: 'm↓',
  MS_LEFT: 'm←',
  MS_RIGHT: 'm→',
  MS_BTN1: 'clk',
  MS_BTN2: 'rclk',
  MS_WH_UP: 'wh↑',
  MS_WH_DOWN: 'wh↓',
  CW_TOGG: 'caps',
  CAPS_WORD: 'caps',
  QK_LLCK: 'lock',
  QK_BOOT: 'boot',
  RESET: 'boot',
}

// One symbol per modifier, in the order macOS menus print them
const MODS: [string[], string][] = [
  [['leftCtrl', 'rightCtrl'], '⌃'],
  [['leftAlt', 'rightAlt'], '⌥'],
  [['leftShift', 'rightShift'], '⇧'],
  [['leftGui', 'rightGui'], '⌘'],
]

// Layer-switch codes: these get no glyph, the switch is reported in `L`.
const LAYER_OPS = new Set(['MO', 'TT', 'TG', 'TO', 'LT', 'OSL', 'DF', ''])

// ── Normalising ─────────────────────────────────────────────────────────────

function code(a?: OryxAction | null) {
  return (a?.code || '').replace(/^KC_/, '')
}

// Oryx sends an empty macro object ({ keys: [] }) on plain keys
function isMacro(a?: OryxAction | null) {
  const keys = (a?.macro as { keys?: unknown[] } | null | undefined)?.keys
  return Array.isArray(keys) && keys.length > 0
}

function isAction(a?: OryxAction | null) {
  return !!a && (!!a.code || typeof a.layer === 'number' || isMacro(a))
}

export function glyph(a?: OryxAction | null): string | undefined {
  if (!a) return
  if (isMacro(a)) return 'macro'
  const c = code(a)
  if (typeof a.layer === 'number' && LAYER_OPS.has(c)) return
  let g: string
  if (c.startsWith('RGB')) g = 'rgb'
  else if (GLYPHS[c]) g = GLYPHS[c]
  else if (c.startsWith('KP_')) g = c.slice(3)
  else if (/^F\d+$/.test(c) || c.length <= 1) g = c
  else g = c.toLowerCase()
  const mods = MODS.filter(([keys]) => keys.some((k) => a.modifiers?.[k]))
    .map(([, s]) => s)
    .join('')
  return mods + g || undefined
}

function layerRef(a?: OryxAction | null) {
  if (a && typeof a.layer === 'number')
    return { op: code(a) || 'MO', to: a.layer }
}

export function normalizeKey(k: OryxKey | null): KeymapKey | null {
  if (!k) return null
  // A key with nothing assigned compiles to KC_TRANSPARENT, not KC_NO
  if (!isAction(k.tap) && !isAction(k.hold) && !isAction(k.doubleTap))
    return null
  const tap = code(k.tap)
  if (tap === 'TRANSPARENT' && !isMacro(k.tap)) return null
  if (tap === 'NO') return { x: true }
  const out: KeymapKey = {}
  const t = k.customLabel || glyph(k.tap)
  const h = glyph(k.hold)
  const d = glyph(k.doubleTap)
  const L = layerRef(k.tap) || layerRef(k.hold)
  if (t) out.t = t
  if (h) out.h = h
  if (d) out.d = d
  if (L) out.L = L
  return Object.keys(out).length ? out : { x: true }
}

// ── Fetch ───────────────────────────────────────────────────────────────────

const QUERY = `query($hashId:String!,$geometry:String!){
  layout(hashId:$hashId,geometry:$geometry,revisionId:"latest"){
    title hashId geometry
    revision{ hashId createdAt layers{ title position color keys } }
  }
}`

export async function fetchOryxLayout(
  hashId: string,
  geometry: string
): Promise<Keymap> {
  const res = await $fetch<{
    data?: {
      layout?: {
        title: string
        hashId: string
        geometry: string
        revision: {
          hashId: string
          createdAt: string
          layers: {
            title: string
            position: number
            color: string | null
            keys: (OryxKey | null)[]
          }[]
        }
      }
    }
  }>('https://oryx.zsa.io/graphql', {
    method: 'POST',
    body: { query: QUERY, variables: { hashId, geometry } },
    timeout: 8000,
  })
  const layout = res.data?.layout
  if (!layout) throw new Error(`Oryx returned no layout for ${hashId}`)
  const { revision } = layout
  return {
    title: layout.title,
    geometry: layout.geometry,
    revision: revision.hashId,
    // createdAt is space-separated with a trailing " UTC", not ISO; rewrite
    // it so Date parses it as UTC everywhere.
    updated: new Date(
      revision.createdAt.replace(' UTC', 'Z').replace(' ', 'T')
    ).toISOString(),
    url: `https://configure.zsa.io/${geometry}/layouts/${hashId}/${revision.hashId}/0`,
    layers: [...revision.layers]
      .sort((a, b) => a.position - b.position)
      .map((l) => ({
        name: l.title,
        color: l.color,
        keys: l.keys.map(normalizeKey),
      })),
  }
}
