<template>
  <div
    class="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border-t border-muted p-2"
  >
    <div class="overflow-x-auto scrollbar-hide">
      <div
        class="flex gap-3 items-center py-2"
        style="scroll-snap-type: x mandatory"
      >
        <div
          v-for="item in sortedGearItems"
          :key="item.Name"
          class="flex-shrink-0 w-20 h-20 rounded-xl border-2 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center p-2"
          :class="
            isCurrentItem(item)
              ? 'border-zinc-100 dark:border-zinc-900 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
              : 'border-muted hover:border-zinc-400 dark:hover:border-zinc-500'
          "
          style="scroll-snap-align: center"
          @click="navigateToGear(item)"
        >
          <div class="text-lg mb-1">
            {{ getTypeSymbol(item.Type) }}
          </div>
          <div class="text-[8px] font-mono leading-tight truncate w-full">
            {{ item.Name }}
          </div>
          <div
            class="text-[7px] font-mono"
            :class="
              isCurrentItem(item)
                ? 'text-zinc-300 dark:text-zinc-600'
                : 'text-muted'
            "
          >
            {{ getItemWeight(item) }}g
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import * as d3 from 'd3'

const props = defineProps({
  currentSlug: {
    type: String,
    default: ''
  }
})

const { getItemWeightInGrams } = useWeightCalculations()

// Type symbols
const typeSymbols = {
  Tech: '▲',
  Utility: '⬟',
  Comfort: '○',
  Sleep: '☽',
  Bag: '▣',
  Safety: '◆',
  Creativity: '✧'
}

// Fetch all gear items
const { data: allGearItems } = await useAsyncData('all-gear', async () => {
  const csvText = await $fetch('/gear.csv', { responseType: 'text' })
  return d3.csvParse(csvText)
})

// Helper functions
const getTypeSymbol = (type) => typeSymbols[type] || '—'
const getItemWeight = (item) => getItemWeightInGrams(item) || 0

const isCurrentItem = (item) => {
  return (
    item.Name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === props.currentSlug
  )
}

const navigateToGear = (item) => {
  const slug = item.Name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  navigateTo(`/gear/${slug}`)
}

// Keyboard navigation
const navigateDirection = (direction) => {
  if (!sortedGearItems.value.length) return

  const currentIndex = sortedGearItems.value.findIndex((item) =>
    isCurrentItem(item)
  )
  if (currentIndex === -1) return

  let nextIndex
  if (direction === 'next') {
    nextIndex = (currentIndex + 1) % sortedGearItems.value.length
  } else {
    nextIndex =
      currentIndex - 1 < 0 ? sortedGearItems.value.length - 1 : currentIndex - 1
  }

  const nextItem = sortedGearItems.value[nextIndex]
  navigateToGear(nextItem)
}

const handleKeydown = (e) => {
  if (e.key === 'ArrowRight') {
    e.preventDefault()
    navigateDirection('next')
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    navigateDirection('prev')
  }
}

// Computed properties
const sortedGearItems = computed(() => {
  if (!allGearItems.value) return []
  return [...allGearItems.value]
    .filter((item) => getItemWeight(item) > 0)
    .sort((a, b) => getItemWeight(a) - getItemWeight(b))
})

// Event listeners
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.scrollbar-hide {
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
