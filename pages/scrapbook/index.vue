<template>
  <div ref="scrapcontainer" class="container mx-auto px-4 py-12 max-h-screen overflow-y-auto monospace">
    <h1 class="text-3xl font-bold mb-4 lg:mb-8">Scrapbook</h1>

    <div v-if="!scraps.length" class="text-center">Loading data...</div>
    <div v-else-if="error" class="text-center text-red-500">Error: {{ error }}</div>
    <template v-else>
      <!-- <pre>{{ scraps }}</pre> -->
      <div v-for="scrap in scraps" :key="scrap.id" class="">
        <ScrapItem :scrap="scrap" />
      </div>
      <div v-if="isLoading" class="text-center">Loading more...</div>
    </template>
  </div>
</template>

<script setup>
import { useInfiniteScroll } from '@vueuse/core'
import ScrapItem from '~/components/Scrap/Item.vue'
import useScraps from '~/composables/useScraps'

const scrapcontainer = ref(null)
const { scraps, loadMore, error, isLoading } = useScraps()

useInfiniteScroll(scrapcontainer, loadMore, { distance: 10 })
</script>

<style scoped>
/* Add any scoped styles here */
</style>