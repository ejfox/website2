<template>
  <div
    v-if="webmentions && webmentions.length > 0"
    class="webmentions mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800"
  >
    <!-- Engagement row: likes + reposts -->
    <div
      v-if="likes.length > 0 || reposts.length > 0"
      class="flex items-center gap-4 mb-4 text-sm text-zinc-500 dark:text-zinc-400"
    >
      <button
        v-if="likes.length > 0"
        class="flex items-center gap-1.5 hover:text-red-500 transition-colors"
        @click="showLikes = !showLikes"
      >
        <span>{{ likes.length }}</span>
        <span class="text-red-500">♥</span>
      </button>

      <button
        v-if="reposts.length > 0"
        class="flex items-center gap-1.5 hover:text-green-500 transition-colors"
        @click="showReposts = !showReposts"
      >
        <span>{{ reposts.length }}</span>
        <span class="text-green-500">↻</span>
      </button>

      <span v-if="replies.length > 0" class="flex items-center gap-1.5">
        <span>{{ replies.length }}</span>
        <span>💬</span>
      </span>
    </div>

    <!-- Expanded likes -->
    <div
      v-if="showLikes && likes.length > 0"
      class="flex flex-wrap gap-1 mb-4 p-2 bg-zinc-50 dark:bg-zinc-900/50 rounded"
    >
      <a
        v-for="like in likes"
        :key="like['wm-id']"
        :href="like.author?.url || like.url"
        :title="like.author?.name"
        target="_blank"
        rel="noopener"
        class="block"
      >
        <img
          :src="like.author?.photo || '/default-avatar.png'"
          :alt="like.author?.name"
          class="w-6 h-6 rounded-full hover:ring-2 hover:ring-red-500 transition-all"
        />
      </a>
    </div>

    <!-- Expanded reposts -->
    <div
      v-if="showReposts && reposts.length > 0"
      class="flex flex-wrap gap-1 mb-4 p-2 bg-zinc-50 dark:bg-zinc-900/50 rounded"
    >
      <a
        v-for="repost in reposts"
        :key="repost['wm-id']"
        :href="repost.author?.url || repost.url"
        :title="repost.author?.name"
        target="_blank"
        rel="noopener"
        class="block"
      >
        <img
          :src="repost.author?.photo || '/default-avatar.png'"
          :alt="repost.author?.name"
          class="w-6 h-6 rounded-full hover:ring-2 hover:ring-green-500 transition-all"
        />
      </a>
    </div>

    <!-- Replies -->
    <div v-if="replies.length > 0" class="space-y-3">
      <div
        v-for="reply in replies"
        :key="reply['wm-id']"
        class="flex gap-3 text-sm"
      >
        <a
          :href="reply.author?.url"
          target="_blank"
          rel="noopener"
          class="flex-shrink-0"
        >
          <img
            :src="reply.author?.photo || '/default-avatar.png'"
            :alt="reply.author?.name"
            class="w-8 h-8 rounded-full"
          />
        </a>
        <div class="flex-grow min-w-0">
          <div class="flex items-baseline gap-2 flex-wrap">
            <a
              :href="reply.author?.url"
              target="_blank"
              rel="noopener"
              class="font-medium text-zinc-900 dark:text-zinc-100 hover:underline"
            >
              {{ reply.author?.name || 'Someone' }}
            </a>
            <a
              :href="reply.url"
              target="_blank"
              rel="noopener"
              class="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              {{ formatTime(reply.published) }}
            </a>
          </div>
          <p
            class="text-zinc-700 dark:text-zinc-300 mt-0.5 break-words"
            v-html="
              truncateHtml(reply.content?.html || reply.content?.text || '')
            "
          ></p>
        </div>
      </div>
    </div>

    <!-- Mentions (minimal) -->
    <div
      v-if="mentions.length > 0 && replies.length === 0"
      class="text-xs text-zinc-500 dark:text-zinc-400"
    >
      Also mentioned by
      <span
        v-for="(mention, i) in mentions.slice(0, 3)"
        :key="mention['wm-id']"
      >
        <a
          :href="mention.url"
          target="_blank"
          rel="noopener"
          class="hover:underline"
        >
          {{ mention.author?.name || getDomain(mention.url) }}
        </a>
        <span v-if="i < Math.min(mentions.length, 3) - 1">,</span>
      </span>
      <span v-if="mentions.length > 3">+ {{ mentions.length - 3 }} more</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDistanceToNow } from 'date-fns'

const props = defineProps<{
  url: string
}>()

const showLikes = ref(false)
const showReposts = ref(false)

const { data: webmentions } = await useFetch('/api/webmentions', {
  query: { target: props.url },
  default: () => [],
})

const likes = computed(() =>
  (webmentions.value || []).filter((w: any) =>
    ['like-of', 'favorite'].includes(w['wm-property'])
  )
)

const reposts = computed(() =>
  (webmentions.value || []).filter((w: any) =>
    ['repost-of', 'share'].includes(w['wm-property'])
  )
)

const replies = computed(() =>
  (webmentions.value || []).filter((w: any) =>
    ['in-reply-to', 'reply'].includes(w['wm-property'])
  )
)

const mentions = computed(() =>
  (webmentions.value || []).filter((w: any) =>
    ['mention-of', 'bookmark-of'].includes(w['wm-property'])
  )
)

const formatTime = (dateStr: string) => {
  if (!dateStr) return ''
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
  } catch {
    return ''
  }
}

const getDomain = (url: string) => {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return 'source'
  }
}

const truncateHtml = (html: string, maxLength = 280) => {
  // Strip tags for length check
  const text = html.replace(/<[^>]*>/g, '')
  if (text.length <= maxLength) return html
  // Truncate and close any open tags
  return text.slice(0, maxLength) + '...'
}
</script>
