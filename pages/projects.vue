<script setup>
// -----------------------------------------------
// IMPORTS AND SETUP
// -----------------------------------------------
import { format } from 'date-fns'
import { ref, computed, onMounted, nextTick, onBeforeUnmount } from 'vue'

const processedMarkdown = useProcessedMarkdown()
const route = useRoute()
const router = useRouter()

// -----------------------------------------------
// STATE MANAGEMENT
// -----------------------------------------------
const activeProject = ref(null)
const projectsLoaded = ref(false)
const hoveredProject = ref(null)
const timelineWidth = ref(0)

// -----------------------------------------------
// DATA FETCHING
// -----------------------------------------------
// Fetch all project posts from markdown files
const { data: projectPosts } = await useAsyncData('project-posts', async () => {
  try {
    const projects = await processedMarkdown.getProjectPosts()
    projectsLoaded.value = true
    return projects || []
  } catch (err) {
    console.error('Error fetching projects:', err)
    return []
  }
})

// -----------------------------------------------
// COMPUTED PROPERTIES
// -----------------------------------------------
// Sort projects by date (newest first)
const sortedProjectPosts = computed(() => {
  return projectPosts.value?.sort((a, b) =>
    new Date(b.metadata?.date || b.date) - new Date(a.metadata?.date || a.date)
  ) || []
})

// Timeline data for visualization
const timelineData = computed(() => {
  if (!sortedProjectPosts.value?.length) return []

  // Get all dates and find the range
  const dates = sortedProjectPosts.value.map(p => new Date(p.metadata?.date || p.date))
  const minDate = new Date(Math.min(...dates))
  const maxDate = new Date(Math.max(...dates))

  // Total time span in milliseconds
  const timeSpan = maxDate.getTime() - minDate.getTime()

  return sortedProjectPosts.value.map(project => {
    const date = new Date(project.metadata?.date || project.date)

    // Calculate position as percentage (0-100%)
    // FIXED: Oldest on left (0%), newest on right (100%)
    const position = ((date.getTime() - minDate.getTime()) / timeSpan * 100)

    return {
      slug: project.slug,
      title: project.title || project.metadata?.title || '',
      date: date,
      position: position,
      type: project.metadata?.type || 'Other'
    }
  })
})

// Get unique years for timeline labels
const timelineYears = computed(() => {
  if (!sortedProjectPosts.value?.length) return []

  // Get all years from projects
  const years = sortedProjectPosts.value.map(p =>
    new Date(p.metadata?.date || p.date).getFullYear()
  )

  // Get unique years
  const uniqueYears = [...new Set(years)].sort((a, b) => a - b)

  // Calculate positions for each year
  return uniqueYears.map(year => {
    // Create a date for this year (middle of the year)
    const yearDate = new Date(year, 6, 1)

    // Get min and max dates from timeline data
    const dates = sortedProjectPosts.value.map(p => new Date(p.metadata?.date || p.date))
    const minDate = new Date(Math.min(...dates))
    const maxDate = new Date(Math.max(...dates))

    // Calculate position (oldest on left)
    const timeSpan = maxDate.getTime() - minDate.getTime()
    const position = ((yearDate.getTime() - minDate.getTime()) / timeSpan * 100)

    return { year, position }
  })
})

// -----------------------------------------------
// HELPER FUNCTIONS
// -----------------------------------------------
// Format date as "MMM YYYY"
function formatDate(date) {
  if (!date) return ''
  return format(new Date(date), 'MMM yyyy')
}

// Format date as just the year "YYYY"
function formatYear(date) {
  if (!date) return ''
  return format(new Date(date), 'yyyy')
}

// Extract all images from project content
// NAVIGATION FUNCTIONS
// -----------------------------------------------
// Scroll to a specific project by slug
function scrollToProject(projectSlug) {
  try {
    const el = document.getElementById(`project-${projectSlug}`)
    if (el) {
      window.scrollTo({
        top: window.scrollY + el.getBoundingClientRect().top - 80,
        behavior: 'smooth'
      })
      router.replace({ hash: `#${projectSlug}` })
    }
  } catch (error) {
    console.error('Error scrolling to project:', error)
  }
}

// Toggle active project
function toggleProject(project) {
  if (activeProject.value === project.slug) {
    activeProject.value = null
    router.replace({ hash: '' })
  } else {
    activeProject.value = project.slug
    scrollToProject(project.slug)
  }
}

// Update timeline width on resize
function updateTimelineWidth() {
  if (typeof document !== 'undefined') {
    const timeline = document.querySelector('.timeline-svg')
    if (timeline) {
      timelineWidth.value = timeline.getBoundingClientRect().width
    }
  }
}

// -----------------------------------------------
// LIFECYCLE HOOKS
// -----------------------------------------------
onMounted(() => {
  // Check if there's a hash in the URL to scroll to a specific project
  if (route.hash) {
    const projectSlug = route.hash.substring(1)
    nextTick(() => {
      scrollToProject(projectSlug)
      activeProject.value = projectSlug
    })
  }

  // Initialize timeline width
  updateTimelineWidth()

  // Add resize listener
  window.addEventListener('resize', updateTimelineWidth)
})

onBeforeUnmount(() => {
  // Remove resize listener
  window.removeEventListener('resize', updateTimelineWidth)
})

// -----------------------------------------------
// PAGE METADATA
// -----------------------------------------------
useHead({
  title: `Projects (${sortedProjectPosts.value?.length || 0})`,
})
</script>

<template>
  <div class="p-5 font-mono">
    <!-- HEADER SECTION -->
    <div class="mb-5 pb-2.5 dark:border-white">
      <h1 class="text-[1.6rem] font-bold font-mono">Projects ({{ sortedProjectPosts.length }})</h1>
    </div>

    <!-- MINIMALIST SVG TIMELINE -->
    <!-- LOADING STATE -->
    <div v-if="!projectsLoaded" class="text-center py-10 text-sm">
      Loading...
    </div>

    <!-- NO RESULTS STATE -->
    <div v-else-if="sortedProjectPosts.length === 0" class="text-center py-10 text-sm">
      No projects found.
    </div>

    <!-- PROJECTS LIST -->
    <div v-else>
      <div v-for="project in sortedProjectPosts" :key="project.slug" :id="`project-${project.slug}`"
        class="mb-[60px] pb-10 dark:border-white">
        <!-- Project header -->
        <div class="mb-5">
          <!-- <div class="text-xs font-bold mb-1.5">{{ formatYear(project.metadata?.date || project.date) }}</div> -->
          <div class="text-xs font-bold mb-1.5">{{ formatDate(project.metadata?.date || project.date) }}</div>
          <h2 class="text-xl md:text-2xl mb-2.5">
            <NuxtLink :to="project.metadata?.url" target="_blank" class="hover:underline">{{ project.title ||
              project.metadata?.title }}</NuxtLink>
          </h2>
          <div class="flex flex-wrap gap-[15px] text-xs mb-4">
            <div class="flex flex-wrap gap-[5px]">
              <span v-for="(tag, index) in project.metadata?.tags" :key="index"
                class="bg-black text-white px-1.5 py-0.5 text-[11px] dark:bg-white dark:text-black">
                {{ tag }}
              </span>
            </div>
          </div>
        </div>

        <!-- Project content -->
        <div class="">
          <div class="w-full block leading-normal" v-html="project.html"></div>
          <div class="flex gap-1.5">
            <a v-if="project.metadata?.github" :href="project.metadata.github" target="_blank"
              class="underline text-sm">GitHub</a>
            <a v-if="project.metadata?.demo" :href="project.metadata.demo" target="_blank"
              class="underline text-sm">Demo</a>
            <a v-if="project.metadata?.website" :href="project.metadata.website" target="_blank"
              class="underline text-sm">Website</a>
            <a v-if="project.metadata?.url" :href="project.metadata.url" target="_blank"
              class="underline text-sm">URL</a>
          </div>

          <!-- Project HTML content -->
        </div>
      </div>
      <div class="mb-10 pb-2.5 overflow-visible">
        <svg class="timeline-svg overflow-visible" width="100%" height="40" @mouseleave="hoveredProject = null">
          <!-- Main timeline line -->
          <line x1="0" y1="30" x2="100%" y2="30" stroke="currentColor" stroke-width="1" />

          <!-- Year markers -->
          <template v-for="yearData in timelineYears" :key="yearData.year">
            <line :x1="`${yearData.position}%`" y1="25" :x2="`${yearData.position}%`" y2="35" stroke="currentColor"
              stroke-width="1" />
            <text :x="`${yearData.position}%`" y="45" text-anchor="middle"
              class="text-[10px] fill-gray-500 font-mono dark:fill-gray-400">
              {{ yearData.year }}
            </text>
          </template>

          <!-- Project markers -->
          <template v-for="project in timelineData" :key="project.slug">
            <!-- Project dot -->
            <circle :cx="`${project.position}%`" cy="30" r="3" :class="[
              'cursor-pointer transition-all duration-200 ease-in-out',
              hoveredProject === project.slug ? 'r-[5]' : '',
              {
                'fill-black stroke-white stroke-1 dark:fill-white dark:stroke-gray-900':
                  !project.type.toLowerCase().includes('visualization') &&
                  !project.type.toLowerCase().includes('tool') &&
                  !project.type.toLowerCase().includes('experiment'),
                'fill-blue-500': project.type.toLowerCase().includes('visualization'),
                'fill-green-500': project.type.toLowerCase().includes('tool'),
                'fill-purple-500': project.type.toLowerCase().includes('experiment')
              }
            ]" @mouseenter="hoveredProject = project.slug" @click="scrollToProject(project.slug)" />

            <!-- Project label (only visible on hover) -->
            <g v-if="hoveredProject === project.slug">
              <!-- Connecting line -->
              <line :x1="`${project.position}%`" y1="18" :x2="`${project.position}%`" y2="27" stroke="currentColor"
                stroke-width="0.5" />

              <!-- Project label -->
              <text :x="`${project.position}%`" y="15" text-anchor="middle"
                class="text-[9px] fill-gray-700 font-mono font-bold cursor-pointer dark:fill-gray-300"
                @click="scrollToProject(project.slug)">
                {{ project.title }}
              </text>
            </g>
          </template>
        </svg>
      </div>

    </div>
  </div>
</template>

<style>
/* Styles for deep selectors that can't be easily converted to Tailwind */
.content :deep(img) {
  display: none;
  /* Hide images in content since we're displaying them separately */
}

.content :deep(a) {
  @apply underline;
}

.content :deep(h1),
.content :deep(h2),
.content :deep(h3) {
  @apply mt-5 mb-2.5 text-[1.1em] !important;
}

.content :deep(p) {
  @apply mb-4 text-[13px];
}

.content :deep(pre) {
  @apply bg-gray-100 p-2.5 overflow-x-auto mb-4 text-xs dark:bg-gray-800;
}
</style>
