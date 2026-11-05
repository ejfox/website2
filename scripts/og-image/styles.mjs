/**
 * @file styles.mjs
 * @description The four house styles the OG generator renders, in slot
 *   order. index.mjs writes STYLES[i] to variant-i.png, so the Dispatch
 *   picker always shows the same style in the same slot and a reroll only
 *   changes the seed. Each style exports `{ name, render(content, seed) }`
 *   and returns a 1200×630 PNG buffer.
 */

import * as dither from './style-dither.mjs'
import * as academic from './style-academic.mjs'
import * as vulpes from './style-vulpes.mjs'
import * as broadcast from './style-broadcast.mjs'

export const WIDTH = 1200
export const HEIGHT = 630

export const STYLES = [dither, academic, vulpes, broadcast]
