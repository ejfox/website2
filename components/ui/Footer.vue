<!--
  @file Footer.vue
  @description Site footer with h-card microformat, navigation links, PGP key, and build info
  @props None - fetches build info from /api/build-info endpoint
-->
<template>
  <footer class="py-8 mt-8">
    <div class="max-w-4xl mx-auto px-4 space-y-8 text-center">
      <!-- Avatar with h-card microformat -->
      <div class="h-card">
        <img
          :src="avatarUrl"
          alt="EJ Fox"
          width="40"
          height="40"
          class="w-10 h-10 rounded-full mx-auto u-photo"
        />
        <span class="p-name hidden">EJ Fox</span>
        <a class="u-url u-uid hidden" href="https://ejfox.com" rel="me">
          ejfox.com
        </a>
        <span class="p-note hidden">
          Data visualization engineer, photographer, and digital craftsperson
        </span>
      </div>

      <!-- Navigation -->
      <nav :class="navClasses">
        <NuxtLink to="/stats" :class="navLinkClasses">/stats</NuxtLink>
        <NuxtLink to="/gists" :class="navLinkClasses">/gists</NuxtLink>
        <NuxtLink to="/gear" :class="navLinkClasses">/gear</NuxtLink>
        <NuxtLink to="/predictions" :class="navLinkClasses">
          /predictions
        </NuxtLink>
        <NuxtLink to="/now" :class="navLinkClasses">/now</NuxtLink>
        <NuxtLink to="/on-this-day" :class="navLinkClasses">
          /on-this-day
        </NuxtLink>
        <NuxtLink to="/sitemap" :class="navLinkClasses">/sitemap</NuxtLink>
        <NuxtLink to="/threads" :class="navLinkClasses">/threads</NuxtLink>
        <a href="https://ejfox.com/rss.xml" :class="navLinkClasses">/rss</a>
        <a
          href="https://github.com/ejfox"
          rel="me authn"
          :class="navLinkClasses"
        >
          github
        </a>
        <a href="https://twitter.com/mrejfox" rel="me" :class="navLinkClasses">
          twitter
        </a>
        <a
          href="https://mastodon.social/@ejfox"
          rel="me"
          :class="navLinkClasses"
        >
          mastodon
        </a>
        <a href="mailto:ejfox@ejfox.com" rel="me authn" :class="navLinkClasses">
          email
        </a>
      </nav>

      <!-- PGP + Build info -->
      <div class="space-y-2 text-xs text-zinc-500 dark:text-zinc-500">
        <div>
          <a href="/pgp.txt" class="interactive-link">
            PGP: E207 8E65 3FE3 89CD
          </a>
        </div>
        <div v-if="buildInfo">
          <a
            :href="buildUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="interactive-link font-mono"
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
