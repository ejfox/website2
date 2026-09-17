#!/usr/bin/env node
/**
 * @file seal-links.mjs
 * @description Print the capability link for every sealed post.
 * @usage yarn seal:links [slug-substring]
 * @env SITE_ORIGIN - override https://ejfox.com (optional)
 *
 * `yarn blog:process` prints these when it seals a post, but that scrolls away
 * and the link is the only thing that opens the post. This reads the same
 * keyring back, so you can re-send a link without re-sealing — re-sealing
 * under a new key would silently break every copy already out there.
 *
 * Anyone with the link can read the post. It is a bearer token: no account, no
 * expiry, and no way to take it back once sent. Re-sealing does NOT revoke —
 * the old envelope stays in git history and opens with the old key forever.
 * The only way to revoke access to a body is to change the body.
 */

import { existsSync } from 'node:fs'
import path from 'node:path'
import chalk from 'chalk'
import { allSealKeys } from '../build/sealKeyring.mjs'
import { capabilityLink } from '../../utils/postSeal.mjs'

const origin = process.env.SITE_ORIGIN || 'https://ejfox.com'
const filter = process.argv[2]

const keys = await allSealKeys()
const slugs = Object.keys(keys)
  .filter((s) => !filter || s.includes(filter))
  .sort()

if (!slugs.length) {
  console.log(
    chalk.yellow(
      filter
        ? `No sealed post matching "${filter}".`
        : 'No sealed posts yet.\n\n' +
            'To make one: write it in the vault under private/, then\n' +
            '  yarn blog:import && yarn blog:process\n'
    )
  )
  process.exit(0)
}

console.log(chalk.bold(`\n🔐 ${slugs.length} sealed post(s)\n`))

for (const slug of slugs) {
  // A key with no committed envelope is a post that was sealed and then
  // deleted, or one that has not been processed yet. Worth flagging: the link
  // would 404, and a stale key sitting in the keyring is a small liability.
  const envelopePath = path.resolve(
    process.cwd(),
    'content/processed',
    `${slug}.json`
  )
  const live = existsSync(envelopePath)

  console.log(
    `  ${chalk.bold(slug)}${live ? '' : chalk.yellow('  (no envelope on disk — run yarn blog:process)')}`
  )
  console.log(`  ${chalk.cyan(capabilityLink(origin, slug, keys[slug]))}\n`)
}

console.log(
  chalk.yellow(
    'Send these over a channel you trust. Sharing cannot be undone.\n'
  )
)
