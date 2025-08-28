<template>
  <div
    class="group hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all duration-200 cursor-pointer"
    @click="navigateToItem"
  >
    <!-- Tabular layout like a spreadsheet row -->
    <div
      class="grid grid-cols-12 gap-3 py-2.5 px-2 text-xs font-mono items-center"
    >
      <!-- Item Name - Primary content, highest contrast -->
      <div class="col-span-6 truncate" :title="item.Name">
        <div class="flex items-center gap-2">
          <span class="text-zinc-950 dark:text-zinc-50 font-medium tracking-tight">{{ item.Name }}</span>

          <!-- Inline buy link -->
          <a
            v-if="item.amazon" :href="amazonAffiliateUrl" target="_blank" rel="nofollow noopener"
            class="text-zinc-500 dark:text-zinc-400 hover:text-orange-600 dark:hover:text-orange-400 text-[9px] font-semibold transition-colors underline decoration-dotted underline-offset-2"
          >
            buy
          </a>

          <!-- Multi-use versatility dots -->
          <div v-if="scores.M >= 5" class="flex gap-0.5 opacity-40 group-hover:opacity-70 transition-opacity">
            <div
              v-for="n in multiUseDots" :key="n" class="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-600"
              :title="`Multi-use score: ${scores.M}/10`"
            ></div>
          </div>

          <!-- Age indicator - patina system -->
          <div v-if="item['Purchase Date']" class="ml-auto mr-2 opacity-0 group-hover:opacity-60 transition-opacity">
            <span
              v-if="itemAge < 365" class="text-[9px] text-zinc-400 dark:text-zinc-600"
              title="New — less than 1 year old"
            >✦</span>
            <span
              v-else-if="itemAge < 730" class="text-[9px] text-zinc-500 dark:text-zinc-500"
              title="Broken in — 1-2 years old"
            >✧</span>
            <span
              v-else-if="itemAge < 1095" class="text-[9px] text-zinc-600 dark:text-zinc-400"
              title="Seasoned — 2-3 years old"
            >◈</span>
            <span
              v-else-if="itemAge < 1825" class="text-[9px] text-zinc-700 dark:text-zinc-300"
              title="Weathered — 3-5 years old"
            >◇</span>
            <span
              v-else class="text-[9px] text-zinc-800 dark:text-zinc-200"
              title="Veteran — 5+ years of service"
            >◆</span>
          </div>
        </div>
      </div>

      <!-- Type - Secondary info -->
      <div
        class="col-span-2 text-center text-zinc-500 dark:text-zinc-500 text-sm font-medium group/type cursor-help"
        :title="item.Type"
      >
        <span class="group-hover/type:hidden">{{
          getTypeSymbol(item.Type)
        }}</span>
        <span class="hidden group-hover/type:inline text-[10px] uppercase tracking-wider font-medium">{{ item.Type ||
          '—' }}</span>
      </div>

      <!-- Waterproof - Secondary data -->
      <div class="col-span-2 text-center text-[10px] text-zinc-500 dark:text-zinc-500 font-medium">
        {{ item.Waterproof || '—' }}
      </div>

      <!-- Tier - Monochrome by default -->
      <div class="col-span-1 text-center text-[10px] font-medium">
        <span
          class="text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200 transition-colors"
        >T{{
          tier }}</span>
      </div>

      <!-- Weight - Primary data with mini viz -->
      <div class="col-span-1 text-right">
        <div v-if="baseWeight > 0" class="flex items-center justify-end gap-1">
          <!-- Mini weight indicator -->
          <div
            class="w-1 bg-zinc-300 dark:bg-zinc-700 rounded-full group-hover:bg-zinc-500 dark:group-hover:bg-zinc-400 transition-colors"
            :style="{
              height: `${Math.max(2, Math.min(12, weightInGrams / 100))}px`
            }" :title="`${weightInGrams}g`"
          ></div>
          <span class="tabular-nums text-zinc-900 dark:text-zinc-100 font-semibold tracking-tight">{{ weightInGrams
          }}g</span>
        </div>
        <span v-else class="text-zinc-300 dark:text-zinc-700">—</span>
      </div>
    </div>

    <!-- Notes - show on hover, full width -->
    <div
      v-if="item.Notes"
      class="px-2 pb-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0"
    >
      <p
        class="text-[10px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-mono italic bg-zinc-50/50 dark:bg-zinc-900/50 p-2 rounded"
      >
        {{ item.Notes }}
      </p>
    </div>
  </div>
</template>

<script setup>

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  createViz: {
    type: Function,
    default: undefined
  }
})

// Animation refs
const itemRef = ref(null)
// Animations removed; keeping structure simple

// TCWM Score calculation
const scores = computed(() => ({
  T: Number(props.item['Time Criticality (T)']) || 0,
  C: Number(props.item['Consequence Severity (C)']) || 0,
  W: Number(props.item['Weight/Space Penalty (W)']) || 0,
  M: Number(props.item['Multi-Use Factor (M)']) || 0
}))

const calculatedScore = computed(() => {
  const { T, C, W, M } = scores.value
  const score = 2 * T + 2 * C + 1.5 * W + M
  return score.toFixed(1)
})

// Tier determination
const tier = computed(() => {
  const score = Number(calculatedScore.value)
  if (score >= 35) return 1
  if (score >= 25) return 2
  return 3
})




const { getItemWeightInOunces, getItemWeightInGrams } = useWeightCalculations()

// Type symbols mapping
const typeSymbols = {
  Tech: '▲',
  Utility: '⬟',
  Comfort: '○',
  Sleep: '☽',
  Bag: '▣',
  Safety: '◆',
  Creativity: '✧'
}

// Get unicode symbol for item type
const getTypeSymbol = (type) => {
  return typeSymbols[type] || '—'
}

// Generate slug for item URL
const itemSlug = computed(() => {
  return props.item.Name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
})

// Enhanced navigation with animation
const navigateToItem = () => {
  // Quick press animation
  if (itemRef.value) {
    // Animation disabled
  }
  navigateTo(`/gear/${itemSlug.value}`)
}

// Epic gear item reveal
const animateGearItem = async () => {
  if (process.server) return

  await nextTick()

  if (itemRef.value) {
    // Animation disabled
  }
}

onMounted(() => {
  animateGearItem()
})

// Update weight calculations
const baseWeight = computed(() => getItemWeightInOunces(props.item))
const weightInGrams = computed(() => getItemWeightInGrams(props.item))

// Amazon affiliate URL
const amazonAffiliateUrl = computed(() => {
  if (!props.item.amazon) return '#'
  const url = new URL(props.item.amazon)
  url.searchParams.set('tag', 'ejfox0c-20')
  return url.toString()
})

// Multi-use dots calculation
const multiUseDots = computed(() => {
  const M = scores.value.M
  if (M >= 9) return 4 // Elite multi-use
  if (M >= 7) return 3 // High multi-use
  if (M >= 5) return 2 // Good multi-use
  return 0 // Not shown
})

// Item age calculation
const itemAge = computed(() => {
  if (!props.item['Purchase Date']) return 0
  const purchaseDate = new Date(props.item['Purchase Date'])
  const today = new Date()
  const diffTime = Math.abs(today - purchaseDate)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
})
</script>

<style>
ruby {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  vertical-align: middle;
  line-height: 1;
}

rt {
  transform: translateY(-0.5em);
  text-align: center;
  font-feature-settings: 'tnum';
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

ruby:hover rt {
  opacity: 1;
}
</style>
