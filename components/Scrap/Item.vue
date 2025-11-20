<template>
  <div
    :class="[
      'bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-sm hover:border-zinc-400 dark:hover:border-zinc-700 transition-all duration-200',
      hasMedia ? 'aspect-[4/3]' : 'aspect-auto min-h-[6rem]',
      'group relative overflow-hidden'
    ]"
  >
    <!-- Media Background -->
    <div v-if="hasMedia" class="absolute inset-0">
      <img
        :src="mediaUrl"
        :alt="displayTitle"
        class="img-cover-hover"
        loading="lazy"
      />
      <div
        class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"
      ></div>
    </div>

    <!-- Content Overlay -->
    <div
      :class="[
        'relative z-10 flex flex-col h-full p-2',
        hasMedia
          ? 'justify-between text-white'
          : 'text-zinc-900 dark:text-zinc-100'
      ]"
    >
      <!-- Header -->
      <div class="flex items-center gap-1 text-xs font-mono mb-1">
        <span>{{ sourceData.label }}</span>
        <span v-if="scrap.type" class="opacity-60">[{{ scrap.type }}]</span>
      </div>

      <!-- Main Content -->
      <div class="flex-1">
        <a
          v-if="scrap.url"
          :href="scrap.url"
          target="_blank"
          rel="noopener noreferrer"
          class="font-mono text-sm hover:underline line-clamp-3"
        >
          {{ displayTitle }}
        </a>
        <div v-else class="font-mono text-sm line-clamp-3">
          {{ displayTitle }}
        </div>

        <!-- Description if available -->
        <p
          v-if="description && !hasMedia"
          class="mt-1 text-xs opacity-75 line-clamp-2"
        >
          {{ description }}
        </p>
      </div>

      <!-- Footer -->
      <div
        :class="[
          'flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-xs',
          'font-mono',
          hasMedia ? 'text-zinc-200' : 'text-zinc-500 dark:text-zinc-400'
        ]"
      >
        <!-- Tags -->
        <div v-if="scrap.tags?.length" class="flex flex-wrap gap-1">
          <span
            v-for="tag in scrap.tags.slice(0, 3)"
            :key="tag"
            :class="[
              'px-1 rounded',
              hasMedia ? 'bg-white/20' : 'bg-zinc-100 dark:bg-zinc-800'
            ]"
          >
            #{{ tag }}
          </span>
          <span v-if="scrap.tags.length > 3" class="opacity-60">
            +{{ scrap.tags.length - 3 }}
          </span>
        </div>

        <!-- Location -->
        <div v-if="scrap.location" class="flex items-center gap-1">
          {{ scrap.location }}
        </div>

        <!-- Links -->
        <div v-if="scrap.relationships?.length" class="flex items-center gap-1">
          {{ scrap.relationships.length }}
        </div>

        <!-- Media count -->
        <div v-if="mediaCount > 1" class="flex items-center gap-1">
          {{ mediaCount }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  scrap: {
    type: Object,
    required: true
  }
})

const sourceData = computed(() => {
  const sourceMap = {
    pinboard: { icon: 'simple-icons:pinboard', label: 'Pinboard' },
    github: { icon: 'simple-icons:github', label: 'GitHub' },
    arena: { icon: 'i-heroicons-square-3-stack-3d', label: 'Are.na' },
    mastodon: { icon: 'simple-icons:mastodon', label: 'Mastodon' },
    twitter: { icon: 'simple-icons:twitter', label: 'Twitter' },
    youtube: { icon: 'simple-icons:youtube', label: 'YouTube' },
    lock: { icon: 'i-heroicons-lock-closed', label: 'Private' }
  }
  return (
    sourceMap[props.scrap.source?.toLowerCase()] || {
      icon: 'i-heroicons-question-mark-circle',
      label: props.scrap.source || 'Unknown'
    }
  )
})

const mediaUrl = computed(() => {
  return (
    props.scrap.screenshot_url ||
    props.scrap.metadata?.screenshotUrl ||
    props.scrap.metadata?.image?.thumb?.url ||
    props.scrap.metadata?.images?.[0]?.url
  )
})

const hasMedia = computed(() => !!mediaUrl.value)

const mediaCount = computed(() => {
  return (
    (props.scrap.metadata?.images?.length || 0) +
    (props.scrap.screenshot_url ? 1 : 0)
  )
})

const displayTitle = computed(
  () => props.scrap.title || props.scrap.content || props.scrap.summary || ''
)

const description = computed(
  () => props.scrap.summary || props.scrap.metadata?.description
)
</script>
