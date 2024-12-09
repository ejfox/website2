<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-4 lg:mb-6">Scrapbook</h1>

    <div v-if="isLoading && !scraps.length" class="text-center">Loading scraps...</div>
    <div v-else-if="error" class="text-center text-red-500">Error: {{ error.message }}</div>
    <div v-else>
      <div class="grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <div v-for="scrap in scraps" :key="scrap.id">
          <ScrapItem :scrap="scrap" />
        </div>
      </div>
      <div v-if="isLoading" class="text-center mt-4">Loading more scraps...</div>
      <div v-if="!isLoading && !hasMoreScraps" class="text-center mt-4">
        All scraps loaded.
      </div>
    </div>
    <div ref="loadMoreTrigger" class="h-10"></div>
  </div>
</template>

<script setup>
import { useIntersectionObserver } from '@vueuse/core'
import ScrapItem from '~/components/Scrap/Item.vue'
import useScraps from '~/composables/useScraps'

const { scraps, isLoading, error, loadMore, hasMoreScraps, totalScraps } = useScraps()

const loadMoreTrigger = ref(null)

// set page title to Scrapbook
useHead({
  title: 'Scrapbook',
  link: [
    {
      rel: 'alternate',
      type: 'application/rss+xml',
      title: 'EJ Fox - Scraps RSS Feed',
      href: '/scraps-rss.xml'
    }
  ]
})

useIntersectionObserver(
  loadMoreTrigger,
  ([{ isIntersecting }]) => {
    if (isIntersecting && !isLoading.value && hasMoreScraps.value) {
      loadMore()
    }
  },
  { threshold: 0.5 }
)
</script>

<style scoped>
/* Add any scoped styles here */
</style>
