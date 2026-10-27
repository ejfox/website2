/**
 * @file no-cache-errors.ts
 * @description Nitro plugin: never let an edge cache keep an error page.
 *   Hooks every response (rendered pages AND server/API routes).
 *
 * routeRules stamp s-maxage on whole path patterns (/blog/** etc.), and those
 * headers ride along on a 404 too. With Cloudflare honouring origin headers,
 * a scheduled post's pre-publishAt 404 would then stay cached past the moment
 * it goes live. Any status >= 400 leaves as no-store, whatever the route says.
 */
import { getResponseStatus, removeResponseHeader, setResponseHeader } from 'h3'

export default defineNitroPlugin((nitroApp) => {
  // Pages (including Nuxt's error page) render through here.
  nitroApp.hooks.hook('render:response', (response) => {
    if ((response.statusCode ?? 200) >= 400) {
      response.headers = {
        ...response.headers,
        'cache-control': 'no-store',
      }
      // CDN-Cache-Control would override no-store at Cloudflare; drop it too.
      delete response.headers['cdn-cache-control']
    }
  })
  // Everything else (API routes, server routes, Nitro's error handler).
  nitroApp.hooks.hook('beforeResponse', (event) => {
    if (getResponseStatus(event) >= 400) {
      setResponseHeader(event, 'Cache-Control', 'no-store')
      removeResponseHeader(event, 'CDN-Cache-Control')
    }
  })
})
