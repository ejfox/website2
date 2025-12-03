<script setup>
import BlogPostContent from '~/components/BlogPostContent.vue'
import { useIntersectionObserver } from '@vueuse/core'

const { formatLongDate } = useDateFormat()
const route = useRoute()
const slug = route.params.slug

// Fetch the project (stored as blog post with projects/ prefix)
const { data: project, error } = await useAsyncData(
  `project-${slug}`,
  async () => {
    try {
      const response = await $fetch(`/api/posts/projects/${slug}`)

      if (response.error) {
        throw new Error(response.error)
      }

      return response
    } catch (error) {
      console.error('Error fetching project:', error)
      throw error
    }
  }
)

// If error, show 404
if (error.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Project not found',
    fatal: true,
  })
}

// SEO metadata
const title = computed(
  () => project.value?.title || project.value?.metadata?.title || 'Project'
)
const description = computed(() => {
  const html = project.value?.html || ''
  return html.replace(/<[^>]*>/g, '').slice(0, 160)
})

const projectTags = computed(
  () => project.value?.metadata?.tags || project.value?.metadata?.tech || []
)

usePageSeo({
  title: computed(() => `${title.value} - EJ Fox`),
  description: computed(() => description.value),
  type: 'article',
  section: 'Projects',
  tags: projectTags,
  publishedTime: computed(() => project.value?.metadata?.date || project.value?.date),
  modifiedTime: computed(
    () => project.value?.metadata?.lastUpdated || project.value?.metadata?.date
  ),
  label1: 'Stack',
  data1: computed(() =>
    (project.value?.metadata?.tech || []).slice(0, 4).join(', ') || 'Details in project'
  ),
  label2: 'Status',
  data2: computed(() => project.value?.metadata?.status || 'Shipped'),
})

// TOC target for teleport
const { tocTarget } = useTOC()

// Extract TOC from project data
const tocChildren = computed(() => {
  return (
    project.value?.toc?.[0]?.children ||
    project.value?.metadata?.toc?.[0]?.children ||
    []
  )
})

// Track active section for scroll highlighting
const activeSection = ref('')

// Helper function for TOC link classes
const getTocLinkClass = (isActive) => {
  if (isActive) {
    return 'text-zinc-900 dark:text-zinc-100 font-medium'
  }
  return [
    'text-zinc-600 dark:text-zinc-400',
    'hover:text-zinc-900 dark:hover:text-zinc-100',
    'hover:translate-x-1',
  ].join(' ')
}

onMounted(() => {
  if (import.meta.client && tocChildren.value.length > 0) {
    const headings = Array.from(document.querySelectorAll('h2[id], h3[id]'))

    useIntersectionObserver(
      headings,
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            activeSection.value = entry.target.id
          }
        })
      },
      {
        rootMargin: '-80px 0px -80% 0px',
      }
    )
  }
})
</script>

<template>
  <div class="container-main" style="max-width: 65ch">
    <article v-if="project" class="py-8 md:py-16">
      <!-- Content (title is extracted and removed by markdown processor) -->
      <BlogPostContent :html="project.html" />

      <!-- Back link -->
      <div class="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800">
        <NuxtLink to="/projects" class="interactive-link back-link">
          ← Back to Projects
        </NuxtLink>
      </div>
    </article>

    <!-- Metadata and TOC for sidebar -->
    <ClientOnly>
      <teleport v-if="tocTarget" to="#nav-toc-container">
        <div class="space-y-6">
          <!-- Project Metadata -->
          <div
            class="space-y-3 pb-6 border-b border-zinc-200 dark:border-zinc-800"
          >
            <h3 class="label-uppercase-mono text-xs mb-3">Project Info</h3>

            <!-- Date -->
            <div v-if="project.metadata?.date" class="text-sm">
              <div class="metadata-label">Date</div>
              <time class="tabular-nums text-zinc-900 dark:text-zinc-100">
                {{ formatLongDate(project.metadata.date) }}
              </time>
            </div>

            <!-- Tech Stack -->
            <div v-if="project.metadata?.tech?.length" class="text-sm">
              <div class="metadata-label">Tech</div>
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="tech in project.metadata.tech"
                  :key="tech"
                  class="tech-badge"
                >
                  {{ tech }}
                </span>
              </div>
            </div>

            <!-- GitHub Link -->
            <div v-if="project.metadata?.github" class="text-sm">
              <div class="metadata-label">Source</div>
              <a
                :href="project.metadata.github"
                target="_blank"
                class="github-link"
              >
                GitHub ↗
              </a>
            </div>
          </div>

          <!-- TOC -->
          <div v-if="tocChildren.length > 0" class="toc">
            <h3 class="label-uppercase-mono text-xs mb-3">Contents</h3>
            <div class="py-4 pl-0 relative">
              <ul class="space-y-0">
                <li
                  v-for="(child, index) in tocChildren"
                  :key="child.slug"
                  class="group relative"
                >
                  <a
                    :href="`#${child.slug}`"
                    class="toc-link"
                    :class="getTocLinkClass(activeSection === child.slug)"
                  >
                    <!-- Section number -->
                    <span
                      class="toc-number"
                      :class="
                        activeSection === child.slug
                          ? 'opacity-70'
                          : 'opacity-40'
                      "
                    >
                      {{ String(index + 1).padStart(2, '0') }}
                    </span>

                    <!-- Section title -->
                    <span
                      class="font-serif leading-relaxed"
                      :class="
                        activeSection === child.slug
                          ? 'font-medium'
                          : 'font-normal'
                      "
                    >
                      {{ child.title }}
                    </span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </teleport>
    </ClientOnly>
  </div>
</template>

<style scoped>
.back-link {
  @apply text-sm text-zinc-600 dark:text-zinc-400;
}

.metadata-label {
  @apply text-zinc-500 dark:text-zinc-500 text-xs uppercase tracking-wider mb-1;
}

.tech-badge {
  @apply font-mono text-xs px-2 py-1 rounded;
  @apply bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300;
}

.github-link {
  @apply text-zinc-900 dark:text-zinc-100;
  @apply hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors;
}

.toc-link {
  @apply flex items-baseline text-sm transition-all duration-200;
  @apply no-underline py-2 gap-2;
}

.toc-number {
  @apply font-mono text-xs tabular-nums w-4 text-right flex-shrink-0;
}
</style>
