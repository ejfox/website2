import { ref, computed } from 'vue'
import * as d3 from 'd3'

export default function useScraps() {
  const scraps = ref([])
  const scrapsByWeek = ref(null)
  const currentPage = ref(1)
  const isLoading = ref(false)
  const hasMoreScraps = ref(true)
  const error = ref(null)

  const fetchScraps = async (page = 1, limit = 20) => {
    if (!hasMoreScraps.value) return

    isLoading.value = true
    error.value = null
    try {
      const response = await $fetch('/api/scraps', {
        method: 'POST',
        body: { page, limit }
      })

      console.log('response', response)
      // response is null??? why?

      if (response && response.scraps && response.scraps.length > 0) {
        const { processedScraps, scrapsByWeekMap } = processScrapData(
          response.scraps
        )
        scraps.value = [...scraps.value, ...processedScraps]
        scrapsByWeek.value = scrapsByWeekMap
        currentPage.value = page

        if (response.scraps.length < limit) {
          hasMoreScraps.value = false
        }
      } else {
        hasMoreScraps.value = false
      }
    } catch (err) {
      error.value = err
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

  const prefetchNextPage = () => {
    if (scraps.value.length > 0 && !isLoading.value && hasMoreScraps.value) {
      const threshold = scraps.value.length - 5
      if (scraps.value.length >= threshold) {
        fetchScraps(currentPage.value + 1)
      }
    }
  }

  function processScrapData(scrapData) {
    const validScraps = scrapData.filter(
      (scrap) => scrap.created_at && scrap.id
    )
    const sortedScraps = validScraps.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    )
    const scrapsByWeekMap = groupScrapsByWeek(sortedScraps)
    return { processedScraps: sortedScraps, scrapsByWeekMap }
  }

  function groupScrapsByWeek(scraps) {
    if (!scraps.length) return null
    return d3.group(scraps, (scrap) =>
      d3.timeWeek.floor(new Date(scrap.created_at))
    )
  }

  // Initial fetch
  fetchScraps()

  return {
    scraps,
    loadMore,
    prefetchNextPage,
    fetchScraps
  }
}
