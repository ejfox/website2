import { defineNuxtConfig } from 'nuxt'

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  modules: ['@nuxt/content', '@unocss/nuxt'],
  unocss: {
    // presets
    uno: true, // enabled `@unocss/preset-uno`
    icons: true, // enabled `@unocss/preset-icons`
    attributify: true, // enabled `@unocss/preset-attributify`,

    // core options
    shortcuts: [],
    rules: [
      ['dn', { display: 'none' }],
      ['measure', { 'max-width': '30em' }],
      ['measure-wide', { 'max-width': '34em' }],
      ['measure-narrow', { 'max-width': '20em' }],
      ['lh-solid', { 'line-height': 1 }],
      ['lh-title', { 'line-height': 1.25 }],
      ['lh-copy', { 'line-height': 1.5 }],
      ['list', { 'list-style-type': 'none' }],
//       .f1 { font-size: 3rem; }
// .f2 { font-size: 2.25rem; }
// .f3 { font-size: 1.5rem; }
// .f4 { font-size: 1.25rem; }
// .f5 { font-size: 1rem; }
// .f6 { font-size: .875rem; }
// .f7 { font-size: .75rem; } /* Small and hard to read for many people so use with extreme caution */
      ['f1', { 'font-size': '3rem' }],
      ['f2', { 'font-size': '2.25rem' }],
      ['f3', { 'font-size': '1.5rem' }],
      ['f4', { 'font-size': '1.25rem' }],
      ['f5', { 'font-size': '1rem' }],
      ['f6', { 'font-size': '.875rem' }],
      ['f7', { 'font-size': '.75rem' }],
      ['f8', { 'font-size': '.625rem' }],
      ['f9', { 'font-size': '.5rem' }],
    ],
  },
})
