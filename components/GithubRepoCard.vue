<template>
  <NuxtLink
    :to="`/github/${name}`"
    class="repo-card group block"
  >
    <article class="flex gap-3">
      <!-- Language Indicator -->
      <div class="flex-shrink-0 pt-1">
        <span
          class="inline-block w-3 h-3 rounded-full"
          :style="{ backgroundColor: languageColor }"
          :title="language"
        ></span>
      </div>

      <!-- Content -->
      <div class="flex-grow min-w-0">
        <!-- Name -->
        <h3
          class="font-mono text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors"
        >
          {{ name }}
        </h3>

        <!-- Description -->
        <p
          v-if="description"
          class="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2"
        >
          {{ description }}
        </p>

        <!-- Stats -->
        <div
          class="flex items-center gap-3 mt-2 text-xs text-zinc-400 dark:text-zinc-600 font-mono"
        >
          <span v-if="stars > 0">⭐ {{ stars }}</span>
          <span v-if="forks > 0">🔀 {{ forks }}</span>
          <span v-if="language" class="text-zinc-500 dark:text-zinc-500">
            {{ language }}
          </span>
        </div>
      </div>
    </article>
  </NuxtLink>
</template>

<script setup lang="ts">
interface Props {
  name: string
  description?: string
  language?: string
  languageColor?: string
  stars?: number
  forks?: number
}

withDefaults(defineProps<Props>(), {
  description: '',
  language: 'Unknown',
  languageColor: '#666666',
  stars: 0,
  forks: 0,
})
</script>

<style scoped>
.repo-card {
  @apply py-3 px-0;
  @apply border-b border-zinc-200 dark:border-zinc-800;
  @apply hover:bg-zinc-50/30 dark:hover:bg-zinc-900/30;
  @apply transition-colors;
}
</style>
