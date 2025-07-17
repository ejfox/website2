<template>
  <div class="min-h-screen">
    <!-- Fixed Header -->
    <header class="sticky top-0 z-50 backdrop-blur-sm border-b">
      <div class="container mx-auto px-3 py-2">
        <div class="flex items-baseline gap-3 font-mono">
          <h1 class="text-sm font-medium">
            Scrapbook
          </h1>
          <span class="text-xs opacity-60">{{ totalScraps }} items</span>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-3 py-4">
      <!-- Loading States -->
      <div v-if="isLoading && !scraps.length" class="space-y-8">
        <section v-for="i in 3" :key="i">
          <div class="skeleton w-32 h-4 mb-3"></div>
          <div class="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            <div v-for="j in 12" :key="j" class="pulse-placeholder-sm aspect-square"></div>
          </div>
        </section>
      </div>

      <div v-else-if="error" class="font-mono text-center py-12 text-xs">
        {{ error.message }}
      </div>

      <!-- Scrap Groups -->
      <div v-else class="space-y-8">
        <section v-for="(group, date) in groupedScraps" :key="date">
          <h3 class="font-mono text-xs opacity-60 mb-3">
            {{ formatGroupDate(date) }}
          </h3>

          <div class="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            <ScrapItem
              v-for="scrap in group" :key="scrap.id" ref="scrapElements" :scrap="scrap"
              @click="handleScrapClick(scrap)"
            />
          </div>
        </section>

        <!-- Load More States -->
        <div v-if="isLoading" class="space-y-2">
          <div class="skeleton w-32 h-4"></div>
          <div class="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            <div v-for="j in 6" :key="j" class="pulse-placeholder-sm aspect-square"></div>
          </div>
        </div>
      </div>
    </main>

    <!-- Infinite Scroll Trigger -->
    <div ref="loadMoreTrigger" class="h-8" />

    <!-- Image Viewer Modal -->
    <UModal v-model="showImageViewer" :ui="{ width: 'max-w-5xl' }">
      <img
        v-if="selectedImage" :src="selectedImage" :alt="selectedScrap?.title || 'Scrap image'"
        class="w-full h-auto rounded"
      />
    </UModal>
  </div>
</template>

<script setup>
import { useIntersectionObserver } from '@vueuse/core'
import { format, parseISO, isThisMonth, isThisYear } from 'date-fns'
import ScrapItem from '~/components/Scrap/Item.vue'
import useScraps from '~/composables/useScraps'

const ITEMS_PER_PAGE = 200

const { scraps, isLoading, error, loadMore, hasMoreScraps, totalScraps } = useScraps()
const loadMoreTrigger = ref(null)
const scrapElements = ref([])

// Image viewer state
const showImageViewer = ref(false)
const selectedImage = ref(null)
const selectedScrap = ref(null)

const handleScrapClick = (scrap) => {
  const imageUrl = scrap.screenshot_url ||
    scrap.metadata?.screenshotUrl ||
    scrap.metadata?.image?.thumb?.url ||
    scrap.metadata?.images?.[0]?.url

  if (imageUrl) {
    selectedImage.value = imageUrl
    selectedScrap.value = scrap
    showImageViewer.value = true
  } else if (scrap.url) {
    window.open(scrap.url, '_blank')
  }
}

const getMostRelevantDate = (scrap) => {
  return new Date(
    scrap.published_at ||
    scrap.updated_at ||
    scrap.created_at
  )
}

// Group scraps by time period
const groupedScraps = computed(() => {
  const groups = {}
  const now = new Date()

  scraps.value.forEach(scrap => {
    const date = getMostRelevantDate(scrap)
    let groupKey

    const hoursAgo = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    const daysAgo = hoursAgo / 24

    if (hoursAgo < 24) {
      groupKey = 'Last 24 Hours'
    } else if (daysAgo < 7) {
      groupKey = 'This Week'
    } else if (isThisMonth(date)) {
      groupKey = 'This Month'
    } else if (isThisYear(date)) {
      groupKey = format(date, 'MMMM yyyy')
    } else {
      groupKey = format(date, 'yyyy')
    }

    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(scrap)
  })

  // Sort scraps within each group by most relevant date
  Object.keys(groups).forEach(key => {
    groups[key].sort((a, b) =>
      getMostRelevantDate(b).getTime() - getMostRelevantDate(a).getTime()
    )
  })

  return groups
})

const formatGroupDate = (date) => date

// Infinite scroll
useIntersectionObserver(
  loadMoreTrigger,
  ([{ isIntersecting }]) => {
    if (isIntersecting && !isLoading.value && hasMoreScraps.value) {
      loadMore({ limit: ITEMS_PER_PAGE })
    }
  },
  { threshold: 0.5 }
)

// Page metadata
useHead({
  title: 'Scrapbook',
  meta: [
    { name: 'description', content: 'A collection of interesting things found around the web' }
  ]
})
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px)
  }

  to {
    opacity: 1;
    transform: translateY(0)
  }
}

.grid>* {
  animation: fadeIn 0.2s ease-out forwards;
}
</style>
