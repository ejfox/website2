<template>
  <div
    id="app-container"
    class="w-full min-h-screen bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
  >
    <!-- Skip to main content link for accessibility -->
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-2 focus:bg-black focus:text-white"
    >
      Skip to main content
    </a>
    <NuxtLoadingIndicator color="#999999" :height="1" />
    <section class="flex flex-col sm:flex-row min-h-screen relative">
      <!-- Mobile navigation - hide on stats page with simple mode -->
      <nav
        v-if="isMobile && !isStatsSimple"
        class="fixed top-0 left-0 w-full z-50 bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-lg"
      >
        <div class="px-4 py-3">
          <div class="flex justify-between items-center">
            <NuxtLink
              class="text-zinc-800 dark:text-zinc-400 text-xl font-bold"
              to="/"
            >
              EJ Fox
            </NuxtLink>
            <button
              class="p-2 -mr-2 text-zinc-800 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors"
              aria-label="Toggle menu"
              :aria-expanded="mobileMenuOpen"
              @click="toggleMobileMenu"
            >
              <!-- Hamburger icon -->
              <svg
                v-if="!mobileMenuOpen"
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <!-- X icon -->
              <svg
                v-else
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 -translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-2"
        >
          <div
            v-if="mobileMenuOpen"
            class="border-t border-zinc-200 dark:border-zinc-800"
          >
            <div class="px-4 py-2 space-y-1">
              <template v-for="(item, index) in primaryNav" :key="item.href">
                <a
                  v-if="item.external"
                  :href="item.href"
                  class="flex items-center justify-between py-3 px-3 rounded-lg text-base transition-colors hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400"
                  target="_blank"
                  rel="noopener noreferrer"
                  :style="{
                    animation: `fadeIn 0.2s ease-out forwards ${index * 0.05}s`,
                  }"
                  @click="closeMobileMenu"
                >
                  <span>{{ item.label }}</span>
                  <svg
                    class="w-4 h-4 ml-2 opacity-60"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
                <NuxtLink
                  v-else
                  :to="item.href"
                  class="flex items-center justify-between py-3 px-3 rounded-lg text-base transition-colors"
                  :class="[
                    'hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50',
                    route.path === item.href
                      ? 'text-zinc-900 dark:text-zinc-100 ' +
                        'bg-zinc-200/30 dark:bg-zinc-800/30'
                      : 'text-zinc-600 dark:text-zinc-400',
                  ]"
                  :style="{
                    animation: `fadeIn 0.2s ease-out forwards ${index * 0.05}s`,
                  }"
                  @click="closeMobileMenu"
                >
                  <span>{{ item.label }}</span>
                </NuxtLink>
              </template>
            </div>

            <div
              class="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800"
            >
              <a
                href="/pgp.txt"
                class="block px-3 py-3 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors rounded-lg hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
              >
                PGP: E207 8E65 3FE3 89CD
              </a>
            </div>
          </div>
        </Transition>
      </nav>

      <!-- Desktop navigation - sticky left sidebar -->
      <nav
        v-else-if="!isStatsSimple"
        class="sticky min-w-[200px] h-auto max-h-screen top-0 left-0 z-50 p-4 font-mono overflow-auto"
      >
        <div
          class="container mx-auto sm:py-1 sm:flex sm:flex-col items-start w-full sm:shadow-none sm:border-none rounded bg-zinc-50/50 sm:bg-transparent dark:bg-zinc-900/30 sm:dark:bg-transparent backdrop-blur-md px-2 max-h-screen"
        >
          <div class="pt-3 pb-1 space-y-2">
            <NuxtLink
              class="text-zinc-800 dark:text-zinc-400 sm:text-xl font-bold px-2 sm:p-4 sm:mb-2 block"
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
                <svg
                  class="w-3 sm:w-4 h-3 sm:h-4 inline-block"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
              <NuxtLink v-else :to="item.href" :class="linkClasses">
                {{ item.label }}
              </NuxtLink>
            </template>
          </div>

          <div
            class="px-4 opacity-50 hover:opacity-100 transition-opacity group hidden sm:block"
          >
            <div
              class="text-xs mt-1 text-zinc-500 dark:text-zinc-400 flex items-center justify-between"
            >
              <a
                href="/pgp.txt"
                class="hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors"
              >
                PGP: E207 8E65 3FE3 89CD
              </a>
            </div>
          </div>
        </div>

        <!-- Table of Contents Container -->
        <div v-if="isBlogPost || isStatsPage || isProjectsPage" class="mt-4">
          <div id="nav-toc-container" class="font-sans"></div>
        </div>

        <div v-if="isBlogPost" class="mt-4 pl-4">
          <NuxtLink
            to="/blog/"
            class="inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            <svg
              class="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>Back to Blog</span>
          </NuxtLink>
        </div>
      </nav>

      <article
        id="main-content"
        :class="[
          'w-full overflow-x-auto',
          isStatsSimple ? 'mt-0' : 'sm:w-4/5 mt-16 sm:mt-0',
        ]"
      >
        <slot />
      </article>

      <!-- Right sidebar TOC for blog posts and stats page -->
      <aside
        v-if="(isBlogPost || isStatsPage || isProjectsPage) && !isStatsSimple"
        class="hidden xl:block w-64 shrink-0 sticky top-0 h-screen overflow-y-auto p-4"
      >
        <div id="aside-toc-container" class="space-y-4"></div>
      </aside>
    </section>

    <Footer />
    <WebVitalsReporter />
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core'
import { getPrimaryNav } from '~/config/navigation'

const breakpoints = useBreakpoints(breakpointsTailwind)
const isMobile = breakpoints.smaller('sm') // < 640px

const mobileMenuOpen = ref(false)

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

const route = useRoute()
const primaryNav = getPrimaryNav()

const isBlogPost = computed(() => {
  return route.path.startsWith('/blog/') && route.path !== '/blog/'
})

const isStatsPage = computed(() => {
  return route.path === '/stats'
})

const isProjectsPage = computed(() => {
  return route.path === '/projects'
})

const isStatsSimple = computed(() => {
  return route.path === '/stats' && route.query?.simple !== undefined
})

const linkClasses =
  'block px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/30 dark:hover:bg-zinc-700/30 hover:text-zinc-900 dark:hover:text-zinc-100 rounded'

// Update TOC container visibility when route changes
watch(
  () => [route.path, isBlogPost.value, isStatsPage.value, isProjectsPage.value],
  () => {
    nextTick(() => {
      if (
        import.meta.client &&
        (isBlogPost.value || isStatsPage.value || isProjectsPage.value)
      ) {
        const tocContainer = document.querySelector('#nav-toc-container')
        if (tocContainer) {
          tocContainer.classList.add('toc-update')
          setTimeout(() => {
            tocContainer.classList.remove('toc-update')
          }, 0)
        }
      }
    })
  },
  { immediate: true }
)
</script>

<style lang="css">
.sticky {
  position: sticky !important;
  top: 0;
  z-index: 10;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
