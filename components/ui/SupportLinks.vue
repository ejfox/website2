<!--
  @file SupportLinks.vue
  @description Compact hire/sponsor links for sidebars - Book a call + GitHub Sponsors
  @props variant: 'sidebar' | 'inline' - display style (default: sidebar)
-->
<template>
  <div :class="containerClasses">
    <h3 v-if="variant === 'sidebar'" class="label-uppercase-mono text-xs mb-3">
      Work with me
    </h3>

    <div class="space-y-2">
      <!-- Book a call - primary CTA -->
      <a
        href="https://cal.com/ejfox/30min"
        target="_blank"
        rel="noopener"
        class="cta-link group"
      >
        <svg
          class="w-4 h-4 text-blue-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span>Book a call</span>
        <span class="text-zinc-400 dark:text-zinc-600 text-xs ml-auto">
          30min
        </span>
      </a>

      <!-- Consulting page -->
      <NuxtLink to="/consulting" class="cta-link group">
        <svg
          class="w-4 h-4 text-emerald-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path d="M20 7h-9" />
          <path d="M14 17H5" />
          <circle cx="17" cy="17" r="3" />
          <circle cx="7" cy="7" r="3" />
        </svg>
        <span>Hire me</span>
        <span class="text-zinc-400 dark:text-zinc-600 text-xs ml-auto">
          consulting
        </span>
      </NuxtLink>

      <!-- GitHub Sponsors -->
      <a
        href="https://github.com/sponsors/ejfox"
        target="_blank"
        rel="noopener"
        class="cta-link group"
      >
        <svg
          class="w-4 h-4 text-pink-500"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          />
        </svg>
        <span>Sponsor</span>
        <span class="text-zinc-400 dark:text-zinc-600 text-xs ml-auto">
          GitHub
        </span>
      </a>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'sidebar',
    validator: (v) => ['sidebar', 'inline'].includes(v),
  },
})

const containerClasses = computed(() => {
  if (props.variant === 'sidebar') {
    return 'pt-6 border-t border-zinc-200 dark:border-zinc-800'
  }
  return ''
})
</script>

<style scoped>
.cta-link {
  @apply flex items-center gap-2 text-sm py-1.5;
  @apply text-zinc-600 dark:text-zinc-400;
  @apply hover:text-zinc-900 dark:hover:text-zinc-100;
  @apply transition-colors duration-150;
}

.cta-link:hover svg {
  @apply scale-110;
  transition: transform 150ms ease;
}
</style>
