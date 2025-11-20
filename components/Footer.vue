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
          >github</a
        >
        <a href="https://twitter.com/mrejfox" rel="me" :class="navLinkClasses"
          >twitter</a
        >
        <a href="mailto:ejfox@ejfox.com" rel="me authn" :class="navLinkClasses"
          >email</a
        >
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
