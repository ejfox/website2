/**
 * @file mastodon.get.ts
 * @description GET /api/mastodon. Latest public, top-level posts from
 *   mastodon.social/@ejfox (no replies, no boosts, no content-warned posts):
 *   { account, posts: [{ id, text, url, at, image }] }. Mastodon's public API
 *   needs no key. Used by now.get.ts. Cached 15 min with swr. Throws if
 *   Mastodon is down (8s timeout).
 */
import { decodeEntities } from '~/server/utils/decodeEntities'
import { stripHtml } from '~/server/utils/text-processing'

const INSTANCE = 'https://mastodon.social'
const ACCOUNT_ID = '794007' // @ejfox, from /api/v1/accounts/lookup?acct=ejfox

interface MastodonStatus {
  id: string
  created_at: string
  url: string
  content: string
  spoiler_text: string
  visibility: string
  media_attachments: Array<{ type: string; preview_url: string | null }>
}

export default defineCachedEventHandler(
  async () => {
    const statuses = await $fetch<MastodonStatus[]>(
      `${INSTANCE}/api/v1/accounts/${ACCOUNT_ID}/statuses`,
      {
        query: { limit: 10, exclude_replies: true, exclude_reblogs: true },
        timeout: 8000,
      }
    )

    return {
      account: `${INSTANCE}/@ejfox`,
      posts: statuses
        // Unlisted/private posts weren't meant for a front page
        .filter((s) => s.visibility === 'public' && !s.spoiler_text)
        .map((s) => ({
          id: s.id,
          text: decodeEntities(stripHtml(s.content)),
          url: s.url,
          at: s.created_at,
          image:
            s.media_attachments.find((m) => m.type === 'image')?.preview_url ||
            null,
        })),
    }
  },
  { maxAge: 900, swr: true, name: 'mastodon-posts' }
)
