<script setup>
import { format, parse, eachYearOfInterval } from 'date-fns'
import { animate, stagger } from '~/anime.esm.js'


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


const projectElements = ref(null)

onMounted(() => {
  animate(projectElements.value, {
    opacity: [0, 1],
    translateY: [20, 0],
    duration: 800,
    easing: 'easeOutQuad',
    delay: stagger(50),
  })
})

</script>

<template>
  <div id="projects" class="container mx-auto px-2 py-8">


    <h1 class="text-4xl font-bold mb-8 font-mono">Projects</h1>
    <div class="masonry-layout">
      <div v-for="post in sortedProjectPosts" :key="post.slug" class="masonry-item" ref="projectElements">
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

    <svg class="w-full h-80 my-12 xl:my-24" viewBox="0 0 1160 200" xmlns="http://www.w3.org/2000/svg">
      <line x1="20" :y1="calculateY()" x2="1140" :y2="calculateY()" stroke="#CCC" stroke-width="0.5" />

      <g v-for="yearData in timelineData" :key="yearData.year">
        <line :x1="yearData.x" :x2="yearData.x" :y1="calculateY() + 5" :y2="calculateY() + 5" stroke="#CCC"
          stroke-width="0.5" />
        <text :x="yearData.x" :y="calculateY() + 20" font-size="14" text-anchor="middle" class="timeline-text">
          {{ yearData.year }}
        </text>

        <g v-for="(project, index) in yearData.projects" :key="project.title">
          <!-- <circle :cx="calculateX(yearData.x, index)" :cy="calculateY()" r="4" fill="currentColor" /> -->


          <path :transform="`translate(${calculateX(yearData.x, index) - 5}, ${calculateY() - 5}) scale(1.25)`"
            d="M7.32,2.97c.06,2.9-5.03,7.04-7.15,2.41C-1.26,1.41,6.89-3.12,7.32,2.97ZM4.75,1.04c-1.38.98-3.78,1.28-3.52,3.96,1.78,4.02,7.85-3.11,3.52-3.96Z"
            fill="#CCC" />
          <g transform="translate(5, -20)">
            <text :x="calculateX(yearData.x, index)" :y="calculateY()" font-size="13" text-anchor="start"
              font-weight="300" class="font-mono timeline-text text-gray-500"
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