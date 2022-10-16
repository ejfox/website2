import { defineNuxtConfig } from 'nuxt'

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  modules: ['@nuxt/content'],
  css: ["tachyons/css/tachyons.min.css"],
  content: {
    documentDriven: true,
    highlight: {
      preload: ['sql'],
      theme: {
        // Default theme (same as single string)
        default: 'github-light',
        // Theme used if `html.dark`
        dark: 'github-dark',
        // Theme used if `html.light`
        light: 'github-light',
      }
    },
    watch: {
      ws: {
        port: 4000
      }
    }
  },
    // unocss: {
    //   // presets
    //   uno: true, // enabled `@unocss/preset-uno`
    //   icons: true, // enabled `@unocss/preset-icons`
    //   attributify: true, // enabled `@unocss/preset-attributify`,
    //   typography: true,

    //   // core options
    //   shortcuts: [],
    //   // rules: [
    //   //   ['dn', { display: 'none' }],
    //   //   ['measure', { 'max-width': '30em' }],
    //   //   ['measure-wide', { 'max-width': '34em' }],
    //   //   ['measure-narrow', { 'max-width': '20em' }],
    //   //   ['lh-solid', { 'line-height': 1 }],
    //   //   ['lh-title', { 'line-height': 1.25 }],
    //   //   ['lh-copy', { 'line-height': 1.5 }],
    //   //   ['list', { 'list-style-type': 'none' }],
    //   //   ['f1', { 'font-size': '3rem' }],
    //   //   ['f2', { 'font-size': '2.25rem' }],
    //   //   ['f3', { 'font-size': '1.5rem' }],
    //   //   ['f4', { 'font-size': '1.25rem' }],
    //   //   ['f5', { 'font-size': '1rem' }],
    //   //   ['f6', { 'font-size': '.875rem' }],
    //   //   ['f7', { 'font-size': '.75rem' }],
    //   //   ['f8', { 'font-size': '.625rem' }],
    //   //   ['f9', { 'font-size': '.5rem' }],
    //   //   ['link', { color: 'inherit', 'text-decoration': 'none' }],
    //   // ],
    // },
    googleFonts: {
      // prefetch: true,
      families: {
        'Signika Negative': [300, 400, 500, 600, 700],
        'Paytone One': [400],
        'Fjalla One': [400],
        // Finlandica: [400, 500, 700],
      },
    },
    vite: {
      server: {
        watch: {
          usePolling: true
        }
      }
    }
  })
