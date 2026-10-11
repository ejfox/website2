/**
 * @file x.get.ts
 * @description Latest original posts from x.com/mrejfox (no replies, no reposts).
 * Dormant until X_BEARER_TOKEN is set in the VPS .env. Without it, this returns
 * an empty list and /now hides the X rows. X bills per read, so the cache is
 * long: about one timeline read an hour, however much traffic /now gets.
 * @endpoint GET /api/x
 * @returns { account, posts: [{ id, text, url, at }] }
 */
import { serverEnv } from '~/server/utils/serverEnv'

const HANDLE = 'mrejfox'
const API = 'https://api.x.com/2'

interface Tweet {
  id: string
  text: string
  created_at: string
  entities?: {
    urls?: Array<{ url: string; display_url?: string; expanded_url?: string }>
  }
}

export default defineCachedEventHandler(
  async () => {
    const account = `https://x.com/${HANDLE}`
    const token = serverEnv('X_BEARER_TOKEN')
    if (!token) return { account, posts: [] }

    const headers = { Authorization: `Bearer ${token}` }
    try {
      const user = await $fetch<{ data: { id: string } }>(
        `${API}/users/by/username/${HANDLE}`,
        { headers, timeout: 8000 }
      )
      const timeline = await $fetch<{ data?: Tweet[] }>(
        `${API}/users/${user.data.id}/tweets`,
        {
          headers,
          timeout: 8000,
          query: {
            max_results: 5,
            exclude: 'replies,retweets',
            'tweet.fields': 'created_at,entities',
          },
        }
      )

      return {
        account,
        posts: (timeline.data || []).map((t) => {
          // Swap t.co wrappers for the readable link; drop the trailing
          // self-link X appends for attached media.
          let text = t.text
          for (const u of t.entities?.urls || []) {
            text = text.replace(
              u.url,
              u.expanded_url?.includes(`/${HANDLE}/status/`)
                ? ''
                : u.display_url || u.url
            )
          }
          return {
            id: t.id,
            text: text.trim(),
            url: `${account}/status/${t.id}`,
            at: t.created_at,
          }
        }),
      }
    } catch (err) {
      console.error('X timeline fetch failed:', (err as Error).message)
      return { account, posts: [] }
    }
  },
  { maxAge: 3600, swr: true, name: 'x-posts' }
)
