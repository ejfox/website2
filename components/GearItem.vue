<template>
  <div class="p-3 sm:p-4 group hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
    <div class="flex gap-4 sm:gap-6">
      <!-- Left: Visualization -->
      <div class="relative shrink-0">
        <div class="w-16 h-16 sm:w-20 sm:h-20">
          <svg ref="svgRef" class="w-full h-full"></svg>
        </div>

        <!-- Score overlay -->
        <div
          class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 bg-zinc-50/90 dark:bg-zinc-900/90 backdrop-blur-sm rounded-lg">
          <div class="grid gap-1.5">
            <!-- TCWM Breakdown -->
            <div class="grid grid-cols-2 gap-x-3 gap-y-1">
              <div v-for="(score, type) in scores" :key="type"
                class="flex items-center justify-between font-mono text-[10px]">
                <span class="text-zinc-400">{{ type }}</span>
                <span class="tabular-nums font-medium">{{ score }}</span>
              </div>
            </div>
            <!-- Final Score -->
            <div
              class="font-mono text-[10px] border-t border-zinc-200 dark:border-zinc-700 pt-1 mt-0.5 flex justify-between items-center">
              <span class="text-zinc-400">Total</span>
              <span class="tabular-nums font-medium" :class="tierTextColor">{{ calculatedScore }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Content -->
      <div class="flex-1 min-w-0">
        <!-- Top row with name and type -->
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <div class="flex items-start gap-2">
              <h3 class="font-medium uppercase leading-snug truncate flex-1" :title="item.Name">
                {{ item.Name }}
              </h3>
            </div>

            <!-- Comment out Amazon section for now -->
            <div class="py-2" v-if="item.amazon">
              <!-- Enhanced Amazon link -->
              <a :href="amazonAffiliateUrl" target="_blank" rel="nofollow noopener" class="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium rounded-full 
                        bg-amber-50 text-orange-600 border border-orange-200 hover:bg-orange-100
                        dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20 dark:hover:bg-orange-500/20
                        transition-colors" :title="`Buy ${item.Name} on Amazon`">
                <UIcon name="i-heroicons-shopping-cart" class="w-3 h-3" />
                <span>Buy yourself</span>
              </a>
            </div>

            <!-- Stats row -->
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs">
              <!-- Waterproof indicator -->
              <div v-if="item.Waterproof" class="flex items-center gap-1 text-blue-500 dark:text-blue-400"
                :title="`${item.Waterproof} waterproof rating`">
                <UIcon name="i-heroicons-droplet" class="w-3.5 h-3.5 shrink-0" />
                <span class="font-mono text-[10px]">{{ item.Waterproof }}</span>
              </div>

              <!-- Weight(s) -->
              <div class="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 group/weight">
                <UIcon name="i-heroicons-scale" class="w-3.5 h-3.5 shrink-0" />
                <div class="flex flex-col gap-1">
                  <!-- Base Weight -->
                  <div v-if="baseWeight" class="flex items-center gap-1.5">
                    <div class="flex flex-wrap gap-px max-w-[3rem] sm:max-w-[4rem]">
                      <div v-for="n in Math.floor(baseWeight)" :key="n"
                        class="w-1 h-1 rounded-full bg-current opacity-50" :title="`${baseWeight}oz base weight`">
                      </div>
                      <div v-if="hasPartialBaseOunce" class="w-1 h-1 rounded-full bg-current opacity-25"
                        :style="{ transform: `scale(${partialBaseOunce})` }" :title="`${baseWeight}oz base weight`">
                      </div>
                    </div>
                    <ruby class="tabular-nums text-[10px] shrink-0 whitespace-nowrap">
                      {{ baseWeight }}oz
                      <rt class="text-zinc-400">{{ (baseWeight / 16).toFixed(1) }}lb</rt>
                    </ruby>
                  </div>

                  <!-- Loaded Weight -->
                  <div v-if="loadedWeight && loadedWeight !== baseWeight" class="flex items-center gap-1.5">
                    <div class="flex flex-wrap gap-px max-w-[3rem] sm:max-w-[4rem]">
                      <div v-for="n in Math.floor(loadedWeight)" :key="n"
                        class="w-1 h-1 rounded-full bg-current opacity-50" :title="`${loadedWeight}oz loaded`">
                      </div>
                      <div v-if="hasPartialLoadedOunce" class="w-1 h-1 rounded-full bg-current opacity-25"
                        :style="{ transform: `scale(${partialLoadedOunce})` }" :title="`${loadedWeight}oz loaded`">
                      </div>
                    </div>
                    <ruby class="tabular-nums text-[10px] shrink-0 whitespace-nowrap">
                      {{ loadedWeight }}oz
                      <rt class="text-zinc-400">{{ (loadedWeight / 16).toFixed(1) }}lb</rt>
                    </ruby>
                  </div>
                </div>
              </div>

              <!-- Tier indicator (unchanged) -->
              <span class="font-mono text-[10px] tabular-nums text-zinc-400 dark:text-zinc-500">
                <span :class="tierTextColor">T{{ tier }}</span>
                <span class="mx-0.5">/</span>
                <span>{{ calculatedScore }}</span>
              </span>
            </div>
          </div>

          <!-- Type badge -->
          <span v-if="item.Type"
            class="shrink-0 px-2 py-1 text-[11px] font-medium rounded-full tracking-wide flex items-center gap-1.5"
            :class="typeClasses[item.Type]">
            <UIcon :name="typeIcons[item.Type]" class="w-3.5 h-3.5" />
            {{ item.Type }}
          </span>
        </div>

        <!-- Notes section -->
        <p v-if="item.Notes" class="mt-6 mb-2 text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {{ item.Notes }}
        </p>
      </div>
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
    required: true
  }
})

const svgRef = ref(null)

// TCWM Score calculation
const scores = computed(() => ({
  'T': Number(props.item['Time Criticality (T)']) || 0,
  'C': Number(props.item['Consequence Severity (C)']) || 0,
  'W': Number(props.item['Weight/Space Penalty (W)']) || 0,
  'M': Number(props.item['Multi-Use Factor (M)']) || 0
}))

const calculatedScore = computed(() => {
  const { T, C, W, M } = scores.value
  const score = (2 * T) + (2 * C) + (1.5 * W) + M
  return score.toFixed(1)
})

// Tier determination
const tier = computed(() => {
  const score = Number(calculatedScore.value)
  if (score >= 35) return 1
  if (score >= 25) return 2
  return 3
})

const tierTextColor = computed(() => {
  switch (tier.value) {
    case 1: return 'text-blue-500 dark:text-blue-400'
    case 2: return 'text-amber-500 dark:text-amber-400'
    case 3: return 'text-green-500 dark:text-green-400'
  }
})

// Type icons and classes (unchanged)
const typeIcons = {
  'Tech': 'i-heroicons-cpu-chip',
  'Utility': 'i-heroicons-wrench',
  'Comfort': 'i-heroicons-heart',
  'Sleep': 'i-heroicons-moon',
  'Bag': 'i-material-symbols-light-backpack-rounded',
  'Safety': 'i-heroicons-shield-check',
  'Creativity': 'i-heroicons-sparkles'
}

const typeClasses = {
  'Tech': 'bg-zinc-50 dark:bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-500/20',
  'Utility': 'bg-zinc-50 dark:bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-500/20',
  'Comfort': 'bg-zinc-50 dark:bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-500/20',
  'Sleep': 'bg-zinc-50 dark:bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-500/20',
  'Bag': 'bg-zinc-50 dark:bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-500/20',
  'Safety': 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20',
  'Creativity': 'bg-zinc-50 dark:bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-500/20'
}

// Update weight calculations
const baseWeight = computed(() => parseFloat(props.item['Base Weight ()']) || 0)
const loadedWeight = computed(() => parseFloat(props.item['Loaded Weight ()']) || 0)

const hasPartialBaseOunce = computed(() => baseWeight.value % 1 !== 0)
const partialBaseOunce = computed(() => baseWeight.value % 1)

const hasPartialLoadedOunce = computed(() => loadedWeight.value % 1 !== 0)
const partialLoadedOunce = computed(() => loadedWeight.value % 1)

// Visualization handling (unchanged)
onMounted(() => {
  if (svgRef.value) {
    props.createViz(props.item, svgRef.value)
  }
})

const updateViz = useDebounceFn(() => {
  if (svgRef.value) {
    props.createViz(props.item, svgRef.value)
  }
}, 250)

onMounted(() => window.addEventListener('resize', updateViz))
onUnmounted(() => window.removeEventListener('resize', updateViz))

// Comment out Amazon import
// import AmazonReferenceItem from './AmazonReferenceItem.vue'

const amazonAffiliateUrl = computed(() => {
  if (!props.item.amazon) return '#'
  const url = new URL(props.item.amazon)
  url.searchParams.set('tag', 'ejfox0c-20')
  return url.toString()
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
  font-feature-settings: "tnum";
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

ruby:hover rt {
  opacity: 1;
}
</style>