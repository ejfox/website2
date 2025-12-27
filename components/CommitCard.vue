<template>
  <article class="commit-card group">
    <div class="flex gap-2">
      <!-- Icon -->
      <div class="flex-shrink-0 pt-1">
        <span class="text-zinc-400 dark:text-zinc-600 text-xs">G</span>
      </div>

      <div class="flex-grow min-w-0">
        <!-- Header -->
        <div class="flex items-center gap-2 mb-1 text-xs">
          <time
            v-if="date"
            :datetime="date"
            class="text-zinc-400 dark:text-zinc-500"
          >
            {{ formattedDate }}
          </time>
          <span class="text-zinc-300 dark:text-zinc-700">·</span>
          <span class="text-zinc-500 dark:text-zinc-400">{{ repo }}</span>
        </div>

        <!-- Commit message -->
        <p class="text-zinc-700 dark:text-zinc-300 text-sm leading-snug">
          {{ message }}
        </p>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
interface Props {
  sha: string
  message: string
  repo: string
  date?: string
}

const props = defineProps<Props>()

const formattedDate = computed(() => {
  if (!props.date) return ''
  try {
    const d = new Date(props.date)
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
})
</script>

<style scoped>
.commit-card {
  @apply py-3 px-0;
  @apply border-b border-zinc-200 dark:border-zinc-800;
}

.commit-card:hover {
  @apply bg-zinc-50/30 dark:bg-zinc-900/30;
}
</style>
