<!--
  @file StatsSectionHeader.vue
  @description Small uppercase sub-heading with a hairline rule, used inside
    the components/stats/* sections (e.g. "LAST.FM TOP ARTISTS").
  @props title: string - Header text
-->
<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <!-- h3: these sit under the page's h2 section titles (an h4 skipped a
       level, which Lighthouse heading-order flags) -->
  <h3 class="section-subheader">
    {{ title }}
  </h3>
</template>

<style scoped>
.section-subheader {
  @apply tracking-wider text-zinc-500 border-b pb-1 mb-4;
  @apply border-zinc-200 dark:border-zinc-800/30;
  font-size: 0.65rem;
  line-height: 1rem;
  /* the old h4 got no heading font; global h3 sets Vault Alarm, so keep what
     it rendered with */
  font-family: inherit;
}
</style>
