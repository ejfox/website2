<template>
  <div class="border-t border-zinc-800/50 py-3 group hover:bg-zinc-900/20 transition-colors">
    <div class="flex gap-4 sm:gap-6">
      <!-- Left: Simple weight/score display instead of viz -->
      <div class="shrink-0 flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20 border border-zinc-800/30 rounded">
        <div class="text-lg font-mono font-medium tabular-nums">{{ baseWeight }}oz</div>
        <div class="text-xs font-mono text-zinc-500 mt-1">TCWM: {{ calculatedScore }}</div>
      </div>

      <!-- Right: Content -->
      <div class="flex-1 min-w-0">
        <!-- Top row with name and type -->
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <div class="flex items-start gap-2">
              <h3 class="font-mono uppercase leading-snug truncate flex-1" :title="item.Name">
                {{ item.Name }}
              </h3>
            </div>

            <!-- Comment out Amazon section for now -->
            <div class="py-2" v-if="item.amazon">
              <!-- Enhanced Amazon link -->
              <a :href="amazonAffiliateUrl" target="_blank" rel="nofollow noopener" class="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono 
                        border border-orange-500/30 text-orange-400 hover:bg-orange-500/10
                        transition-colors" :title="`Buy ${item.Name} on Amazon`">
                <UIcon name="i-heroicons-shopping-cart" class="w-3 h-3" />
                <span>BUY</span>
              </a>
            </div>

            <!-- Stats row -->
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs font-mono">
              <!-- Waterproof indicator -->
              <div v-if="item.Waterproof" class="flex items-center gap-1 text-blue-400"
                :title="`${item.Waterproof} waterproof rating`">
                <UIcon name="i-heroicons-droplet" class="w-3.5 h-3.5 shrink-0" />
                <span class="font-mono text-[10px]">{{ item.Waterproof }}</span>
              </div>

              <!-- TCWM Breakdown -->
              <div class="flex items-center gap-2">
                <span class="text-blue-400 text-[10px]">T:{{ scores.T }}</span>
                <span class="text-purple-400 text-[10px]">C:{{ scores.C }}</span>
                <span class="text-green-400 text-[10px]">W:{{ scores.W }}</span>
                <span class="text-amber-400 text-[10px]">M:{{ scores.M }}</span>
              </div>

              <!-- Tier indicator -->
              <span class="font-mono text-[10px] tabular-nums text-zinc-500">
                <span :class="tierTextColor">T{{ tier }}</span>
              </span>
            </div>
          </div>

          <!-- Type badge -->
          <span v-if="item.Type"
            class="shrink-0 px-2 py-1 text-[11px] font-mono tracking-wide flex items-center gap-1.5 border border-zinc-800"
            :class="typeClasses[item.Type]">
            <UIcon :name="typeIcons[item.Type]" class="w-3.5 h-3.5" />
            {{ item.Type }}
          </span>
        </div>

        <!-- Notes section -->
        <p v-if="item.Notes" class="mt-6 mb-2 text-zinc-500 leading-relaxed font-mono text-xs">
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
    required: false 
  }
})

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
  'Tech': 'bg-transparent text-zinc-400 border-zinc-700',
  'Utility': 'bg-transparent text-zinc-400 border-zinc-700',
  'Comfort': 'bg-transparent text-zinc-400 border-zinc-700',
  'Sleep': 'bg-transparent text-zinc-400 border-zinc-700',
  'Bag': 'bg-transparent text-zinc-400 border-zinc-700',
  'Safety': 'bg-transparent text-red-400 border-red-800/50',
  'Creativity': 'bg-transparent text-zinc-400 border-zinc-700'
}

// Update weight calculations
const baseWeight = computed(() => parseFloat(props.item['Base Weight ()']) || 0)
const loadedWeight = computed(() => parseFloat(props.item['Loaded Weight ()']) || 0)

// Amazon affiliate URL
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