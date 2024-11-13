<template>
  <div id="app-container" class="sans-serif w-full">
    <NuxtLoadingIndicator />
    <section class="flex flex-col md:flex-row min-h-screen relative">
      <!-- Mobile navigation -->
      <nav v-if="isMobile" class="fixed top-0 left-0 w-full z-50 bg-zinc-100 dark:bg-zinc-900 p-2">
        <div class="flex justify-between items-center">
          <NuxtLink class="text-zinc-800 dark:text-zinc-400 text-xl font-bold" to="/">EJ Fox</NuxtLink>
          <button @click="toggleMobileMenu" class="text-zinc-800 dark:text-zinc-400">
            <UIcon :name="mobileMenuOpen ? 'i-heroicons-x-mark' : 'i-heroicons-bars-3'" class="w-6 h-6" />
          </button>
        </div>
        <Transition name="slide-down">
          <div v-if="mobileMenuOpen" class="mt-2">
            <NuxtLink v-for="link in navLinks" :key="link.to" :to="link.to" :class="linkClasses"
              @click="closeMobileMenu">
              {{ link.text }}
              <UIcon v-if="link.external" name="i-ei-external-link" class="w-3 h-3 inline-block" />
            </NuxtLink>

            <div class="border-t border-zinc-200 dark:border-zinc-800 mt-2 pt-2">
              <div class="px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
                <a href="/pgp.txt" class="hover:text-zinc-800 dark:hover:text-zinc-300">
                  PGP: E207 8E65...
                </a>
                <NuxtLink to="/verify" class="hover:text-zinc-800 dark:hover:text-zinc-300">
                  verify →
                </NuxtLink>
              </div>
            </div>
          </div>
        </Transition>
      </nav>

      <!-- Desktop navigation -->
      <nav v-else class="sticky w-52 h-auto max-h-screen top-0 left-0 z-50 p-4 monospace overflow-auto">
        <div
          class="container mx-auto md:py-1 md:flex md:flex-col items-start shadow-lg dark:shadow-none w-full md:shadow-none border-b border-zinc-300 dark:border-zinc-900 md:border-none rounded bg-zinc-50/50 dark:bg-zinc-900/30 md:dark:bg-transparent backdrop-blur-md px-2 max-h-screen">
          <div class="pt-3 pb-1 space-y-2">
            <!-- Updated class: items-start -->
            <NuxtLink class="text-zinc-800 dark:text-zinc-400 md:text-xl font-bold px-2 md:p-4 md:mb-2 block" to="/">EJ
              Fox
            </NuxtLink>
            <NuxtLink :class="linkClasses" to="/"> Home </NuxtLink>
            <NuxtLink :class="linkClasses" to="/projects"> Projects </NuxtLink>
            <NuxtLink :class="linkClasses" to="/blog/">Blog </NuxtLink>

            <NuxtLink :class="linkClasses" to="/scrapbook/">Scrapbook</NuxtLink>
            <!-- <NuxtLink :class="linkClasses" to="/pottery/">Pottery</NuxtLink> -->

            <NuxtLink :class="linkClasses" to="https://ejfox.photos">
              Photos
              <UIcon name="i-ei-external-link" class="w-3 md:w-4 h-3 md:h-4 inline-block" />
            </NuxtLink>

          </div>

          <div class="mt-8 px-4 opacity-50 hover:opacity-100 transition-opacity group hidden md:block">
            <svg id="pgp-fingerprint" width="200" height="32" class="w-full">
              <!-- Will be populated by D3 -->
            </svg>
            <div class="text-xs mt-1 text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
              <a href="/pgp.txt" class="hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors">
                PGP: E207 8E65 3FE3 89CD
              </a>
              <NuxtLink to="/verify"
                class="opacity-0 group-hover:opacity-100 transition-opacity hover:text-zinc-800 dark:hover:text-zinc-300">
                verify →
              </NuxtLink>
            </div>
          </div>
        </div>

        <div id="toc-container"></div>

        <div v-if="isBlogPost" class="mt-4 pl-4">
          <UButton to="/blog/" size="sm" class="" icon="i-heroicons-arrow-left" :color="isDark ? 'white' : 'black'">
            Back to Blog
          </UButton>
        </div>

      </nav>


      <article class="w-full md:w-5/6 mt-16 md:mt-0">
        <NuxtPage />
      </article>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useWindowSize } from '@vueuse/core'

const { width } = useWindowSize()
const isDark = useDark()
const isMobile = computed(() => width.value < 768)

const mobileMenuOpen = ref(false)

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

const route = useRoute()

const isBlog = computed(() => {
  return route.path.startsWith('/blog')
})

const isBlogPost = computed(() => {
  // return route.path.startsWith('/blog/')
  // except we don't want the blog index page
  return route.path.startsWith('/blog/') && route.path !== '/blog/'
})

const navLinks = [
  { to: '/', text: 'Home' },
  { to: '/projects', text: 'Projects' },
  { to: '/blog/', text: 'Blog' },
  { to: '/scrapbook/', text: 'Scrapbook' },
  { to: '/pottery/', text: 'Pottery' },
  { to: 'https://ejfox.photos', text: 'Photos', external: true },
]

const linkClasses = "block px-4 py-2 text-sm hover:bg-zinc-200/30 dark:hover:bg-zinc-700/30 rounded"
</script>

<style>
.sans-serif {
  font-family: 'Signika Negative', sans-serif !important;
  /* font-family: 'Raleway', Helvetica, Arial, sans-serif !important; */
  font-weight: 300;
}


.monospace {
  font-family: 'Red Hat Mono', monospace !important;
}

h1,
h2,
h3,
.font-fjalla {
  font-family: 'Fjalla One', sans-serif !important;
}

.sticky {
  position: sticky !important;
  top: 0;
  z-index: 10;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: max-height 0.3s ease-in-out, opacity 0.3s ease-in-out;
  max-height: 300px;
  opacity: 1;
}

.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
