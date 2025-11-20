<template>
  <footer class="py-8 mt-8">
    <div class="max-w-4xl mx-auto px-4 space-y-8 text-center">
      <!-- Avatar with h-card microformat -->
      <div class="h-card">
        <img
          :src="avatarUrl"
          alt="EJ Fox"
          class="w-10 h-10 rounded-full mx-auto u-photo"
        />
        <span class="p-name hidden">EJ Fox</span>
        <a class="u-url u-uid hidden" href="https://ejfox.com" rel="me"
          >ejfox.com</a
        >
        <span class="p-note hidden"
          >Data visualization engineer, photographer, and digital
          craftsperson</span
        >
      </div>

      <!-- Combined navigation -->
      <nav :class="navClasses">
        <a href="/stats" :class="navLinkClasses">/stats</a>
        <a href="/gists" :class="navLinkClasses">/gists</a>
        <a href="/gear" :class="navLinkClasses">/gear</a>
        <a href="/predictions" :class="navLinkClasses">/predictions</a>
        <a href="https://ejfox.com/rss.xml" :class="navLinkClasses">/rss</a>
        <a
          href="https://github.com/ejfox"
          rel="me authn"
          :class="navLinkClasses"
          title="GitHub"
        >
          <svg class="w-3.5 h-3.5 inline-block align-text-bottom" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </a>
        <a
          href="https://twitter.com/mrejfox"
          rel="me"
          :class="navLinkClasses"
          title="Twitter"
        >
          <svg class="w-3.5 h-3.5 inline-block align-text-bottom" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>
        <a
          href="mailto:ejfox@ejfox.com"
          rel="me authn"
          :class="navLinkClasses"
          title="Email"
        >
          <svg class="w-3.5 h-3.5 inline-block align-text-bottom" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </a>
      </nav>

      <!-- PGP + Build info -->
      <div class="space-y-2">
        <div>
          <a href="/pgp.txt" :class="pgpLinkClasses">PGP: E207 8E65 3FE3 89CD</a>
        </div>
        <div v-if="buildInfo">
          <a
            :href="buildUrl"
            target="_blank"
            rel="noopener noreferrer"
            :class="buildLinkClasses"
            :title="buildTitle"
          >
            {{ buildInfo.commit }}
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const avatarUrl =
  'https://res.cloudinary.com/ejf/image/upload/' +
  'w_128,f_webp/v1733606048/me_full.png'

const { data: buildInfo } = await useFetch('/api/build-info')

const navClasses =
  'flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm ' +
  'text-zinc-600 dark:text-zinc-400'

const navLinkClasses = 'interactive-link'

const pgpLinkClasses = 'interactive-link font-mono text-xs text-zinc-500 dark:text-zinc-500'

const buildLinkClasses =
  'interactive-link font-mono text-xs text-zinc-400 dark:text-zinc-600'

const buildUrl = computed(
  () =>
    `https://github.com/ejfox/website2/commit/${buildInfo.value?.commitLong}`
)

const buildTitle = computed(() => {
  if (!buildInfo.value) return ''
  const date = new Date(buildInfo.value.buildDate).toLocaleString()
  return `Built from ${buildInfo.value.branch} on ${date}`
})
</script>
