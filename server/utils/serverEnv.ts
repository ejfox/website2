/**
 * Read a server-only secret: runtime config first, then process.env.
 *
 * Production is built on the GitHub Actions runner, which has none of these
 * secrets, so nuxt.config's `process.env.X || ''` bakes empty strings into
 * runtimeConfig. The VPS loads the real values into process.env at startup
 * (pm2 → `-r dotenv/config`), but Nuxt only maps runtime env vars onto config
 * for NUXT_-prefixed names. Reading both makes either setup work.
 *
 * @param key     runtimeConfig key, e.g. 'GITHUB_TOKEN' or 'calcomApiKey'
 * @param envName process.env name when it differs from the key
 */
export function serverEnv(key: string, envName: string = key): string {
  const config = useRuntimeConfig() as unknown as Record<string, unknown>
  const fromConfig = config[key]
  if (typeof fromConfig === 'string' && fromConfig) return fromConfig
  return process.env[envName] || ''
}
