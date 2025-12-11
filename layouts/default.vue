<template>
  <div id="app-container" class="layout-base">
    <!-- Skip to main content link for accessibility -->
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-2 focus:bg-black focus:text-white"
    >
      Skip to main content
    </a>
    <NuxtLoadingIndicator color="#999999" :height="1" />

    <!-- Single responsive nav -->
    <nav
      v-if="!isStatsSimple"
      class="sticky top-0 z-40 bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-900"
    >
      <div class="max-w-4xl mx-auto px-4 md:px-8">
        <div class="flex items-center justify-between h-14">
          <!-- Logo -->
          <NuxtLink
            to="/"
            class="text-lg font-medium tracking-tight text-zinc-900 dark:text-zinc-100"
          >
            EJ Fox
          </NuxtLink>

          <!-- Nav links - always visible, responsive spacing -->
          <div class="flex items-center gap-1 md:gap-4">
            <template v-for="item in primaryNav" :key="item.href">
              <a
                v-if="item.external"
                :href="item.href"
                class="px-2 py-1 text-sm font-mono text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ item.label }}
              </a>
              <NuxtLink
                v-else
                :to="item.href"
                class="px-2 py-1 text-sm font-mono text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                {{ item.label }}
              </NuxtLink>
            </template>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main content -->
    <main id="main-content" class="min-h-screen">
      <slot />
    </main>

    <Footer />
  </div>
</template>

<script setup>
import { getPrimaryNav } from '~/config/navigation'

const route = useRoute()
const primaryNav = getPrimaryNav()

// Hide nav on /stats?simple
const isStatsSimple = ref(false)

onMounted(() => {
  isStatsSimple.value =
    route.path === '/stats' && route.query?.simple !== undefined
})
</script>
