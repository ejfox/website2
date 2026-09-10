<!--
  @file ProjectRow.vue
  @description Image-FIRST project row. A compact title + lede sits above a
    masonry grid showing screenshots at natural aspect (no bars, no crop),
    wrapping to fill the full width. Click → project detail.
  @props project: Object - Project with title, html, metadata
  @props featured: boolean - Featured rows get bigger type + full-bleed escape
    via the parent layout.
-->
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
    collaborative: {
      label: 'collaborative',
      class: 'text-zinc-500 dark:text-zinc-300',
    },
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

// --- AI involvement ----------------------------------------------------------
// Surfaced verbatim from frontmatter (ai-assisted / ai-collaborative /
// ai-enhanced / human-only). Readers can smell robot work — say it plainly
// instead of letting them wonder.
const aiInvolvement = computed(
  () => props.project.metadata?.['ai-involvement'] || ''
)

// --- State chip --------------------------------------------------------------
// --- External link ----------------------------------------------------------
// The whole row is a NuxtLink to the detail page; the ↗ opens the project's own
// URL in a new tab without triggering that navigation. Quieter than a state chip.
const projectUrl = computed(() => props.project.metadata?.url || '')

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
  const marker = '/image/upload/'
  const at = url.indexOf(marker)
  if (at === -1) return url
  const head = url.slice(0, at + marker.length)
  // Strip any transform segments ALREADY baked into the URL (e.g. the
  // c_scale,…,w_1280 that remarkEnhanceImages injects upstream). Otherwise our
  // c_fill,w_900 crop gets re-scaled to 1280 — upscaling a downscale, which
  // ships softer, heavier images. A segment is a transform iff every
  // comma-token is a cloudinary param (`x_…`); versions (v123) and folder
  // names (projects) are not, so they survive.
  const segs = url.slice(at + marker.length).split('/')
  const isTransform = (s) =>
    s.length > 0 && s.split(',').every((t) => /^[a-z]+_/.test(t))
  let i = 0
  while (i < segs.length && isTransform(segs[i])) i++
  return head + transform + '/' + segs.slice(i).join('/')
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
  return [...props.project.html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) =>
    m[1].replace(/^http:/, 'https:')
  )
})

// --- Demo video --------------------------------------------------------------
// First <video> in the post becomes a living tile at the head of the grid.
// Playback is viewport-driven (plugins/video-viewport.client.ts): it only
// plays while on screen.
const heroVideo = computed(() => {
  if (!props.project.html) return ''
  const m = props.project.html.match(/<video[^>]*\ssrc="([^"]+)"/)
  return m ? m[1].replace(/^http:/, 'https:') : ''
})

// Cloudinary video transform injection — same strip-then-inject as cld(), but
// on the /video/upload/ marker.
const cldVideo = (src, transform) => {
  const marker = '/video/upload/'
  const at = src.indexOf(marker)
  if (at === -1) return src
  const head = src.slice(0, at + marker.length)
  const segs = src.slice(at + marker.length).split('/')
  const isTransform = (s) =>
    s.length > 0 && s.split(',').every((t) => /^[a-z]+_/.test(t))
  let i = 0
  while (i < segs.length && isTransform(segs[i])) i++
  return head + transform + '/' + segs.slice(i).join('/')
}
const videoTile = (src) => cldVideo(src, 'c_fill,ar_3:2,w_900,q_auto')
const videoPoster = (src) =>
  cldVideo(src, 'so_0,c_fill,ar_3:2,w_900,q_auto,f_jpg').replace(
    /\.\w+$/,
    '.jpg'
  )

const IMAGE_CAP = 6
const imageCap = computed(() => IMAGE_CAP - (heroVideo.value ? 1 : 0))
const visibleImages = computed(() => images.value.slice(0, imageCap.value))
const hiddenCount = computed(() =>
  Math.max(0, images.value.length - imageCap.value)
)

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
          v-if="aiInvolvement"
          class="uppercase tracking-wider text-zinc-400 dark:text-zinc-600"
        >
          {{ aiInvolvement }}
        </span>
        <span
          v-if="project.metadata?.draft"
          class="uppercase tracking-wider text-zinc-400 dark:text-zinc-600"
        >
          draft
        </span>
        <time v-if="year" class="text-zinc-500 tabular-nums">{{ year }}</time>
        <a
          v-if="projectUrl"
          :href="projectUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
          :title="`Open ${projectUrl}`"
          :aria-label="`Open ${projectTitle} (opens in new tab)`"
          @click.stop
        >
          ↗
        </a>
      </span>
    </div>

    <div
      v-if="tech.length"
      class="font-mono text-xs lowercase text-zinc-500 mb-2 leading-6"
    >
      <span v-for="(t, i) in tech" :key="t">
        <span>{{ t }}</span>
        <span
          v-if="i < tech.length - 1"
          class="px-1 text-zinc-400 dark:text-zinc-600"
        >
          ·
        </span>
      </span>
    </div>

    <p
      v-if="excerpt"
      class="text-sm text-zinc-500 dark:text-zinc-400 max-w-prose mb-5 leading-6"
    >
      {{ excerpt }}
    </p>

    <!-- One image: a generous hero.
         Several: a masonry wall, capped at 6 with an overflow link. -->
    <!-- Single hero: natural aspect, no crop, no bars (no video). -->
    <img
      v-if="!heroVideo && images.length === 1"
      :src="heroSrc"
      :srcset="`${thumb(images[0], 900)} 900w, ${thumb(images[0], 1500)} 1500w`"
      sizes="(min-width: 768px) 75vw, 100vw"
      :alt="`${projectTitle} screenshot`"
      :loading="eager ? 'eager' : 'lazy'"
      :fetchpriority="eager ? 'high' : undefined"
      decoding="async"
      class="w-auto max-w-full h-auto max-h-[75vh] rounded"
    />
    <!-- Uniform tile grid: every tile the same size (3:2), so rows read evenly
         and reserve their space (no layout shift). If the project has a demo
         video it leads the grid as a living tile — playback is viewport-driven
         so only visible rows animate. -->
    <div
      v-else-if="heroVideo || images.length > 1"
      class="grid grid-cols-2 gap-4"
    >
      <!-- data-autoplay (not native autoplay): playback starts only when the
           viewport plugin sees it, so the index never eagerly loads a dozen
           videos. No-JS fallback is the poster frame. -->
      <video
        v-if="heroVideo"
        :src="videoTile(heroVideo)"
        :poster="videoPoster(heroVideo)"
        data-autoplay
        loop
        muted
        playsinline
        preload="none"
        width="900"
        height="600"
        class="w-full aspect-[3/2] object-cover rounded"
        :aria-label="`${projectTitle} demo video`"
      />
      <img
        v-for="(src, i) in visibleImages"
        :key="i"
        :src="tile(src, 900)"
        :srcset="`${tile(src, 500)} 500w, ${tile(src, 900)} 900w`"
        sizes="50vw"
        :alt="`${projectTitle} screenshot ${i + 1}`"
        width="900"
        height="600"
        :loading="eager && i === 0 && !heroVideo ? 'eager' : 'lazy'"
        :fetchpriority="eager && i === 0 && !heroVideo ? 'high' : undefined"
        decoding="async"
        class="w-full aspect-[3/2] object-cover rounded"
      />
    </div>

    <div v-if="hiddenCount > 0" class="mt-2 font-mono text-xs text-zinc-500">
      + {{ hiddenCount }} more →
    </div>
  </NuxtLink>
</template>

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
