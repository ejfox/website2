/**
 * @file smallweb.ts
 * @description fetchSmallweb(app, path): fetch JSON from one of EJ's smallweb
 *   OSINT apps (<app>.tools.ejfox.com). Used by the Valley Atlas layers in
 *   server/api/atlas/ (ships, news, cameras, history, private/*). Throws on
 *   non-2xx.
 *
 * `app` and `path` go straight into the URL unencoded. Today's callers pass
 *   constants (travels coerces its id with Number()); keep raw request input out.
 *
 * Always over the public HTTPS hostname: Node's fetch won't send a custom
 * Host header, so the localhost:7777 shortcut isn't available. If the tools
 * hostnames are ever put behind Cloudflare Access, add a service token here.
 *
 * Callers must filter what they return: these apps hold private data, and
 * only the fields a map layer needs should ever reach the browser.
 */
import { fetchWithTimeout } from '~/server/utils/fetch'

export async function fetchSmallweb<T = unknown>(
  app: string,
  path: string,
  timeoutMs = 10000
): Promise<T> {
  const url = `https://${app}.tools.ejfox.com${path}`
  const res = await fetchWithTimeout(url, {}, timeoutMs)
  if (!res.ok) throw new Error(`${app}${path} → ${res.status}`)
  return (await res.json()) as T
}
