<!--
  @file BentoProjectCard.vue
  @description Bento-style project card with metadata, tech stack, and dense statistics display
  @props project: Object - Project with title, metadata (date, tech), html content, stats
  @props index: number - Card index for stagger animation
-->
<template>
  <NuxtLink
    :to="`/projects/${projectSlug}`"
    :style="{ transform: cardTransform }"
    class="interactive-card block p-4 no-underline min-h-[180px] flex flex-col"
  >
    <div
      v-if="project.metadata?.client"
      class="font-mono text-xs text-zinc-500 uppercase tracking-wide mb-1"
    >
      {{ project.metadata.client }}
    </div>
    <h3 class="text-lg font-serif text-zinc-900 dark:text-zinc-100 mb-2">
      {{ projectTitle }}
    </h3>

    <p
      v-if="excerpt"
      class="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-2"
    >
      {{ excerpt }}
    </p>

    <div class="mt-auto space-y-2">
      <!-- Dense metadata display - maximalist approach -->
      <div
        class="flex flex-wrap gap-x-3 gap-y-1 text-xs font-mono text-zinc-500"
      >
        <time class="tabular-nums text-zinc-900 dark:text-zinc-100">
          {{ formatYearOnly(project.metadata?.date || project.date) }}
        </time>
        <span v-if="wordCount">{{ wordCount }}w</span>
        <span v-if="charCount">{{ charCount }}c</span>
        <span v-if="readingMinutes">{{ readingMinutes }}min</span>
        <span v-if="imageCount">{{ imageCount }}img</span>
        <span v-if="linkCount">{{ linkCount }}links</span>
        <span v-if="techCount">{{ techCount }}tech</span>
      </div>

      <div
        v-if="project.metadata?.tech?.length"
        class="flex flex-wrap gap-2 text-xs font-mono uppercase text-zinc-400"
      >
        <span v-for="tech in project.metadata.tech.slice(0, 3)" :key="tech">
          {{ tech }}
        </span>
        <span v-if="project.metadata.tech.length > 3">
          +{{ project.metadata.tech.length - 3 }}
        </span>
      </div>

      <a
        v-if="project.metadata?.github"
        :href="project.metadata.github"
        target="_blank"
        class="inline-block text-xs text-zinc-500"
        @click.stop
      >
        GitHub ↗
      </a>
    </div>
  </NuxtLink>
</template>

<script setup>
const props = defineProps({
  project: { type: Object, required: true },
})

const { formatYearOnly } = useDateFormat()
const { getSlug } = useProjectSlug()

const projectSlug = computed(() => getSlug(props.project))

const projectTitle = computed(
  () => props.project.title || props.project.metadata?.title || 'Untitled'
)

const excerpt = computed(() => {
  if (!props.project.html) return null
  const text = props.project.html
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > 120 ? text.substring(0, 120) + '…' : text
})

// Seed-based consistent rotation for organic feel
const seededRotation = computed(() => {
  const seed = projectTitle.value
    .split('')
    .reduce((a, b) => a + b.charCodeAt(0), 0)
  return ((seed % 7) - 3) * 0.4 // -1.2deg to +1.2deg
})

const cardTransform = computed(() => `rotate(${seededRotation.value}deg)`)

// Dense metadata extraction - maximalist data display
const wordCount = computed(() => {
  if (!props.project.html) return 0
  const text = props.project.html.replace(/<[^>]*>/g, '').trim()
  return text.split(/\s+/).filter((w) => w.length > 0).length
})

const charCount = computed(() => {
  if (!props.project.html) return 0
  return props.project.html.replace(/<[^>]*>/g, '').replace(/\s+/g, '').length
})

const imageCount = computed(() => {
  if (!props.project.html) return 0
  return (props.project.html.match(/<img/g) || []).length
})

const linkCount = computed(() => {
  if (!props.project.html) return 0
  return (props.project.html.match(/<a /g) || []).length
})

const readingMinutes = computed(() => {
  if (!wordCount.value) return 0
  return Math.max(1, Math.ceil(wordCount.value / 200))
})

const techCount = computed(() => props.project.metadata?.tech?.length || 0)
</script>
