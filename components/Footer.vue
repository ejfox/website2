<template>
  <footer class="py-8 mt-8">
    <div class="max-w-4xl mx-auto px-4 space-y-6 text-center">
      <!-- Avatar with h-card microformat -->
      <div class="h-card">
        <img
          :src="avatarUrl"
          alt="EJ Fox"
          class="w-12 h-12 rounded-full mx-auto u-photo"
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
        <span class="text-zinc-300 dark:text-zinc-700">·</span>
        <a
          href="https://github.com/ejfox"
          rel="me authn"
          :class="navLinkClasses"
          >GitHub</a
        >
        <a href="https://twitter.com/mrejfox" rel="me" :class="navLinkClasses"
          >Twitter</a
        >
        <a href="mailto:ejfox@ejfox.com" rel="me authn" :class="navLinkClasses"
          >Email</a
        >
        <span class="text-zinc-300 dark:text-zinc-700">·</span>
        <a href="/pgp.txt" :class="pgpLinkClasses">PGP: E207 8E65 3FE3 89CD</a>
      </nav>

      <!-- Build info -->
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
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const avatarUrl =
  'https://res.cloudinary.com/ejf/image/upload/' +
  'w_128,f_webp/v1733606048/me_full.png'

const { data: buildInfo } = await useFetch('/api/build-info')

const navClasses =
  'flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm ' +
  'text-zinc-600 dark:text-zinc-400'

const navLinkClasses = ''

const pgpLinkClasses = 'font-mono text-xs'

const buildLinkClasses =
  'font-mono text-[10px] text-zinc-400 dark:text-zinc-600'

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
