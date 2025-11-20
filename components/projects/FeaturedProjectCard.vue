<template>
  <NuxtLink
    :to="`/projects/${projectSlug}`"
    class="block no-underline text-zinc-900 dark:text-zinc-100 group"
  >
    <div v-if="featuredImage" class="mb-4">
      <img
        :src="featuredImage"
        :alt="projectTitle"
        class="w-full h-auto rounded"
      />
    </div>
    <div class="prose dark:prose-invert max-w-none" v-html="projectContent" />
  </NuxtLink>
</template>

<script setup>
const props = defineProps({
  project: { type: Object, required: true },
  index: { type: Number, required: true }
})

const { getSlug } = useProjectSlug()

const projectSlug = computed(() => getSlug(props.project))

const projectTitle = computed(
  () => props.project.title || props.project.metadata?.title || ''
)

const featuredImage = computed(() => {
  if (!props.project.html) return null
  const imgMatch = props.project.html.match(/<img[^>]+src="([^"]+)"/)
  return imgMatch ? imgMatch[1] : null
})

const projectContent = computed(() => {
  if (!props.project.html) return ''
  if (featuredImage.value) {
    return props.project.html.replace(/<img[^>]*>/, '')
  }
  return props.project.html
})
</script>
