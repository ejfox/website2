/**
 * First path segments that server/middleware/json-twin.ts can answer for
 * (its `resolveTwin` switch), plus '' for the homepage. app.vue advertises a
 * page's `.json` twin only under these, so /rides, /apps, /threads etc. don't
 * point crawlers and readers at a 404. Add a section here when you add a case
 * there; utils/__tests__/jsonTwin.test.ts checks they match.
 */
export const JSON_TWIN_SECTIONS = new Set([
  '',
  'blog',
  'projects',
  'reading',
  'gear',
  'predictions',
  'scraps',
  'photos',
  'github',
  'gists',
  'changelog',
  'tag',
  'now',
  'stats',
])

export const hasJsonTwin = (path: string) =>
  JSON_TWIN_SECTIONS.has(path.split('/')[1] ?? '')
