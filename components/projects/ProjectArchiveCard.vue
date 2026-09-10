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

const firstImage = computed(() => {
  if (!props.project.html) return ''
  const m = props.project.html.match(/<img[^>]+src="([^"]+)"/)
  return m ? m[1].replace(/^http:/, 'https:') : ''
})
</script>

<template>
  <NuxtLink
    :id="projectSlug"
    :to="`/projects/${projectSlug}`"
    class="archive-card group block no-underline text-zinc-900 dark:text-zinc-100 scroll-mt-24"
  >
    <div class="relative overflow-hidden rounded bg-raised mb-2 aspect-[3/2]">
      <img
        v-if="firstImage"
        :src="tile(firstImage, 600)"
        :srcset="`${tile(firstImage, 400)} 400w, ${tile(firstImage, 600)} 600w`"
        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
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
        class="font-serif font-light tracking-tight leading-snug text-base group-hover:underline decoration-1 underline-offset-2 truncate"
      >
        {{ projectTitle }}
      </h3>
      <a
        v-if="projectUrl"
        :href="projectUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="shrink-0 font-mono text-2xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        :aria-label="`Open ${projectTitle} (opens in new tab)`"
        @click.stop
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
      <template v-if="tech.length">
        <span class="text-zinc-300 dark:text-zinc-700">·</span>
        <span class="lowercase truncate">{{ tech.join(' · ') }}</span>
      </template>
    </div>
  </NuxtLink>
</template>
