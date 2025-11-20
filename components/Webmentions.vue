<template>
  <div
    v-if="webmentions.length > 0"
    class="webmentions mt-12 border-t border-zinc-200 dark:border-zinc-800 pt-8"
  >
    <h3 class="text-lg font-semibold mb-6 text-zinc-900 dark:text-zinc-100">
      Webmentions
      <span class="text-sm font-normal text-zinc-500 dark:text-zinc-400 ml-2"
        >({{ webmentions.length }})</span
      >
    </h3>

    <div class="space-y-4">
      <!-- Likes and Reposts -->
      <div
        v-if="likes.length > 0 || reposts.length > 0"
        class="flex items-center gap-6 text-sm"
      >
        <div v-if="likes.length > 0" class="flex items-center gap-2">
          <span class="text-zinc-600 dark:text-zinc-400"
            >❤️ {{ likes.length }}
            {{ likes.length === 1 ? 'like' : 'likes' }}</span
          >
          <div class="flex -space-x-2">
            <img
              v-for="like in likes.slice(0, 5)"
              :key="like.url"
              :src="like.author?.photo || '/default-avatar.png'"
              :alt="like.author?.name || 'Unknown'"
              :title="like.author?.name || 'Unknown'"
              :class="[
                'w-6 h-6 rounded-full border-2 border-white',
                'dark:border-zinc-900'
              ]"
            />
          </div>
        </div>

        <div v-if="reposts.length > 0" class="flex items-center gap-2">
          <span class="text-zinc-600 dark:text-zinc-400"
            >🔁 {{ reposts.length }}
            {{ reposts.length === 1 ? 'repost' : 'reposts' }}</span
          >
          <div class="flex -space-x-2">
            <img
              v-for="repost in reposts.slice(0, 5)"
              :key="repost.url"
              :src="repost.author?.photo || '/default-avatar.png'"
              :alt="repost.author?.name || 'Unknown'"
              :title="repost.author?.name || 'Unknown'"
              :class="[
                'w-6 h-6 rounded-full border-2 border-white',
                'dark:border-zinc-900'
              ]"
            />
          </div>
        </div>
      </div>

      <!-- Comments and Replies -->
      <div v-if="replies.length > 0" class="space-y-4">
        <h4 class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Replies
        </h4>
        <div
          v-for="reply in replies"
          :key="reply.url"
          class="flex gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50"
        >
          <img
            :src="reply.author?.photo || '/default-avatar.png'"
            :alt="reply.author?.name || 'Unknown'"
            class="w-10 h-10 rounded-full flex-shrink-0"
          />
          <div class="flex-grow min-w-0">
            <div class="flex items-baseline gap-2 mb-1">
              <a
                :href="reply.author?.url"
                target="_blank"
                rel="noopener noreferrer"
                :class="[
                  'font-medium text-sm text-zinc-900 dark:text-zinc-100',
                  'hover:underline'
                ]"
              >
                {{ reply.author?.name || 'Someone' }}
              </a>
              <time
                :datetime="reply.published"
                class="text-xs text-zinc-500 dark:text-zinc-400"
              >
                {{ formatDate(reply.published) }}
              </time>
            </div>
            <div
              class="text-sm text-zinc-700 dark:text-zinc-300 prose-sm"
              v-html="reply.content?.html || reply.content?.text || ''"
            ></div>
            <a
              :href="reply.url"
              target="_blank"
              rel="noopener noreferrer"
              :class="[
                'text-xs text-zinc-500 hover:text-zinc-700',
                'dark:text-zinc-400 dark:hover:text-zinc-200',
                'mt-1 inline-block'
              ]"
            >
              View on {{ getDomain(reply.url) }} →
            </a>
          </div>
        </div>
      </div>

      <!-- Mentions -->
      <div v-if="mentions.length > 0" class="space-y-4">
        <h4 class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Mentions
        </h4>
        <ul class="space-y-2">
          <li v-for="mention in mentions" :key="mention.url" class="text-sm">
            <a
              :href="mention.url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {{ mention.title || getDomain(mention.url) }}
            </a>
            <span class="text-zinc-500 dark:text-zinc-400 ml-2">
              by {{ mention.author?.name || 'Unknown' }}
            </span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { format } from 'date-fns'

const props = defineProps({
  url: {
    type: String,
    required: true
  }
})

const { data: webmentions } = await useFetch('/api/webmentions', {
  query: { target: props.url }
})

const likes = computed(
  () =>
    webmentions.value?.filter((w) =>
      ['like-of', 'favorite'].includes(w['wm-property'])
    ) || []
)

const reposts = computed(
  () =>
    webmentions.value?.filter((w) =>
      ['repost-of', 'share'].includes(w['wm-property'])
    ) || []
)

const replies = computed(
  () =>
    webmentions.value?.filter((w) =>
      ['in-reply-to', 'reply'].includes(w['wm-property'])
    ) || []
)

const mentions = computed(
  () =>
    webmentions.value?.filter((w) =>
      ['mention-of', 'bookmark-of'].includes(w['wm-property'])
    ) || []
)

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  try {
    return format(new Date(dateStr), 'MMM d, yyyy')
  } catch {
    return ''
  }
}

const getDomain = (url) => {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return 'source'
  }
}
</script>

<style scoped>
.prose-sm :deep(p) {
  @apply mb-2;
}

.prose-sm :deep(a) {
  @apply text-blue-600 dark:text-blue-400 underline;
}
</style>
