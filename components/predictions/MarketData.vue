<template>
  <div
    v-if="marketData"
    class="border-l border-zinc-300 dark:border-zinc-700 pl-3 my-4 font-mono text-xs"
  >
    <!-- Header -->
    <div class="flex items-baseline justify-between mb-2">
      <span class="text-zinc-500 dark:text-zinc-500">market</span>
      <a
        :href="marketData.url"
        target="_blank"
        class="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        {{ marketData.provider }}
      </a>
    </div>

    <!-- Current Probability -->
    <div class="mb-2">
      <span class="text-zinc-900 dark:text-zinc-100"
        >{{ Math.round(marketData.currentProb) }}%</span
      >
      <span class="text-zinc-500 dark:text-zinc-500 ml-2">current</span>
    </div>

    <!-- Sparkline -->
    <div v-if="marketData.priceHistory?.length > 0" class="mb-2">
      <svg :viewBox="`0 0 ${width} ${height}`" class="w-full h-8">
        <polyline
          :points="sparklinePoints"
          fill="none"
          class="stroke-zinc-900 dark:stroke-zinc-100"
          stroke-width="1"
        />
        <circle
          v-if="lastPoint"
          :cx="lastPoint.x"
          :cy="lastPoint.y"
          r="1.5"
          class="fill-zinc-900 dark:fill-zinc-100"
        />
      </svg>
    </div>

    <!-- Stats -->
    <div class="text-zinc-500 dark:text-zinc-500 space-y-0.5">
      <div>${{ (marketData.volume / 1000000).toFixed(1) }}M vol</div>
      <div v-if="marketData.resolved" class="text-zinc-900 dark:text-zinc-100">
        resolved: {{ marketData.outcome === 'YES' ? '✓' : '✗' }}
      </div>
    </div>
  </div>

  <!-- Loading State -->
  <div
    v-else-if="loading"
    class="border-l border-zinc-300 dark:border-zinc-700 pl-3 my-4 label-xs"
  >
    loading market...
  </div>

  <!-- Error State -->
  <div
    v-else-if="error"
    class="border-l border-zinc-300 dark:border-zinc-700 pl-3 my-4 label-xs"
  >
    market unavailable
  </div>
</template>

<script setup lang="ts">
interface Props {
  prediction: {
    confidence: number
    market?: {
      provider: 'polymarket' | 'kalshi'
      slug: string
      autoResolve?: boolean
    }
    skinInGame?: {
      amount: number
      currency: string
      platform: string
      position: 'YES' | 'NO'
      entryPrice: number
    }
  }
}

const props = defineProps<Props>()

const marketData = ref<any>(null)
const loading = ref(false)
const error = ref(false)

// Fetch market data dynamically
if (props.prediction.market) {
  loading.value = true
  try {
    const { data } = await useFetch(
      `/api/markets/${props.prediction.market.provider}?slug=${props.prediction.market.slug}`
    )
    marketData.value = data.value
  } catch (e) {
    error.value = true
    console.error('Failed to fetch market data:', e)
  } finally {
    loading.value = false
  }
}

// Computed values
const skinInGame = computed(() => props.prediction.skinInGame)

const currentPnL = computed(() => {
  if (!skinInGame.value || !marketData.value) return null

  const { amount, position, entryPrice } = skinInGame.value
  const currentPrice = marketData.value.currentProb / 100

  if (position === 'YES') {
    return (amount * (currentPrice - entryPrice)) / entryPrice
  } else {
    return (amount * (entryPrice - currentPrice)) / entryPrice
  }
})

// Sparkline calculations
const width = 300
const height = 48

const priceToY = (price: number) => {
  // Invert Y axis (SVG 0 is top)
  const minPrice = 0
  const maxPrice = 100
  return height - ((price - minPrice) / (maxPrice - minPrice)) * height
}

const sparklinePoints = computed(() => {
  if (!marketData.value?.priceHistory?.length) return ''

  const points = marketData.value.priceHistory
  const xStep = width / (points.length - 1)

  return points
    .map((point: any, i: number) => {
      const x = i * xStep
      const y = priceToY(point.p)
      return `${x},${y}`
    })
    .join(' ')
})

const firstPoint = computed(() => {
  if (!marketData.value?.priceHistory?.length) return null
  const first = marketData.value.priceHistory[0]
  return { x: 0, y: priceToY(first.p) }
})

const lastPoint = computed(() => {
  if (!marketData.value?.priceHistory?.length) return null
  const last =
    marketData.value.priceHistory[marketData.value.priceHistory.length - 1]
  const xStep = width / (marketData.value.priceHistory.length - 1)
  return {
    x: (marketData.value.priceHistory.length - 1) * xStep,
    y: priceToY(last.p)
  }
})
</script>
