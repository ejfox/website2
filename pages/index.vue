<!--
  @file index.vue
  @description / (homepage): renders the processed content/blog/index.md, then
    an index of EJ's own projects by category, then a footer linking his
    latest post. A Hire me button sits under the text. Data: useProcessedMarkdown() (manifest + index JSON) and /api/now
    (client-only). SSR per request (LIVE_LISTINGS in nuxt.config.ts), not
    prerendered. Homepage redesigns have been rejected; change copy in
    index.md, not here.
-->
<script setup>
import madeList from '~/assets/home-projects.txt?raw'
import { useMediaQuery } from '@vueuse/core'
import { Menu as VMenu } from 'floating-vue'
import { cldPlaceholder, cldTile } from '~/utils/cld'

const NextAvailableSlot = defineAsyncComponent(
  () => import('~/components/NextAvailableSlot.vue')
)

const { getPostBySlug, getAllPosts, getProjectPostsLite } =
  useProcessedMarkdown()
const { revealContainer: homeReveal } = useScrollReveal({
  selector: ':scope > *',
  staggerDelay: 40,
  translateY: 6,
  duration: 250,
})

const { data: indexContent } = await useAsyncData('index-content', () =>
  getPostBySlug('index')
)

// YYYY-MM-DD in Eastern time (en-CA formats as ISO dates). Post dates mix
// offsets and Z, so compare calendar days, not string prefixes.
const { data: latestPost } = await useAsyncData('latest-post', async () => {
  // Dated journal notes have no real title to show here.
  const posts = await getAllPosts()
  const post = posts.find((p) => !/^\d{4}-\d{2}-\d{2}$/.test(p.title))
  return post ? { slug: post.slug, title: post.title } : null
})

// The things EJ has made. assets/home-projects.txt is the list, trimmed by hand:
// file order is page order, and anything not public is skipped.
// Live things with no project page yet go here, and in that file by slug.
const MADE_ELSEWHERE = [
  {
    slug: 'art-art-art',
    title: 'Art Art Art',
    url: 'https://artartartgame.com',
    images: ['https://artartartgame.com/assets/art-mountain.jpg'],
    excerpt:
      'A first-person gallery game. Unpack real artworks, arrange your collection, and put on an exhibition.',
  },
]
const { data: made } = await useAsyncData('home-made', async () => {
  const projects = await getProjectPostsLite()
  const known = new Map(
    [
      ...projects.map(({ slug, title }) => ({ slug, title })),
      ...MADE_ELSEWHERE,
    ].map((p) => [p.slug, p])
  )
  const groups = []
  for (const raw of madeList.split('\n')) {
    const line = raw.trim()
    if (line.startsWith('## ')) {
      groups.push({ category: line.slice(3), items: [] })
    } else if (known.has(line)) {
      groups.at(-1)?.items.push(known.get(line))
    } else if (/^[^#].* \| https:\/\/\S+$/.test(line)) {
      const [title, url] = line.split(' | ')
      groups.at(-1)?.items.push({ slug: url, title, url })
    }
  }
  return groups.filter((group) => group.items.length)
})

// Hover previews for the index above. Client-only, so the summaries and images
// stay out of the first page load. Keyed by slug and read only for slugs in
// `made`: in dev this API also returns drafts, which must never appear here.
const { data: projectCards } = useLazyFetch('/api/projects?slim=1', {
  server: false,
})
const previews = computed(() =>
  Object.fromEntries(
    [...(projectCards.value || []), ...MADE_ELSEWHERE].map((p) => [p.slug, p])
  )
)
const noHover = useMediaQuery('(hover: none)')

// Previews must appear instantly, so warm the cache once the card data lands.
// The image URL here has to match the <img> exactly. Mouse devices only: a
// phone never sees a preview, so it shouldn't download them.
const previewImage = (slug) => {
  const src = previews.value[slug]?.images?.[0]
  return src ? cldTile(src, 640) : ''
}
const previewPlaceholder = (slug) => {
  const src = previews.value[slug]?.images?.[0]
  return src ? `url(${cldPlaceholder(src)})` : 'none'
}
watch(previews, () => {
  if (noHover.value) return
  for (const group of made.value || []) {
    for (const { slug } of group.items) {
      const src = previewImage(slug)
      if (!src) continue
      new Image().src = previewPlaceholder(slug).slice(4, -1)
      const img = new Image()
      img.fetchPriority = 'low'
      img.src = src
    }
  }
})

// Beside the Hire me button. data/availability.json is hand-edited, so past 60
// days the count is dropped rather than left to go quietly wrong.
const { data: availability } = await useFetch('/api/availability')
const slotsLine = computed(() => {
  const a = availability.value
  if (!a?.known || !a.asOf || a.openSlots <= 0) return ''
  const days = (Date.now() - new Date(a.asOf).getTime()) / 86400000
  return days > 60 ? '' : `${a.openSlots} of ${a.capacity} client slots open`
})

// Mount dynamic calendar component into placeholder rendered by v-html.
// The <span id="next-available-spot"> lives in content/blog/index.md; delete
// it there and the slot silently never mounts. Client-only, because the
// target only exists once v-html has rendered in the DOM.
const calendarSlotMounted = ref(false)
onMounted(() => {
  // Wait for v-html to render before teleporting into it
  nextTick(() => {
    if (document.querySelector('#next-available-spot')) {
      calendarSlotMounted.value = true
    }
  })
})

const title = 'EJ Fox — hacker-journalist'
const description =
  'When someone hands me a mess, I take a kind of pathological joy in untangling it.'

usePageSeo({
  title,
  description,
  type: 'website',
})
</script>

<template>
  <div data-page-main class="container-main h-card pt-6 min-h-screen">
    <div ref="homeReveal" style="max-width: 65ch">
      <template v-if="indexContent">
        <!-- Visually hidden: pages still need one h1 for screen readers. -->
        <h1 class="sr-only">EJ Fox</h1>
        <div
          id="index-content"
          class="font-serif prose prose-zinc dark:prose-invert max-w-none text-lg leading-8"
          v-html="indexContent.html"
        />
        <p class="mt-8 flex flex-wrap items-center gap-4">
          <NuxtLink
            to="/consulting"
            class="cta-button"
            data-umami-event="nav-hire-me"
            data-umami-event-location="home"
          >
            Hire me
          </NuxtLink>
          <span v-if="slotsLine" class="mono-xs text-secondary">
            {{ slotsLine }}
          </span>
        </p>
      </template>
    </div>

    <section class="mt-16 mono-xs text-secondary" style="max-width: 40rem">
      <div v-for="group in made" :key="group.category" class="ambient-line">
        <span class="ambient-label">{{ group.category }}</span>
        <span>
          <template v-for="(item, i) in group.items" :key="item.slug">
            <VMenu
              tag="span"
              class="made-item"
              placement="top"
              popper-class="made-tip"
              :triggers="['hover', 'focus']"
              :delay="{ show: 50, hide: 0 }"
              :distance="10"
              :disabled="noHover || !previews[item.slug]?.excerpt"
            >
              <NuxtLink
                :to="item.url || `/${item.slug}`"
                class="made-link"
                data-umami-event="home-project"
                :data-umami-event-project="item.slug"
                >{{ item.title }}</NuxtLink
              >
              <template #popper>
                <img
                  v-if="previewImage(item.slug)"
                  :src="previewImage(item.slug)"
                  decoding="sync"
                  :style="{ backgroundImage: previewPlaceholder(item.slug) }"
                  :alt="item.title"
                  class="made-tip-image"
                />
                <p class="made-tip-text">{{ previews[item.slug]?.excerpt }}</p>
              </template> </VMenu
            >{{ i < group.items.length - 1 ? ', ' : '' }}
          </template>
        </span>
      </div>
    </section>

    <teleport v-if="calendarSlotMounted" to="#next-available-spot">
      <NextAvailableSlot />
    </teleport>

    <footer v-if="latestPost" class="mt-12 mb-8 mono-xs text-secondary">
      <NuxtLink
        :to="`/blog/${latestPost.slug}`"
        class="ambient-line hover:text-primary transition-colors"
        data-umami-event="home-latest-post"
      >
        <span class="ambient-label">Notebook</span>
        <span>{{ latestPost.title }}</span>
      </NuxtLink>
    </footer>
  </div>
</template>

<style scoped>
.ambient-line {
  display: block;
  line-height: 1.5;
  margin-bottom: 12px;
}

.ambient-label {
  display: block;
}

@media (min-width: 640px) {
  .ambient-line {
    display: flex;
    gap: 1rem;
  }

  .ambient-label {
    flex: none;
    width: 7rem;
  }
}

.made-link {
  text-decoration: underline;
  text-decoration-color: rgb(113 113 122 / 0.5);
  text-underline-offset: 3px;
}

.made-link:hover {
  text-decoration-color: currentColor;
}

:deep(#index-content h2) {
  @apply font-serif text-2xl font-normal mt-8 mb-4;
}

:deep(#index-content h3) {
  @apply font-serif text-xl font-normal mt-8 mb-4;
}
</style>

<!-- Unscoped: floating-vue teleports the popper to <body>. -->
<style>
.made-item {
  display: inline;
}

.made-tip .v-popper__inner {
  @apply bg-surface text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800;
  border-radius: 0;
  box-shadow: none;
  width: 320px;
  overflow: hidden;
}

.made-tip .v-popper__arrow-container {
  display: none;
}

.made-tip-image {
  display: block;
  width: 100%;
  aspect-ratio: 3 / 2;
  object-fit: cover;
  background-size: cover;
}

.made-tip-text {
  @apply font-serif text-xs;
  margin: 12px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
  overflow: hidden;
}
</style>
