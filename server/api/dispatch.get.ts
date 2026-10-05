/**
 * @file dispatch.get.ts
 * @description Lists Dispatch pieces (content/dispatch/*.md), newest first.
 * Public pieces only in production; dev also lists drafts/unlisted/scheduled
 * (each flagged) so they can be previewed locally.
 * @endpoint GET /api/dispatch
 * @returns Array of piece metadata (no body HTML)
 */
import { defineEventHandler, createError } from 'h3'
import { listDispatches } from '~/server/utils/dispatch'

export default defineEventHandler(async () => {
  try {
    return await listDispatches({ preview: import.meta.dev })
  } catch (error) {
    console.error('Error reading dispatch pieces:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load dispatch',
    })
  }
})
