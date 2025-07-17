<template>
  <div class="flex ite ms-center justify-between text-[10px] text-gray-500 px-2">
    <div class="flex items-center space-x-2 justify-center">
      <UIcon :name="getIconName(scrap.source)" class="w-4 h-4" />
      <span>{{ scrap.source }}</span>
      <span class="text-gray-300 dark:text-gray-700">{{ scrap.scrap_id }}</span>
    </div>

    <p class="timestamp">
      {{ formatDate(scrap.created_at) }}
    </p>

    <div class="opacity-50 hover:opacity-100 transition-opacity w-48 overflow-x-auto">
      {{ scrap.metadata.latitude }}, {{ scrap.metadata.longitude }}
    </div>

    <UButton :to="scrap.href" target="_blank" color="primary" variant="ghost" icon="i-heroicons-link" size="xs">
      Link
    </UButton>

    <div class="flex items-center space-x-2">
      <span>Raw</span>
      <UToggle v-model="showRaw" size="xs" />
    </div>

    <div class="flex items-center space-x-2">
      <span>Relationships</span>
      <UToggle v-model="showRelationships" size="xs" />
    </div>

    <!-- Raw Data -->
    <pre v-if="showRaw" class="text-[9px] max-h-48 overflow-auto bg-gray-950 text-white p-1">
      {{ scrap }}
    </pre>
  </div>
</template>

<script setup>
import { format } from 'date-fns'
const _props = defineProps({
  scrap: {
    type: Object,
    required: true,
  },
  hasRelationships: Boolean,
})

const formatDate = (date) => format(new Date(date), 'MMM d')

const getIconName = (type) => {
  const iconMap = {
    'github-pr': 'i-ph-git-pull-request-fill',
    'github-star': 'i-material-symbols-light-kid-star-outline',
    'mastodon': 'i-mingcute-thought-fill',
    'user-github-issue': 'i-octicon-issue-opened-16',
    'github-gist': 'i-material-symbols-code-blocks-outline-sharp',
    'pinboard': 'i-cib-pinboard',
  }
  return iconMap[type] || 'i-heroicons-document'
}

</script>

<style scoped></style>