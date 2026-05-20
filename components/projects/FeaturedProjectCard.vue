<!--
  @file FeaturedProjectCard.vue
  @description Featured project card with image extraction and full HTML content display
  @props project: Object - Project with title, html, metadata
  @props index: number - Card index
-->
<template>
  <NuxtLink
    :to="`/projects/${projectSlug}`"
    :class="[
      'interactive-card block no-underline group',
      'text-zinc-900 dark:text-zinc-100',
    ]"
  >
    <div
      v-if="project.metadata?.client || project.metadata?.industry"
      class="flex flex-wrap gap-3 mb-3 font-mono text-xs"
    >
      <span
        v-if="project.metadata?.client"
        class="text-zinc-500 uppercase tracking-wider"
      >
        {{ project.metadata.client }}
      </span>
      <span v-if="project.metadata?.industry" class="text-zinc-400">
        {{
          Array.isArray(project.metadata.industry)
            ? project.metadata.industry.join(' · ')
            : project.metadata.industry
        }}
      </span>
    </div>
    <div v-if="featuredImage" class="mb-4">
      <img
        :src="featuredImage"
        :alt="projectTitle"
        class="w-full h-auto rounded"
      />
    </div>
    <h3 class="text-xl font-serif mb-2">{{ projectTitle }}</h3>
    <p v-if="excerpt" class="text-sm text-zinc-600 dark:text-zinc-400">
      {{ excerpt }}
    </p>
  </NuxtLink>
</template>

<script setup>
const props = defineProps({
  project: { type: Object, required: true },
  index: { type: Number, required: true },
})

const projectSlug = computed(
  () => props.project.slug?.replace(/^projects\//, '') || ''
)

const projectTitle = computed(
  () => props.project.title || props.project.metadata?.title || ''
)

const featuredImage = computed(() => {
  if (!props.project.html) return null
  const imgMatch = props.project.html.match(/<img[^>]+src="([^"]+)"/)
  return imgMatch ? imgMatch[1] : null
})

const excerpt = computed(() => {
  if (!props.project.html) return null
  const text = props.project.html
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > 200 ? text.substring(0, 200) + '…' : text
})
</script>
