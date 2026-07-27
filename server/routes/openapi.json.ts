/**
 * /openapi.json — OpenAPI 3.1 spec generated from utils/apiCatalog.ts.
 * Machine-readable twin of the /api-docs page. Kept in sync with the real routes
 * by server/api/__tests__/api-catalog.test.ts.
 */
import { apiCatalog } from '~/utils/apiCatalog'

export default defineEventHandler((event) => {
  setHeader(event, 'content-type', 'application/json; charset=utf-8')
  setHeader(event, 'x-robots-tag', 'noindex, nofollow')

  const paths: Record<string, Record<string, unknown>> = {}

  for (const route of apiCatalog) {
    // OpenAPI wants {param} style — apiCatalog already uses it.
    const path = route.path
    const params = [...path.matchAll(/\{([^}]+)\}/g)].map((m) => ({
      name: m[1],
      in: 'path',
      required: true,
      schema: { type: 'string' },
    }))

    paths[path] = paths[path] || {}
    paths[path][route.method.toLowerCase()] = {
      summary: route.summary,
      tags: [route.group],
      ...(params.length ? { parameters: params } : {}),
      // Non-standard but harmless annotations that mirror the docs page.
      'x-consumer': route.consumer,
      'x-consumed-by': route.consumedBy,
      'x-deps': route.deps,
      'x-health': route.health,
      ...(route.note ? { 'x-note': route.note } : {}),
      responses: {
        '200': { description: 'OK' },
      },
    }
  }

  return {
    openapi: '3.1.0',
    info: {
      title: 'ejfox.com API',
      version: '1.0.0',
      description:
        'Internal + public API for ejfox.com. Generated from utils/apiCatalog.ts. ' +
        'Most routes are read-only GETs consumed by the site itself; a few are ' +
        'external (iOS Shortcuts, uptime, Cal.com webhook, AI agent endpoints).',
    },
    servers: [{ url: 'https://ejfox.com' }],
    tags: [...new Set(apiCatalog.map((r) => r.group))].map((name) => ({
      name,
    })),
    paths,
  }
})
