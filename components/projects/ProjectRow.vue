<!--
  @file ProjectRow.vue
  @description Image-FIRST project row. A compact title + lede sits above a
    masonry grid showing screenshots at natural aspect (no bars, no crop),
    wrapping to fill the full width. Click → project detail.
  @props project: Object - Project with title, html, metadata
  @props featured: boolean - Featured rows get bigger type + full-bleed escape
    via the parent layout.
-->
<template>
  <NuxtLink
    :to="`/projects/${projectSlug}`"
    class="project-row block no-underline group text-zinc-900 dark:text-zinc-100"
  >
    <div class="flex items-baseline justify-between gap-4 mb-2">
      <h3
        class="font-serif font-light tracking-tight leading-tight group-hover:underline decoration-1 underline-offset-4"
        :class="featured ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl'"
      >
        {{ projectTitle }}
        <span
          v-if="client"
          class="font-mono text-xs text-zinc-500 uppercase tracking-wider align-middle ml-2"
        >
          {{ client }}
        </span>
      </h3>
      <span class="shrink-0 flex items-baseline gap-2 font-mono text-xs">
        <span
          v-if="project.metadata?.draft"
          class="uppercase tracking-wider text-amber-600 dark:text-amber-500 border border-amber-600/40 rounded px-1"
        >
          draft
        </span>
        <span
          v-if="stateChip"
          class="uppercase tracking-wider border rounded px-1"
          :class="stateChip.class"
        >
          {{ stateChip.label }}
        </span>
        <span
          v-if="aiGlyph"
          class="uppercase tracking-wider text-zinc-500 tabular-nums"
          :title="`AI involvement: ${aiGlyph.label}`"
        >
          <span aria-hidden="true">{{ aiGlyph.glyph }}</span>
          {{ aiGlyph.label }}
        </span>
        <time v-if="year" class="text-zinc-500 tabular-nums">{{ year }}</time>
      </span>
    </div>

    <div
      v-if="tech.length"
      class="font-mono text-xs lowercase text-zinc-500 mb-2 leading-relaxed"
    >
      <span v-for="(t, i) in tech" :key="t">
        <span>{{ t }}</span>
        <span
          v-if="i < tech.length - 1"
          class="px-1.5 text-zinc-400 dark:text-zinc-600"
        >
          ·
        </span>
      </span>
    </div>

    <p
      v-if="excerpt"
      class="text-sm text-zinc-500 dark:text-zinc-400 max-w-prose mb-5 leading-relaxed"
    >
      {{ excerpt }}
    </p>

    <!-- One image: a generous hero.
         Several: a masonry wall, capped at 6 with an overflow link. -->
    <img
      v-if="images.length === 1"
      :src="heroSrc"
      :alt="`${projectTitle} screenshot`"
      loading="lazy"
      decoding="async"
      class="w-auto max-w-full h-auto max-h-[50vh] rounded transition-opacity duration-500"
      @mouseenter="onHoverEnter"
      @mouseleave="onHoverLeave"
    />
    <div
      v-else-if="images.length > 1"
      class="columns-1 sm:columns-2 lg:columns-3 2xl:columns-4 gap-4"
      @mouseenter="onHoverEnter"
      @mouseleave="onHoverLeave"
    >
      <img
        v-for="(src, i) in visibleImages"
        :key="i"
        :src="src"
        :alt="`${projectTitle} screenshot ${i + 1}`"
        loading="lazy"
        decoding="async"
        class="w-auto max-w-full h-auto max-h-[50vh] mb-4 block break-inside-avoid rounded transition-opacity duration-500"
        :class="tileOpacityClass(i)"
      />
    </div>

    <div v-if="hiddenCount > 0" class="mt-2 font-mono text-xs text-zinc-500">
      + {{ hiddenCount }} more →
    </div>
  </NuxtLink>
</template>

<script setup>
import { usePreferredReducedMotion, useMediaQuery } from '@vueuse/core'

const props = defineProps({
  project: { type: Object, required: true },
  featured: { type: Boolean, default: false },
})

const projectSlug = computed(
  () => props.project.slug?.replace(/^projects\//, '') || ''
)

const projectTitle = computed(
  () => props.project.title || props.project.metadata?.title || 'Untitled'
)

const client = computed(() => props.project.metadata?.client || '')

const year = computed(() => {
  const date = props.project.metadata?.date || props.project.date
  if (!date) return ''
  const y = new Date(date).getFullYear()
  return Number.isNaN(y) ? '' : y
})

// --- State chip --------------------------------------------------------------
const stateChip = computed(() => {
  const s = props.project.metadata?.state
  if (!s) return null
  const map = {
    deployed: {
      label: 'deployed',
      class: 'text-emerald-600 dark:text-emerald-500 border-emerald-600/40',
    },
    archived: {
      label: 'archived',
      class: 'text-zinc-500 border-zinc-500/40',
    },
    prototype: {
      label: 'prototype',
      class: 'text-sky-600 dark:text-sky-400 border-sky-500/40',
    },
    draft: {
      label: 'draft',
      class: 'text-amber-600 dark:text-amber-500 border-amber-600/40',
    },
  }
  // Skip "draft" here — already rendered by the dedicated draft pill above.
  if (s === 'draft') return null
  return map[s] || null
})

// --- AI involvement glyph ----------------------------------------------------
// Values seen: solo, pair, ai-assisted, human-only. Treat human-only as solo.
const aiGlyph = computed(() => {
  const a = props.project.metadata?.aiInvolvement
  if (!a) return null
  const norm = a === 'human-only' ? 'solo' : a
  const map = {
    solo: { glyph: '◯', label: 'solo' },
    pair: { glyph: '◐', label: 'pair' },
    'ai-assisted': { glyph: '●', label: 'ai-assisted' },
  }
  return map[norm] || null
})

// --- Tech stack stripe -------------------------------------------------------
const tech = computed(() => {
  const t = props.project.metadata?.tech
  if (!Array.isArray(t)) return []
  return t.map((x) => String(x).toLowerCase()).filter(Boolean)
})

// --- Images & Cloudinary thumbnailing ---------------------------------------
const thumb = (src, width) => {
  if (!src) return src
  const url = src.replace(/^http:/, 'https:')
  if (!url.includes('res.cloudinary.com')) return url
  return url.replace(/\/(v\d+)\//, `/c_limit,w_${width},q_auto,f_auto/$1/`)
}

const images = computed(() => {
  if (!props.project.html) return []
  const all = [...props.project.html.matchAll(/<img[^>]+src="([^"]+)"/g)].map(
    (m) => m[1]
  )
  const w = all.length === 1 ? 1500 : 900
  return all.map((src) => thumb(src, w))
})

const IMAGE_CAP = 6
const visibleImages = computed(() => images.value.slice(0, IMAGE_CAP))
const hiddenCount = computed(() => Math.max(0, images.value.length - IMAGE_CAP))

// --- Hover filmstrip (desktop only, respects reduced-motion) -----------------
const reducedMotion = usePreferredReducedMotion()
const isDesktop = useMediaQuery('(min-width: 768px)')

const cycleIndex = ref(0)
let cycleTimer = null

const stopCycle = () => {
  if (cycleTimer) {
    clearInterval(cycleTimer)
    cycleTimer = null
  }
}

const startCycle = () => {
  stopCycle()
  if (reducedMotion.value !== 'no-preference') return
  if (!isDesktop.value) return
  if (images.value.length < 2) return
  cycleTimer = setInterval(() => {
    cycleIndex.value = (cycleIndex.value + 1) % images.value.length
  }, 800)
}

const onHoverEnter = () => {
  if (typeof window === 'undefined') return
  startCycle()
}

const onHoverLeave = () => {
  stopCycle()
  cycleIndex.value = 0
}

onBeforeUnmount(stopCycle)

// Single-image rows: cycle src on the hero img element.
const heroSrc = computed(() => {
  if (!images.value.length) return ''
  return images.value[cycleIndex.value] || images.value[0]
})

// Multi-image masonry: shift opacity stagger across tiles so the currently
// "lit" tile reads as the focus and the rest dim gently. Reduced motion or
// non-desktop falls back to a flat hover state.
const tileOpacityClass = (i) => {
  if (!cycleTimer) return ''
  // Highlight cycleIndex tile, dim the rest.
  return i === cycleIndex.value % visibleImages.value.length
    ? 'opacity-100'
    : 'opacity-60'
}

// --- Excerpt ----------------------------------------------------------------
const excerpt = computed(() => {
  if (!props.project.html) return null
  const pMatch = props.project.html.match(/<p[^>]*>([\s\S]*?)<\/p>/)
  const raw = pMatch ? pMatch[1] : props.project.html
  return (
    raw
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim() || null
  )
})
</script>
