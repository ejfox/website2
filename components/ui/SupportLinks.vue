<!--
  @file SupportLinks.vue
  @description Compact "Book a call" (cal.com, Umami consulting-book) and
    "Sponsor" (GitHub Sponsors) links. Used in the sidebar of
    pages/projects/[slug].vue.
  @props variant: 'sidebar' | 'inline' - 'sidebar' adds the "Work with me"
    heading; otherwise identical (containerClasses is '' for both)
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
    <!-- Not uppercased (the caps read as shouty for no reason); slightly
         bolder and white in dark mode. Kept dark-in-light so it doesn't
         vanish against the light sidebar. -->
    <h3
      v-if="variant === 'sidebar'"
      class="font-mono text-2xs font-medium tracking-wide text-zinc-900 dark:text-white mb-2"
    >
      Work with me
    </h3>

    <div class="space-y-1">
      <!-- Book a call - primary CTA -->
      <a
        href="https://cal.com/ejfox/30min"
        data-umami-event="consulting-book"
        data-umami-event-location="support-links"
        target="_blank"
        rel="noopener"
        class="cta-link group"
      >
        <span>Book a call</span>
      </a>

      <!-- Note: "Hire me" → /consulting lives in the primary nav already
           (utils/navigation.ts), so it's intentionally NOT repeated
           here to avoid duplicating it in sidebars that show both. -->

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

/* No <svg> in the template any more, so this rule currently matches nothing. */
.cta-link:hover svg {
  @apply scale-110;
  transition: transform 150ms ease;
}
</style>
