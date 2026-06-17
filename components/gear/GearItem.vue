<script setup lang="ts">
const props = defineProps({
  item: { type: Object, required: true },
  weightUnit: { type: String, default: 'metric' },
})

const { TYPE_SYMBOLS, PRIORITY_PIPS, slugifyGear } = useGearUI()

// ── Weight ──────────────────────────────────────────────
const formatWeight = (weightOz) => {
  const oz = Number.parseFloat(weightOz)
  if (!oz || oz <= 0) return '—'
  if (props.weightUnit === 'imperial')
    return oz >= 16 ? `${(oz / 16).toFixed(1)}lb` : `${oz.toFixed(1)}oz`
  const g = Math.round(oz * 28.3495)
  return g >= 1000 ? `${(g / 1000).toFixed(1)}kg` : `${g}g`
}

// ── Category ─────────────────────────────────────────────
const CATEGORY_ABBR: Record<string, string> = {
  Adventure: 'ADV',
  Tech: 'TCH',
  Photo: 'PHT',
  Motorcycle: 'MTO',
  Home: 'HOM',
  Clothing: 'CLT',
}
const categoryAbbr = (c: string) =>
  c ? (CATEGORY_ABBR[c] ?? c.substring(0, 3).toUpperCase()) : '—'

// ── Waterproof ───────────────────────────────────────────
const waterproofDot = (w: string) =>
  ({ Yes: '●', No: '○', Partial: '◐' })[w] ?? '—'

// ── Condition ────────────────────────────────────────────
const conditionClass = (c: string) =>
  ({
    New: 'text-zinc-900 dark:text-zinc-100',
    Good: 'text-zinc-600 dark:text-zinc-400',
    Fair: 'text-zinc-400 dark:text-zinc-600',
    Poor: 'text-zinc-300 dark:text-zinc-700',
  })[c] ?? 'text-zinc-500 dark:text-zinc-600'

// ── Age since last use ───────────────────────────────────
const daysSince = (d: string) =>
  d ? Math.floor((Date.now() - +new Date(d)) / 86400000) : null

const ageLabel = (lastUsed: string) => {
  const d = daysSince(lastUsed)
  if (d === null) return '—'
  if (d === 0) return 'tdy'
  if (d < 7) return `${d}d`
  if (d < 30) return `${Math.floor(d / 7)}w`
  if (d < 365) return `${Math.floor(d / 30)}m`
  return `${Math.floor(d / 365)}y`
}

const ageClass = (lastUsed: string) => {
  const d = daysSince(lastUsed)
  if (d === null || d >= 180) return 'text-zinc-300 dark:text-zinc-700'
  if (d < 7) return 'text-zinc-900 dark:text-zinc-100'
  if (d < 30) return 'text-zinc-500 dark:text-zinc-600'
  return 'text-zinc-400 dark:text-zinc-600'
}

// ── Amazon affiliate ─────────────────────────────────────
const affiliateUrl = (url: string) => {
  if (!url?.includes('amazon.com')) return url
  try {
    const u = new URL(url)
    u.searchParams.set('tag', 'ejfox0c-20')
    return u.toString()
  } catch {
    return url
  }
}
</script>

<template>
  <tr class="row group">
    <td class="cell-name">
      <div class="name-inner">
        <NuxtLink
          v-tooltip="item.Notes"
          :to="`/gear/${slugifyGear(item.Name)}`"
          class="name-link"
          @click.stop
        >
          {{ item.Name }}
        </NuxtLink>
        <span v-if="item.Notes" class="note-dot">•</span>
      </div>
    </td>
    <td class="cell-buy">
      <a
        v-if="item.Amazon_URL"
        v-tooltip="'Buy on Amazon'"
        :href="affiliateUrl(item.Amazon_URL)"
        target="_blank"
        rel="nofollow noopener"
        class="badge-orange-hover"
        @click.stop
      >
        BUY
      </a>
      <span v-else class="empty">—</span>
    </td>
    <td class="cell cell-sym">{{ TYPE_SYMBOLS[item.Type] || '—' }}</td>
    <td class="cell">{{ categoryAbbr(item.Category) }}</td>
    <td class="cell">{{ waterproofDot(item.Waterproof) }}</td>
    <td class="cell">
      <span class="priority-pips">
        {{ PRIORITY_PIPS[item.Priority] || '—' }}
      </span>
    </td>
    <td class="cell" :class="conditionClass(item.Condition)">
      <span v-if="item.Condition">●</span>
      <span v-else class="empty">—</span>
    </td>
    <td class="cell tabular-nums" :class="ageClass(item.Last_Used)">
      {{ ageLabel(item.Last_Used) }}
    </td>
    <td class="cell-weight">
      <span class="text-3xs font-medium">
        {{ formatWeight(item.Weight_oz) }}
      </span>
    </td>
  </tr>
</template>

<style scoped>
.row {
  @apply hover:bg-zinc-100 dark:hover:bg-zinc-900/40 cursor-pointer even:bg-zinc-50 dark:even:bg-zinc-900/20 relative;
}

.cell-name {
  @apply px-1 py-0.5 truncate max-w-[300px];
}
.name-inner {
  @apply flex items-center gap-1;
}
.name-link {
  @apply truncate flex-1 text-3xs text-zinc-800 dark:text-zinc-100 hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors;
}
.note-dot {
  @apply text-zinc-400 dark:text-zinc-700 text-3xs;
}

.cell-buy {
  @apply px-1 py-0.5 text-center;
}
.cell-sym {
  @apply text-2xs text-zinc-600 dark:text-zinc-500;
}
.cell {
  @apply px-1 py-0.5 text-center text-3xs text-zinc-500 dark:text-zinc-600;
}
.cell-weight {
  @apply px-1 py-0.5 text-right text-zinc-700 dark:text-zinc-300 tabular-nums pr-2;
}

.priority-pips {
  @apply tracking-tighter font-mono;
}
.empty {
  @apply text-zinc-400 dark:text-zinc-800 text-3xs;
}

.badge-orange-hover {
  @apply font-mono text-3xs uppercase tracking-wider px-1 py-0.5
         text-orange-600 dark:text-orange-400
         border border-orange-300 dark:border-orange-700
         hover:bg-orange-50 dark:hover:bg-orange-900/20
         transition-colors duration-150 no-underline;
}
</style>
