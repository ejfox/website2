<script setup>
defineProps({ items: { type: Array, required: true } })

const { TYPE_SYMBOLS, slugifyGear } = useGearUI()
const { getItemWeightInOunces } = useWeightCalculations()

const formatOz = (item) => {
  const oz = getItemWeightInOunces(item)
  if (!oz || Number.isNaN(oz)) return '—'
  return oz > 16 ? `${(oz / 16).toFixed(1)}lb` : `${oz.toFixed(1)}oz`
}
</script>

<template>
  <div>
    <div class="showroom-label font-mono">
      SHOWROOM · {{ items.length }} SCANS
    </div>
    <div class="gallery">
      <NuxtLink
        v-for="item in items"
        :key="item.Name"
        :to="`/gear/${slugifyGear(item.Name || '')}`"
        :aria-label="`View 3D scan of ${item.Name || 'gear item'}`"
        class="card"
      >
        <GearModelViewer :model-url="item.Scan_3D_URL" height="220px" />
        <div class="card-meta font-mono">
          <span class="sym">{{ TYPE_SYMBOLS[item.Type] || '—' }}</span>
          <span class="name">{{ (item.Name || '').toUpperCase() }}</span>
          <span class="wt">{{ formatOz(item) }}</span>
          <span class="sep">·</span>
          <span class="type">{{ (item.Type || '').toUpperCase() }}</span>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.showroom-label {
  @apply font-mono text-3xs uppercase tracking-[.1em];
  @apply text-cyan-500/50 py-1 px-2 bg-sunken;
}

.gallery {
  @apply grid gap-2 p-2;
  grid-template-columns: repeat(
    auto-fill,
    minmax(260px, 1fr)
  ); /* no Tailwind equivalent */
  /* gradient can't @apply */
  background:
    repeating-linear-gradient(
      0deg,
      transparent 0 2px,
      rgba(6, 182, 212, 0.015) 2px 4px
    ),
    #080808;
}

.card {
  @apply relative block border border-cyan-500 no-underline;
  @apply bg-page transition-shadow duration-200;
  /* complex shadow — keep raw */
  box-shadow: 0 0 8px rgba(6, 182, 212, 0.3);
}
.card::before,
.card::after {
  content: '';
  /* 12px not in custom spacing scale */
  @apply absolute w-[12px] h-[12px] z-[1];
}
.card::before {
  @apply -top-px -left-px border-t-2 border-l-2 border-cyan-500;
}
.card::after {
  @apply -bottom-px -right-px border-b-2 border-r-2 border-cyan-500;
}
.card:hover {
  box-shadow:
    0 0 24px rgba(6, 182, 212, 0.7),
    inset 0 0 24px rgba(6, 182, 212, 0.05);
}

.card-meta {
  @apply flex items-center gap-1 py-1 px-2;
  @apply border-t border-cyan-500/20 text-3xs leading-none;
}
.sym {
  @apply text-cyan-500 flex-shrink-0;
}
.name {
  @apply text-zinc-400 tracking-[.05em] flex-1;
  @apply overflow-hidden text-ellipsis whitespace-nowrap;
}
.wt {
  @apply text-cyan-500/70 flex-shrink-0;
}
.sep {
  @apply text-cyan-500/30 flex-shrink-0;
}
.type {
  @apply text-cyan-500/40 flex-shrink-0 tracking-[.05em];
}
</style>
