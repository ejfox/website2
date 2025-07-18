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
  return [...(projectPosts.value || [])].sort(
    (a, b) =>
      new Date(b.metadata?.date || b.date) -
      new Date(a.metadata?.date || a.date)
  )
})

// Timeline data for visualization
const timelineData = computed(() => {
  if (!sortedProjectPosts.value?.length) return []

  // Get all dates and find the range
  const dates = sortedProjectPosts.value.map(
    (p) => new Date(p.metadata?.date || p.date)
  )
  const minDate = new Date(Math.min(...dates))
  const maxDate = new Date(Math.max(...dates))

  // Total time span in milliseconds
  const timeSpan = maxDate.getTime() - minDate.getTime()

  return sortedProjectPosts.value.map((project) => {
    const date = new Date(project.metadata?.date || project.date)

    // Calculate position as percentage (0-100%)
    // FIXED: Oldest on left (0%), newest on right (100%)
    const position = ((date.getTime() - minDate.getTime()) / timeSpan) * 100

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
  const years = sortedProjectPosts.value.map((p) =>
    new Date(p.metadata?.date || p.date).getFullYear()
  )

  // Get unique years
  const uniqueYears = [...new Set(years)].sort((a, b) => a - b)

  // Calculate positions for each year
  return uniqueYears.map((year) => {
    // Create a date for this year (middle of the year)
    const yearDate = new Date(year, 6, 1)

    // Get min and max dates from timeline data
    const dates = sortedProjectPosts.value.map(
      (p) => new Date(p.metadata?.date || p.date)
    )
    const minDate = new Date(Math.min(...dates))
    const maxDate = new Date(Math.max(...dates))

    // Calculate position (oldest on left)
    const timeSpan = maxDate.getTime() - minDate.getTime()
    const position = ((yearDate.getTime() - minDate.getTime()) / timeSpan) * 100

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
const projectElements = ref([])

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

  // Add scroll listener for active project tracking
  window.addEventListener('scroll', trackActiveProject)

  // Add elegant animations
  if (projectElements.value?.length) {
    import('~/anime.esm.js').then(({ animate }) => {
      animate(projectElements.value, {
        opacity: [0, 1],
        translateY: [10, 0],
        duration: 600,
        easing: 'easeOutQuad',
        delay: (el, i) => i * 50
      })
    })
  }
})

// Track which project is currently in view
function trackActiveProject() {
  const projects = document.querySelectorAll('[id^="project-"]')
  let current = null

  projects.forEach((project) => {
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
  window.removeEventListener('scroll', trackActiveProject)
})

// -----------------------------------------------
// PAGE METADATA
// -----------------------------------------------
useHead({
  title: `Projects (${sortedProjectPosts.value?.length || 0})`
})
</script>

<template>
  <div class="mt-24 md:mt-0">
    <!-- Header -->
    <header class="my-6">
      <h1 class="text-display mb-8">Projects</h1>
      <p class="text-body">
        A collection of experiments, tools, and creative explorations.
      </p>
    </header>

    <!-- Loading and empty states -->
    <div v-if="!projectsLoaded" class="animate-pulse">
      <div class="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4 mb-4"></div>
      <div class="space-y-3">
        <div class="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full"></div>
        <div class="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6"></div>
      </div>
    </div>

    <div v-else-if="sortedProjectPosts.length === 0" class="text-center py-16">
      <p class="text-body">&nbsp;</p>
    </div>

    <!-- Projects list -->
    <div v-else class="content-grid space-y-24">
      <article
        v-for="project in sortedProjectPosts"
        :id="`project-${project.slug}`"
        :key="project.slug"
        ref="projectElements"
        class="group"
      >
        <!-- Project header -->
        <div class="grid grid-cols-12 gap-4 mb-8">
          <!-- Date column -->
          <div class="col-span-2 pl-2 md:pl-0">
            <time class="md:text-xs text-zinc-500">
              {{ formatDate(project.metadata?.date || project.date) }}
            </time>
            <div
              v-if="
                project.metadata?.github ||
                project.metadata?.demo ||
                project.metadata?.website ||
                project.metadata?.url
              "
              class="flex flex-wrap gap-6 pt-6"
            >
              <a
                v-if="project.metadata?.github"
                :href="project.metadata.github"
                target="_blank"
                class="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                GitHub ↗
              </a>
              <a
                v-if="project.metadata?.demo"
                :href="project.metadata.demo"
                target="_blank"
                class="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                Demo ↗
              </a>
              <a
                v-if="project.metadata?.website"
                :href="project.metadata.website"
                target="_blank"
                class="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                Website ↗
              </a>
              <a
                v-if="
                  project.metadata?.url &&
                  !project.metadata?.github &&
                  !project.metadata?.demo &&
                  !project.metadata?.website
                "
                :href="project.metadata.url"
                target="_blank"
                class="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                View Project ↗
              </a>
            </div>
          </div>

          <!-- Content column -->
          <div class="col-span-10">
            <!-- Title -->
            <h2
              class="text-3xl md:text-4xl font-light text-zinc-900 dark:text-zinc-100 mb-4"
            >
              <NuxtLink
                v-if="project.metadata?.url"
                :to="project.metadata?.url"
                target="_blank"
                class="hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors"
              >
                {{ project.title || project.metadata?.title }}
              </NuxtLink>
              <span v-else>{{ project.title || project.metadata?.title }}</span>
            </h2>

            <!-- Tags -->
            <div
              v-if="project.metadata?.tags"
              class="flex flex-wrap gap-4 mb-4"
            >
              <span
                v-for="(tag, index) in project.metadata?.tags"
                :key="index"
                class="text-xs uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-500"
              >
                {{ tag }}
              </span>
            </div>

            <div class="space-y-6">
              <div
                class="prose prose-zinc dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400 leading-relaxed content"
                v-html="project.html"
              ></div>

              <!-- Links -->
            </div>
          </div>
        </div>
      </article>
      <!-- Simplified timeline -->
      <section
        class="content-grid mt-24 pt-12 border-t border-zinc-200 dark:border-zinc-800"
      >
        <h3
          class="text-xs font-normal uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-500 mb-12"
        >
          Timeline
        </h3>
        <div class="space-y-6">
          <div
            v-for="year in [
              ...new Set(
                sortedProjectPosts.map((p) =>
                  new Date(p.metadata?.date || p.date).getFullYear()
                )
              )
            ].sort((a, b) => b - a)"
            :key="year"
            class="grid grid-cols-12 gap-4"
          >
            <div class="col-span-3">
              <span class="text-sm text-zinc-500 dark:text-zinc-500">{{
                year
              }}</span>
            </div>
            <div class="col-span-9">
              <div class="space-y-2">
                <div
                  v-for="project in sortedProjectPosts.filter(
                    (p) =>
                      new Date(p.metadata?.date || p.date).getFullYear() ===
                      year
                  )"
                  :key="project.slug"
                >
                  <a
                    :href="`#${project.slug}`"
                    class="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                    @click.prevent="scrollToProject(project.slug)"
                  >
                    {{ project.title || project.metadata?.title }}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Project TOC for sidebar -->
    <teleport
      v-if="tocTarget && sortedProjectPosts.length"
      to="#nav-toc-container"
    >
      <div class="toc">
        <div class="px-6 py-6">
          <h3
            class="text-xs font-normal uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-500 mb-6"
          >
            Projects
          </h3>
          <ul class="space-y-2">
            <li
              v-for="project in sortedProjectPosts"
              :key="project.slug"
              class="group"
            >
              <a
                :href="`#${project.slug}`"
                class="block text-sm transition-colors py-1"
                :class="[
                  activeProject === project.slug
                    ? 'text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                ]"
                @click.prevent="scrollToProject(project.slug)"
              >
                {{ project.title || project.metadata?.title }}
              </a>
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
  @apply bg-zinc-50 dark:bg-zinc-800/50 p-4 overflow-x-auto mb-4 text-sm font-mono rounded-lg;
}

.content :deep(code) {
  @apply bg-zinc-50 dark:bg-zinc-800/50 px-1.5 py-0.5 text-sm font-mono rounded;
}

.content :deep(blockquote) {
  @apply border-l-4 border-zinc-200 dark:border-zinc-800 pl-4 my-4 italic text-zinc-600 dark:text-zinc-400;
}
</style>
