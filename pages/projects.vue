<script setup>
import { format } from 'date-fns'
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'

const processedMarkdown = useProcessedMarkdown()
const hoveredProject = ref(null)
const focusedProject = ref(null)
const route = useRoute()
const currentSlide = ref(0)

// Track scroll position for animation
const scrollY = ref(0)
const updateScrollPosition = () => {
  scrollY.value = window.scrollY
}

// Handle keyboard events
const handleKeyDown = (event) => {
  // Handle escape key to close focused project
  if (event.key === 'Escape' && focusedProject.value) {
    clearFocus()
    return
  }

  // Only proceed if a project is focused
  if (!focusedProject.value) return

  // Get the current project index
  const currentProjectIndex = sortedProjectPosts.value.findIndex(p => p.slug === focusedProject.value)
  if (currentProjectIndex === -1) return

  // Handle arrow keys for project navigation - only use left/right for consistency
  if (event.key === 'ArrowRight') {
    // Navigate to next project
    const nextIndex = (currentProjectIndex + 1) % sortedProjectPosts.value.length
    const nextProject = sortedProjectPosts.value[nextIndex]

    if (nextProject) {
      // Reset carousel position and update focused project
      currentSlide.value = 0
      focusedProject.value = nextProject.slug

      // Use setTimeout to ensure the DOM has updated
      setTimeout(() => {
        const el = document.getElementById(`project-${nextProject.slug}`)
        if (el) {
          // Scroll to make element visible
          window.scrollTo({
            top: window.scrollY + el.getBoundingClientRect().top - 100,
            behavior: 'smooth'
          })
        }
      }, 10)
    }
  } else if (event.key === 'ArrowLeft') {
    // Navigate to previous project
    const prevIndex = (currentProjectIndex - 1 + sortedProjectPosts.value.length) % sortedProjectPosts.value.length
    const prevProject = sortedProjectPosts.value[prevIndex]

    if (prevProject) {
      // Reset carousel position and update focused project
      currentSlide.value = 0
      focusedProject.value = prevProject.slug

      // Use setTimeout to ensure the DOM has updated
      setTimeout(() => {
        const el = document.getElementById(`project-${prevProject.slug}`)
        if (el) {
          // Scroll to make element visible
          window.scrollTo({
            top: window.scrollY + el.getBoundingClientRect().top - 100,
            behavior: 'smooth'
          })
        }
      }, 10)
    }
  }
}

// Set up scroll and keyboard listeners
onMounted(() => {
  try {
    // Remove any existing listeners first to prevent duplicates
    window.removeEventListener('scroll', updateScrollPosition)
    window.removeEventListener('keydown', handleKeyDown)

    // Add listeners
    window.addEventListener('scroll', updateScrollPosition)
    window.addEventListener('keydown', handleKeyDown)
    updateScrollPosition()
  } catch (error) {
    console.error('Error setting up event listeners:', error)
  }
})

onBeforeUnmount(() => {
  try {
    window.removeEventListener('scroll', updateScrollPosition)
    window.removeEventListener('keydown', handleKeyDown)
  } catch (error) {
    console.error('Error removing event listeners:', error)
  }
})

function formatTitle(slug = '') {
  const baseName = slug.split('/').pop() || slug
  return baseName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const { data: projectPosts } = await useAsyncData('project-posts', async () => {
  try {
    const projects = await processedMarkdown.getProjectPosts()
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

// Extract all images from project content
function extractImages(project) {
  if (!project || !project.html || typeof document === 'undefined') return []

  const images = []

  try {
    // Add featured image if it exists
    if (project.metadata?.image) {
      images.push({
        src: project.metadata.image,
        alt: project.title || project.metadata?.title || formatTitle(project.slug),
        isFeatured: true
      })
    }

    // Parse HTML to find all images
    const div = document.createElement('div')
    div.innerHTML = project.html

    // Get all img elements
    const imgElements = div.querySelectorAll('img')
    imgElements.forEach(img => {
      const src = img.getAttribute('src')
      if (!src || project.metadata?.image === src || images.some(existingImg => existingImg.src === src)) return

      images.push({
        src,
        alt: img.getAttribute('alt') || '',
        isFeatured: false
      })
    })

    // Special case for NYPD clusters project
    if (project.slug === 'projects/ccrb-clusters' && images.length === 0) {
      images.push({
        src: 'https://res.cloudinary.com/ejf/image/upload/fl_progressive:semi,c_scale,dpr_auto,w_1280/v1624505769/Screen_Shot_2021-06-21_at_8.58.50_PM.jpg',
        alt: 'Clusters of NYPD Misconduct',
        isFeatured: false
      })
    }
  } catch (error) {
    console.error(`Error extracting images for ${project.slug}:`, error)
  }

  return images
}

// Focus on a project
function focusProject(project) {
  try {
    if (typeof document === 'undefined') return

    if (focusedProject.value === project.slug) {
      // If clicking the already focused project, navigate to it
      navigateToProject(project)
      return
    }

    // Reset carousel position
    currentSlide.value = 0

    // Update focused project
    focusedProject.value = project.slug

    // Use setTimeout to ensure the DOM has updated
    setTimeout(() => {
      const el = document.getElementById(`project-${project.slug}`)
      if (el) {
        // Scroll to make element visible
        window.scrollTo({
          top: window.scrollY + el.getBoundingClientRect().top - 100,
          behavior: 'smooth'
        })
      }
    }, 10)
  } catch (error) {
    console.error('Error focusing project:', error)
  }
}

// Navigate to project detail page
function navigateToProject(project) {
  if (project.slug) {
    navigateTo(`/blog/${project.slug}`)
  }
}

// Clear focused project
function clearFocus() {
  try {
    focusedProject.value = null
    hoveredProject.value = null
    currentSlide.value = 0
  } catch (error) {
    console.error('Error clearing focus:', error)
  }
}

// Carousel controls
function nextSlide(images) {
  currentSlide.value = (currentSlide.value + 1) % images.length
}

function prevSlide(images) {
  currentSlide.value = (currentSlide.value - 1 + images.length) % images.length
}

function goToSlide(index) {
  currentSlide.value = index
}

// Set page title
useHead({
  title: `Projects (${sortedProjectPosts.value?.length || 0})`,
})
</script>

<template>
  <div class="container mx-auto px-4 py-5">
    <h1 class="text-3xl font-medium mb-2">Projects</h1>
    <p class="text-base text-zinc-600 dark:text-zinc-400 mb-4">
      A collection of tools, visualizations, and experiments
    </p>

    <div v-if="!sortedProjectPosts.length" class="text-center py-6">
      <p class="text-base text-zinc-600 dark:text-zinc-400">No projects found.</p>
    </div>

    <div v-else>
      <!-- Overlay for focused state -->
      <div v-if="focusedProject" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-10 transition-opacity duration-500"
        @click="clearFocus"></div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 relative">
        <article v-for="project in sortedProjectPosts" :key="project.slug || project.title"
          :id="`project-${project.slug}`"
          class="group relative rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-all duration-300 project-card min-h-[280px]"
          :class="{
            'z-20 scale-100 opacity-100 shadow-2xl focused': focusedProject === project.slug,
            'scale-95 opacity-40': focusedProject && focusedProject !== project.slug,
            'hover:shadow-lg': !focusedProject
          }" @mouseenter="!focusedProject && (hoveredProject = project.slug)"
          @mouseleave="!focusedProject && (hoveredProject = null)">

          <!-- Project card content -->
          <div class="h-full" @click="focusProject(project)">
            <!-- Project image with consistent handling -->
            <div class="relative aspect-video overflow-hidden bg-zinc-100 dark:bg-zinc-800">
              <img v-if="project.metadata?.image" :src="project.metadata.image"
                :alt="project.title || project.metadata?.title || formatTitle(project.slug)"
                class="w-full h-full object-cover" loading="lazy" />
              <div v-else class="w-full h-full flex items-center justify-center">
                <span class="text-zinc-500 dark:text-zinc-400 text-lg font-medium">{{ project.title ||
                  project.metadata?.title ||
                  formatTitle(project.slug) }}</span>
              </div>
            </div>

            <!-- Consistent title bar for all cards -->
            <div class="p-2 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
              <h2 class="text-base font-medium text-zinc-900 dark:text-white truncate">
                {{ project.title || project.metadata?.title || formatTitle(project.slug) }}
              </h2>
              <div class="flex items-center justify-between mt-0.5">
                <div v-if="project.metadata?.date" class="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                  {{ formatDate(project.metadata.date) }}
                </div>
              </div>
            </div>

            <!-- Hover state with more details -->
            <div
              class="absolute inset-0 bg-zinc-900/90 dark:bg-black/90 backdrop-blur-sm flex flex-col p-3 transition-opacity duration-300"
              :class="[
                hoveredProject === project.slug && !focusedProject ? 'opacity-100' : 'opacity-0',
                focusedProject === project.slug ? 'opacity-0' : ''
              ]">
              <div class="mb-1.5">
                <h2 class="text-base font-medium text-white mb-0.5">
                  {{ project.title || project.metadata?.title || formatTitle(project.slug) }}
                </h2>
                <div v-if="project.metadata?.date" class="text-xs font-mono text-zinc-300">
                  {{ formatDate(project.metadata.date) }}
                </div>
              </div>

              <p class="text-zinc-200 text-xs mb-auto leading-relaxed line-clamp-3">
                {{ getExcerpt(project.html) }}
              </p>

              <div class="mt-2 text-xs space-y-1">
                <div v-if="project.metadata?.github || project.metadata?.demo || project.metadata?.website"
                  class="flex flex-wrap gap-1.5">
                  <a v-if="project.metadata?.github" :href="project.metadata.github" target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center px-2 py-0.5 bg-blue-500/30 text-blue-200 rounded-md hover:bg-blue-500/40 transition-colors">
                    GitHub
                  </a>
                  <a v-if="project.metadata?.demo" :href="project.metadata.demo" target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center px-2 py-0.5 bg-purple-500/30 text-purple-200 rounded-md hover:bg-purple-500/40 transition-colors">
                    Demo
                  </a>
                  <a v-if="project.metadata?.website" :href="project.metadata.website" target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center px-2 py-0.5 bg-green-500/30 text-green-200 rounded-md hover:bg-green-500/40 transition-colors">
                    Website
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- Expanded view when focused -->
          <div v-if="focusedProject === project.slug"
            class="absolute inset-0 bg-white dark:bg-zinc-900 z-30 overflow-auto p-4 rounded-lg shadow-2xl">
            <button @click.stop="clearFocus"
              class="absolute top-2 right-2 p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors z-50">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-zinc-700 dark:text-zinc-300" fill="none"
                viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div class="mb-3">
              <h2 class="text-xl font-medium text-zinc-900 dark:text-white mb-1">
                {{ project.title || project.metadata?.title || formatTitle(project.slug) }}
              </h2>
              <div class="flex items-center gap-2">
                <div v-if="project.metadata?.date" class="text-sm font-mono text-zinc-500 dark:text-zinc-400">
                  {{ formatDate(project.metadata.date) }}
                </div>
              </div>
            </div>

            <!-- Image Carousel -->
            <div v-if="extractImages(project).length > 0" class="mb-4 relative">
              <div class="relative overflow-hidden rounded-lg aspect-video bg-zinc-100 dark:bg-zinc-800">
                <div class="carousel-container h-full">
                  <div v-for="(image, index) in extractImages(project)" :key="index"
                    class="carousel-slide absolute inset-0 transition-opacity duration-500"
                    :class="{ 'opacity-100': index === currentSlide, 'opacity-0': index !== currentSlide }">
                    <img :src="image.src" :alt="image.alt" class="w-full h-full object-contain" />
                  </div>
                </div>

                <!-- Carousel Controls -->
                <div v-if="extractImages(project).length > 1"
                  class="absolute inset-x-0 bottom-0 flex justify-between items-center p-2">
                  <button @click.stop="prevSlide(extractImages(project))"
                    class="p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <div class="flex space-x-1">
                    <button v-for="(_, index) in extractImages(project)" :key="index" @click.stop="goToSlide(index)"
                      class="w-1.5 h-1.5 rounded-full transition-colors"
                      :class="index === currentSlide ? 'bg-white' : 'bg-white/50 hover:bg-white/70'">
                    </button>
                  </div>

                  <button @click.stop="nextSlide(extractImages(project))"
                    class="p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                <!-- Image Counter -->
                <div v-if="extractImages(project).length > 1"
                  class="absolute top-2 right-2 px-1.5 py-0.5 bg-black/50 text-white text-xs rounded-md">
                  {{ currentSlide + 1 }} / {{ extractImages(project).length }}
                </div>
              </div>
            </div>

            <div class="prose prose-sm dark:prose-invert max-w-none mb-4" v-html="project.html"></div>

            <div class="flex flex-wrap gap-2 mt-4">
              <a v-if="project.metadata?.github" :href="project.metadata.github" target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center px-3 py-1.5 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors">
                View on GitHub
              </a>
              <a v-if="project.metadata?.demo" :href="project.metadata.demo" target="_blank" rel="noopener noreferrer"
                class="inline-flex items-center px-3 py-1.5 bg-purple-500 text-white text-sm rounded-md hover:bg-purple-600 transition-colors">
                View Demo
              </a>
              <a v-if="project.metadata?.website" :href="project.metadata.website" target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center px-3 py-1.5 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 transition-colors">
                Visit Website
              </a>
              <button @click.stop="navigateToProject(project)"
                class="inline-flex items-center px-3 py-1.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-sm rounded-md hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors">
                View Full Page
              </button>
            </div>
          </div>
        </article>
      </div>

      <!-- Keyboard navigation hint -->
      <div v-if="focusedProject"
        class="fixed bottom-0 left-0 right-0 flex justify-center items-center z-50 pointer-events-none">
        <div
          class="bg-black/60 backdrop-blur-sm text-white font-mono text-xs px-3 py-1.5 rounded-t-lg flex items-center space-x-4 transform keyboard-hint">
          <div class="flex items-center space-x-2">
            <span class="inline-block border border-white/30 rounded px-1 py-0.5 text-[10px]">esc</span>
            <span class="text-zinc-300 text-[10px]">close</span>
          </div>
          <div class="flex items-center space-x-2">
            <div class="flex space-x-1">
              <span class="inline-block border border-white/30 rounded px-1 py-0.5 text-[10px]">←</span>
              <span class="inline-block border border-white/30 rounded px-1 py-0.5 text-[10px]">→</span>
            </div>
            <span class="text-zinc-300 text-[10px]">navigate projects</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.prose) {
  max-width: none;
  font-size: 0.9rem;
}

:deep(.prose a) {
  @apply text-blue-500 dark:text-blue-400 no-underline hover:underline;
}

:deep(.prose h1, .prose h2, .prose h3) {
  @apply text-zinc-800 dark:text-zinc-200 font-medium;
  margin-top: 1.5em;
  margin-bottom: 0.75em;
}

:deep(.prose h1) {
  font-size: 1.5rem;
}

:deep(.prose h2) {
  font-size: 1.25rem;
}

:deep(.prose h3) {
  font-size: 1.1rem;
}

:deep(.prose p) {
  @apply text-zinc-700 dark:text-zinc-300;
  margin-top: 0.75em;
  margin-bottom: 0.75em;
  line-height: 1.6;
}

:deep(.prose ol) {
  @apply list-decimal list-outside ml-5;
}

:deep(.prose ul) {
  @apply list-disc list-outside ml-5;
}

:deep(.prose li) {
  @apply text-zinc-700 dark:text-zinc-300;
  margin-top: 0.25em;
  margin-bottom: 0.25em;
}

:deep(.prose img) {
  @apply rounded-md;
}

/* Refined hover effect */
.project-card {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.project-card:hover:not(.focused) {
  transform: translateY(-2px);
}

/* Carousel styles */
.carousel-container {
  position: relative;
  width: 100%;
}

.carousel-slide {
  transition: opacity 0.5s ease;
}

/* Keyboard hint animation */
.keyboard-hint {
  animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  transform: translateY(100%);
}

@keyframes slide-up {
  from {
    transform: translateY(100%);
  }

  to {
    transform: translateY(0);
  }
}
</style>
