/**
 * Projects Page Component
 * ========================
 * 
 * CRITICAL: Animation Setup Required!
 * -----------------------------------
 * The markdown processor (rehypeAddClassToParagraphs.mjs) adds animation classes
 * like 'animate-on-scroll', 'slide-from-left', etc. to HTML elements during build.
 * These classes set initial states (opacity: 0, transforms) expecting JavaScript
 * to animate them in.
 * 
 * WITHOUT the animation setup below, content will remain invisible (opacity: 0).
 * This was discovered when projects after the first 2 weren't showing - they had
 * the animation classes but no JS to trigger the animations.
 * 
 * This pattern matches the blog post page (blog/[...slug].vue) which has the
 * same requirement. Any page displaying processed markdown content needs this.
 * 
 * @see scripts/plugins/rehypeAddClassToParagraphs.mjs - adds animation classes
 * @see composables/useScrollAnimation.ts - scroll-triggered animations
 * @see pages/blog/[...slug].vue - reference implementation
 */

<script setup>
import { format } from 'date-fns'
import { animate, stagger as _stagger } from '~/anime.esm.js'

// Fetch project data using same pattern as blog
const { data: projects } = await useAsyncData('projects-page-data', () => 
  $fetch('/api/projects')
)

// Animation composables - required for processed markdown content
const { timing, staggers, easing } = useAnimations()
const { slideUp } = useScrollAnimation()

// Track if animations have been set up
const animationsInitialized = ref(false)

function formatDate(date) {
  if (!date) return ''
  try {
    return format(new Date(date), 'MMM yyyy')
  } catch {
    return ''
  }
}

/**
 * Initialize animations for markdown content
 * This MUST run after the content is rendered or elements will stay at opacity: 0
 * Pattern copied from blog/[...slug].vue which handles the same animation classes
 */
async function initializeAnimations() {
  if (animationsInitialized.value) return
  
  await nextTick()
  await nextTick() // Double nextTick ensures DOM is fully updated
  await new Promise((resolve) => setTimeout(resolve, 50)) // Small delay for hydration
  
  // Animate all non-image content with animate-on-scroll class
  // These elements start at opacity: 0 from the markdown processor
  const content = document.querySelectorAll('.animate-on-scroll:not(img)')
  if (content.length > 0) {
    animate(content, {
      opacity: [0, 1],
      translateY: [20, 0],
      duration: timing.normal,
      ease: easing.standard,
      delay: _stagger(staggers.tight)
    })
  }
  
  // Set up scroll-triggered animations for images
  // Images use intersection observer for lazy animation
  const images = document.querySelectorAll('img.animate-on-scroll')
  images.forEach((img) => slideUp(img))
  
  // Also handle slide-from-* classes if present
  const slideElements = document.querySelectorAll('.slide-from-left, .slide-from-bottom')
  if (slideElements.length > 0) {
    animate(slideElements, {
      opacity: [0, 1],
      duration: timing.normal,
      ease: easing.standard
    })
  }
  
  animationsInitialized.value = true
}

// Initialize animations once when projects are loaded
onMounted(async () => {
  if (projects.value && projects.value.length > 0) {
    await initializeAnimations()
  }
})

useHead({
  title: 'Projects'
})
</script>

<template>
  <div>
    <header class="my-20 md:mt-6 pl-4 md:pl-0">
      <h1 class="text-display mb-8">
        Projects
      </h1>
      <p class="text-body">
        A collection of experiments, tools, and creative explorations.
      </p>
    </header>

    <div class="max-w-screen-lg">
      <section class="mt-16 md:mt-0">
        <div v-if="!projects || !projects.length" class="text-center py-16">
          <p class="text-zinc-600 dark:text-zinc-400">
            No projects found.
          </p>
        </div>

        <div v-else class="space-y-24">
          <article
            v-for="project in projects"
            :key="project.slug"
            class="group grid grid-cols-12 gap-4"
          >
            <!-- Date column -->
            <div class="col-span-2 pl-2 md:pl-0">
              <time class="text-xs text-zinc-500">
                {{ formatDate(project.metadata?.date || project.date) }}
              </time>
              <div v-if="project.metadata?.github" class="pt-6">
                <a
                  :href="project.metadata.github"
                  target="_blank"
                  class="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  GitHub ↗
                </a>
              </div>
            </div>

            <!-- Content column -->
            <div class="col-span-10">
              <h2 class="text-3xl md:text-4xl font-light text-zinc-900 dark:text-zinc-100 mb-4">
                {{ project.title || project.metadata?.title }}
              </h2>

              <div
                class="prose prose-zinc dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400 leading-relaxed"
                v-html="project.html"
              ></div>
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>