<!--
  @file ProjectArchiveCard.vue
  @description Compact, image-first archive card used below the flagships. One
    small 3:2 thumbnail + title + a quiet metadata line. Dense enough to browse
    dozens at a glance, visual enough to still show the work. Click → detail.
  @props project: Object - Project with title, html, metadata
-->
<script setup>
const props = defineProps({
  project: { type: Object, required: true },
})

const projectSlug = computed(
  () => props.project.slug?.replace(/^projects\//, '') || ''
)
const projectTitle = computed(
  () => props.project.title || props.project.metadata?.title || 'Untitled'
)
const client = computed(() => props.project.metadata?.client || '')
const projectUrl = computed(() => props.project.metadata?.url || '')

const year = computed(() => {
  const date = props.project.metadata?.date || props.project.date
  if (!date) return ''
  const y = new Date(date).getFullYear()
  return Number.isNaN(y) ? '' : y
})

const contextTag = computed(() => {
  const c = props.project.metadata?.context || 'personal'
  const map = {
    client: 'client',
    collaborative: 'collab',
    personal: 'personal',
  }
  return map[c] || 'personal'
})

const tech = computed(() => {
  const t = props.project.metadata?.tech
  if (!Array.isArray(t)) return []
  return t
    .map((x) => String(x).toLowerCase())
    .filter(Boolean)
    .slice(0, 3)
})

// Verbatim ai-involvement disclosure — see ProjectRow.vue for the why.
const aiInvolvement = computed(
  () => props.project.metadata?.['ai-involvement'] || ''
)

// Cloudinary transform injector — mirrors ProjectRow's cld()/tile(). Inserts the
// transform right after /image/upload/ and strips any transform already baked in
// upstream so we don't re-scale a downscale.
const cld = (src, transform) => {
  if (!src) return src
  const url = src.replace(/^http:/, 'https:')
  const marker = '/image/upload/'
  const at = url.indexOf(marker)
  if (at === -1) return url
  const head = url.slice(0, at + marker.length)
  const segs = url.slice(at + marker.length).split('/')
  const isTransform = (s) =>
    s.length > 0 && s.split(',').every((t) => /^[a-z]+_/.test(t))
  let i = 0
  while (i < segs.length && isTransform(segs[i])) i++
  return head + transform + '/' + segs.slice(i).join('/')
}
const tile = (src, width) =>
  cld(src, `c_fill,ar_3:2,g_auto,w_${width},q_auto,f_auto`)

// Precomputed server-side by /api/projects?slim=1.
const firstImage = computed(() => props.project.images?.[0] || '')
</script>

<template>
  <!-- Stretched-link card (see ProjectRow.vue): title link's ::after overlay
       makes the card clickable without nesting the ↗ anchor inside it. -->
  <div
    :id="projectSlug"
    class="archive-card group relative block text-zinc-900 dark:text-zinc-100 scroll-mt-24"
  >
    <div class="relative overflow-hidden rounded bg-raised mb-2 aspect-[3/2]">
      <img
        v-if="firstImage"
        :src="tile(firstImage, 600)"
        :srcset="`${tile(firstImage, 400)} 400w, ${tile(firstImage, 800)} 800w`"
        sizes="(min-width: 640px) 33vw, 50vw"
        :alt="`${projectTitle} screenshot`"
        width="600"
        height="400"
        loading="lazy"
        decoding="async"
        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      />
      <div
        v-else
        class="w-full h-full grid place-items-center font-mono text-3xs text-zinc-400 dark:text-zinc-600"
      >
        {{ projectTitle }}
      </div>
    </div>

    <div class="flex items-baseline justify-between gap-2">
      <h3
        class="min-w-0 font-serif font-light tracking-tight leading-snug text-base truncate"
      >
        <NuxtLink
          :to="`/projects/${projectSlug}`"
          class="no-underline text-inherit group-hover:underline decoration-1 underline-offset-2 after:absolute after:inset-0 after:content-['']"
        >
          {{ projectTitle }}
        </NuxtLink>
      </h3>
      <a
        v-if="projectUrl"
        :href="projectUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="relative z-10 shrink-0 p-1 -m-1 font-mono text-2xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        :aria-label="`Open ${projectTitle} (opens in new tab)`"
      >
        ↗
      </a>
    </div>

    <div
      class="font-mono text-3xs text-zinc-500 dark:text-zinc-500 mt-0.5 flex items-center gap-1.5 flex-wrap"
    >
      <time v-if="year" class="tabular-nums">{{ year }}</time>
      <span v-if="client" class="text-zinc-600 dark:text-zinc-400">
        {{ client }}
      </span>
      <span v-else-if="contextTag !== 'personal'">{{ contextTag }}</span>
      <span v-if="aiInvolvement" class="text-zinc-400 dark:text-zinc-600">
        {{ aiInvolvement }}
      </span>
      <!-- separator lives inside the tech span so they wrap as one unit —
           a standalone '·' span orphans at line-end under flex-wrap -->
      <span v-if="tech.length" class="lowercase"
        ><span class="text-zinc-300 dark:text-zinc-700">·&nbsp;</span
        >{{ tech.join(' · ') }}</span
      >
    </div>
  </div>
</template>
