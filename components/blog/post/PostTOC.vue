<!--
  @file PostTOC.vue
  @description Numbered table of contents in the blog post sidebar. Used by
    pages/blog/[...slug].vue, which also tracks the active heading.
  @props tocChildren - array of { slug, text, depth?, number? }, activeSection - current section id
-->
<script setup lang="ts">
const props = defineProps<{
  tocChildren: Array<{
    slug: string
    text: string
    depth?: number
    number?: string
  }>
  activeSection: string
}>()

function isActive(slug: string): boolean {
  return props.activeSection === slug
}

// Click is prevented and scrolled by hand so the jump is smooth; the href
// stays real so middle-click / copy-link still work.
function scrollToSection(slug: string) {
  const el = document.getElementById(slug)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>

<template>
  <div v-if="tocChildren.length > 0" class="toc pt-8 pb-4">
    <div class="pl-0 relative">
      <ul class="space-y-0">
        <li
          v-for="child in tocChildren"
          :key="child.slug"
          class="group relative"
        >
          <a
            :href="`#${child.slug}`"
            :class="[
              'flex items-baseline text-3xs font-mono',
              'transition-all duration-200',
              'no-underline py-1 gap-1',
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
                // natural width: the spacing scale is 8px-based, so w-4 was 32px
                // and crushed the heading text to ~70px in a 200px sidebar
                'tabular-nums flex-shrink-0',
                isActive(child.slug) ? 'opacity-70' : 'opacity-30',
              ]"
            >
              {{ child.number || '' }}
            </span>
            <span class="leading-snug min-w-0">
              {{ child.text }}
            </span>
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>
