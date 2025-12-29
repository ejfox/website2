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
      <!-- Mobile navigation -->
      <nav
        v-if="!isStatsSimple"
        class="md:hidden fixed top-0 left-0 w-full z-50 bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-lg"
      >
        <div class="px-4 py-3 flex justify-between items-center">
          <NuxtLink
            class="text-zinc-800 dark:text-zinc-400 text-xl font-bold"
            to="/"
          >
            EJ Fox
          </NuxtLink>
          <button
            class="p-2 -mr-2 text-zinc-800 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 rounded-lg"
            aria-label="Toggle menu"
            :aria-expanded="mobileMenuOpen"
            @click="mobileMenuOpen = !mobileMenuOpen"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                :d="
                  mobileMenuOpen
                    ? 'M6 18L18 6M6 6l12 12'
                    : 'M4 6h16M4 12h16M4 18h16'
                "
              />
            </svg>
          </button>
        </div>

        <div
          v-if="mobileMenuOpen"
          class="border-t border-zinc-200 dark:border-zinc-800 px-4 py-2 space-y-1"
        >
          <template v-for="item in primaryNav" :key="item.href">
            <a
              v-if="item.external"
              :href="item.href"
              class="block py-3 px-3 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
              target="_blank"
              rel="noopener noreferrer"
              @click="mobileMenuOpen = false"
            >
              {{ item.label }}
            </a>
            <NuxtLink
              v-else
              :to="item.href"
              class="block py-3 px-3 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
              @click="mobileMenuOpen = false"
            >
              {{ item.label }}
            </NuxtLink>
          </template>
        </div>
      </nav>

      <!-- Desktop sidebar -->
      <nav
        v-if="!isStatsSimple"
        class="hidden md:block sticky w-[180px] shrink-0 h-auto max-h-screen top-0 left-0 z-50 p-4 font-mono overflow-auto"
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

          <div class="pt-4 text-xs text-zinc-500 dark:text-zinc-500">
            <a
              href="/pgp.txt"
              class="hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              PGP: E207 8E65
            </a>
          </div>
        </div>

        <!-- TOC container - always present for teleport targets -->
        <div id="nav-toc-container" class="mt-4 font-sans w-full overflow-hidden"></div>

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
        :class="[
          'w-full overflow-x-auto',
          isStatsSimple ? 'mt-0' : 'md:w-4/5 mt-14 md:mt-0',
        ]"
      >
        <slot />
      </article>
    </section>

    <Footer />
    <WebVitalsReporter />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { getPrimaryNav } from '~/config/navigation'

const mobileMenuOpen = ref(false)
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
