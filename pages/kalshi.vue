<template>
  <main class="container-main pt-8">
    <header class="section-spacing-lg">
      <h1 class="heading-1 mb-4">Market Positions</h1>
      <div class="label-xs text-muted">
        Real-money prediction market positions from Kalshi
      </div>
    </header>

    <!-- Error State -->
    <div
      v-if="kalshiError"
      class="text-center py-8 text-red-600 dark:text-red-400"
    >
      Failed to load market data
    </div>

    <!-- Positions Section -->
    <section
      v-else-if="kalshiData?.positions && kalshiData.positions.length > 0"
      class="section-spacing"
    >
      <KalshiPositionsList
        :kalshi-data="kalshiData"
        :parsed-commentaries="parsedCommentaries"
      />
      <KalshiFillsTable :fills="kalshiData.fills" />
    </section>

    <!-- Empty State -->
    <section v-else class="card-padding">
      <div class="text-primary mb-2 uppercase">No positions</div>
      <p class="text-secondary">No open market positions at the moment.</p>
    </section>
  </main>
</template>

<script setup>
import { ref, watch } from 'vue'
import KalshiPositionsList from '~/components/kalshi/KalshiPositionsList.vue'
import KalshiFillsTable from '~/components/kalshi/KalshiFillsTable.vue'

const { data: kalshiData, error: kalshiError } = useKalshi()
const { markdownToHtml } = useMarkdown()

// Parsed commentary cache
const parsedCommentaries = ref({})

// Watch kalshiData and parse commentaries when they load
watch(
  () => kalshiData.value?.commentaries,
  async (commentaries) => {
    if (!commentaries) return

    const parsed = {}
    for (const [ticker, commentary] of Object.entries(commentaries)) {
      if (commentary?.commentary) {
        parsed[ticker] = await markdownToHtml(commentary.commentary)
      }
    }
    parsedCommentaries.value = parsed
  },
  { immediate: true }
)

usePageSeo({
  title: 'Market Positions · EJ Fox',
  description: 'Real-money prediction market positions from Kalshi',
  type: 'article',
  section: 'Trading',
})
</script>
