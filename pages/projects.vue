<script setup>
import { format } from 'date-fns'
import { animate, stagger as _stagger } from '~/anime.esm.js'
import { useStorage } from '@vueuse/core'
import { useAnimations } from '~/composables/useAnimations'
import { useScrollAnimation } from '~/composables/useScrollAnimation'

const { data: projects } = await useAsyncData('projects-page-data', () => 
  $fetch('/api/projects')
)

const isGrid = useStorage('projects-grid', false)

const { timing, staggers, easing } = useAnimations()
const { slideUp } = useScrollAnimation()

const animationsInitialized = ref(false)

function formatDate(date) {
  if (!date) return ''
  try {
    return format(new Date(date), 'MMM yyyy')
  } catch {
    return ''
  }
}


async function initializeAnimations() {
  if (animationsInitialized.value) return
  
  await nextTick()
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 50))
  
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
  
  const images = document.querySelectorAll('img.animate-on-scroll')
  images.forEach((img) => slideUp(img))
  
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
    <header class="my-20 md:mt-6 pl-4 md:pl-0 flex justify-between items-end">
      <div>
        <h1 class="text-display mb-8">
          Projects
        </h1>
        <p class="text-body">
          A collection of experiments, tools, and creative explorations.
        </p>
      </div>
      <button class="px-3 py-1 text-sm border rounded hover:bg-zinc-50 dark:hover:bg-zinc-900" @click="isGrid = !isGrid">
        {{ isGrid ? 'List' : 'Grid' }}
      </button>
    </header>

    <div class="max-w-screen-lg">
      <section class="mt-16 md:mt-0">
        <div v-if="!projects || !projects.length" class="text-center py-16">
          <p class="text-zinc-600 dark:text-zinc-400">
            No projects found.
          </p>
        </div>

        <TransitionGroup 
          name="project" 
          tag="div"
          :class="isGrid ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-24'"
        >
          <template v-if="!isGrid">
            <article
              v-for="project in projects"
              :key="`list-${project.slug}`"
              class="group grid grid-cols-12 gap-4"
            >
              <div class="col-span-2 pl-2 md:pl-0">
                <time class="text-xs text-zinc-500">
                  {{ formatDate(project.metadata?.date || project.date) }}
                </time>
                <div v-if="project.metadata?.tech?.length" class="pt-3">
                  <div class="flex flex-col gap-1">
                    <span 
                      v-for="tech in project.metadata.tech" 
                      :key="tech"
                      class="text-xs px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-md w-fit"
                    >
                      {{ tech }}
                    </span>
                  </div>
                </div>
                <div v-if="project.metadata?.github" class="pt-6">
                  <a :href="project.metadata.github" target="_blank" class="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
                    GitHub ↗
                  </a>
                </div>
              </div>
              <div class="col-span-10">
                <h2 class="text-3xl md:text-4xl font-light text-zinc-900 dark:text-zinc-100 mb-4">
                  {{ project.title || project.metadata?.title }}
                </h2>
                <div class="prose prose-zinc dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400 leading-relaxed" v-html="project.html" />
              </div>
            </article>
          </template>

          <template v-else>
            <article
              v-for="project in projects"
              :key="`grid-${project.slug}`"
              class="group"
            >
              <div class="aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-lg mb-3 flex items-center justify-center text-4xl font-light text-zinc-400">
                {{ (project.title || project.metadata?.title || '').charAt(0) }}
              </div>
              <time class="text-xs text-zinc-500 block mb-1">
                {{ formatDate(project.metadata?.date || project.date) }}
              </time>
              <h3 class="text-sm font-medium leading-tight line-clamp-2 mb-2">
                {{ project.title || project.metadata?.title }}
              </h3>
              <div v-if="project.metadata?.tech?.length" class="flex flex-wrap gap-1 mb-2">
                <span 
                  v-for="tech in project.metadata.tech" 
                  :key="tech"
                  class="text-xs px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded"
                >
                  {{ tech }}
                </span>
              </div>
              <a v-if="project.metadata?.github" :href="project.metadata.github" target="_blank" class="text-xs text-blue-600 hover:text-blue-800">
                GitHub ↗
              </a>
            </article>
          </template>
        </TransitionGroup>
      </section>
    </div>
  </div>
</template>

<style scoped>
.project-enter-active,
.project-leave-active {
  transition: all 0.4s ease;
}

.project-move {
  transition: transform 0.4s ease;
}

.project-enter-from,
.project-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.project-leave-active {
  position: absolute;
}
</style>