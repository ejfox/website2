<script setup lang="ts">
// SIGNAL_USERNAME_TODO: EJ fills this in (e.g. 'ejfox.42'). Until then the
// Signal section renders nothing; never invent one.
const SIGNAL_USERNAME = ''

const FINGERPRINT = '5D30 A33E 08E3 5B89 15B4  C7E2 E207 8E65 3FE3 89CD'

usePageSeo({
  title: 'Tips · EJ Fox',
  description:
    'How to get a document, a lead or a tip to EJ Fox, and how to do it without burning yourself.',
  type: 'article',
  section: 'Meta',
  tags: ['Tips', 'Security', 'PGP', 'Journalism'],
})
</script>

<template>
  <div class="max-w-screen-xl mx-auto px-4 md:px-8 xl:px-16 pt-8 pb-16">
    <div class="max-w-prose font-serif">
      <header class="mb-10">
        <h1 class="font-serif text-2xl mb-2">Tips</h1>
        <p class="text-zinc-600 dark:text-zinc-400">
          Documents, leads, a record someone hoped nobody would read. I read
          everything. I protect sources. I don't promise a story.
        </p>
      </header>

      <section v-if="SIGNAL_USERNAME" class="mb-10">
        <h2
          class="font-mono text-xs uppercase tracking-wider text-zinc-500 mb-2"
        >
          ◆ Signal (best)
        </h2>
        <p>
          Turn on disappearing messages. You don't need to share a phone number.
        </p>
        <p class="font-mono text-xs bg-sunken px-3 py-2 mt-2">
          {{ SIGNAL_USERNAME }}
        </p>
      </section>

      <section class="mb-10">
        <h2
          class="font-mono text-xs uppercase tracking-wider text-zinc-500 mb-2"
        >
          ◇ Encrypted email
        </h2>
        <p class="mb-3">
          Encrypt to my PGP key and send to
          <a href="mailto:ejfox@ejfox.com" class="underline">ejfox@ejfox.com</a>
        </p>
        <p class="mb-3">Check the fingerprint before you trust the key:</p>
        <p class="font-mono text-xs bg-sunken px-3 py-2 mb-3 break-words">
          {{ FINGERPRINT }}
        </p>
        <ul
          class="list-none space-y-1 font-mono text-xs text-zinc-600 dark:text-zinc-400"
        >
          <li>
            <a href="/pgp.txt" class="underline">/pgp.txt</a>
            · the armored key
          </li>
          <li>
            <span>gpg --locate-keys ejfox@ejfox.com</span>
            · fetched from this domain (WKD)
          </li>
          <li>
            <a
              href="https://keys.openpgp.org/search?q=ejfox%40ejfox.com"
              class="underline"
            >
              keys.openpgp.org
            </a>
            ·
            <a href="https://keybase.io/ejfox" class="underline">
              keybase.io/ejfox
            </a>
          </li>
        </ul>
        <p class="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Encryption hides what you said, not that you said something. The
          subject line, the time and both addresses travel in the clear.
        </p>
      </section>

      <section class="mb-10">
        <h2
          class="font-mono text-xs uppercase tracking-wider text-zinc-500 mb-2"
        >
          ○ Before you send anything
        </h2>
        <ul class="list-disc pl-5 space-y-2">
          <li>
            Use your own device on your own network. Work laptops and office
            Wi-Fi belong to someone who isn't you.
          </li>
          <li>
            Don't forward documents from a work account. Assume the logs
            remember who opened what, and when.
          </li>
          <li>
            Files carry their history: author names, edit trails, printer dots,
            the exact copy only five people received. Tell me how you got it and
            I'll work out what's safe to show.
          </li>
          <li>
            If you're the only person who could have known it, say so up front.
            Protecting you starts before anything is published.
          </li>
          <li>
            Timing is metadata. Sending the hour after a meeting narrows the
            list of who was in the room. If it can wait, let it.
          </li>
        </ul>
      </section>

      <section class="text-sm text-zinc-600 dark:text-zinc-400">
        <p>
          Reporting a vulnerability in this site instead? See
          <a href="/.well-known/security.txt" class="underline">security.txt</a>
        </p>
      </section>
    </div>
  </div>
</template>
