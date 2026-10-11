/**
 * Week notes were retired on 2026-10-11: they leaked screenshots and were
 * indexed by search engines. Every old URL answers 410 Gone (not 404), which
 * tells crawlers the removal is deliberate and drops pages from results faster.
 * The notes themselves live on privately in the vault.
 */
export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname
  if (
    path === '/week-notes-rss.xml' ||
    path === '/blog/week-notes' ||
    path.startsWith('/blog/week-notes/') ||
    path.startsWith('/api/posts/week-notes/')
  ) {
    setResponseHeader(event, 'X-Robots-Tag', 'noindex')
    throw createError({ statusCode: 410, statusMessage: 'Gone' })
  }
})
