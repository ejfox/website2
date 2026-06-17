<script setup lang="ts">
const props = defineProps({
  gearSlug: { type: String, required: true },
})

const { data: item, pending } = useFetch(`/api/gear/${props.gearSlug}`, {
  getCachedData: (key, nuxtApp) =>
    nuxtApp.payload.data[key] ?? nuxtApp.static.data[key],
})

const weightGrams = computed(() => {
  const oz = Number.parseFloat(item.value?.Weight_oz ?? '')
  if (!oz || oz <= 0) return '—'
  const g = Math.round(oz * 28.3495)
  return g >= 1000 ? `${(g / 1000).toFixed(1)}k` : g
})

// First sentence of Notes, capped at 120 chars
const noteExcerpt = computed(() => {
  const notes = item.value?.Notes?.trim()
  if (!notes) return null
  const first = notes.split(/\.\s+/)[0]
  return first.length > 120 ? first.slice(0, 117) + '…' : first + '.'
})

const conditionColor = computed(() => {
  const map: Record<string, string> = {
    New: 'tag-bright',
    Good: 'tag-mid',
    Fair: 'tag-dim',
    Poor: 'tag-faint',
  }
  return map[item.value?.Condition ?? ''] ?? ''
})
</script>

<template>
  <div v-if="item" class="card">
    <div class="card-top">
      <div class="card-identity">
        <NuxtLink :to="`/gear/${item.slug}`" class="card-name">
          {{ item.Name }}
        </NuxtLink>
        <span v-if="item.Brand" class="card-brand">{{ item.Brand }}</span>
      </div>
      <div class="card-weight" :title="`${item.Weight_oz}oz`">
        {{ weightGrams }}
        <span class="card-weight-unit">g</span>
      </div>
    </div>

    <p v-if="noteExcerpt" class="card-note">{{ noteExcerpt }}</p>

    <div class="card-footer">
      <span v-if="item.Type" class="card-tag">{{ item.Type }}</span>
      <span v-if="item.Condition" class="card-tag" :class="conditionColor">
        {{ item.Condition }}
      </span>
      <NuxtLink :to="`/gear/${item.slug}`" class="card-cta">
        open in gear inventory →
      </NuxtLink>
    </div>
  </div>

  <div v-else-if="pending" class="card card-skeleton">
    <div class="skeleton-name" />
    <div class="skeleton-note" />
    <div class="skeleton-footer" />
  </div>

  <div v-else class="card card-error">
    <span class="error-label">gear: {{ gearSlug }}</span>
  </div>
</template>

<style scoped>
.card {
  @apply my-4 border border-zinc-200 dark:border-zinc-700
         bg-zinc-50 dark:bg-zinc-900
         px-4 py-3 font-mono rounded-sm;
}

.card-top {
  @apply flex items-start justify-between gap-3 mb-2;
}

.card-identity {
  @apply flex flex-col gap-0.5 min-w-0;
}

.card-name {
  @apply text-sm font-medium text-zinc-900 dark:text-zinc-100
         no-underline hover:text-zinc-600 dark:hover:text-zinc-400
         transition-colors duration-150 leading-tight;
}

.card-brand {
  @apply text-3xs text-zinc-400 dark:text-zinc-600 uppercase tracking-widest;
}

.card-weight {
  @apply text-xl font-light tabular-nums text-zinc-700 dark:text-zinc-300 shrink-0 leading-none;
}

.card-weight-unit {
  @apply text-xs text-zinc-400 dark:text-zinc-600 ml-px;
}

.card-note {
  @apply text-2xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-2 italic;
}

.card-footer {
  @apply flex items-center gap-2 flex-wrap;
}

.card-tag {
  @apply text-3xs uppercase tracking-widest text-zinc-400 dark:text-zinc-600
         border border-zinc-200 dark:border-zinc-700 px-1.5 py-px rounded-sm;
}

.tag-bright {
  @apply text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-600;
}
.tag-mid {
  @apply text-zinc-500 dark:text-zinc-500;
}
.tag-dim {
  @apply text-zinc-400 dark:text-zinc-600;
}
.tag-faint {
  @apply text-zinc-300 dark:text-zinc-700;
}

.card-cta {
  @apply ml-auto text-3xs text-zinc-400 dark:text-zinc-600
         hover:text-zinc-700 dark:hover:text-zinc-300
         transition-colors duration-150 no-underline tracking-wide;
}

/* Skeleton */
.card-skeleton {
  @apply animate-pulse;
}
.skeleton-name {
  @apply h-4 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800 mb-2;
}
.skeleton-note {
  @apply h-3 w-full rounded bg-zinc-200 dark:bg-zinc-800 mb-1;
}
.skeleton-footer {
  @apply h-3 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800;
}

/* Error */
.card-error {
  @apply opacity-40;
}
.error-label {
  @apply text-2xs text-zinc-500;
}
</style>
