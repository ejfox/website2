/**
 * READMEs are written for github.com, where `./docs/x.md`, `/LICENSE` and
 * `screenshots/1.png` resolve against the repo. Served on /github/<repo> the
 * same hrefs resolve against ejfox.com and 404. Rewrite them the way GitHub
 * would: links to the blob view, images to raw.githubusercontent.com.
 *
 * `HEAD` stands in for the default branch (often null in the exported data);
 * GitHub resolves it, and a blob URL that is a directory redirects to tree.
 *
 * Done at serve time rather than in export-github-repos.mjs because that
 * script keeps each repo's cached HTML until the repo is pushed again.
 */
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i

export function absolutizeReadmeUrls(html: string, repoUrl: string): string {
  const m = /^https:\/\/github\.com\/([^/]+)\/([^/#?]+)/.exec(repoUrl || '')
  if (!html || !m) return html
  const [, owner, repo] = m
  const blob = `https://github.com/${owner}/${repo}/blob/HEAD/`
  const raw = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/`

  return html.replace(
    /(<(a|img)\b[^>]*?\s(href|src)=")([^"]*)"/gi,
    (whole, pre: string, tag: string, attr: string, value: string) => {
      const v = value.trim()
      if (!v || v.startsWith('#') || v.startsWith('//') || HAS_SCHEME.test(v))
        return whole
      const isImage =
        tag.toLowerCase() === 'img' && attr.toLowerCase() === 'src'
      // A leading slash means the repo root on GitHub, not the site root.
      const path = v.replace(/^\/+/, '')
      try {
        return `${pre}${new URL(path, isImage ? raw : blob).href}"`
      } catch {
        return whole
      }
    }
  )
}
