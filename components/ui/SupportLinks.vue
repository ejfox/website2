<!--
  @file SupportLinks.vue
  @description Compact hire/sponsor links for sidebars - Book a call + GitHub Sponsors
  @props variant: 'sidebar' | 'inline' - display style (default: sidebar)
-->
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
    return ''
  }
  return ''
})
</script>

<template>
  <div :class="containerClasses">
    <h3 v-if="variant === 'sidebar'" class="label-uppercase-mono text-2xs mb-2">
      Work with me
    </h3>

    <div class="space-y-1">
      <!-- Book a call - primary CTA -->
      <a
        href="https://cal.com/ejfox/30min"
        target="_blank"
        rel="noopener"
        class="cta-link group"
      >
        <span>Book a call</span>
      </a>

      <!-- Consulting page -->
      <NuxtLink to="/consulting" class="cta-link group">
        <span>Hire me</span>
      </NuxtLink>

      <!-- GitHub Sponsors -->
      <a
        href="https://github.com/sponsors/ejfox"
        target="_blank"
        rel="noopener"
        class="cta-link group"
      >
        <span>Sponsor</span>
      </a>
    </div>
  </div>
</template>

<style scoped>
.cta-link {
  @apply flex items-center gap-1.5 text-xs py-1;
  @apply text-zinc-600 dark:text-zinc-400;
  @apply hover:text-zinc-900 dark:hover:text-zinc-100;
  @apply transition-colors duration-150;
  @apply whitespace-nowrap overflow-hidden;
}

.cta-link:hover svg {
  @apply scale-110;
  transition: transform 150ms ease;
}
</style>
