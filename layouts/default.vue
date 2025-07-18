<template>
  <div
    id="app-container"
    class="sans-serif w-full min-h-screen bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
  >
    <NuxtLoadingIndicator color="#999999" :height="1" />
    <section class="flex flex-col md:flex-row min-h-screen relative">
      <!-- Mobile navigation - hide on stats page with simple mode -->
      <nav
        v-if="
          isMobile &&
            !(route.path === '/stats' && route.query.simple !== undefined)
        "
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
              <Icon
                :name="mobileMenuOpen ? 'heroicons:x-mark' : 'heroicons:bars-3'"
                class="w-6 h-6"
              />
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
              <NuxtLink
                v-for="(link, index) in navLinks"
                :key="link.to"
                :to="link.to"
                class="justify-between py-3 px-3 rounded-lg text-base transition-colors"
                :class="[
                  'hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50',
                  route.path === link.to
                    ? 'text-zinc-900 dark:text-zinc-100 bg-zinc-200/30 dark:bg-zinc-800/30'
                    : 'text-zinc-600 dark:text-zinc-400'
                ]"
                :style="{
                  animation: `fadeIn 0.2s ease-out forwards ${index * 0.05}s`
                }"
                @click="closeMobileMenu"
              >
                <span>{{ link.text }}</span>
                <Icon
                  v-if="link.external"
                  name="heroicons:arrow-top-right-on-square"
                  class="w-4 h-4 ml-2 opacity-60"
                />
              </NuxtLink>
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

      <!-- Desktop navigation - hide on stats page with simple mode -->
      <nav
        v-else-if="
          !(route.path === '/stats' && route.query.simple !== undefined)
        "
        class="sticky min-w-[240px] h-auto max-h-screen top-0 left-0 z-50 monospace overflow-auto"
      >
        <div
          class="container mx-auto md:flex md:flex-col items-start w-full max-h-screen"
        >
          <div class="px-6 py-6 space-y-1 w-full">
            <!-- Updated class: items-start -->
            <NuxtLink
              class="text-zinc-900 dark:text-zinc-100 text-2xl font-bold block mb-8"
              to="/"
            >
              EJ Fox
            </NuxtLink>
            <div class="space-y-1">
              <NuxtLink :class="linkClasses" to="/">
                Home
              </NuxtLink>
              <NuxtLink :class="linkClasses" to="/projects">
                Projects
              </NuxtLink>
              <NuxtLink :class="linkClasses" to="/blog/">
                Blog
              </NuxtLink>
            </div>

            <!-- <NuxtLink :class="linkClasses" to="/scrapbook/">Scrapbook</NuxtLink> -->
            <!-- <NuxtLink :class="linkClasses" to="/pottery/">Pottery</NuxtLink> -->

            <div class="my-6"></div>

            <div class="space-y-1">
              <NuxtLink :class="linkClasses" to="https://ejfox.photos">
                <span class="justify-between">
                  <span>Photos</span>
                  <Icon name="mdi:external-link" class="w-3 h-3 opacity-50" />
                </span>
              </NuxtLink>

              <NuxtLink :class="linkClasses" to="https://archive.ejfox.com">
                <span class="justify-between">
                  <span>Archive</span>
                  <Icon name="mdi:external-link" class="w-3 h-3 opacity-50" />
                </span>
              </NuxtLink>
            </div>
          </div>

          <div
            class="px-6 mt-auto pt-8 opacity-60 hover:opacity-100 transition-opacity group hidden md:block"
          >
            <div class="text-xs text-zinc-500 dark:text-zinc-400">
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
        <div v-if="isBlogPost || isStatsPage || isProjectsPage" class="mt-8">
          <div id="nav-toc-container" class="sans-serif"></div>
        </div>

        <div v-if="isBlogPost" class="px-6 py-4">
          <NuxtLink
            to="/blog/"
            class="inline- gap-2 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <Icon name="heroicons:arrow-left" class="w-3 h-3" />
            <span>Back to Blog</span>
          </NuxtLink>
        </div>
      </nav>

      <article :class="['w-full overflow-x-auto']">
        <slot />
      </article>
    </section>

    <Footer />
    <WebVitalsReporter />
  </div>
</template>

<script setup>
import {
  ref,
  computed,
  defineAsyncComponent,
  onMounted as _onMounted,
  watch,
  nextTick
} from 'vue'
import { useWindowSize, useDark } from '@vueuse/core'

// Lazy load the Footer component
const Footer = defineAsyncComponent(() => import('@/components/Footer.vue'))

const { width } = useWindowSize()
const _isDark = useDark()
const isMobile = computed(() => width.value < 768)

const mobileMenuOpen = ref(false)

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

const route = useRoute()

const _isBlog = computed(() => {
  return route.path.startsWith('/blog')
})

const isBlogPost = computed(() => {
  return route.path.startsWith('/blog/') && route.path !== '/blog/'
})

const isStatsPage = computed(() => {
  return route.path === '/stats'
})

const isProjectsPage = computed(() => {
  return route.path === '/projects'
})

const navLinks = [
  { to: '/', text: 'Home' },
  { to: '/projects', text: 'Projects' },
  { to: '/blog/', text: 'Blog' },
  { to: '/scrapbook/', text: 'Scrapbook' },
  { to: '/pottery/', text: 'Pottery' },
  { to: 'https://ejfox.photos', text: 'Photos', external: true },
  { to: 'https://archive.ejfox.com', text: 'Archive', external: true }
]

const linkClasses =
  'block text-sm transition-colors duration-200 hover:text-zinc-900 dark:hover:text-zinc-100 no-underline'

// Add a watcher to update the TOC container visibility when route changes
watch(
  () => [route.path, isBlogPost.value, isStatsPage.value, isProjectsPage.value],
  () => {
    nextTick(() => {
      // Force re-render of TOC container when route changes
      if (
        process.client &&
        (isBlogPost.value || isStatsPage.value || isProjectsPage.value)
      ) {
        const tocContainer = document.querySelector('#toc-container')
        if (tocContainer) {
          // Trigger a DOM update by toggling a class
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

/* View Transitions API support - REMOVED */
/*
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}

::view-transition-old(root) {
  z-index: 1;
}

::view-transition-new(root) {
  z-index: 2147483646;
}

/* Default animations for view transitions */
@keyframes slide-from-right {
  from {
    transform: translateX(30px);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slide-to-left {
  from {
    transform: translateX(0);
    opacity: 1;
  }

  to {
    transform: translateX(-30px);
    opacity: 0;
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes fade-out {
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
  }
}

/* Apply animations to all view transitions by default */
::view-transition-old(*) {
  animation: 300ms cubic-bezier(0.45, 0, 0.55, 1) both slide-to-left;
}

::view-transition-new(*) {
  animation: 300ms cubic-bezier(0.4, 0, 0.55, 1) both slide-from-right;
}

/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none !important;
  }
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition:
    max-height 0.3s ease-in-out,
    opacity 0.3s ease-in-out;
  max-height: 300px;
  opacity: 1;
}

.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
}

/* Staggered nav link animations */
.nav-links-enter-active,
.nav-links-leave-active {
  transition: all 0.3s ease-out;
}

.nav-links-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.nav-links-enter-active {
  transition-delay: calc(var(--index) * 100ms);
}

.nav-links-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.nav-links-move {
  transition: transform 0.5s ease-out;
}

/* Add this to ensure hardware acceleration */
.nav-links-item {
  backface-visibility: hidden;
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
