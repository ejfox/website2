<script setup>
import { format, parse, eachYearOfInterval } from 'date-fns'

const processedMarkdown = useProcessedMarkdown()

const { data: projectPosts } = await useAsyncData('project-posts', async () => {
  const posts = await processedMarkdown.getProjectPosts()
  return Promise.all(posts.map(async (post) => {
    const fullPost = await processedMarkdown.getPostBySlug(post.slug)
    return { ...post, ...fullPost }
  }))
})

function formatDate(date) {
  return format(new Date(date), 'yyyy')
}

const sortedProjectPosts = computed(
  () => projectPosts.value?.sort((a, b) => new Date(b.date) - new Date(a.date)) || []
)

const timelineData = computed(() => {
  if (!sortedProjectPosts.value) return []

  const projects = sortedProjectPosts.value.map((post) => ({
    title: post.title,
    date: new Date(post.date),
    year: format(new Date(post.date), 'yyyy'),
  }))

  const minYear = Math.min(...projects.map((p) => p.date.getFullYear()))
  const maxYear = Math.max(...projects.map((p) => p.date.getFullYear()))

  const allYears = eachYearOfInterval({
    start: new Date(minYear, 0, 1),
    end: new Date(maxYear, 11, 31),
  })

  const timelineYears = allYears.map((date) => {
    const year = format(date, 'yyyy')
    const yearProjects = projects.filter((p) => p.year === year)
    return {
      year,
      projects: yearProjects,
    }
  })

  const totalYears = timelineYears.length
  const availableWidth = 1040 - 140 // Total width minus left and right margins
  return timelineYears.map((yearData, index) => ({
    ...yearData,
    x: 20 + (index / (totalYears - 1)) * availableWidth,
  }))
})

function calculateY() {
  return 220 // Timeline baseline
}

function calculateX(baseX, index) {
  return baseX + index * 25 // Increased offset to 25 units for better spacing
}
</script>

<template>
  <div id="projects" class="container mx-auto px-2 py-8">


    <h1 class="text-4xl font-bold mb-8">Projects</h1>
    <div class="masonry-layout">
      <div v-for="post in sortedProjectPosts" :key="post.slug" class="masonry-item">
        <article class="rounded-md border-zinc-800 overflow-hidden prose-img:p-8">
          <h2 class="text-3xl font-semibold mb-2">
            <NuxtLink :to="`/blog/${post.slug}`" class="no-underline hover:underline">
              {{ post.title }}
              <span class="text-xs text-zinc-400 dark:text-zinc-500">
                ({{ formatDate(post.date) }})
              </span>
            </NuxtLink>
          </h2>
          <div
            class="prose-sm dark:prose-invert max-w-none mb-4 break-words prose-a:no-underline hover:prose-a:underline prose-a:text-blue-500 dark:prose-a:text-blue-200 dark:hover:prose-a:text-blue-400 prose-a:px-y prose-a:bg-zinc-100 dark:prose-a:bg-zinc-900 prose-a:rounded-sm prose-a:leading-0"
            v-html="post.content"></div>
        </article>
      </div>
    </div>

    <svg class="w-full h-80 mb-12" viewBox="0 0 1160 200" xmlns="http://www.w3.org/2000/svg">
      <line x1="20" :y1="calculateY()" x2="1140" :y2="calculateY()" stroke="currentColor" stroke-width="1" />

      <g v-for="yearData in timelineData" :key="yearData.year">
        <line :x1="yearData.x" :x2="yearData.x" :y1="calculateY() + 5" :y2="calculateY() + 5" stroke="currentColor"
          stroke-width="1" />
        <text :x="yearData.x" :y="calculateY() + 20" font-size="12" text-anchor="middle" class="timeline-text">
          {{ yearData.year }}
        </text>

        <g v-for="(project, index) in yearData.projects" :key="project.title">
          <circle :cx="calculateX(yearData.x, index)" :cy="calculateY()" r="4" fill="currentColor" />
          <g transform="translate(0, -20)">
            <text :x="calculateX(yearData.x, index)" :y="calculateY()" font-size="13" text-anchor="start"
              font-weight="300" class="font-mono timeline-text"
              :transform="`rotate(-90, ${calculateX(yearData.x, index)}, ${calculateY()}) translate(-5, 0)`">
              {{ project.title }}
            </text>
          </g>
        </g>
      </g>
    </svg>
  </div>
</template>

<style scoped>
#projects img {
  @apply rounded-lg shadow-md;
}

.masonry-layout {
  column-count: 1;
  column-gap: 2rem;
}

.masonry-item {
  break-inside: avoid;
  margin-bottom: 2rem;
}

@media (min-width: 1024px) {
  .masonry-layout {
    column-count: 2;
  }
}

svg {
  overflow: visible;
}

.timeline-text {
  fill: currentColor;
}

@media (max-width: 640px) {
  svg {
    height: 200px;
  }
}

:root.dark .timeline-text {
  fill: #fff;
}
</style>