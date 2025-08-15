<template>
  <div
    id="app-container"
    class="sans-serif w-full min-h-screen bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
  >
    <NuxtLoadingIndicator color="#999999" :height="1" />
    <section class="flex flex-col md:flex-row min-h-screen relative">
      <!-- Mobile navigation - 2025 best practices: Tab bar pattern -->
      <nav
        v-if="!isStatsSimple"
        class="fixed top-0 left-0 w-full z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200/20 dark:border-zinc-800/20 md:hidden"
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
            <a href="/" role="tab" class="flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50">Home</a>
            <a href="/projects" role="tab" class="flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50">Projects</a>
            <a href="/blog/" role="tab" class="flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50">Blog</a>

            <!-- More button for additional links -->
            <button
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
            v-if="mobileMenuOpen"
            id="secondary-nav-menu"
            class="px-4 pb-3 border-t border-zinc-200/30 dark:border-zinc-800/30"
          >
            <div class="flex flex-wrap gap-1 pt-3">
              <a href="/scrapbook/" class="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-full transition-all duration-200" @click="closeMobileMenu">Scrapbook</a>
              <a href="/pottery/" class="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-full transition-all duration-200" @click="closeMobileMenu">Pottery</a>
              <a href="https://ejfox.photos" target="_blank" class="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-full transition-all duration-200" @click="closeMobileMenu">Photos 🔗</a>
              <a href="https://archive.ejfox.com" target="_blank" class="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-full transition-all duration-200" @click="closeMobileMenu">Archive 🔗</a>
            </div>
          </div>
        </Transition>
      </nav>

      <!-- Desktop navigation - DELETED COMPLEX SSR-BREAKING LINKS -->
      <nav
        class="sticky min-w-[240px] h-auto max-h-screen top-0 left-0 z-50 monospace overflow-auto hidden md:block"
      >
        <div class="container mx-auto md:flex md:flex-col items-start w-full max-h-screen">
          <div class="px-6 py-6 space-y-1 w-full">
            <div class="text-zinc-900 dark:text-zinc-100 text-2xl font-bold block mb-8">
              EJ Fox
            </div>
            <div class="space-y-1">
              <a :class="linkClasses" href="/">Home</a>
              <a :class="linkClasses" href="/projects">Projects</a>
              <a :class="linkClasses" href="/blog/">Blog</a>
            </div>
            <div class="my-6"></div>
            <div class="space-y-1">
              <a :class="linkClasses" href="https://ejfox.photos" target="_blank">Photos 🔗</a>
              <a :class="linkClasses" href="https://archive.ejfox.com" target="_blank">Archive 🔗</a>
            </div>
          </div>
          <div class="px-6 mt-auto pt-8 opacity-60 text-xs text-zinc-500 dark:text-zinc-400 hidden md:block">
            <a href="/pgp.txt">PGP: E207 8E65 3FE3 89CD</a>
          </div>
        </div>
      </nav>

      <article 
        class="w-full overflow-x-auto pt-24 md:pt-0"
        :class="{
          'pt-36': mobileMenuOpen
        }"
      >
        <slot />
      </article>
    </section>

    <!-- Global Gear Navigator for gear pages - DELETED SSR-BREAKING COMPONENT -->
    <ClientOnly>
      <GearNavigator 
        v-if="isGearPage" 
        :current-slug="currentGearSlug"
      />
    </ClientOnly>
    
    <Footer />
    <ClientOnly>
      <WebVitalsReporter />
    </ClientOnly>
  </div>
</template>

<script setup>
import { ref, computed, defineAsyncComponent, watch, nextTick } from 'vue'
// Lazy load components
const Footer = defineAsyncComponent(() => import('@/components/Footer.vue'))
const GearNavigator = defineAsyncComponent(() => import('@/components/gear/Navigator.vue'))
const WebVitalsReporter = defineAsyncComponent(() => import('@/components/WebVitalsReporter.vue'))

// SSR-friendly mobile detection - render both and hide with CSS
const isMobile = ref(false)

const mobileMenuOpen = ref(false)

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

// Use Nuxt's built-in composable - should be SSR safe
const route = useRoute()

// Client-only route access to prevent SSR errors
const isStatsSimple = ref(false)
const isBlogPost = ref(false)
const isStatsPage = ref(false)
const isProjectsPage = ref(false)
const isGearPage = ref(false)
const currentGearSlug = ref('')

onMounted(() => {
  // Only detect mobile on client-side after hydration
  const checkMobile = () => {
    isMobile.value = window.innerWidth < 768
  }
  checkMobile()
  window.addEventListener('resize', checkMobile)
  
  onUnmounted(() => {
    window.removeEventListener('resize', checkMobile)
  })
  
  // Only check routes on client-side after hydration
  const updateRouteStates = () => {
    if (!route) return
    
    isStatsSimple.value = route.path === '/stats' && route.query?.simple !== undefined
    isBlogPost.value = route.path?.startsWith('/blog/') && route.path !== '/blog/'
    isStatsPage.value = route.path === '/stats'
    isProjectsPage.value = route.path === '/projects'
    isGearPage.value = route.path?.startsWith('/gear/') || false
    
    if (isGearPage.value) {
      const pathParts = route.path?.split('/') || []
      currentGearSlug.value = pathParts[pathParts.length - 1] || ''
    }
  }
  
  updateRouteStates()
  watch(() => route?.path, updateRouteStates)
})

// DELETE-DRIVEN: Navigation arrays removed, using plain anchor tags now

const linkClasses =
  'block text-sm transition-colors duration-200 hover:text-zinc-900 dark:hover:text-zinc-100 no-underline'

// Add a watcher to update the TOC container visibility when route changes
const tocContainerRef = ref(null)

// TOC watcher moved inside onMounted to be client-only
onMounted(() => {
  // Only check routes on client-side after hydration
  const updateRouteStates = () => {
    if (!route) return
    
    isStatsSimple.value = route.path === '/stats' && route.query?.simple !== undefined
    isBlogPost.value = route.path?.startsWith('/blog/') && route.path !== '/blog/'
    isStatsPage.value = route.path === '/stats'
    isProjectsPage.value = route.path === '/projects'
    isGearPage.value = route.path?.startsWith('/gear/') || false
    
    if (isGearPage.value) {
      const pathParts = route.path?.split('/') || []
      currentGearSlug.value = pathParts[pathParts.length - 1] || ''
    }
    
    // Handle TOC updates
    nextTick(() => {
      if (
        (isBlogPost.value || isStatsPage.value || isProjectsPage.value) &&
        tocContainerRef.value
      ) {
        tocContainerRef.value.classList.add('toc-update')
        setTimeout(() => {
          tocContainerRef.value?.classList.remove('toc-update')
        }, 0)
      }
    })
  }
  
  updateRouteStates()
  watch(() => route?.path, updateRouteStates)
})
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
