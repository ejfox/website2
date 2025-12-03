<template>
  <article class="tweet-card group">
    <div class="flex gap-2">
      <!-- Icon -->
      <div class="flex-shrink-0 pt-1">
        <span class="text-zinc-400 dark:text-zinc-600 text-xs">𝕏</span>
      </div>

      <div class="flex-grow min-w-0">
        <!-- Header -->
        <div class="flex items-center gap-1.5 mb-1 text-xs">
          <time
            v-if="date"
            :datetime="date"
            class="text-zinc-400 dark:text-zinc-500"
          >
            {{ formattedDate }}
          </time>
        </div>

        <!-- Tweet text -->
        <p
          class="text-zinc-700 dark:text-zinc-300 text-sm leading-snug whitespace-pre-wrap break-words"
        >
          {{ text }}
        </p>

        <!-- Engagement -->
        <div
          v-if="favorites > 0 || retweets > 0"
          class="flex items-center gap-3 mt-2 text-xs text-zinc-400 dark:text-zinc-600"
        >
          <span v-if="favorites > 0">♥ {{ favorites }}</span>
          <span v-if="retweets > 0">↻ {{ retweets }}</span>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
interface Props {
  id?: string
  text: string
  date?: string
  replyTo?: string | null
  favorites?: number
  retweets?: number
  year?: number
}

const props = withDefaults(defineProps<Props>(), {
  id: undefined,
  date: undefined,
  replyTo: undefined,
  favorites: 0,
  retweets: 0,
  year: undefined,
})

const formattedDate = computed(() => {
  if (!props.date) return ''
  try {
    const d = new Date(props.date)
    const now = new Date()
    const diffDays = Math.floor(
      (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (diffDays < 1) return 'today'
    if (diffDays === 1) return 'yesterday'
    if (diffDays < 7) return `${diffDays}d`
    if (diffDays < 365) {
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    }
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return ''
  }
})
</script>

<style scoped>
.tweet-card {
  @apply py-3 px-0;
  @apply border-b border-zinc-200 dark:border-zinc-800;
}

.tweet-card:hover {
  @apply bg-zinc-50/30 dark:bg-zinc-900/30;
}
</style>
