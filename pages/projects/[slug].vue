<script setup>
import BlogPostContent from '~/components/blog/BlogPostContent.vue'
import { useIntersectionObserver } from '@vueuse/core'

const route = useRoute()
const slug = route.params.slug

// Fetch the project (stored as blog post with projects/ prefix)
// Before the await: composables needing the component instance must run
// while it still exists. Every other page using useTOC does the same.
const { tocTarget } = useTOC()

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
const description = computed(() =>
  ogDescription(project.value?.html, {
    dek: project.value?.metadata?.dek || project.value?.dek,
    title: title.value,
  })
)

const projectTags = computed(
  () => project.value?.metadata?.tags || project.value?.metadata?.tech || []
)

// Share cards should show the WORK, not the generic site og-image — these are
// portfolio pages whose whole point is visuals. First image in the post wins.
const firstProjectImage = computed(() => {
  const m = project.value?.html?.match(/<img[^>]+src="([^"]+)"/)
  return m ? m[1].replace(/^http:/, 'https:') : ''
})

usePageSeo({
  title: computed(() => `${title.value} - EJ Fox`),
  description: computed(() => description.value),
  image: computed(() => firstProjectImage.value || undefined),
  imageAlt: computed(() => `${title.value} — project imagery`),
  type: 'article',
  section: 'Projects',
  tags: projectTags,
  publishedTime: computed(
    () => project.value?.metadata?.date || project.value?.date
  ),
  modifiedTime: computed(
    () => project.value?.metadata?.lastUpdated || project.value?.metadata?.date
  ),
  label1: 'Stack',
  data1: computed(
    () =>
      (project.value?.metadata?.tech || []).slice(0, 4).join(', ') ||
      'Details in project'
  ),
  label2: 'Status',
  data2: computed(() => project.value?.metadata?.status || 'Shipped'),
})

// TOC target for teleport

// Extract TOC from project data
// Flatten the TOC tree: top-level headings numbered, their children indented.
// Legacy content wraps everything in a single h1 (the title) — unwrap it so the
// h2s stay top-level.
const tocChildren = computed(() => {
  const toc = project.value?.toc || project.value?.metadata?.toc || []
  const roots =
    toc.length === 1 && toc[0]?.level === 'h1' ? toc[0].children || [] : toc

  let number = 0
  return roots.flatMap((item) => [
    { ...item, depth: 0, number: String(++number).padStart(2, '0') },
    ...(item.children || []).map((child) => ({ ...child, depth: 1 })),
  ])
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
  <div class="container-main max-w-5xl">
    <!-- Slim persistent strip: only the marquee's UNIQUE value — status
         + the live-project CTA. Year/tech/date live once, in the sidebar
         PROJECT INFO (no longer duplicated here). Hidden entirely if
         there's nothing unique. -->
    <!-- sticky (not fixed): starts in-flow below the site nav so it never
         covers the nav's tap targets, then pins to the top on scroll. The bar
         is dark in BOTH modes, so the text is always light — the old
         text-zinc-800 light-mode value was ~1.1:1 against zinc-900. -->
    <div
      v-if="
        project &&
        (project.metadata?.state ||
          project.metadata?.url ||
          project.metadata?.['ai-involvement'])
      "
      class="sticky top-0 z-40 bg-zinc-900/90 backdrop-blur-sm rounded-b print:hidden"
    >
      <div
        class="flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-4 py-2 font-mono text-3xs sm:text-2xs text-zinc-100 uppercase tracking-wider"
      >
        <span v-if="project.metadata?.state" class="whitespace-nowrap">
          {{ project.metadata.state }}
        </span>
        <!-- ai-involvement disclosure, verbatim from frontmatter. Readers
             can smell robot work — say it plainly, don't let them wonder. -->
        <template v-if="project.metadata?.['ai-involvement']">
          <span v-if="project.metadata?.state" class="text-zinc-500">·</span>
          <span class="whitespace-nowrap text-zinc-400">
            {{ project.metadata['ai-involvement'] }}
          </span>
        </template>
        <span
          v-if="
            (project.metadata?.state || project.metadata?.['ai-involvement']) &&
            project.metadata?.url
          "
          class="text-zinc-500"
        >
          ·
        </span>
        <a
          v-if="project.metadata?.url"
          :href="project.metadata.url"
          target="_blank"
          rel="noopener noreferrer"
          class="whitespace-nowrap hover:text-zinc-300 transition-colors"
        >
          view project ↗
        </a>
      </div>
    </div>

    <article v-if="project" class="pt-8 md:pt-16">
      <h1
        class="text-4xl md:text-5xl font-serif font-light tracking-tight leading-tight mb-6"
      >
        {{ title }}
      </h1>
      <BlogPostContent :content="project.html" class="project-content" />

      <!-- Back link -->
      <div class="mt-12 pt-6">
        <NuxtLink to="/projects" class="back-link">← Back to Projects</NuxtLink>
      </div>
    </article>

    <!-- Metadata and TOC for sidebar -->
    <ClientOnly>
      <teleport v-if="tocTarget" to="#nav-toc-container">
        <div class="space-y-4">
          <!-- Project Metadata -->
          <div class="space-y-2">
            <h3 class="label-uppercase-mono text-2xs mb-2">Project Info</h3>

            <!-- Date -->
            <div v-if="project.metadata?.date" class="text-2xs">
              <div class="metadata-label">Date</div>
              <time class="tabular-nums text-zinc-900 dark:text-zinc-100">
                {{ formatLongDate(project.metadata.date) }}
              </time>
            </div>

            <!-- Tech Stack -->
            <div v-if="project.metadata?.tech?.length" class="text-2xs">
              <div class="metadata-label">Tech</div>
              <div class="flex flex-wrap gap-0.5">
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
            <div v-if="project.metadata?.github" class="text-2xs">
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

          <!-- Support Links -->
          <UiSupportLinks />

          <!-- TOC -->
          <div v-if="tocChildren.length > 0" class="toc">
            <h3 class="label-uppercase-mono text-xs mb-4">Contents</h3>
            <div class="pl-0 relative">
              <ul class="space-y-0">
                <li
                  v-for="child in tocChildren"
                  :key="child.slug"
                  :class="['group relative', child.depth ? 'pl-6' : '']"
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
                      {{ child.number || '' }}
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
                      {{ child.text }}
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

<style>
/* Project page: wide images, prose-width text.
   NOTE: this is an UNSCOPED <style> block, so Vue does NOT process :deep() —
   using it here silently voided the text-measure rule and let paragraphs run
   the full container width. Plain descendant selectors are correct: the
   content is global v-html, and BlogPostContent merges `project-content` onto
   its <article> root, so `.project-content p` targets the real paragraphs. */
.project-content p,
.project-content ul,
.project-content ol,
.project-content blockquote,
.project-content h2,
.project-content h3,
.project-content h4 {
  @apply max-w-prose;
}

.project-content figure {
  @apply max-w-none w-full mb-8;
}

.project-content img {
  @apply max-w-none w-full rounded;
  transform: none !important;
}

.project-content figcaption {
  @apply text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-mono;
}
</style>

<style scoped>
.back-link {
  @apply text-sm text-zinc-600 dark:text-zinc-400;
}

.metadata-label {
  @apply text-zinc-500 dark:text-zinc-500 text-2xs;
  @apply uppercase tracking-wider mb-1;
}

.tech-badge {
  @apply font-mono text-2xs px-1 py-0.5 rounded;
  @apply bg-zinc-100 dark:bg-surface text-zinc-700 dark:text-zinc-300;
}

.github-link {
  @apply text-zinc-900 dark:text-zinc-100;
  @apply hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors;
}

.toc-link {
  @apply flex items-baseline text-xs transition-all duration-200;
  @apply no-underline py-1 gap-2;
}

.toc-number {
  @apply font-mono text-xs tabular-nums w-4 text-right flex-shrink-0;
}
</style>
