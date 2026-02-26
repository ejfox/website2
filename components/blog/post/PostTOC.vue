<!--
  @file PostTOC.vue
  @description Table of contents for blog post sidebar
  @props tocChildren - array of { slug, text }, activeSection - current section id
-->
<template>
  <div v-if="tocChildren.length > 0" class="toc pt-8 pb-4">
    <div class="pl-0 relative">
      <ul class="space-y-0">
        <li
          v-for="(child, index) in tocChildren"
          :key="child.slug"
          class="group relative"
        >
          <a
            :href="`#${child.slug}`"
            :class="[
              'flex items-baseline text-3xs font-mono transition-all duration-200',
              'no-underline py-1 gap-2',
              isActive(child.slug)
                ? 'text-zinc-900 dark:text-zinc-100'
                : [
                    'text-zinc-500 dark:text-zinc-500',
                    'hover:text-zinc-900 dark:hover:text-zinc-100',
                  ],
            ]"
            @click.prevent="scrollToSection(child.slug)"
          >
            <span
              :class="[
                'tabular-nums w-4 text-right flex-shrink-0',
                isActive(child.slug) ? 'opacity-70' : 'opacity-30',
              ]"
            >
              {{ String(index + 1).padStart(2, '0') }}
            </span>
            <span class="leading-snug">
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

function scrollToSection(slug: string) {
  const el = document.getElementById(slug)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>
