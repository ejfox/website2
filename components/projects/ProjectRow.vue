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
        class="font-serif font-light tracking-tight leading-tight group-hover:underline decoration-1 underline-offset-4 text-2xl md:text-3xl"
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
        <span class="uppercase tracking-wider" :class="contextTag.class">
          {{ contextTag.label }}
        </span>
        <span
          v-if="project.metadata?.draft"
          class="uppercase tracking-wider text-zinc-400 dark:text-zinc-600"
        >
          draft
        </span>
        <time v-if="year" class="text-zinc-500 tabular-nums">{{ year }}</time>
        <span
          v-if="projectUrl"
          class="text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
          :title="`Open ${projectUrl}`"
          role="link"
          @click.stop.prevent="openExternal"
        >
          ↗
        </span>
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
    <!-- Single hero: natural aspect, no crop, no bars. -->
    <img
      v-if="images.length === 1"
      :src="heroSrc"
      :srcset="`${thumb(images[0], 900)} 900w, ${thumb(images[0], 1500)} 1500w`"
      sizes="(min-width: 768px) 75vw, 100vw"
      :alt="`${projectTitle} screenshot`"
      :loading="eager ? 'eager' : 'lazy'"
      :fetchpriority="eager ? 'high' : undefined"
      decoding="async"
      class="w-auto max-w-full h-auto max-h-[60vh] rounded"
    />
    <!-- Uniform tile grid: every image the same size (3:2), padded to fill,
         so rows read evenly and reserve their space (no layout shift). -->
    <div
      v-else-if="images.length > 1"
      class="grid grid-cols-2 lg:grid-cols-3 gap-3"
    >
      <img
        v-for="(src, i) in visibleImages"
        :key="i"
        :src="tile(src, 900)"
        :srcset="`${tile(src, 500)} 500w, ${tile(src, 900)} 900w`"
        sizes="(min-width: 1024px) 33vw, 50vw"
        :alt="`${projectTitle} screenshot ${i + 1}`"
        width="900"
        height="600"
        :loading="eager && i === 0 ? 'eager' : 'lazy'"
        :fetchpriority="eager && i === 0 ? 'high' : undefined"
        decoding="async"
        class="w-full aspect-[3/2] object-cover rounded"
      />
    </div>

    <div v-if="hiddenCount > 0" class="mt-2 font-mono text-xs text-zinc-500">
      + {{ hiddenCount }} more →
    </div>
  </NuxtLink>
</template>

<script setup>
const props = defineProps({
  project: { type: Object, required: true },
  featured: { type: Boolean, default: false },
  // Eager-load + high-priority the first row's image (the LCP candidate).
  eager: { type: Boolean, default: false },
})

const projectSlug = computed(
  () => props.project.slug?.replace(/^projects\//, '') || ''
)

const projectTitle = computed(
  () => props.project.title || props.project.metadata?.title || 'Untitled'
)

const client = computed(() => props.project.metadata?.client || '')

// --- Context: client / collaborative / personal --------------------------------
// Defaults to "personal" — only client & collaborative projects set `context` in
// frontmatter. client/collaborative read slightly brighter; personal sits back.
const contextTag = computed(() => {
  const c = props.project.metadata?.context || 'personal'
  const map = {
    client: { label: 'client', class: 'text-zinc-500 dark:text-zinc-300' },
    collaborative: { label: 'collaborative', class: 'text-zinc-500 dark:text-zinc-300' },
    personal: { label: 'personal', class: 'text-zinc-400 dark:text-zinc-600' },
  }
  return map[c] || map.personal
})

const year = computed(() => {
  const date = props.project.metadata?.date || props.project.date
  if (!date) return ''
  const y = new Date(date).getFullYear()
  return Number.isNaN(y) ? '' : y
})

// --- State chip --------------------------------------------------------------
// --- External link ----------------------------------------------------------
// The whole row is a NuxtLink to the detail page; the ↗ opens the project's own
// URL in a new tab without triggering that navigation. Quieter than a state chip.
const projectUrl = computed(() => props.project.metadata?.url || '')
const openExternal = () => {
  if (projectUrl.value) window.open(projectUrl.value, '_blank', 'noopener')
}

// --- Tech stack stripe -------------------------------------------------------
const tech = computed(() => {
  const t = props.project.metadata?.tech
  if (!Array.isArray(t)) return []
  return t.map((x) => String(x).toLowerCase()).filter(Boolean)
})

// --- Images & Cloudinary transforms -----------------------------------------
// Inject the transform right after /upload/ so it works on BOTH versioned
// (/upload/v123/…) and unversioned (/upload/projects/…) URLs.
const cld = (src, transform) => {
  if (!src) return src
  const url = src.replace(/^http:/, 'https:')
  if (!url.includes('/image/upload/')) return url
  return url.replace('/image/upload/', `/image/upload/${transform}/`)
}
// Hero: keep full aspect, just cap size. Tile: uniform 3:2 with NO crop —
// pad to the aspect using the page background color (zinc-900 #18181b) so the
// padding is invisible. Portraits float whole, landscapes fill; every tile the
// same size and nothing gets butchered.
const thumb = (src, width) => cld(src, `c_limit,w_${width},q_auto,f_auto`)
const tile = (src, width) =>
  cld(src, `c_fill,ar_3:2,g_auto,w_${width},q_auto,f_auto`)

const images = computed(() => {
  if (!props.project.html) return []
  return [...props.project.html.matchAll(/<img[^>]+src="([^"]+)"/g)].map(
    (m) => m[1].replace(/^http:/, 'https:')
  )
})

const IMAGE_CAP = 6
const visibleImages = computed(() => images.value.slice(0, IMAGE_CAP))
const hiddenCount = computed(() => Math.max(0, images.value.length - IMAGE_CAP))

// Single-image rows: one static hero, no cycling.
const heroSrc = computed(() =>
  images.value.length ? thumb(images.value[0], 1500) : ''
)

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

<style scoped>
/* The lede sits in a calm reading measure and a quiet size so it reads as
   subordinate to the title — not a second competing block of large serif.
   Scoped specificity holds the measure against global paragraph widths. */
.project-row p {
  max-width: 56ch;
  font-size: 0.9rem;
  line-height: 1.65;
}
</style>
