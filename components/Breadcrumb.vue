<template>
  <!--  eslint-disable-next-line vue/max-len, max-len -->
  <nav
    v-if="breadcrumbs.length > 1"
    class="font-mono text-xs mb-6 flex items-center gap-2 text-zinc-500 dark:text-zinc-500 overflow-x-auto"
    aria-label="Breadcrumb"
  >
    <a
      href="/"
      class="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
    >
      Home
    </a>

    <template
      v-for="(crumb, index) in breadcrumbs"
      :key="`${crumb.href}-${index}`"
    >
      <span class="opacity-50">/</span>
      <component
        :is="crumb.href ? 'a' : 'span'"
        :href="crumb.href || undefined"
        :class="{
          'transition-colors hover:text-zinc-900 dark:hover:text-zinc-100':
            crumb.href,
          'text-zinc-900 dark:text-zinc-100': !crumb.href,
        }"
      >
        {{ crumb.label }}
      </component>
    </template>
  </nav>
</template>

<script setup lang="ts">
interface Breadcrumb {
  label: string
  href?: string
}

defineProps<{
  breadcrumbs: Breadcrumb[]
}>()
</script>

<style scoped>
nav {
  scrollbar-width: none;
}

nav::-webkit-scrollbar {
  display: none;
}
</style>
