<template>
  <div id="app-container" class="layout-base">
    <NuxtLoadingIndicator color="#999999" :height="1" />
    <section class="flex flex-col md:flex-row min-h-screen relative">
      <!-- Mobile navigation - 2025 best practices: Tab bar pattern -->
      <nav v-if="!isStatsSimple" class="header-mobile-sticky">
        <!-- Top bar with branding -->
        <div class="flex items-center justify-between px-4 h-12">
          <a
            href="/"
            class="text-lg font-medium tracking-tight text-zinc-900 dark:text-zinc-100"
          >
            EJ Fox
          </a>
          <div class="w-6"></div>
          <!-- Spacer for visual balance -->
        </div>

        <!-- Visible tab navigation - no hidden menu -->
        <div class="px-4 pb-2">
          <div
            class="flex items-center gap-1 overflow-x-auto scrollbar-hide"
            role="tablist"
            aria-label="Main navigation"
          >
            <a
              v-for="item in primaryNav"
              :key="item.href"
              :href="item.href"
              role="tab"
              class="nav-pill"
              >{{ item.label }}</a
            >

            <!-- More button for additional links -->
            <button
              :aria-expanded="mobileMenuOpen"
              aria-controls="secondary-nav-menu"
              aria-label="Show more navigation options"
              class="nav-pill-simple"
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
            class="px-4 pb-4 border-t border-zinc-200/30 dark:border-zinc-800/30"
          >
            <div class="flex flex-wrap gap-1 pt-4">
              <a
                v-for="item in secondaryNav"
                :key="item.href"
                :href="item.href"
                :target="item.external ? '_blank' : undefined"
                class="nav-pill-hover"
                @click="closeMobileMenu"
                >{{ item.label }}{{ item.icon ? ` ${item.icon}` : '' }}</a
              >
            </div>
          </div>
        </Transition>
      </nav>

      <!-- Desktop navigation - DELETED COMPLEX SSR-BREAKING LINKS -->
      <nav class="sidebar-sticky">
        <div
          class="container mx-auto md:flex md:flex-col items-start w-full max-h-screen"
        >
          <div class="px-8 py-8 space-y-1 w-full">
            <div
              class="text-zinc-900 dark:text-zinc-100 text-2xl font-bold block mb-8"
            >
              EJ Fox
            </div>
            <div class="space-y-1">
              <a
                v-for="item in primaryNav"
                :key="item.href"
                :class="linkClasses"
                :href="item.href"
                :target="item.external ? '_blank' : undefined"
                >{{ item.label }}{{ item.icon ? ` ${item.icon}` : '' }}</a
              >
            </div>
            <div class="my-8"></div>
            <div class="space-y-1">
              <a
                v-for="item in secondaryNav"
                :key="item.href"
                :class="linkClasses"
                :href="item.href"
                :target="item.external ? '_blank' : undefined"
                >{{ item.label }}{{ item.icon ? ` ${item.icon}` : '' }}</a
              >
            </div>
            <!-- Table of Contents Teleport Target -->
            <div id="nav-toc-container" class="mt-8"></div>

            <!-- Calendar TOC removed - causing hydration mismatch -->
          </div>
          <div class="footer-sidebar">
            <a href="/pgp.txt"
              >PGP: <span class="font-mono">E207 8E65 3FE3 89CD</span></a
            >
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

    <!-- Components removed to prevent hydration flicker -->
    <Footer />
  </div>
</template>

<script setup>
// Nuxt 4 auto-imports everything - DELETE manual imports!
import { getPrimaryNav, getSecondaryNav } from '~/config/navigation'

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

// Simplified to prevent hydration flickering
const isStatsSimple = ref(false)

// Navigation config
const primaryNav = getPrimaryNav()
const secondaryNav = getSecondaryNav()

const linkClasses =
  'block text-sm font-mono transition-colors-base hover:text-zinc-900 dark:hover:text-zinc-100 no-underline'

// Simplified onMounted to prevent flickering
onMounted(() => {
  // Only basic mobile detection
  const checkMobile = () => {
    isMobile.value = window.innerWidth < 768
  }
  checkMobile()
  window.addEventListener('resize', checkMobile)

  // Simple stats check
  isStatsSimple.value =
    route.path === '/stats' && route.query?.simple !== undefined

  onUnmounted(() => {
    window.removeEventListener('resize', checkMobile)
  })
})
</script>

<style lang="css"></style>
