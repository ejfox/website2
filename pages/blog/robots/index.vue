<!--
  @file blog/robots/index.vue
  @description /blog/robots: list of shared "robot notes" (AI-written or
    AI-assisted) with word counts and section badges. Data:
    useProcessedMarkdown().getRobotNotesWithContent(): manifest entries
    under robots/ with share: true, then one /api/robots/<slug> fetch per note
    (server/api/robots/[...slug].ts).
  Gotchas:
    - Matches the /blog/** prerender rule, but getBlogRoutes() (nuxt.helpers.ts)
      skips robots/, so it isn't in the prerender list.
    - Robot notes are a special section, kept out of getAllPosts() and /blog.
-->
<script setup>
const processedMarkdown = useProcessedMarkdown()
const { data: robotNotes } = await useAsyncData('robot-notes', () =>
  processedMarkdown.getRobotNotesWithContent()
)

// Helper to build robot link URLs
const robotsLinkUrl = (note, child) => {
  const slug = note.slug.replace('robots/', '')
  return `/blog/robots/${slug}#${child.slug}`
}

// Metadata styling
const metadataClass =
  'post-metadata text-sm text-zinc-500 dark:text-zinc-400 font-mono'

// Get all TOC headers for a note and calculate total word count
const getNoteSummary = (note) => {
  // Processed JSON stores the body as `html`; `content` is the older field.
  const body = note.html || note.content
  if (!body) return { headers: [], wordCount: 0 }

  // Get all headers from TOC
  const headers =
    note.toc?.flatMap(
      (item) =>
        item.children?.map((child) => ({
          text: child.text,
          slug: child.slug,
        })) || []
    ) || []

  // Calculate total word count
  const wordCount = body
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .trim()
    .split(/\s+/).length

  return { headers, wordCount }
}
</script>

<template>
  <div class="container mx-auto px-2 pt-8 lg:flex lg:gap-8 font-mono">
    <!-- Main Content -->
    <section class="lg:w-2/3">
      <div class="mb-8">
        <h1 class="text-3xl font-light">Robot Notes</h1>
        <p class="text-zinc-600 dark:text-zinc-400 mt-2">
          <a
            href="https://www.are.na/ej-fox/conversations-with-robots"
            target="_blank"
            class="text-hover"
          >
            Conversations with Robots </a
          >, notes from various AI models, projects, and experiments.
        </p>
      </div>

      <div
        v-for="note in robotNotes"
        :id="note.slug.replace('robots/', '')"
        :key="note.slug"
        class="border-b border-zinc-200 dark:border-zinc-700 py-4 my-8 xl:my-16"
      >
        <!-- Metadata row -->
        <div class="flex items-center justify-between mb-2">
          <div :class="metadataClass">
            {{ formatCompactDate(note.date) }}
          </div>
          <div
            v-if="getNoteSummary(note).wordCount"
            class="text-xs text-zinc-500 dark:text-zinc-600 font-mono"
          >
            {{ getNoteSummary(note).wordCount }} words
          </div>
        </div>

        <NuxtLink
          :to="`/blog/robots/${note.slug.replace('robots/', '')}`"
          class="group"
        >
          <h2 class="title-hover-subtle">
            {{ note.title }}
          </h2>
        </NuxtLink>

        <p
          v-if="note.description"
          class="text-zinc-600 dark:text-zinc-400 mt-2"
        >
          {{ note.description }}
        </p>

        <!-- TOC Preview -->
        <div v-if="note.toc?.length" class="mt-8 space-y-2">
          <div
            class="text-xs uppercase text-zinc-500 dark:text-zinc-400 font-mono"
          >
            Sections:
          </div>
          <div class="flex flex-wrap gap-4">
            <template v-for="section in note.toc" :key="section.slug">
              <template v-if="section.children?.length">
                <NuxtLink
                  v-for="child in section.children"
                  :key="child.slug"
                  :to="robotsLinkUrl(note, child)"
                  class="badge-link"
                >
                  {{ child.text }}
                </NuxtLink>
              </template>
            </template>
          </div>
        </div>

        <!-- Tags -->
        <div v-if="note.tags" class="mt-4 flex gap-2 flex-wrap">
          <span
            v-for="tag in note.tags"
            :key="tag"
            class="text-xs px-2 py-1 bg-raised rounded"
          >
            {{ tag }}
          </span>
        </div>
      </div>

      <div v-if="!robotNotes?.length" class="text-center py-8 text-zinc-500">
        No shared robot notes yet.
      </div>
    </section>
  </div>
</template>

<style scoped>
.sticky {
  position: sticky;
  top: 2rem;
}
</style>
