# Sealed posts

**Status:** implemented 2026-09-14. Supersedes PR #35 (closed unmerged) and the
design brief in `HANDOFF-PRIVATE-POSTS-2026-09-14.md`.

A sealed post is readable only by someone holding the link you sent them. The
repo stays public. The plaintext never enters it.

---

## The two decisions the handoff asked to be made explicitly

### 1. Is the GitHub Actions runner trusted with plaintext? **No — and it does not need to be.**

The handoff framed this as a trade: "plaintext never in the public repo" plus
"push-to-deploy" seemed to force CI to hold a decryption key. It doesn't,
because the plaintext is never required to make a deployable artifact. The
renderer that produces the sealed envelope runs on EJ's laptop, where the
source already is; CI copies an opaque blob from one place to another.

So the runner holds no key, sees no plaintext, and could not open a sealed post
if it were entirely compromised. Neither could a malicious fork PR, a
supply-chain attack on an action, or anyone who exfiltrates every repo secret.
The same is true of the VPS, which stores and serves the envelope and never
holds a key.

This costs nothing against the alternative. The rejected shape (encrypted
source in the repo, CI decrypts with a repo secret) would have bought exactly
one thing — the ability to re-render a sealed post from a fresh clone — in
exchange for a long-lived secret in CI, a key on the runner, and a preview
workflow that runs on fork PRs. The vault is the source of truth anyway.

### 2. How does a URL-fragment key reconcile with server-side gating? **There is no server-side gate, because there is nothing for it to gate.**

The handoff offered two ways to square "capability link" with "VPS trusted":
(a) client JS reads the fragment and POSTs it to an unlock endpoint, keeping
server-side validation; (b) the browser decrypts locally.

**(b).** EJ's answer that the VPS may hold plaintext was *permission*, not a
requirement, and declining the permission is strictly stronger:

- A 256-bit random key has no brute-force surface, so there is no rate limiter
  to build and none to defeat. The last design's rate limiter was itself a DoS
  vector twice over (key-table exhaustion → global lockout; ~400 concurrent
  scrypt unlocks → past the 1GB pm2 ceiling).
- Nothing on the server can produce plaintext, so a listing filter that
  regresses next year leaks an envelope instead of a post. Three of the four
  real leaks in PR #35 were in code a `grep passwordHash` would never have
  found; this makes that class of bug survivable rather than fatal.
- The key never reaches the VPS at all — not in a request line, a pm2 log, a
  Referer header, or a CDN cache key. Fragments are not sent to servers.
- It is less code, not more: no unlock endpoint, no rate limiter, no KDF, no
  cost-parameter migration path.

**The cost, stated plainly: sealed posts need JavaScript and are not
server-rendered.** For a handful of posts read by friends who were sent a link,
that is the right trade. If it ever isn't, (a) is a drop-in — the envelope
format doesn't change.

---

## How it works

### Author time

Write the post in the Obsidian vault under `private/`. Then:

```
yarn seal                 # vault → seal → guard
git add -A && git commit && git push
```

**Not `yarn blog`.** That chain starts with `blog:import`, which `rm -rf`s
`content/blog/` and rebuilds it from the vault — and the two have drifted
badly. The vault keeps posts under `blog/<year>/`, so the importer writes
`content/blog/blog/2022/…`, one level deeper than the 366 files actually
committed. Running it today deletes every `reading/` note and most years, then
rebuilds ~169 files in the wrong shape. That is a pre-existing bug, unrelated
to sealing, and publishing a sealed post shouldn't require fixing it first.

`yarn seal:import` therefore touches exactly one gitignored directory
(`content/blog/private/`) and nothing else. It copies the vault's `private/`
folder in, prunes copies of posts you've deleted from the vault, and stops.
`yarn seal` is that plus `blog:process` plus the guard.

It prints the capability link:

```
🔐 1 sealed post(s)

  private/some-post  new key
  https://ejfox.com/blog/private/some-post#k=Eimhq8kin4jJp_1soJzm4kYJ9DIyp8Wto2X1RZNbfmI
```

`yarn seal:links` reprints them later without re-sealing.

### The folder is the only switch

`content/blog/private/` is **gitignored**, so `git add -A` cannot stage the
plaintext. That is the wall, and it holds by construction rather than by
anyone remembering.

Frontmatter runs the *other* way. Any key matching `/protect|passw|secret|
encrypt|seal|private/i` on a post **outside** `private/` is a fatal build
error. The previous attempt keyed protection on `passwordEnv:`, a field whose
*absence* meant "public" — so typing `passwordenv:` published the post with a
green build. Here there is no spelling of `password` that publishes a post,
because no spelling of it protects one.

That tripwire runs at the very start of `processAllFiles`, before the mtime
cache. On a fresh clone every processed JSON is newer than its source, so
`getFileCacheStatus` returns `cache` for nearly everything and the per-file
path may never execute in CI at all. A guard inside it is not a guard.

### What gets committed

```json
{
  "slug": "private/some-post",
  "sealed": true,
  "envelope": { "v": 1, "alg": "A256GCM", "iv": "…", "ct": "…" }
}
```

Three keys. No title, dek, date, tags, word count — and no table of contents,
which is the one PR #35 shipped in cleartext beside its ciphertext. Headings are
usually where the substance is.

The post is **omitted from `manifest-lite.json` at write time**, not filtered at
serve time. `manifest-lite.json` is a tracked file in a public repo, so a
serve-time filter would still have published the title and TOC to GitHub.
Omitting it there also sanitises `/tags.json`, the sitemap, both feeds, search,
suggest and the prerender route list for free.

### Crypto

AES-256-GCM under a 256-bit CSPRNG key. Fresh IV per seal. `v|slug` bound as
additionalData, so an envelope cannot be swapped between posts. One
implementation (`utils/postSeal.mjs`) written against WebCrypto, imported by
both the build script and the browser — two copies that must agree is how a
feature silently stops working.

No password, no KDF: there is nothing to grind.

### Request time

`/api/posts/private/<slug>` returns the envelope. `SealedPost.vue` reads `#k=`,
strips it from the address bar via `replaceState`, decrypts, and merges the
payload into the page's `post` ref — so every component below renders exactly
as it would for a public post, and nothing downstream needs to know about any
of this.

### CI

The gitignored source does not exist on the runner, but the committed envelope
does. **Orphan cleanup is exempted for sealed JSON** — without that it would
delete the envelope on every CI run and the post would 404 forever. This is
also what makes the design correct whether pm2's cwd is the git checkout or
`.output` (unverified; SSH has been timing out). Either way the envelope is
present in both trees.

### Guards

| layer | catches |
|---|---|
| `.gitignore` | `git add -A` staging the plaintext |
| emit invariant in `sealResult` | an envelope that still contains the body, title, dek, a tag or a heading — checked on the re-seal **and** reuse paths, and fatal, so the per-file catch in `processAllFiles` cannot swallow it |
| `.githooks/pre-commit` | plaintext, a tracked keyring, or non-envelope-only JSON, in the **staged** tree |
| `guard-sealed.yml` | the same, server-side, on every branch — bypassing the hook with `--no-verify` doesn't help |
| `deploy.yml` safety step | blocks the deploy itself, before the build |
| frontmatter tripwire | secret-looking frontmatter on a public post |

---

## Where the key lives

`.postkeys.json` at the repo root, gitignored, mode 0600, one key per slug.
**Back it up to 1Password.** It is the only copy besides the links already sent.

Keys are per-post (sharing one post doesn't share them all) and stable across
edits (a link you already sent keeps working).

---

## What this does not protect against

- **The link is a bearer token.** Anyone who receives it, or finds it in a
  screenshot or a forwarded message, is in. No accounts, no expiry.
- **Sharing cannot be undone.** Re-sealing under a new key revokes nothing: the
  old envelope is in git history and opens with the old key forever. The only
  way to revoke access to a body is to change the body.
- **The post's existence is public** — its filename (which is its URL), its
  approximate length, and the commit timestamps that touched it. If the title
  is the sensitive part, use an opaque slug (`private/a7f3`).
- **Images are not sealed.** Embedded images are public Cloudinary URLs.
- **The vault is the real exposure.** Plaintext lives in iCloud regardless, and
  none of this helps if the laptop is compromised.
- **A post must be born sealed.** Moving an already-committed post into
  `private/` leaves its plaintext in the history of a public repo forever. The
  guards cannot catch that; only not doing it can.
- **Nothing is tamper-evident.** A reader can paste the text anywhere.

The requirement was "keep people without the link out of a few posts." That is
what this delivers, and it delivers it against someone who clones the repo.
