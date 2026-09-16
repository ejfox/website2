#!/usr/bin/env node
/**
 * @file check-sealed.mjs
 * @description Assert that nothing about a sealed post has leaked into the
 *   public repository. Run by the pre-commit hook (against the STAGED tree)
 *   and by .github/workflows/guard-sealed.yml (against HEAD, on every branch).
 * @usage yarn check:sealed [--staged]
 *
 * ## Why this exists even though the plaintext is gitignored
 *
 * `.gitignore` is the wall, and it is a good wall — `git add -A` cannot stage
 * an ignored file. But it is not a fence you cannot climb: `git add -f` gets
 * past it, a file tracked BEFORE the ignore rule existed stays tracked forever,
 * and a future edit to .gitignore could quietly remove the rule. None of those
 * is exotic; all of them are silent.
 *
 * So this checks the thing that actually matters — what is in the git INDEX,
 * not what is in the working tree. The working tree is legitimately full of
 * plaintext; that is where the post gets written. Only the committed blobs
 * have to be clean.
 *
 * It runs on every branch, not just main, because a plaintext push to a
 * feature branch of a public repo is already public.
 */

import { execFileSync } from 'node:child_process'
import chalk from 'chalk'

const STAGED = process.argv.includes('--staged')

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim()

/** Paths git is tracking (or about to), under a pathspec. */
function trackedPaths(pathspec) {
  const out = STAGED
    ? git(
        'diff',
        '--cached',
        '--name-only',
        '--diff-filter=ACM',
        '--',
        pathspec
      )
    : git('ls-files', '--', pathspec)
  return out ? out.split('\n').filter(Boolean) : []
}

/** The blob content git would commit for a path. */
function blob(file) {
  return STAGED ? git('show', `:${file}`) : git('show', `HEAD:${file}`)
}

const failures = []

// 1. No sealed SOURCE may be tracked, ever. This is the fatal one: the
//    markdown is the whole post in the clear, and a public repo keeps it
//    forever — a later `git rm` does not un-publish anything.
//
//    `content/backup/private` is checked alongside it because `blog:import`
//    copies `content/blog/` to `content/backup/` before rebuilding, which
//    quietly produces a second plaintext copy of every sealed post. Both
//    directories are gitignored today and `content/backup/**` has never had a
//    tracked file — but the plaintext is only one careless .gitignore edit
//    away from being committable, and the backup copy is the one nobody would
//    think to look for.
for (const file of [
  ...trackedPaths('content/blog/private'),
  ...trackedPaths('content/backup/private'),
]) {
  failures.push(
    `PLAINTEXT SOURCE TRACKED: ${file}\n` +
      `    This is the unencrypted post. It must never be committed to a\n` +
      `    public repo. Unstage it (git rm --cached), confirm\n` +
      `    content/blog/private/ is still in .gitignore, and re-run.`
  )
}

// 2. The keyring is the credential for every sealed post at once.
for (const file of trackedPaths('.postkeys.json')) {
  failures.push(
    `KEYRING TRACKED: ${file}\n` +
      `    This file holds the key to every sealed post. Committing it to a\n` +
      `    public repo publishes all of them, permanently and irrevocably.`
  )
}

// 3. Every committed sealed JSON must be envelope-only. This is the check
//    that would have caught the previous attempt, which shipped the table of
//    contents and all frontmatter in cleartext beside the ciphertext — so a
//    post whose headings read "Why I am leaving Acme Corp" published its own
//    story while the paragraphs sat safely encrypted.
const ALLOWED = new Set(['slug', 'sealed', 'envelope'])
for (const file of trackedPaths('content/processed/private')) {
  if (!file.endsWith('.json')) continue

  let data
  try {
    data = JSON.parse(blob(file))
  } catch (e) {
    failures.push(`UNPARSEABLE: ${file}\n    ${e.message}`)
    continue
  }

  const extra = Object.keys(data).filter((k) => !ALLOWED.has(k))
  if (extra.length) {
    failures.push(
      `NOT ENVELOPE-ONLY: ${file}\n` +
        `    Public field(s): ${extra.join(', ')}\n` +
        `    Only slug/sealed/envelope may be public. Everything else —\n` +
        `    title, dek, date, tags, and above all the table of contents —\n` +
        `    belongs inside the sealed payload.`
    )
  }

  if (data.sealed !== true || !data.envelope?.ct || !data.envelope?.iv) {
    failures.push(
      `NOT SEALED: ${file}\n` +
        `    A file under content/processed/private/ that is not a sealed\n` +
        `    envelope is a post being published by accident.`
    )
  }
}

if (failures.length) {
  console.error(chalk.red.bold('\n🚨 Sealed-post guard failed\n'))
  for (const f of failures) console.error(chalk.red(`  • ${f}\n`))
  console.error(
    chalk.yellow(
      'Nothing was committed. See utils/postSeal.mjs for how sealing works.\n'
    )
  )
  process.exit(1)
}

console.log(
  chalk.green(
    `✅ Sealed-post guard passed (${STAGED ? 'staged' : 'HEAD'} tree clean)`
  )
)
