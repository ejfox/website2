/**
 * @file dispatch.get.ts
 * @description GET /api/dispatch. Dispatch pieces (content/dispatch/*.md),
 *   newest first, metadata only (no body HTML). Logic in server/utils/dispatch.ts.
 *   Production lists public pieces only; dev (import.meta.dev) also lists
 *   drafts/unlisted/scheduled, each flagged, for local preview.
 *   Throws 500 if the directory can't be read.
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
