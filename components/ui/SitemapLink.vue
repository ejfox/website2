<!--
  @file SitemapLink.vue
  @description Sitemap link component with title, description, and internal/external link support
  @props to: string - Link URL (internal path or external URL)
  @props title: string - Link title
  @props description: string - Link description
  @props external: boolean - Whether link is external (default: false)
-->
<template>
  <div :class="['group', 'rounded-lg p-4 -m-4']">
    <component
      :is="external ? 'a' : 'NuxtLink'"
      :to="external ? undefined : to"
      :href="external ? to : undefined"
      :target="external ? '_blank' : undefined"
      :rel="external ? 'noopener noreferrer' : undefined"
      class="block"
    >
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1 min-w-0">
          <h3
            :class="[
              'font-medium text-zinc-900 dark:text-zinc-100',
              'group-hover:text-zinc-700 dark:group-hover:text-zinc-300',
              'transition-colors',
            ]"
          >
            {{ title }}
            <span v-if="external" class="text-xs text-zinc-400 ml-1">↗</span>
          </h3>
          <p
            :class="[
              'text-sm text-zinc-600 dark:text-zinc-400 mt-2',
              'leading-relaxed',
            ]"
          >
            {{ description }}
          </p>
        </div>
        <span class="icon-muted-hover">→</span>
      </div>
    </component>
  </div>
</template>

<script setup>
defineProps({
  to: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  external: {
    type: Boolean,
    default: false,
  },
})
</script>
