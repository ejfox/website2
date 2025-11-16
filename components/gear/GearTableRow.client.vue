<template>
  <div class="gear-row" @click="navigateToItem">
    <!-- Tabular layout like a spreadsheet row -->
    <div
      class="grid grid-cols-12 gap-4 py-2.5 px-2 text-xs font-mono items-center"
    >
      <!-- Item Name - Primary content, highest contrast -->
      <div class="col-span-7 truncate" :title="item.Name">
        <div class="flex items-center gap-2">
          <span
            class="text-zinc-950 dark:text-zinc-50 font-medium tracking-tight"
            >{{ item.Name }}</span
          >

          <!-- Inline buy link -->
          <a
            v-if="item.amazon"
            :href="amazonAffiliateUrl"
            target="_blank"
            rel="nofollow noopener"
            class="gear-link"
          >
            buy
          </a>

          <!-- Age indicator - patina system -->
          <div
            v-if="item['Purchase Date']"
            class="ml-auto mr-2 opacity-0 group-hover:opacity-60 transition-opacity"
          >
            <span
              v-if="itemAge < 365"
              class="text-xs text-zinc-400 dark:text-zinc-600"
              title="New — less than 1 year old"
              >✦</span
            >
            <span
              v-else-if="itemAge < 730"
              class="text-xs text-zinc-500 dark:text-zinc-500"
              title="Broken in — 1-2 years old"
              >✧</span
            >
            <span
              v-else-if="itemAge < 1095"
              class="text-xs text-zinc-600 dark:text-zinc-400"
              title="Seasoned — 2-3 years old"
              >◈</span
            >
            <span
              v-else-if="itemAge < 1825"
              class="text-xs text-zinc-700 dark:text-zinc-300"
              title="Weathered — 3-5 years old"
              >◇</span
            >
            <span
              v-else
              class="text-xs text-zinc-800 dark:text-zinc-200"
              title="Veteran — 5+ years of service"
              >◆</span
            >
          </div>
        </div>
      </div>

      <!-- Type - Secondary info -->
      <div class="gear-type-cell" :title="item.Type">
        <span class="group-hover/type:hidden">{{
          getTypeSymbol(item.Type)
        }}</span>
        <span
          class="hidden group-hover/type:inline text-xs uppercase tracking-widest font-medium"
          >{{ item.Type || '—' }}</span
        >
      </div>

      <!-- Waterproof - Secondary data -->
      <div
        class="col-span-2 text-center text-xs text-zinc-500 dark:text-zinc-500 font-medium"
      >
        {{ item.Waterproof || '—' }}
      </div>

      <!-- Weight - Primary data with mini viz -->
      <div class="col-span-1 text-right">
        <div v-if="baseWeight > 0" class="flex items-center justify-end gap-1">
          <!-- Mini weight indicator -->
          <div
            class="w-1 bg-zinc-300 dark:bg-zinc-700 rounded-full group-hover:bg-zinc-500 dark:group-hover:bg-zinc-400 transition-colors"
            :style="{
              height: `${Math.max(2, Math.min(12, weightInGrams / 100))}px`
            }"
            :title="`${weightInGrams}g`"
          ></div>
          <span
            class="tabular-nums text-zinc-900 dark:text-zinc-100 font-normal tracking-tight"
            >{{ weightInGrams }}g</span
          >
        </div>
        <span v-else class="text-zinc-300 dark:text-zinc-700">—</span>
      </div>
    </div>

    <!-- Notes - show on hover, full width -->
    <div v-if="item.Notes" class="tooltip-slide-up">
      <p class="note-box">
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
  if (import.meta.server) return

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
