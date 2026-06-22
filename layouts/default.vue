<script setup>
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

<template>
  <!-- Flex-column shell: the grid holds bar/nav/sidebar/main; the footer lives
       OUTSIDE #app-container on purpose. A sticky element clamps to its parent's
       content box, so while the footer was a grid child the sticky sidebar could
       travel down over it. As a sibling below the grid, the sidebar clamps at
       main's bottom and the footer always clears it. flex-1 keeps the footer
       pinned to the viewport bottom on short pages, and #app-container is
       natural-height (no min-h / no flex-1) so short posts don't get a void
       above the footer — the leftover space falls below it as background. -->
  <div
    class="w-full min-h-screen flex flex-col bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
  >
    <div
      id="app-container"
      :class="['w-full min-w-0', isStatsSimple ? '' : 'layout-grid']"
    >
      <a
        href="#main-content"
        class="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-2 focus:bg-black focus:text-white"
      >
        Skip to main content
      </a>
    <NuxtLoadingIndicator color="#999999" :height="1" />

    <!-- Page-chrome bar slot. Blog posts (and any future pages) teleport
         their chrome into this slot. Empty on non-blog routes — the grid
         row auto-collapses to 0. -->
    <header
      v-if="!isStatsSimple"
      id="layout-bar"
      class="layout-bar sticky top-0 z-[100] print:hidden"
    ></header>

    <!-- Mobile nav -->
    <nav
      v-if="!isStatsSimple"
      class="layout-mobile-nav md:hidden px-4 py-3 font-mono text-sm flex flex-wrap gap-x-3 gap-y-1 items-baseline"
    >
      <NuxtLink to="/" class="font-bold text-zinc-800 dark:text-zinc-200">
        EJ Fox
      </NuxtLink>
      <template v-for="item in primaryNav" :key="item.href">
        <NuxtLink
          v-if="item.href !== '/'"
          :to="item.href"
          class="text-zinc-500 dark:text-zinc-400"
        >
          {{ item.label }}
        </NuxtLink>
      </template>
    </nav>

    <!-- Desktop sidebar -->
    <nav
      v-if="!isStatsSimple"
      class="layout-sidebar hidden md:flex md:flex-col w-[200px] px-3 py-4 font-mono sticky top-0 self-start max-h-screen overflow-y-auto z-50"
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
      </div>

      <div id="nav-toc-container" class="mt-4 px-2 pt-4 pb-4"></div>

      <div v-if="isBlogPost" class="mt-4">
        <NuxtLink
          to="/blog/"
          class="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          <span>&larr;</span>
          <span>Back to Blog</span>
        </NuxtLink>
      </div>

      <div class="mt-auto pt-4 px-2 text-2xs text-zinc-500 dark:text-zinc-400">
        <a href="/pgp.txt" class="hover:text-zinc-700 dark:hover:text-zinc-200">
          PGP: E207 8E65
        </a>
      </div>
    </nav>

    <article id="main-content" class="layout-main min-w-0">
      <!-- Inner wrapper owns horizontal-overflow clipping so the layout's
           sticky bar isn't trapped in an overflow context. -->
      <div class="overflow-x-clip">
        <slot />
      </div>
    </article>

    </div>
    <!-- /#app-container — footer is a sibling so the sticky sidebar can't overlap it -->

    <UiFooter />
    <UiWebVitalsReporter />
  </div>
</template>

<style scoped>
/*
 * Scoped CSS holds the one thing Tailwind can't express cleanly: named
 * grid-template-areas. Each element opts into its area below; positioning,
 * spacing, and colors stay in Tailwind utilities on the elements themselves.
 */
.layout-grid {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto auto 1fr;
  grid-template-areas:
    'bar'
    'nav'
    'main';
}

@media (min-width: theme('screens.md')) {
  .layout-grid {
    grid-template-columns: 200px minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr);
    /* Sidebar spans bar + main rows so it gets full viewport height while
       the bar sits over only the main column. The footer is NOT a grid area —
       it's a sibling below #app-container so the sticky sidebar clamps to
       main's bottom and can never overlap it. */
    grid-template-areas:
      'sidebar bar'
      'sidebar main';
  }
}

.layout-bar {
  grid-area: bar;
}

.layout-mobile-nav {
  grid-area: nav;
}

.layout-sidebar {
  grid-area: sidebar;
}

.layout-main {
  grid-area: main;
}
</style>
