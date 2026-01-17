<template>
  <div
    id="app-container"
    class="w-full min-h-screen bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
  >
    <!-- Skip to main content link for accessibility -->
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-2 focus:bg-black focus:text-white"
    >
      Skip to main content
    </a>
    <NuxtLoadingIndicator color="#999999" :height="1" />
    <section class="flex flex-col md:flex-row min-h-screen relative">
      <!-- Mobile nav -->
      <nav
        v-if="!isStatsSimple"
        class="md:hidden px-4 py-3 font-mono text-sm flex flex-wrap gap-x-3 gap-y-1 items-baseline"
      >
        <NuxtLink to="/" class="font-bold text-zinc-800 dark:text-zinc-200">
          EJ Fox
        </NuxtLink>
        <NuxtLink to="/blog/" class="text-zinc-500 dark:text-zinc-400">
          Blog
        </NuxtLink>
        <NuxtLink to="/projects" class="text-zinc-500 dark:text-zinc-400">
          Projects
        </NuxtLink>
        <NuxtLink to="/consulting" class="text-zinc-500 dark:text-zinc-400">
          Hire Me
        </NuxtLink>
      </nav>

      <!-- Desktop sidebar -->
      <nav
        v-if="!isStatsSimple"
        class="hidden md:block sticky w-[200px] shrink-0 h-auto top-0 left-0 z-50 px-3 py-4 font-mono"
      >
        <div class="space-y-2">
          <NuxtLink
            class="text-zinc-800 dark:text-zinc-400 text-xl font-bold p-2 mb-4 block"
            to="/"
          >
            EJ Fox
          </NuxtLink>

          <template v-for="item in primaryNav" :key="item.href">
            <a
              v-if="item.external"
              :href="item.href"
              :class="linkClasses"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ item.label }}
            </a>
            <NuxtLink v-else :to="item.href" :class="linkClasses">
              {{ item.label }}
            </NuxtLink>
          </template>

          <div class="pt-4 px-2 text-2xs text-zinc-500 dark:text-zinc-400">
            <a
              href="/pgp.txt"
              class="hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              PGP: E207 8E65
            </a>
          </div>
        </div>

        <!-- TOC container - always present for teleport targets -->
        <div
          id="nav-toc-container"
          class="mt-4 font-sans"
        ></div>

        <div v-if="isBlogPost" class="mt-4">
          <NuxtLink
            to="/blog/"
            class="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            <span>&larr;</span>
            <span>Back to Blog</span>
          </NuxtLink>
        </div>
      </nav>

      <article
        id="main-content"
        :class="['w-full overflow-x-auto', isStatsSimple ? '' : 'md:w-4/5']"
      >
        <slot />
      </article>
    </section>

    <UiFooter />
    <UiWebVitalsReporter />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getPrimaryNav } from '~/composables/useNavigation'

const route = useRoute()
const primaryNav = getPrimaryNav()

const isBlogPost = computed(() => {
  return route.path.startsWith('/blog/') && route.path !== '/blog/'
})

const isStatsSimple = computed(() => {
  return route.path === '/stats' && route.query?.simple !== undefined
})

const linkClasses =
  'block px-2 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
</script>
