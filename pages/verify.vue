<!--
  @file verify.vue
  @description /verify: PGP fingerprint, rel="me" accounts and the identity
    proofs served from this domain (public/keybase.txt, webfinger,
    security.txt). Static page, no data fetch. SSR.
    FINGERPRINT is duplicated in pages/tips.vue; keep them identical.
-->
<script setup lang="ts">
// Everything on this page is already published elsewhere on ejfox.com
// (/pgp.txt, /keybase.txt, webfinger, the footer's rel="me" links). Keep it
// that way: this page collects proofs, it never introduces new claims.
const FINGERPRINT = '5D30 A33E 08E3 5B89 15B4  C7E2 E207 8E65 3FE3 89CD'

const KEY = [
  { label: 'type', value: 'RSA 4096' },
  { label: 'created', value: '2019-01-26' },
  { label: 'expires', value: '2035-01-22' },
]

const KEY_SOURCES = [
  { href: '/pgp.txt', label: '/pgp.txt', note: 'the armored key' },
  {
    href: 'https://keys.openpgp.org/search?q=ejfox%40ejfox.com',
    label: 'keys.openpgp.org',
    note: 'keyserver',
  },
]

const PROOFS = [
  {
    href: '/keybase.txt',
    label: '/keybase.txt',
    note: 'signed Keybase claim on this domain',
  },
  {
    href: '/.well-known/webfinger?resource=acct:ejfox@ejfox.com',
    label: 'acct:ejfox@ejfox.com',
    note: 'webfinger, points to Mastodon',
  },
  { href: '/crypto.txt', label: '/crypto.txt', note: 'wallet addresses' },
  {
    href: '/.well-known/security.txt',
    label: '/.well-known/security.txt',
    note: 'vulnerability contact',
  },
]

// rel="me" accounts. GitHub and email also carry authn, matching the footer
const ACCOUNTS = [
  {
    service: 'github',
    href: 'https://github.com/ejfox',
    label: 'github.com/ejfox',
    rel: 'me authn',
  },
  {
    service: 'mastodon',
    href: 'https://mastodon.social/@ejfox',
    label: '@ejfox@mastodon.social',
    rel: 'me',
  },
  {
    service: 'bluesky',
    href: 'https://bsky.app/profile/did:plc:5qysguz3v267ggtfitebl5nc',
    label: '@mrejfox.bsky.social',
    note: 'did:plc:5qysguz3v267ggtfitebl5nc',
    rel: 'me',
  },
  {
    service: 'keybase',
    href: 'https://keybase.io/ejfox',
    label: 'keybase.io/ejfox',
    rel: 'me',
  },
  {
    service: 'email',
    href: 'mailto:ejfox@ejfox.com',
    label: 'ejfox@ejfox.com',
    rel: 'me authn',
  },
]

usePageSeo({
  title: 'Verify · EJ Fox',
  description:
    "EJ Fox's PGP fingerprint, identity proofs and real accounts, in one place.",
  type: 'article',
  section: 'Meta',
  tags: ['Verification', 'PGP', 'Identity'],
})
</script>

<template>
  <div class="max-w-screen-xl mx-auto px-4 md:px-8 xl:px-16 pt-8 pb-16">
    <div class="max-w-prose">
      <header class="mb-10">
        <h1 class="font-serif text-2xl mb-2">Verify</h1>
        <p class="font-serif text-zinc-600 dark:text-zinc-400">
          My keys and accounts, in one place. If something claims to be me,
          check it against this page.
        </p>
      </header>

      <section class="mb-10">
        <h2
          class="font-mono text-xs uppercase tracking-wider text-zinc-500 mb-2"
        >
          ◆ PGP fingerprint
        </h2>
        <p
          class="font-mono text-sm bg-sunken border border-zinc-200 dark:border-zinc-800 px-3 py-2 mb-3 break-words"
          data-fingerprint
        >
          {{ FINGERPRINT }}
        </p>
        <dl
          class="grid grid-cols-[6rem_1fr] gap-x-4 gap-y-1 font-mono text-xs mb-3"
        >
          <template v-for="row in KEY" :key="row.label">
            <dt class="text-zinc-500">{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </template>
        </dl>
        <ul
          class="list-none space-y-1 font-mono text-xs text-zinc-600 dark:text-zinc-400"
        >
          <li v-for="src in KEY_SOURCES" :key="src.href">
            <a :href="src.href" class="underline">{{ src.label }}</a>
            · {{ src.note }}
          </li>
          <li>
            <span>gpg --locate-keys ejfox@ejfox.com</span>
            · fetched from this domain (WKD)
          </li>
        </ul>
        <p class="font-serif mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          To check a signed message, import the key, run
          <code class="font-mono text-xs">gpg --verify</code>, and compare the
          fingerprint it reports with all 40 characters above
        </p>
      </section>

      <section class="mb-10">
        <h2
          class="font-mono text-xs uppercase tracking-wider text-zinc-500 mb-2"
        >
          ◇ Accounts
        </h2>
        <table data-plain class="w-full font-mono text-xs">
          <tbody>
            <tr
              v-for="acct in ACCOUNTS"
              :key="acct.service"
              class="block sm:table-row border-t border-zinc-200 dark:border-zinc-800 align-top"
            >
              <!-- stacked on a phone: the value gets the full width -->
              <td
                class="block sm:table-cell pt-1 sm:py-1 pr-2 text-zinc-500 sm:w-px whitespace-nowrap"
              >
                {{ acct.service }}
              </td>
              <td class="block sm:table-cell pb-1 sm:py-1">
                <a
                  :href="acct.href"
                  :rel="acct.rel"
                  class="underline wrap-anywhere"
                >
                  {{ acct.label }}
                </a>
                <div v-if="acct.note" class="text-zinc-500 wrap-anywhere">
                  {{ acct.note }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="mb-10">
        <h2
          class="font-mono text-xs uppercase tracking-wider text-zinc-500 mb-2"
        >
          ○ Proofs on this domain
        </h2>
        <ul
          class="list-none space-y-1 font-mono text-xs text-zinc-600 dark:text-zinc-400"
        >
          <li v-for="proof in PROOFS" :key="proof.href">
            <a :href="proof.href" class="underline wrap-anywhere">{{
              proof.label
            }}</a>
            · {{ proof.note }}
          </li>
        </ul>
      </section>

      <section class="font-serif text-sm text-zinc-600 dark:text-zinc-400">
        <p>
          Sending a tip? See
          <NuxtLink to="/tips" class="underline">/tips</NuxtLink>
        </p>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* URLs, handles and DIDs have no spaces, so let only them break anywhere —
   normal words in notes keep whole-word wrapping (break-all split "points") */
.wrap-anywhere {
  overflow-wrap: anywhere;
}
</style>
