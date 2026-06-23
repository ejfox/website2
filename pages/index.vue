<script setup>
const NextAvailableSlot = defineAsyncComponent(
  () => import('~/components/consulting/NextAvailableSlot.vue')
)

const { getPostBySlug, getAllPosts } = useProcessedMarkdown()
const { revealContainer: homeReveal } = useScrollReveal({
  selector: ':scope > *',
  staggerDelay: 40,
  translateY: 6,
  duration: 250,
})

const { data: indexContent } = await useAsyncData('index-content', () =>
  getPostBySlug('index')
)

// Check if there's a blog post published today
const { data: todaysPost } = await useAsyncData('todays-post', async () => {
  const posts = await getAllPosts()
  const today = new Date().toISOString().split('T')[0]
  const post = posts.find((p) => p.date && p.date.startsWith(today))
  return post || null
})

// Weekly creative pulse: words written + GitHub activity
const { data: weeklyPulse } = await useAsyncData('weekly-pulse', async () => {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  // Blog words this week from manifest
  const posts = await getAllPosts()
  const postsThisWeek = posts.filter((p) => {
    if (!p.date) return false
    return new Date(p.date) >= startOfWeek
  })
  const wordsThisWeek = postsThisWeek.reduce(
    (sum, p) => sum + (p.metadata?.words || 0),
    0
  )

  // GitHub activity this week
  let commits = 0
  let projectNames = []
  try {
    const github = await $fetch('/api/github')
    const weekCommits = (github?.detail?.commits || []).filter(
      (c) => new Date(c.occurredAt) >= startOfWeek
    )
    commits = weekCommits.length
    projectNames = [...new Set(weekCommits.map((c) => c.repository.name))]
  } catch {
    // GitHub API may fail, that's fine
  }

  if (wordsThisWeek === 0 && commits === 0) return null

  return { wordsThisWeek, commits, projectNames }
})

// Mount dynamic calendar component into placeholder rendered by v-html
const calendarSlotMounted = ref(false)
onMounted(() => {
  // Wait for v-html to render before teleporting into it
  nextTick(() => {
    if (document.querySelector('#next-available-spot')) {
      calendarSlotMounted.value = true
    }
  })
})

// SEO
const title = 'EJ Fox — data viz, investigations & weird web experiments'
const description =
  "I'm a data viz engineer and journalist — I build interactive stories, newsroom tools, and the occasional climate dashboard, mostly through room302.studio"

usePageSeo({
  title,
  description,
  type: 'website',
})
</script>

<template>
  <main class="container-main h-card pt-8">
    <div ref="homeReveal" style="max-width: 65ch">
      <template v-if="indexContent">
        <div class="mono-xs text-secondary mb-4 tabular">
          <span>INDEX</span>
          <span class="mx-2 text-divider">·</span>
          <span>{{ new Date().toISOString().split('T')[0] }}</span>
        </div>
        <h1
          class="font-serif text-4xl md:text-6xl font-light section-spacing-lg"
        >
          {{ indexContent.title }}
        </h1>
        <div
          id="index-content"
          class="font-serif prose prose-zinc dark:prose-invert max-w-none text-lg leading-8"
          v-html="indexContent.html"
        />
      </template>
    </div>

    <teleport v-if="calendarSlotMounted" to="#next-available-spot">
      <NextAvailableSlot />
    </teleport>

    <footer
      v-if="todaysPost || weeklyPulse"
      class="mt-16 mb-8 mono-xs text-secondary"
      style="max-width: 65ch"
    >
      <p v-if="weeklyPulse">
        <span v-if="weeklyPulse.wordsThisWeek">
          +{{ weeklyPulse.wordsThisWeek.toLocaleString() }} words
        </span>
        <span v-if="weeklyPulse.wordsThisWeek && weeklyPulse.commits">,</span>
        <span v-if="weeklyPulse.commits">
          {{ weeklyPulse.commits }} commits across
          {{ weeklyPulse.projectNames.length }}
          {{ weeklyPulse.projectNames.length === 1 ? 'project' : 'projects' }}
        </span>
        this week
      </p>
      <p v-if="todaysPost" class="mt-2">
        <NuxtLink
          :to="`/blog/${todaysPost.slug}`"
          class="text-secondary hover:text-primary transition-colors"
        >
          wrote something today: {{ todaysPost.title }}
        </NuxtLink>
      </p>
    </footer>
  </main>
</template>

<style scoped>
:deep(#index-content h2) {
  @apply font-serif text-2xl font-normal mt-8 mb-4;
}

:deep(#index-content h3) {
  @apply font-serif text-xl font-normal mt-8 mb-4;
}
</style>
