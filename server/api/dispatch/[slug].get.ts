/**
 * @file dispatch/[slug].get.ts
 * @description One Dispatch piece with its markdown body rendered to HTML.
 * Unlisted pieces are served (the page marks them noindex); draft, hidden,
 * password-protected and scheduled pieces 404 in production. Dev previews all.
 * @endpoint GET /api/dispatch/{slug}
 * @params slug: string - lowercase-hyphenated file name without .md
 */
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { getDispatch, isValidDispatchSlug } from '~/server/utils/dispatch'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!isValidDispatchSlug(slug)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid slug' })
  }

  const piece = await getDispatch(slug, { preview: import.meta.dev })
  if (!piece) {
    throw createError({ statusCode: 404, statusMessage: 'Dispatch not found' })
  }
  return piece
})
