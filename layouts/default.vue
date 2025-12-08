<template>
  <div id="app-container" class="layout-base">
    <NuxtLoadingIndicator color="#999999" :height="1" />
    <section class="flex flex-col md:flex-row min-h-screen relative">
      <!-- Mobile navigation - 2025 best practices: Tab bar pattern -->
      <nav v-if="!isStatsSimple" class="header-mobile-sticky">
        <!-- Top bar with branding -->
        <div class="flex items-center justify-between px-4 h-12">
          <a href="/" :class="brandingClasses">EJ Fox</a>
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
            <template v-for="item in primaryNav" :key="item.href">
              <a
                v-if="item.external"
                :href="item.href"
                role="tab"
                class="nav-pill"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ item.label }}
              </a>
              <NuxtLink v-else :to="item.href" role="tab" class="nav-pill">
                {{ item.label }}
              </NuxtLink>
            </template>
          </div>
        </div>
      </nav>

      <!-- Desktop navigation - DELETED COMPLEX SSR-BREAKING LINKS -->
      <nav class="sidebar-sticky">
        <div :class="desktopNavContainerClasses">
          <div class="px-8 py-8 space-y-1 w-full">
            <div :class="headingClasses">EJ Fox</div>
            <div class="space-y-1">
              <template v-for="item in primaryNav" :key="item.href">
                <a
                  v-if="item.external"
                  :href="item.href"
                  :class="linkClasses"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {{ item.label }}{{ item.icon ? ` ${item.icon}` : '' }}
                </a>
                <NuxtLink v-else :to="item.href" :class="linkClasses">
                  {{ item.label }}{{ item.icon ? ` ${item.icon}` : '' }}
                </NuxtLink>
              </template>
            </div>
            <!-- Table of Contents Teleport Target -->
            <div id="nav-toc-container" class="mt-8"></div>
          </div>
        </div>
      </nav>

      <article
        class="w-full pt-24 md:pt-0"
        :class="{
          'pt-36': mobileMenuOpen,
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

const linkClasses = `
  block text-sm font-mono transition-colors-base
  hover:text-zinc-900 dark:hover:text-zinc-100
  no-underline
`
  .trim()
  .split(/\s+/)
  .join(' ')

// Class strings that exceed 80 chars - extracted to constants
const brandingClasses = `
  text-lg font-medium tracking-tight
  text-zinc-900 dark:text-zinc-100
`
  .trim()
  .split(/\s+/)
  .join(' ')

const secondaryNavMenuClasses = `
  px-4 pb-4 border-t
  border-zinc-200/30 dark:border-zinc-800/30
`
  .trim()
  .split(/\s+/)
  .join(' ')

const desktopNavContainerClasses = `
  container mx-auto md:flex md:flex-col
  items-start w-full max-h-screen
`
  .trim()
  .split(/\s+/)
  .join(' ')

const headingClasses = `
  text-zinc-900 dark:text-zinc-100 text-2xl
  font-bold block mb-8
`
  .trim()
  .split(/\s+/)
  .join(' ')

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
