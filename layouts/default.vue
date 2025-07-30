<template>
  <div
    id="app-container"
    class="sans-serif w-full min-h-screen bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
  >
    <NuxtLoadingIndicator color="#999999" :height="1" />
    <section class="flex flex-col md:flex-row min-h-screen relative">
      <!-- Mobile navigation - 2025 best practices: Tab bar pattern -->
      <nav
        v-if="
          isMobile &&
            !(route.path === '/stats' && route.query.simple !== undefined)
        "
        class="fixed top-0 left-0 w-full z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200/20 dark:border-zinc-800/20"
      >
        <!-- Top bar with branding -->
        <div class="flex items-center justify-between px-4 h-14">
          <NuxtLink
            to="/"
            class="text-lg font-medium tracking-tight text-zinc-900 dark:text-zinc-100"
          >
            EJ Fox
          </NuxtLink>
          <div class="w-6"></div>
          <!-- Spacer for visual balance -->
        </div>

        <!-- Visible tab navigation - no hidden menu -->
        <div class="px-4 pb-3">
          <div
            class="flex items-center gap-1 overflow-x-auto scrollbar-hide"
            role="tablist"
            aria-label="Main navigation"
          >
            <NuxtLink
              v-for="link in primaryNavLinks"
              :key="link.to"
              :to="link.to"
              role="tab"
              :aria-selected="
                route.path === link.to ||
                  (link.to !== '/' && route.path.startsWith(link.to))
              "
              class="flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200"
              :class="
                route.path === link.to ||
                  (link.to !== '/' && route.path.startsWith(link.to))
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
              "
            >
              {{ link.text }}
            </NuxtLink>

            <!-- More button for additional links -->
            <button
              v-if="secondaryNavLinks.length > 0"
              :aria-expanded="mobileMenuOpen"
              aria-controls="secondary-nav-menu"
              aria-label="Show more navigation options"
              class="flex-shrink-0 px-3 py-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-full transition-all duration-200"
              :class="
                mobileMenuOpen
                  ? 'bg-zinc-100 dark:bg-zinc-800'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
              "
              @click="toggleMobileMenu"
            >
              More
            </button>
          </div>
        </div>

        <!-- Expandable secondary menu -->
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          leave-active-class="transition-all duration-150 ease-in"
          enter-from-class="opacity-0 -translate-y-1 scale-95"
          enter-to-class="opacity-100 translate-y-0 scale-100"
          leave-from-class="opacity-100 translate-y-0 scale-100"
          leave-to-class="opacity-0 -translate-y-1 scale-95"
        >
          <div
            v-if="mobileMenuOpen && secondaryNavLinks.length > 0"
            id="secondary-nav-menu"
            class="px-4 pb-3 border-t border-zinc-200/30 dark:border-zinc-800/30"
          >
            <div class="flex flex-wrap gap-1 pt-3">
              <NuxtLink
                v-for="link in secondaryNavLinks"
                :key="link.to"
                :to="link.external ? link.to : link.to"
                :target="link.external ? '_blank' : undefined"
                class="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-full transition-all duration-200"
                @click="closeMobileMenu"
              >
                {{ link.text }}
                <Icon
                  v-if="link.external"
                  name="heroicons:arrow-top-right-on-square"
                  class="w-3 h-3 ml-1 inline opacity-60"
                />
              </NuxtLink>
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
            <div ref="primaryNavRef" class="space-y-1">
              <NuxtLink :class="linkClasses + ' nav-link-primary'" to="/">
                Home
              </NuxtLink>
              <NuxtLink
                :class="linkClasses + ' nav-link-primary'"
                to="/projects"
              >
                Projects
              </NuxtLink>
              <NuxtLink :class="linkClasses + ' nav-link-primary'" to="/blog/">
                Blog
              </NuxtLink>
            </div>

            <!-- <NuxtLink :class="linkClasses" to="/scrapbook/">Scrapbook</NuxtLink> -->
            <!-- <NuxtLink :class="linkClasses" to="/pottery/">Pottery</NuxtLink> -->

            <div class="my-6"></div>

            <div ref="secondaryNavRef" class="space-y-1">
              <NuxtLink
                :class="linkClasses + ' nav-link-secondary'"
                to="https://ejfox.photos"
              >
                <span class="justify-between">
                  <span>Photos</span>
                  <Icon name="mdi:external-link" class="w-3 h-3 opacity-50" />
                </span>
              </NuxtLink>

              <NuxtLink
                :class="linkClasses + ' nav-link-secondary'"
                to="https://archive.ejfox.com"
              >
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
          <div
            id="nav-toc-container"
            ref="tocContainerRef"
            class="sans-serif"
          ></div>
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

      <article
        :class="[
          'w-full overflow-x-auto',
          isMobile &&
            !(route.path === '/stats' && route.query.simple !== undefined)
            ? 'pt-20'
            : ''
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
import { ref, computed, defineAsyncComponent, watch, nextTick } from 'vue'
import { useWindowSize } from '@vueuse/core'

// Lazy load the Footer component
const Footer = defineAsyncComponent(() => import('@/components/Footer.vue'))

const { width } = useWindowSize()
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

// Split navigation for mobile: primary (always visible) vs secondary (in "More")
const primaryNavLinks = computed(() => [
  { to: '/', text: 'Home' },
  { to: '/projects', text: 'Projects' },
  { to: '/blog/', text: 'Blog' }
])

const secondaryNavLinks = computed(() => [
  { to: '/scrapbook/', text: 'Scrapbook' },
  { to: '/pottery/', text: 'Pottery' },
  { to: 'https://ejfox.photos', text: 'Photos', external: true },
  { to: 'https://archive.ejfox.com', text: 'Archive', external: true }
])

const linkClasses =
  'block text-sm transition-colors duration-200 hover:text-zinc-900 dark:hover:text-zinc-100 no-underline'

// Add a watcher to update the TOC container visibility when route changes
const tocContainerRef = ref(null)

watch(
  () => [route.path, isBlogPost.value, isStatsPage.value, isProjectsPage.value],
  () => {
    nextTick(() => {
      // Force re-render of TOC container when route changes - using template ref
      if (
        process.client &&
        (isBlogPost.value || isStatsPage.value || isProjectsPage.value) &&
        tocContainerRef.value
      ) {
        // Trigger a DOM update by toggling a class
        tocContainerRef.value.classList.add('toc-update')
        setTimeout(() => {
          tocContainerRef.value?.classList.remove('toc-update')
        }, 0)
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

/* Pure anime.js-driven navigation - NO HOVER EFFECTS */
.nav-link-primary {
  position: relative;
  opacity: 0.7; /* Start subtle for animation */
  will-change: transform, opacity;
}

.nav-link-primary::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 50%;
  transform: translateY(-50%);
  width: 1px;
  height: 0;
  background: currentColor;
  opacity: 0.2;
}

.nav-link-secondary {
  opacity: 0.5; /* Start subtle for animation */
  will-change: transform, opacity;
}

/* Data-driven separator for visual hierarchy */
.my-6 {
  position: relative;
}

.my-6::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  width: 8px;
  height: 1px;
  background: currentColor;
  opacity: 0.1;
}

/* REFINED MINIMALIST PAGE TRANSITIONS */
main,
article,
[role='main'] {
  will-change: opacity, transform, filter;
  backface-visibility: hidden;
  /* Ensure smooth transitions without layout shifts */
  contain: layout style;
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  main,
  article,
  [role='main'] {
    will-change: auto !important;
  }
}

/* Hide scrollbars while maintaining functionality */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
