import { defineEventHandler, setHeader } from 'h3'
import { PUBLICATION_URI } from '~/utils/atprotoRkey.mjs'

// Standard.site publication verification: the bare AT-URI of the publication
// record scripts/author/mirror-to-atproto.mjs writes. Readers (Bluesky's rich
// cards among them) only trust the record when this domain points back at it.
// https://standard.site/docs/verification
export default defineEventHandler((event) => {
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=86400')
  setHeader(event, 'access-control-allow-origin', '*')
  return PUBLICATION_URI
})
