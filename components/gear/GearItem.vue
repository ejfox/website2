<template>
  <tr
    class="group hover:bg-zinc-900/40 cursor-pointer even:bg-zinc-900/20 relative"
  >
    <td
      class="px-1 py-0.5 text-zinc-100 truncate max-w-[300px]"
      :title="item.Name + (item.Notes ? '\n\n' + item.Notes : '')"
    >
      <div class="flex items-center gap-1">
        <span class="truncate flex-1 text-[9px]">{{ item.Name }}</span>
        <span v-if="item.Notes" class="text-zinc-700 text-[7px]">•</span>
        <a
          v-if="item.Amazon_URL"
          :href="addAffiliateCode(item.Amazon_URL)"
          target="_blank"
          rel="nofollow noopener"
          class="text-orange-600/80 hover:text-orange-500 text-[8px]"
          @click.stop
        >
          ↗
        </a>
      </div>
    </td>
    <td class="px-1 py-0.5 text-center text-zinc-500 text-[10px]">
      {{ getTypeSymbol(item.Type) }}
    </td>
    <td class="px-1 py-0.5 text-center text-zinc-600 text-[8px]">
      {{ getCategoryAbbr(item.Category) }}
    </td>
    <td class="px-1 py-0.5 text-center text-zinc-600 text-[8px]">
      {{ getWaterproofSymbol(item.Waterproof) }}
    </td>
    <td class="px-1 py-0.5 text-center text-zinc-600 text-[8px]">
      {{ getPrioritySymbol(item.Priority) }}
    </td>
    <td class="px-1 py-0.5 text-center text-zinc-600 text-[8px]">
      {{ getConditionSymbol(item.Condition) }}
    </td>
    <td class="px-1 py-0.5 text-center text-zinc-600 tabular-nums text-[8px]">
      {{ getDaysSinceUsed(item.Last_Used) }}
    </td>
    <td class="px-1 py-0.5 text-right text-zinc-300 tabular-nums pr-2">
      <span class="text-[9px] font-medium">{{
        formatWeight(item.Weight_oz)
      }}</span>
    </td>
  </tr>
</template>

<script setup>
const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  weightUnit: {
    type: String,
    default: 'metric'
  }
})

const typeSymbols = {
  Tech: '▲',
  Utility: '⬟',
  Comfort: '○',
  Sleep: '☽',
  Bag: '▣',
  Safety: '◆',
  Creativity: '✧'
}

const getTypeSymbol = (type) => typeSymbols[type] || '—'

const formatWeight = (weightOz) => {
  if (!weightOz) return '—'

  if (props.weightUnit === 'imperial') {
    // Convert to imperial
    if (weightOz >= 16) {
      const pounds = (weightOz / 16).toFixed(1)
      return `${pounds}lb`
    }
    return `${weightOz.toFixed(1)}oz`
  } else {
    // Convert to metric
    const grams = Math.round(weightOz * 28.3495)
    if (grams >= 1000) {
      const kg = (grams / 1000).toFixed(1)
      return `${kg}kg`
    }
    return `${grams}g`
  }
}

const getCategoryAbbr = (category) => {
  if (!category) return '—'
  const abbrs = {
    Adventure: 'ADV',
    Tech: 'TCH',
    Photo: 'PHT',
    Motorcycle: 'MTO',
    Home: 'HOM',
    Clothing: 'CLT'
  }
  return abbrs[category] || category.substring(0, 3).toUpperCase()
}

const getWaterproofSymbol = (waterproof) => {
  if (!waterproof) return '—'
  const symbols = {
    Yes: '●',
    No: '○',
    Partial: '◐'
  }
  return symbols[waterproof] || '—'
}

const getPrioritySymbol = (priority) => {
  if (!priority) return '—'
  const symbols = {
    High: '↑',
    Medium: '→',
    Low: '↓'
  }
  return symbols[priority] || '—'
}

const getConditionSymbol = (condition) => {
  if (!condition) return '—'
  const symbols = {
    New: '◆',
    Good: '●',
    Fair: '◐',
    Poor: '○'
  }
  return symbols[condition] || '—'
}

const getDaysSinceUsed = (lastUsed) => {
  if (!lastUsed) return '—'
  const days = Math.floor(
    (new Date() - new Date(lastUsed)) / (1000 * 60 * 60 * 24)
  )
  if (days === 0) return 'tdy'
  if (days === 1) return '1d'
  if (days < 7) return `${days}d`
  if (days < 30) return `${Math.floor(days / 7)}w`
  if (days < 365) return `${Math.floor(days / 30)}m`
  return `${Math.floor(days / 365)}y`
}

const addAffiliateCode = (url) => {
  if (!url?.includes('amazon.com')) return url
  try {
    const amazonUrl = new URL(url)
    amazonUrl.searchParams.set('tag', 'ejfox0c-20')
    return amazonUrl.toString()
  } catch {
    return url
  }
}
</script>
