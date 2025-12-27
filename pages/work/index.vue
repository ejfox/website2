<script setup lang="ts">
import problemTypesData from '~/data/project-problem-types.json'

const { data: projects } = await useAsyncData('projects', () =>
  queryContent('/blog/projects').find()
)

const problemTypes = problemTypesData.problemTypes
const projectMappings = problemTypesData.projectMappings

// Get slug from project path
function getSlug(path: string): string {
  return path.split('/').pop() || ''
}

// Get problem types for a project
function getProjectProblemTypes(path: string): string[] {
  const slug = getSlug(path)
  return projectMappings[slug as keyof typeof projectMappings] || []
}

// Active filter
const activeFilter = ref<string | null>(null)

// Filtered projects
const filteredProjects = computed(() => {
  if (!projects.value) return []
  if (!activeFilter.value) return projects.value

  return projects.value.filter(p => {
    const types = getProjectProblemTypes(p._path || '')
    return types.includes(activeFilter.value!)
  })
})

// Count projects per type
function countProjects(typeId: string): number {
  if (!projects.value) return 0
  return projects.value.filter(p => {
    const types = getProjectProblemTypes(p._path || '')
    return types.includes(typeId)
  }).length
}

usePageSeo({
  title: 'Work · EJ Fox',
  description: 'Projects organized by type of problem: real-time systems, messy data, novel AI, weird interfaces, and more.',
})
</script>

<template>
  <main class="container-main pt-8 max-w-4xl">
    <header class="section-spacing-lg">
      <h1 class="font-serif text-3xl md:text-4xl font-normal mb-4" style="letter-spacing: -0.02em">
        Work by Problem Type
      </h1>
      <p class="font-serif text-lg text-zinc-600 dark:text-zinc-400 mb-8">
        I make computers do things no one has seen before. Here's how that breaks down.
      </p>

      <!-- Problem Type Filters -->
      <div class="flex flex-wrap gap-2 mb-8">
        <button
          class="px-3 py-1.5 rounded font-mono text-xs transition-colors"
          :class="activeFilter === null
            ? 'bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900'
            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'"
          @click="activeFilter = null"
        >
          All
        </button>
        <button
          v-for="(type, id) in problemTypes"
          :key="id"
          class="px-3 py-1.5 rounded font-mono text-xs transition-colors"
          :class="activeFilter === id
            ? 'bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900'
            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'"
          @click="activeFilter = activeFilter === id ? null : id"
        >
          {{ type.title }}
          <span class="opacity-50 ml-1">({{ countProjects(id) }})</span>
        </button>
      </div>
    </header>

    <!-- Problem Type Description -->
    <div v-if="activeFilter && problemTypes[activeFilter as keyof typeof problemTypes]" class="mb-8 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
      <h2 class="font-mono text-sm text-zinc-900 dark:text-zinc-100 mb-1">
        {{ problemTypes[activeFilter as keyof typeof problemTypes].title }}
      </h2>
      <p class="font-serif text-sm text-zinc-600 dark:text-zinc-400">
        {{ problemTypes[activeFilter as keyof typeof problemTypes].description }}
      </p>
    </div>

    <!-- Projects Grid -->
    <div class="space-y-6">
      <article
        v-for="project in filteredProjects"
        :key="project._path"
        class="border-b border-zinc-200 dark:border-zinc-800 pb-6"
      >
        <NuxtLink :to="project._path" class="block group">
          <h2 class="font-serif text-xl text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors mb-2">
            {{ project.title }}
          </h2>

          <!-- Problem Type Tags -->
          <div class="flex flex-wrap gap-1 mb-3">
            <span
              v-for="typeId in getProjectProblemTypes(project._path || '')"
              :key="typeId"
              class="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded font-mono text-xs text-zinc-500"
            >
              {{ problemTypes[typeId as keyof typeof problemTypes]?.title || typeId }}
            </span>
          </div>

          <!-- Tech Stack -->
          <div v-if="project.tech" class="flex flex-wrap gap-1 mb-2">
            <span
              v-for="tech in project.tech?.slice(0, 4)"
              :key="tech"
              class="font-mono text-xs text-zinc-400"
            >
              {{ tech }}<span v-if="project.tech.indexOf(tech) < Math.min(project.tech.length, 4) - 1">,</span>
            </span>
            <span v-if="project.tech?.length > 4" class="font-mono text-xs text-zinc-400">
              +{{ project.tech.length - 4 }}
            </span>
          </div>

          <!-- State -->
          <span class="font-mono text-xs" :class="{
            'text-green-600 dark:text-green-400': project.state === 'deployed',
            'text-yellow-600 dark:text-yellow-400': project.state === 'doing',
            'text-zinc-400': project.state === 'evolved'
          }">
            {{ project.state }}
          </span>
        </NuxtLink>
      </article>
    </div>

    <!-- CTA -->
    <section class="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800">
      <p class="font-serif text-zinc-600 dark:text-zinc-400 mb-4">
        Have a problem that fits one of these patterns?
      </p>
      <NuxtLink
        to="/consulting"
        class="inline-block bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 px-5 py-2.5 rounded font-mono text-sm hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
      >
        Let's talk
      </NuxtLink>
    </section>
  </main>
</template>
