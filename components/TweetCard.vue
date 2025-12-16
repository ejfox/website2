<!--
  @file TweetCard.vue
  @description Twitter-style tweet card with text, engagement stats, and link to original tweet
  @props id: string - Tweet ID (optional)
  @props text: string - Tweet text content
  @props date: string - Tweet date (optional)
  @props replyTo: string - Username being replied to (optional)
  @props favorites: number - Favorite count (default: 0)
  @props retweets: number - Retweet count (default: 0)
  @props year: number - Year of tweet (optional)
-->
<template>
  <article class="tweet-card group">
    <div class="flex gap-3">
      <!-- Avatar placeholder -->
      <div
        class="flex-shrink-0 w-10 h-10 rounded-full flex bg-zinc-200 dark:bg-zinc-800 items-center justify-center"
      >
        <span class="text-xs font-mono text-zinc-500 dark:text-zinc-400">
          EJ
        </span>
      </div>

      <div class="flex-grow min-w-0">
        <!-- Header -->
        <div class="flex items-center gap-2 mb-2">
          <span class="font-medium text-zinc-900 dark:text-zinc-100 text-sm">
            EJ Fox
          </span>
          <span class="text-zinc-400 dark:text-zinc-500 text-sm">@ejfox</span>
          <span class="text-zinc-300 dark:text-zinc-700">·</span>
          <time
            v-if="date"
            :datetime="date"
            class="text-zinc-400 dark:text-zinc-500 text-sm"
          >
            {{ formattedDate }}
          </time>
        </div>

        <!-- Reply indicator -->
        <div
          v-if="replyTo"
          class="flex items-center gap-0.5 mb-2 text-xs text-zinc-400 dark:text-zinc-500"
        >
          <svg
            class="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
            />
          </svg>
          <span>Replying to @{{ replyTo }}</span>
        </div>

        <!-- Tweet text -->
        <p
          class="text-zinc-800 dark:text-zinc-200 text-[15px] leading-relaxed whitespace-pre-wrap break-words"
        >
          {{ text }}
        </p>

        <!-- Engagement -->
        <div
          class="flex items-center gap-6 mt-4 text-xs text-zinc-400 dark:text-zinc-500"
        >
          <span v-if="retweets > 0" class="flex items-center gap-0.5.5">
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {{ retweets }}
          </span>
          <span v-if="favorites > 0" class="flex items-center gap-0.5.5">
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            {{ favorites }}
          </span>
          <a
            v-if="id"
            :href="`https://twitter.com/ejfox/status/${id}`"
            target="_blank"
            rel="noopener"
            class="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
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
  @apply p-4 bg-white dark:bg-zinc-950 border rounded-xl;
  @apply border-zinc-100 dark:border-zinc-900;
}
</style>
