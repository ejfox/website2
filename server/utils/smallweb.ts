/**
 * Fetch JSON from one of EJ's smallweb OSINT apps (<app>.tools.ejfox.com).
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
