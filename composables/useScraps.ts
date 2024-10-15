import { ref, computed } from 'vue'

interface Scrap {
  id: string
  source: string
  content: string
  summary: string
  created_at: string
  updated_at: string
  tags: string[]
  scrap_id: string
  metadata?: any
  relationships?: Array<{
    id: string
    type: string
    target_id: string
  }>
}

export default function useScraps() {
  const scraps = ref<Scrap[]>([])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const currentPage = ref(1)
  const totalScraps = ref(0)
  const hasMoreScraps = computed(() => scraps.value.length < totalScraps.value)

  const fetchScraps = async (page = 1, limit = 20) => {
    if (isLoading.value) return

    isLoading.value = true
    error.value = null
    try {
      const response = await $fetch<{ scraps: Scrap[], count: number }>('/api/scraps', {
        method: 'POST',
        body: { page, limit }
      })

      if (response && response.scraps) {
        scraps.value = page === 1 ? response.scraps : [...scraps.value, ...response.scraps]
        totalScraps.value = response.count
        currentPage.value = page
      }
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Unknown error occurred')
      console.error('Error fetching scraps:', err)
    } finally {
      isLoading.value = false
    }
  }

  const loadMore = () => {
    if (!isLoading.value && hasMoreScraps.value) {
      fetchScraps(currentPage.value + 1)
    }
  }

  // Initial fetch
  fetchScraps()

  return {
    scraps,
    isLoading,
    error,
    loadMore,
    hasMoreScraps,
    totalScraps: computed(() => totalScraps.value)
  }
}
