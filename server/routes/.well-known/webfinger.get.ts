import { defineEventHandler, getQuery, setHeader, createError } from 'h3'

export default defineEventHandler((event) => {
  const { resource } = getQuery(event)

  if (!resource) {
    throw createError({ statusCode: 400, statusMessage: 'Missing resource parameter' })
  }

  const accepted = [
    'acct:ejfox@ejfox.com',
    'acct:ejfox@mastodon.social',
    'mailto:ejfox@ejfox.com',
    'https://ejfox.com',
  ]

  if (!accepted.includes(resource as string)) {
    throw createError({ statusCode: 404, statusMessage: 'Resource not found' })
  }

  setHeader(event, 'content-type', 'application/jrd+json')
  setHeader(event, 'cache-control', 'public, max-age=86400')
  setHeader(event, 'access-control-allow-origin', '*')

  return {
    subject: 'acct:ejfox@ejfox.com',
    aliases: [
      'https://mastodon.social/@ejfox',
      'https://mastodon.social/users/ejfox',
      'https://ejfox.com',
    ],
    links: [
      {
        rel: 'http://webfinger.net/rel/profile-page',
        type: 'text/html',
        href: 'https://mastodon.social/@ejfox',
      },
      {
        rel: 'self',
        type: 'application/activity+json',
        href: 'https://mastodon.social/users/ejfox',
      },
      {
        rel: 'http://webfinger.net/rel/profile-page',
        type: 'text/html',
        href: 'https://ejfox.com',
      },
    ],
  }
})
