/**
 * @file blog-projects-redirect.ts
 * @description 301 /blog/projects/<slug> → /projects/<slug>. Projects live in
 *   the blog content pipeline (slug prefix `projects/`), so the generic blog
 *   route happily rendered them at /blog/projects/* too — a full duplicate of
 *   every project page, each self-canonicalizing, with the sitemap formerly
 *   promoting the wrong twin. One canonical home: /projects/<slug>.
 */
export default defineEventHandler((event) => {
  const path = event.path || ''
  if (!path.startsWith('/blog/projects/')) return
  const rest = path.slice('/blog/projects/'.length)
  // don't touch nested special paths (none exist today, but be conservative)
  if (!rest || rest.includes('/')) return
  return sendRedirect(event, `/projects/${rest}`, 301)
})
