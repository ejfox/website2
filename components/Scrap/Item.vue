<template>
  <div class="rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col h-full">
    <div class="flex-grow">
      <!-- Pinboard scrap -->
      <div v-if="scrap.source === 'pinboard'" class="space-y-2">
        <div class="text-sm font-bold line-clamp-3 font-sans flex items-center">
          <UIcon name="simple-icons:pinboard" class="w-4 h-4 mr-2" />
          <a :href="scrap.metadata?.href" target="_blank" rel="noopener noreferrer" class="">{{ scrap.content }}</a>
        </div>
        <!-- <p class="text-xs text-gray-600 dark:text-gray-400 line-clamp-5">{{ scrap.summary }}</p> -->
        <div class="flex flex-wrap gap-1">
          <span v-for="tag in scrap.tags" :key="tag"
            class="px-1 py-0.5 text-xs font-light text-gray-700 bg-gray-200 dark:bg-gray-800 dark:text-gray-200 rounded-full">
            {{ tag }}
          </span>
        </div>
        <div v-if="scrap.metadata?.screenshotUrl" class="mt-1">
          <img :src="scrap.metadata.screenshotUrl" alt="Screenshot" class="w-full h-32 object-cover rounded" />
        </div>
      </div>

      <!-- Arena scrap -->
      <div v-else-if="scrap.source === 'arena'" class="space-y-2">
        <div v-if="scrap.metadata?.image" class="mt-1">
          <img :src="scrap.metadata.image.thumb.url" :alt="scrap.metadata.title"
            class="w-full h-32 object-cover rounded" />
        </div>
        <p class="text-xs text-gray-600 line-clamp-3">{{ scrap.metadata?.description }}</p>
      </div>

      <!-- Mastodon scrap -->
      <div v-else-if="scrap.source === 'mastodon'" class="space-y-2">
        <UIcon name="simple-icons:mastodon" class="w-4 h-4 mr-2 block" />
        <div class="text-xs font-serif line-clamp-4" v-html="scrap.content"></div>
        <div v-if="scrap.metadata?.images" class="flex flex-wrap gap-1">
          <img v-for="image in scrap.metadata.images.slice(0, 4)" :key="image.url" :src="image.url"
            class="w-full h-auto object-cover rounded" />
        </div>
      </div>

      <!-- GitHub scrap -->
      <div v-else-if="scrap.source === 'github'" class="space-y-2">
        <div class="flex items-center mb-2">
          <UIcon name="simple-icons:github" class="w-4 h-4 mr-2" />
        </div>
        <h3 class="text-sm font-semibold">
          {{ scrap.metadata.full_name }}
        </h3>

        <p class="text-xs line-clamp-3">{{ scrap.content || scrap.summary }}</p>


      </div>

      <!-- Default scrap -->
      <div v-else class="space-y-2">
        <div class="flex items-center mb-2">
          <UIcon :name="getIconForSource(scrap.source)" class="w-4 h-4 mr-2" />
          <h3 class="text-sm font-semibold">{{ scrap.source }} Scrap</h3>
        </div>
        <p class="text-xs line-clamp-3">{{ scrap.content || scrap.summary }}</p>
      </div>
    </div>

    <!-- Common footer -->
    <div class="mt-2 text-xs text-gray-500 flex justify-between">
      <span>{{ new Date(scrap.created_at).toLocaleDateString() }}</span>
      <span>{{ scrap.scrap_id }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  scrap: {
    type: Object,
    required: true,
  },
})

const getIconForSource = (source) => {
  const iconMap = {
    pinboard: 'simple-icons:pinboard',
    arena: '',
    mastodon: 'simple-icons:mastodon',
    github: 'simple-icons:github',
    twitter: 'simple-icons:twitter',
    youtube: 'simple-icons:youtube',
    // Add more mappings as needed
  }

  return iconMap[source.toLowerCase()] || 'uil:link'
}

const scrapIcon = computed(() => getIconForSource(props.scrap.source))
</script>
