<script setup>
import { format } from 'date-fns'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const processedMarkdown = useProcessedMarkdown()
const hoveredProject = ref(null)
const focusedProject = ref(null)
const activeCategory = ref(null)
const route = useRoute()

// Track scroll position for animation
const scrollY = ref(0)
const updateScrollPosition = () => {
  scrollY.value = window.scrollY
}

// Set up scroll listener
onMounted(() => {
  window.addEventListener('scroll', updateScrollPosition)
  updateScrollPosition()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateScrollPosition)
})

function formatTitle(slug = '') {
  const baseName = slug.split('/').pop() || slug
  return baseName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const { data: projectPosts } = await useAsyncData('project-posts', async () => {
  console.log('Fetching project posts...')
  try {
    const projects = await processedMarkdown.getProjectPosts()
    console.log('Found projects:', {
      count: projects?.length,
      slugs: projects?.map(p => p.slug)
    })
    return projects || []
  } catch (err) {
    console.error('Error fetching projects:', err)
    return []
  }
})

function formatDate(date) {
  return format(new Date(date), 'MMM yyyy')
}

const sortedProjectPosts = computed(() => {
  return projectPosts.value?.sort((a, b) =>
    new Date(b.metadata?.date || b.date) - new Date(a.metadata?.date || a.date)
  ) || []
})

// Extract unique categories for the sidebar navigation
const categories = computed(() => {
  const cats = new Set()
  sortedProjectPosts.value.forEach(project => {
    if (project.metadata?.type) {
      cats.add(project.metadata.type)
    }
  })
  return Array.from(cats)
})

// Get a short excerpt from the project content
function getExcerpt(html) {
  if (!html) return ''

  // Create a temporary div to parse the HTML
  const div = document.createElement('div')
  div.innerHTML = html

  // Get the text content
  const text = div.textContent || div.innerText || ''

  // Return a short excerpt
  return text.slice(0, 100) + (text.length > 100 ? '...' : '')
}

// Scroll to category
function scrollToCategory(category) {
  activeCategory.value = category
  const el = document.getElementById(`category-${category.toLowerCase().replace(/\s+/g, '-')}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// Focus on a project
function focusProject(project) {
  if (focusedProject.value === project.slug) {
    // If clicking the already focused project, navigate to it
    navigateToProject(project)
    return
  }

  focusedProject.value = project.slug
  // Scroll to the focused project if needed
  nextTick(() => {
    const el = document.getElementById(`project-${project.slug}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  })
}

// Navigate to project detail page
function navigateToProject(project) {
  if (project.slug) {
    navigateTo(`/blog/${project.slug}`)
  }
}

// Clear focused project
function clearFocus() {
  focusedProject.value = null
}

// Set page title
useHead({
  title: `Projects (${sortedProjectPosts.value?.length || 0})`,
})
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <h1 class="text-4xl font-bold mb-3">Projects</h1>
    <p class="text-lg text-zinc-600 dark:text-zinc-400 mb-5">
      A collection of tools, visualizations, and experiments
    </p>

    <div v-if="!sortedProjectPosts.length" class="text-center py-8">
      <p class="text-lg text-zinc-600 dark:text-zinc-400">No projects found.</p>
    </div>

    <div v-else>
      <!-- Overlay for focused state -->
      <div v-if="focusedProject" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-10 transition-opacity duration-500"
        @click="clearFocus"></div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative">
        <article v-for="project in sortedProjectPosts" :key="project.slug || project.title"
          :id="`project-${project.slug}`"
          class="group relative rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-all duration-300 project-card min-h-[280px]"
          :class="{
            'z-20 scale-100 opacity-100 shadow-2xl': focusedProject === project.slug,
            'scale-95 opacity-40': focusedProject && focusedProject !== project.slug,
            'hover:shadow-lg': !focusedProject
          }" :style="focusedProject === project.slug ? 'view-transition-name: focused-project;' : ''"
          @mouseenter="!focusedProject && (hoveredProject = project.slug)"
          @mouseleave="!focusedProject && (hoveredProject = null)">

          <!-- Project card content -->
          <div class="h-full" @click="focusProject(project)">
            <!-- Project image with consistent handling -->
            <div class="relative aspect-video overflow-hidden bg-zinc-100 dark:bg-zinc-800">
              <img v-if="project.metadata?.image" :src="project.metadata.image"
                :alt="project.title || project.metadata?.title || formatTitle(project.slug)"
                class="w-full h-full object-cover" loading="lazy" />
              <div v-else class="w-full h-full flex items-center justify-center">
                <span class="text-zinc-500 dark:text-zinc-400 text-xl font-medium">{{ project.title ||
                  project.metadata?.title ||
                  formatTitle(project.slug) }}</span>
              </div>
            </div>

            <!-- Consistent title bar for all cards -->
            <div class="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
              <h2 class="text-lg font-bold text-zinc-900 dark:text-white truncate">
                {{ project.title || project.metadata?.title || formatTitle(project.slug) }}
              </h2>
              <div v-if="project.metadata?.date" class="text-xs font-mono text-zinc-500 dark:text-zinc-400 mt-1">
                {{ formatDate(project.metadata.date) }}
              </div>
            </div>

            <!-- Hover state with more details -->
            <div
              class="absolute inset-0 bg-zinc-900/90 dark:bg-black/90 backdrop-blur-sm flex flex-col p-4 transition-opacity duration-300"
              :class="[
                hoveredProject === project.slug && !focusedProject ? 'opacity-100' : 'opacity-0',
                focusedProject === project.slug ? 'opacity-0' : ''
              ]">
              <div class="mb-2">
                <h2 class="text-lg font-bold text-white mb-1">
                  {{ project.title || project.metadata?.title || formatTitle(project.slug) }}
                </h2>
                <div v-if="project.metadata?.date" class="text-xs font-mono text-zinc-300">
                  {{ formatDate(project.metadata.date) }}
                </div>
              </div>

              <p class="text-zinc-200 text-sm mb-auto leading-relaxed line-clamp-3">
                {{ getExcerpt(project.html) }}
              </p>

              <div class="mt-3 text-xs space-y-1.5">
                <div v-if="project.metadata?.github || project.metadata?.demo || project.metadata?.website"
                  class="flex flex-wrap gap-2">
                  <a v-if="project.metadata?.github" :href="project.metadata.github" target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center px-2.5 py-1 bg-blue-500/30 text-blue-200 rounded-md hover:bg-blue-500/40 transition-colors">
                    GitHub
                  </a>
                  <a v-if="project.metadata?.demo" :href="project.metadata.demo" target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center px-2.5 py-1 bg-purple-500/30 text-purple-200 rounded-md hover:bg-purple-500/40 transition-colors">
                    Demo
                  </a>
                  <a v-if="project.metadata?.website" :href="project.metadata.website" target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center px-2.5 py-1 bg-green-500/30 text-green-200 rounded-md hover:bg-green-500/40 transition-colors">
                    Website
                  </a>
                </div>
                <div v-if="project.metadata?.behindTheScenes" class="text-zinc-300 line-clamp-2 italic text-xs">
                  {{ project.metadata.behindTheScenes }}
                </div>
              </div>
            </div>
          </div>

          <!-- Expanded view when focused -->
          <div v-if="focusedProject === project.slug"
            class="absolute inset-0 bg-white dark:bg-zinc-900 z-30 overflow-auto p-5 rounded-lg shadow-2xl">
            <button @click.stop="clearFocus"
              class="absolute top-3 right-3 p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-zinc-700 dark:text-zinc-300" fill="none"
                viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div class="mb-4">
              <h2 class="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                {{ project.title || project.metadata?.title || formatTitle(project.slug) }}
              </h2>
              <div v-if="project.metadata?.date" class="text-sm font-mono text-zinc-500 dark:text-zinc-400">
                {{ formatDate(project.metadata.date) }}
              </div>
            </div>

            <div v-if="project.metadata?.image" class="mb-5">
              <img :src="project.metadata.image"
                :alt="project.title || project.metadata?.title || formatTitle(project.slug)"
                class="w-full rounded-lg object-cover max-h-[40vh]" />
            </div>

            <div class="prose dark:prose-invert max-w-none mb-5" v-html="project.html"></div>

            <div class="flex flex-wrap gap-3 mt-6">
              <a v-if="project.metadata?.github" :href="project.metadata.github" target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                View on GitHub
              </a>
              <a v-if="project.metadata?.demo" :href="project.metadata.demo" target="_blank" rel="noopener noreferrer"
                class="inline-flex items-center px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors">
                View Demo
              </a>
              <a v-if="project.metadata?.website" :href="project.metadata.website" target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors">
                Visit Website
              </a>
              <button @click.stop="navigateToProject(project)"
                class="inline-flex items-center px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-md hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors">
                View Full Page
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  </div>

  <!-- Teleport navigation to sidebar -->
  <Teleport to="#toc-container">
    <div v-if="categories.length > 0" class="py-2 px-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
      <h3 class="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-2">Project Categories</h3>
      <ul class="space-y-1">
        <li v-for="category in categories" :key="category" class="text-sm transition-colors cursor-pointer"
          :class="activeCategory === category ? 'text-blue-500 dark:text-blue-400 font-medium' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
          @click="scrollToCategory(category)">
          {{ category }}
        </li>
      </ul>
    </div>
  </Teleport>
</template>

<style scoped>
:deep(.prose) {
  max-width: none;
}

:deep(.prose a) {
  @apply text-blue-500 dark:text-blue-400 no-underline hover:underline;
}

:deep(.prose h1, .prose h2, .prose h3) {
  @apply text-zinc-800 dark:text-zinc-200;
}

:deep(.prose p) {
  @apply text-zinc-700 dark:text-zinc-300;
}

:deep(.prose ol) {
  @apply list-decimal list-outside ml-6;
}

:deep(.prose li) {
  @apply text-zinc-700 dark:text-zinc-300;
}

/* Refined hover effect */
.project-card {
  transition: transform 0.5s cubic-bezier(0.2, 0, 0.2, 1),
    box-shadow 0.5s cubic-bezier(0.2, 0, 0.2, 1),
    opacity 0.5s cubic-bezier(0.2, 0, 0.2, 1);
}

.project-card:hover:not(.focused) {
  transform: translateY(-2px);
}

/* Ensure smooth transitions for the focused state */
::view-transition-old(focused-project),
::view-transition-new(focused-project) {
  animation-duration: 0.5s;
  animation-timing-function: cubic-bezier(0.2, 0, 0.2, 1);
}
</style>
