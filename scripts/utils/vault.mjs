/**
 * @file utils/vault.mjs
 * @description Where EJ's Obsidian vaults live, for the few scripts that read
 *   (or, for gen-gear-annex, write) them: scripts/meta/vault-repo-merge.mjs,
 *   scripts/meta/frontmatter-sync-report.mjs, scripts/meta/gen-gear-annex.mjs,
 *   scripts/blog/import-sealed.mjs. Defaults are the iCloud Obsidian folder
 *   under the current user's home, so no machine-specific path is hardcoded.
 * @env OBSIDIAN_VAULT_PATH - the main vault (posts under blog/, sealed under private/)
 * @env AGENT_VAULT_PATH - the agent-vault (gear annex)
 */

import os from 'node:os'
import path from 'node:path'

const ICLOUD_OBSIDIAN = path.join(
  os.homedir(),
  'Library/Mobile Documents/iCloud~md~obsidian/Documents'
)

export const VAULT_ROOT =
  process.env.OBSIDIAN_VAULT_PATH || path.join(ICLOUD_OBSIDIAN, 'ejfox')

export const AGENT_VAULT_ROOT =
  process.env.AGENT_VAULT_PATH || path.join(ICLOUD_OBSIDIAN, 'agent-vault')
