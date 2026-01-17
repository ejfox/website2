<!--
  @file PostTOC.vue
  @description Table of contents for blog post sidebar
  @props tocChildren - array of { slug, text }, activeSection - current section id
-->
<template>
  <div v-if="tocChildren.length > 0" class="toc">
    <div class="py-4 pl-0 relative">
      <ul class="space-y-0">
        <li
          v-for="(child, index) in tocChildren"
          :key="child.slug"
          class="group relative"
        >
          <a
            :href="`#${child.slug}`"
            :class="[
              'flex items-baseline text-sm transition-all duration-200 no-underline py-2 gap-2',
              isActive(child.slug)
                ? 'text-zinc-900 dark:text-zinc-100 font-medium'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:translate-x-1',
            ]"
          >
            <span
              :class="[
                'font-mono text-xs tabular-nums w-4 text-right flex-shrink-0',
                isActive(child.slug) ? 'opacity-70' : 'opacity-40',
              ]"
            >
              {{ String(index + 1).padStart(2, '0') }}
            </span>
            <span
              class="font-serif leading-relaxed"
              :class="isActive(child.slug) ? 'font-medium' : 'font-normal'"
            >
              {{ child.text }}
            </span>
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  tocChildren: Array<{ slug: string; text: string }>
  activeSection: string
}>()

function isActive(slug: string): boolean {
  return props.activeSection === slug
}
</script>
