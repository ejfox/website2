<template>
  <div>
    <div class="plate-header">
      <span class="plate-label">PLATE · {{ items.length }} SPECIMENS</span>
      <span class="plate-total">{{ totalLabel }}</span>
    </div>

    <div class="specimens">
      <div v-for="item in items" :key="item.Name" class="specimen">

        <div class="specimen-image">
          <img v-if="item.Photo_URL?.trim()" :src="item.Photo_URL" :alt="item.Name"
            class="specimen-photo" />
          <span v-else class="specimen-symbol">{{ TYPE_SYMBOLS[item.Type] || '—' }}</span>
          <div class="specimen-rule" />
        </div>

        <div class="specimen-labels">
          <span class="specimen-name" :title="item.Name">{{ item.Name }}</span>
          <span class="specimen-weight">{{ toGrams(item) }}g</span>
          <span class="specimen-type">{{ item.Type || '—' }}{{ item.Condition ? ' · ' + item.Condition : '' }}</span>
          <span class="specimen-pips">{{ PRIORITY_PIPS[item.Priority] || '' }}</span>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({ items: { type: Array, required: true } })

const { TYPE_SYMBOLS, PRIORITY_PIPS } = useGearUI()
const { getItemWeightInOunces, calculateTotalWeight } = useWeightCalculations()

const toGrams = (item) => {
  const oz = getItemWeightInOunces(item)
  if (!oz || isNaN(oz)) return 0
  return Math.round(oz * 28.3495)
}

const totalGrams = computed(() => Math.round(calculateTotalWeight(props.items).grams))
const totalLabel = computed(() =>
  totalGrams.value >= 1000
    ? `${(totalGrams.value / 1000).toFixed(1)}kg total`
    : `${totalGrams.value}g total`
)
</script>

<style scoped>
.plate-header  { @apply flex justify-between items-baseline border-b border-zinc-200 dark:border-zinc-700 mb-4 pb-1; }
.plate-label   { @apply font-mono text-3xs uppercase tracking-wider text-zinc-400; }
.plate-total   { @apply font-mono text-3xs tabular-nums text-zinc-400; }

.specimens     {
  @apply grid gap-8;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); /* no Tailwind equivalent */
}
.specimen      { @apply flex flex-col items-center; }

.specimen-image  { @apply flex flex-col items-center w-full; }
.specimen-photo  { @apply object-cover w-[120px] h-[120px] grayscale opacity-80; }
.specimen-symbol { @apply text-4xl text-zinc-400 dark:text-zinc-600 leading-none; }
.specimen-rule   { @apply w-full mt-3 border-b border-zinc-300 dark:border-zinc-700; }

.specimen-labels { @apply flex flex-col items-center w-full mt-2 gap-0.5; }
.specimen-name   { @apply font-mono text-3xs uppercase tracking-wider text-zinc-700 dark:text-zinc-300 truncate max-w-full text-center block; }
.specimen-weight { @apply font-mono text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-100 text-center; }
.specimen-type   { @apply font-mono text-3xs text-zinc-400 dark:text-zinc-600 uppercase text-center; }
.specimen-pips   { @apply font-mono text-3xs text-zinc-500 text-center; }
</style>
