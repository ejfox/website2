<template>
  <!--  eslint-disable-next-line vue/max-len, max-len -->
  <nav
    v-if="breadcrumbs.length > 1"
    class="font-mono text-xs mb-6 flex items-center gap-2 text-zinc-500 dark:text-zinc-500 overflow-x-auto"
    aria-label="Breadcrumb"
  >
    <NuxtLink to="/" class="text-zinc-500 dark:text-zinc-400">Home</NuxtLink>

    <template
      v-for="(crumb, index) in breadcrumbs"
      :key="`${crumb.href}-${index}`"
    >
      <span class="opacity-50">/</span>
      <component
        :is="crumb.href ? 'NuxtLink' : 'span'"
        :to="crumb.href || undefined"
        :class="{
          'text-zinc-500 dark:text-zinc-400': crumb.href,
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
