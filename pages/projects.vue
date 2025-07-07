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
const tocTarget = ref(null)

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
  // Set up TOC target
  tocTarget.value = document.querySelector('#nav-toc-container')
  
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
  
  // Add scroll listener for active project tracking
  window.addEventListener('scroll', trackActiveProject)
})

// Track which project is currently in view
function trackActiveProject() {
  const projects = document.querySelectorAll('[id^="project-"]')
  let current = null
  
  projects.forEach(project => {
    const rect = project.getBoundingClientRect()
    if (rect.top <= 100 && rect.bottom >= 100) {
      current = project.id.replace('project-', '')
    }
  })
  
  if (current && current !== activeProject.value) {
    activeProject.value = current
  }
}

onBeforeUnmount(() => {
  // Remove listeners
  window.removeEventListener('resize', updateTimelineWidth)
  window.removeEventListener('scroll', trackActiveProject)
})

// -----------------------------------------------
// PAGE METADATA
// -----------------------------------------------
useHead({
  title: `Projects (${sortedProjectPosts.value?.length || 0})`,
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
    <!-- Header -->
    <header class="mb-8 sm:mb-12 lg:mb-16">
      <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-3 sm:mb-4">Projects</h1>
      <div class="flex items-center gap-4 mb-4">
        <p class="text-base sm:text-lg text-zinc-600 dark:text-zinc-400">A collection of experiments, tools, and creative explorations.</p>
        <div class="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 font-medium font-mono">
          {{ sortedProjectPosts.length }} {{ sortedProjectPosts.length === 1 ? 'Project' : 'Projects' }}
        </div>
      </div>
    </header>

    <!-- Loading and empty states -->
    <div v-if="!projectsLoaded" class="text-center py-16">
      <p class="text-zinc-600 dark:text-zinc-400">Loading...</p>
    </div>

    <div v-else-if="sortedProjectPosts.length === 0" class="text-center py-16">
      <p class="text-zinc-600 dark:text-zinc-400">No projects found.</p>
    </div>

    <!-- Projects list -->
    <div v-else class="space-y-16 lg:space-y-20">
      <article v-for="project in sortedProjectPosts" :key="project.slug" :id="`project-${project.slug}`"
        class="group">
        <!-- Project header -->
        <div class="space-y-4 mb-6">
          <!-- Date and tags -->
          <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <time class="text-xs tabular-nums text-zinc-500 dark:text-zinc-400 font-mono uppercase tracking-wide">
              {{ formatDate(project.metadata?.date || project.date) }}
            </time>
            <div class="hidden sm:block w-px h-3 bg-zinc-300 dark:bg-zinc-700"></div>
            <div class="flex flex-wrap gap-2" v-if="project.metadata?.tags">
              <span v-for="(tag, index) in project.metadata?.tags" :key="index"
                class="text-[10px] font-mono uppercase tracking-[0.1em] text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                {{ tag }}
              </span>
            </div>
          </div>
          
          <!-- Title -->
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight">
            <NuxtLink v-if="project.metadata?.url" :to="project.metadata?.url" target="_blank" 
              class="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors hover:underline decoration-1 underline-offset-2">
              {{ project.title || project.metadata?.title }}
            </NuxtLink>
            <span v-else>{{ project.title || project.metadata?.title }}</span>
          </h2>
        </div>

        <!-- Project content -->
        <div class="space-y-6">
          <div class="prose prose-zinc dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400 leading-relaxed content" v-html="project.html"></div>
          
          <!-- Links -->
          <div class="flex flex-wrap gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800" v-if="project.metadata?.github || project.metadata?.demo || project.metadata?.website || project.metadata?.url">
            <a v-if="project.metadata?.github" :href="project.metadata.github" target="_blank"
              class="inline-flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors font-medium">
              <span>GitHub</span>
              <Icon name="heroicons:arrow-top-right-on-square" class="w-3 h-3" />
            </a>
            <a v-if="project.metadata?.demo" :href="project.metadata.demo" target="_blank"
              class="inline-flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors font-medium">
              <span>Demo</span>
              <Icon name="heroicons:arrow-top-right-on-square" class="w-3 h-3" />
            </a>
            <a v-if="project.metadata?.website" :href="project.metadata.website" target="_blank"
              class="inline-flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors font-medium">
              <span>Website</span>
              <Icon name="heroicons:arrow-top-right-on-square" class="w-3 h-3" />
            </a>
            <a v-if="project.metadata?.url && !project.metadata?.github && !project.metadata?.demo && !project.metadata?.website" 
              :href="project.metadata.url" target="_blank"
              class="inline-flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors font-medium">
              <span>View Project</span>
              <Icon name="heroicons:arrow-top-right-on-square" class="w-3 h-3" />
            </a>
          </div>
        </div>
      </article>
      <!-- Timeline visualization -->
      <section class="mt-16 lg:mt-20 pt-8 border-t border-zinc-200 dark:border-zinc-800">
        <h3 class="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 font-semibold mb-6">Timeline</h3>
        <div class="overflow-visible">
          <svg class="timeline-svg overflow-visible w-full" height="60" @mouseleave="hoveredProject = null">
            <!-- Main timeline line -->
            <line x1="0" y1="40" x2="100%" y2="40" stroke="currentColor" stroke-width="1" class="stroke-zinc-300 dark:stroke-zinc-700" />

            <!-- Year markers -->
            <template v-for="yearData in timelineYears" :key="yearData.year">
              <line :x1="`${yearData.position}%`" y1="35" :x2="`${yearData.position}%`" y2="45" 
                class="stroke-zinc-400 dark:stroke-zinc-600" stroke-width="1" />
              <text :x="`${yearData.position}%`" y="55" text-anchor="middle"
                class="text-[10px] fill-zinc-500 dark:fill-zinc-400 font-mono">
                {{ yearData.year }}
              </text>
            </template>

            <!-- Project markers -->
            <template v-for="project in timelineData" :key="project.slug">
              <!-- Project dot -->
              <circle :cx="`${project.position}%`" cy="40" :r="hoveredProject === project.slug ? '5' : '3'" :class="[
                'cursor-pointer transition-all duration-200 ease-in-out fill-zinc-900 dark:fill-zinc-100 hover:fill-zinc-700 dark:hover:fill-zinc-300'
              ]" @mouseenter="hoveredProject = project.slug" @click="scrollToProject(project.slug)" />

              <!-- Project label (only visible on hover) -->
              <g v-if="hoveredProject === project.slug">
                <!-- Connecting line -->
                <line :x1="`${project.position}%`" y1="25" :x2="`${project.position}%`" y2="35" 
                  class="stroke-zinc-400 dark:stroke-zinc-600" stroke-width="1" />

                <!-- Project label -->
                <text :x="`${project.position}%`" y="20" text-anchor="middle"
                  class="text-[10px] fill-zinc-700 dark:fill-zinc-300 font-mono cursor-pointer"
                  @click="scrollToProject(project.slug)">
                  {{ project.title }}
                </text>
              </g>
            </template>
          </svg>
        </div>
      </section>

    </div>

    <!-- Project TOC for sidebar -->
    <teleport to="#nav-toc-container" v-if="tocTarget && sortedProjectPosts.length">
      <div class="toc">
        <div class="px-6 py-6">
          <h3 class="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400 mb-6">
            Projects
          </h3>
          <ul class="space-y-1">
            <li
              v-for="project in sortedProjectPosts"
              :key="project.slug"
              class="group relative"
            >
              <a
                :href="`#${project.slug}`"
                @click.prevent="scrollToProject(project.slug)"
                class="flex items-center justify-between py-2 pr-3 pl-8 -ml-4 text-[13px] leading-relaxed transition-all duration-200 rounded-lg group"
                :class="[
                  activeProject === project.slug
                    ? 'text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 font-medium'
                    : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                ]"
              >
                <span class="truncate font-mono flex-1 mr-2">
                  {{ project.title || project.metadata?.title }}
                </span>
                <span class="text-[10px] font-mono opacity-40 shrink-0">
                  '{{ formatYear(project.metadata?.date || project.date).slice(-2) }}
                </span>
              </a>
              <!-- Active indicator -->
              <div 
                v-if="activeProject === project.slug"
                class="absolute left-1 top-2 bottom-2 w-[2px] bg-zinc-900 dark:bg-zinc-100 rounded-full"
              ></div>
            </li>
          </ul>
        </div>
      </div>
    </teleport>
  </div>
</template>

<style>
/* Refined content styles to match blog aesthetic */
.content :deep(img) {
  display: none;
  /* Hide images in content since we're displaying them separately */
}

.content :deep(a) {
  @apply text-zinc-900 dark:text-zinc-100 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors underline decoration-1 underline-offset-2;
}

.content :deep(h1),
.content :deep(h2),
.content :deep(h3) {
  @apply mt-6 mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100 !important;
}

.content :deep(p) {
  @apply mb-4 leading-relaxed;
}

.content :deep(ul),
.content :deep(ol) {
  @apply mb-4 pl-4;
}

.content :deep(li) {
  @apply mb-2 leading-relaxed;
}

.content :deep(pre) {
  @apply bg-zinc-100 dark:bg-zinc-800 p-4 overflow-x-auto mb-4 text-sm font-mono rounded-lg;
}

.content :deep(code) {
  @apply bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-sm font-mono rounded;
}

.content :deep(blockquote) {
  @apply border-l-4 border-zinc-300 dark:border-zinc-700 pl-4 my-4 italic text-zinc-600 dark:text-zinc-400;
}
</style>
