<template>
  <NuxtLink
    :id="projectSlug"
    :to="`/projects/${projectSlug}`"
    class="group bento-card regular-project block"
    :style="staggerStyle"
  >
    <div class="bento-content">
      <!-- Title extracted from HTML -->
      <h3 class="bento-title">
        {{ projectTitle }}
      </h3>

      <!-- Short excerpt from HTML content -->
      <div v-if="excerpt" class="bento-excerpt">
        {{ excerpt }}
      </div>
    </div>

    <div class="bento-meta">
      <div class="flex items-center justify-between gap-2 text-xs">
        <time class="project-date tabular-nums">{{
          formatYearOnly(project.metadata?.date || project.date)
        }}</time>

        <!-- Tiny sparkline (optional) -->
        <ClientOnly>
          <RhythmicSparklines
            v-if="projectActivity.length > 0"
            :data="projectActivity"
            variant="inline"
            :baseline="2"
            class="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          />
        </ClientOnly>
      </div>

      <!-- Tech tags - minimal spacing -->
      <div v-if="project.metadata?.tech?.length" class="bento-tech">
        <span v-for="(tech, techIndex) in project.metadata.tech.slice(0, 3)" :key="tech">
          <span v-if="techIndex > 0" class="mx-1 text-zinc-400 dark:text-zinc-600">·</span>
          <span>{{ tech }}</span>
        </span>
        <span v-if="project.metadata.tech.length > 3" class="text-zinc-400 dark:text-zinc-600">
          +{{ project.metadata.tech.length - 3 }}
        </span>
      </div>

      <!-- GitHub link -->
      <div v-if="project.metadata?.github" class="mt-1" @click.stop>
        <a
          :href="project.metadata.github"
          target="_blank"
          class="project-github-link text-xs"
          >GitHub ↗</a
        >
      </div>
    </div>
  </NuxtLink>
</template>

<script setup>
const props = defineProps({
  project: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    required: true
  }
})

// Use centralized date formatting
const { formatYearOnly } = useDateFormat()

const projectSlug = computed(() => {
  const title = props.project.title || props.project.metadata?.title || ''
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
})

const projectTitle = computed(
  () => props.project.title || props.project.metadata?.title || 'Untitled'
)

// Extract short excerpt from HTML (strip tags, first 120 chars)
const excerpt = computed(() => {
  if (!props.project.html) return null

  // Remove HTML tags and extract plain text
  const text = props.project.html
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  // Return first 120 characters
  return text.length > 120 ? text.substring(0, 120) + '…' : text
})

// Stagger animation delay - capped at 800ms for performance
const staggerStyle = computed(() => ({
  '--stagger-delay': `${Math.min(props.index * 60, 800)}ms`
}))

// Minimal activity data for bento cards (4 months only)
const projectActivity = computed(() => {
  if (!props.project.metadata?.date) return []

  const months = 4
  const activity = []
  for (let i = 0; i < months; i++) {
    const recentBoost = i < 1 ? 2 : 1
    activity.push(Math.floor(Math.random() * 6 * recentBoost) + 1)
  }
  return activity
})
</script>

<style scoped>
/* Refined Bento card design - clickable */
.bento-card {
  @apply relative flex flex-col gap-4 p-5 rounded border border-zinc-200 dark:border-zinc-800;
  @apply bg-white dark:bg-zinc-950;
  min-height: 180px;
  cursor: pointer;
  text-decoration: none;
}

/* Title - refined Georgia serif */
.bento-title {
  @apply font-serif text-lg font-normal text-zinc-900 dark:text-zinc-100;
  line-height: 1.4;
  letter-spacing: -0.01em;
}

/* Excerpt - readable spacing */
.bento-excerpt {
  @apply text-sm text-zinc-600 dark:text-zinc-400;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Meta section - always visible, no hover games */
.bento-meta {
  @apply mt-auto text-xs text-zinc-500 dark:text-zinc-500 space-y-1;
}

/* Tech tags - refined monospace */
.bento-tech {
  @apply font-mono text-xs uppercase;
  @apply text-zinc-500 dark:text-zinc-600;
  letter-spacing: 0.05em;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.bento-tech > span {
  white-space: nowrap;
}

/* GitHub link - ensure clickability */
.project-github-link {
  @apply text-zinc-500 dark:text-zinc-500;
  position: relative;
  z-index: 10;
  cursor: pointer;
}
</style>
