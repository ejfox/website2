<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <!-- Header -->
    <header class="mb-6">
      <h1 class="font-serif text-2xl">{{ tag }}</h1>
      <p class="font-mono text-xs text-zinc-500 mt-1">
        {{ allTaggedPosts.length }} posts · {{ scraps.length }} scraps
      </p>
    </header>

    <!-- Posts -->
    <section v-if="posts.length" class="mb-6">
      <h3
        class="font-mono text-[10px] text-zinc-600 uppercase tracking-wider mb-2"
      >
        Posts
      </h3>
      <div class="space-y-0.5">
        <div
          v-for="post in posts"
          :key="post.slug"
          class="flex gap-3 text-sm leading-tight"
        >
          <span class="font-mono text-xs text-zinc-600 w-20 shrink-0">
            {{ formatShortDate(post.date || post.metadata?.date) }}
          </span>
          <div class="flex-1 min-w-0">
            <NuxtLink
              :to="`/blog/${post.slug}`"
              class="hover:underline underline-offset-2"
            >
              {{ post.title || post.metadata?.title }}
            </NuxtLink>
            <div
              class="font-mono text-zinc-600 truncate"
              style="font-size: 9px; line-height: 1.2"
            >
              ejfox.com/blog/{{ post.slug }}
            </div>
          </div>
          <span class="font-mono text-xs text-zinc-600 shrink-0">
            {{ (post.metadata?.words || post.words || 0).toLocaleString() }}
          </span>
        </div>
      </div>
    </section>

    <!-- Week Notes -->
    <section v-if="weekNotes.length" class="mb-6">
      <h3
        class="font-mono text-[10px] text-zinc-600 uppercase tracking-wider mb-2"
      >
        Week Notes
      </h3>
      <div class="space-y-0.5">
        <div
          v-for="post in weekNotes"
          :key="post.slug"
          class="flex gap-3 text-sm leading-tight"
        >
          <span class="font-mono text-xs text-zinc-600 w-20 shrink-0">
            {{ formatShortDate(post.date || post.metadata?.date) }}
          </span>
          <div class="flex-1 min-w-0">
            <NuxtLink
              :to="`/blog/${post.slug}`"
              class="hover:underline underline-offset-2"
            >
              {{ post.title || post.metadata?.title }}
            </NuxtLink>
            <div
              class="font-mono text-zinc-600 truncate"
              style="font-size: 9px; line-height: 1.2"
            >
              ejfox.com/blog/{{ post.slug }}
            </div>
          </div>
          <span class="font-mono text-xs text-zinc-600 shrink-0">
            {{ (post.metadata?.words || post.words || 0).toLocaleString() }}
          </span>
        </div>
      </div>
    </section>

    <!-- Projects -->
    <section v-if="projects.length" class="mb-6">
      <h3
        class="font-mono text-[10px] text-zinc-600 uppercase tracking-wider mb-2"
      >
        Projects
      </h3>
      <div class="space-y-0.5">
        <div
          v-for="post in projects"
          :key="post.slug"
          class="flex gap-3 text-sm leading-tight"
        >
          <span class="font-mono text-xs text-zinc-600 w-20 shrink-0">
            {{ formatShortDate(post.date || post.metadata?.date) }}
          </span>
          <div class="flex-1 min-w-0">
            <NuxtLink
              :to="`/blog/${post.slug}`"
              class="hover:underline underline-offset-2"
            >
              {{ post.title || post.metadata?.title }}
            </NuxtLink>
            <div
              class="font-mono text-zinc-600 truncate"
              style="font-size: 9px; line-height: 1.2"
            >
              ejfox.com/blog/{{ post.slug }}
            </div>
          </div>
          <span class="font-mono text-xs text-zinc-600 shrink-0">
            {{ (post.metadata?.words || post.words || 0).toLocaleString() }}
          </span>
        </div>
      </div>
    </section>

    <!-- Reading -->
    <section v-if="reading.length" class="mb-6">
      <h3
        class="font-mono text-[10px] text-zinc-600 uppercase tracking-wider mb-2"
      >
        Reading
      </h3>
      <div class="space-y-0.5">
        <div
          v-for="post in reading"
          :key="post.slug"
          class="flex gap-3 text-sm leading-tight"
        >
          <span class="font-mono text-xs text-zinc-600 w-20 shrink-0">
            {{ formatShortDate(post.date || post.metadata?.date) }}
          </span>
          <div class="flex-1 min-w-0">
            <NuxtLink
              :to="`/blog/${post.slug}`"
              class="hover:underline underline-offset-2"
            >
              {{ post.title || post.metadata?.title }}
            </NuxtLink>
            <div
              class="font-mono text-zinc-600 truncate"
              style="font-size: 9px; line-height: 1.2"
            >
              ejfox.com/blog/{{ post.slug }}
            </div>
          </div>
          <span class="font-mono text-xs text-zinc-600 shrink-0">
            {{ (post.metadata?.words || post.words || 0).toLocaleString() }}
          </span>
        </div>
      </div>
    </section>

    <!-- Scraps -->
    <section v-if="scraps.length">
      <h3
        class="font-mono text-[10px] text-zinc-600 uppercase tracking-wider mb-2"
      >
        Scraps
      </h3>
      <div class="space-y-0.5">
        <div
          v-for="scrap in scraps"
          :key="scrap.id"
          class="flex gap-3 text-sm leading-tight"
        >
          <span class="font-mono text-xs text-zinc-600 w-20 shrink-0">
            {{ formatShortDate(scrap.created_at) }}
          </span>
          <div class="flex-1 min-w-0">
            <span class="text-zinc-400">
              {{ scrap.title || scrap.summary || scrap.content?.slice(0, 80) }}
            </span>
            <div
              class="font-mono text-zinc-600 truncate"
              style="font-size: 9px; line-height: 1.2"
            >
              scrap/{{ scrap.id }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Empty state -->
    <div v-if="!posts.length && !scraps.length && !pending" class="py-12">
      <p class="text-zinc-500">No content found with tag "{{ tag }}"</p>
      <NuxtLink
        to="/threads"
        class="text-zinc-500 hover:underline text-sm mt-2 inline-block"
      >
        Back to threads
      </NuxtLink>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="py-12">
      <p class="text-zinc-600">Loading...</p>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()

const tag = computed(() => {
  const slugArray = route.params.slug
  return Array.isArray(slugArray) ? slugArray.join('/') : slugArray
})

// Fetch posts
const { data: allPosts, pending: postsPending } =
  await useFetch('/api/manifest')

// Fetch scraps
const { data: allScraps, pending: scrapsPending } =
  await useFetch('/api/scraps')

const pending = computed(() => postsPending.value || scrapsPending.value)

// Filter posts by tag and categorize
const allTaggedPosts = computed(() => {
  if (!allPosts.value || !tag.value) return []
  return allPosts.value
    .filter((post) => {
      const postTags = post.tags || post.metadata?.tags || []
      return postTags.includes(tag.value)
    })
    .sort((a, b) => {
      const dateA = new Date(a.date || a.metadata?.date || 0)
      const dateB = new Date(b.date || b.metadata?.date || 0)
      return dateB - dateA
    })
})

// Categorize by slug prefix
const posts = computed(() =>
  allTaggedPosts.value.filter((p) => p.slug?.match(/^\d{4}\//))
)
const weekNotes = computed(() =>
  allTaggedPosts.value.filter((p) => p.slug?.startsWith('week-notes/'))
)
const reading = computed(() =>
  allTaggedPosts.value.filter((p) => p.slug?.startsWith('reading/'))
)
const projects = computed(() =>
  allTaggedPosts.value.filter((p) => p.slug?.startsWith('projects/'))
)

// Filter scraps by tag
const scraps = computed(() => {
  if (!allScraps.value || !tag.value) return []
  return allScraps.value
    .filter((scrap) => {
      const scrapTags = [...(scrap.tags || []), ...(scrap.concept_tags || [])]
      return scrapTags.includes(tag.value)
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at || 0)
      const dateB = new Date(b.created_at || 0)
      return dateB - dateA
    })
})

// Format date (compact)
const formatShortDate = (dateStr) => {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  const y = date.getFullYear().toString().slice(-2)
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const d = date.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${d}`
}

// SEO
useHead({
  title: computed(() => `${tag.value} | EJ Fox`),
  meta: [
    {
      name: 'description',
      content: computed(() => `Posts and scraps tagged with "${tag.value}"`),
    },
  ],
})
</script>
