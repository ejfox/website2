<template>
  <NuxtLink :to="`/projects/${projectSlug}`" :class="cardClasses">
    <h3 class="text-lg font-serif text-zinc-900 dark:text-zinc-100 mb-2">
      {{ projectTitle }}
    </h3>

    <p
      v-if="excerpt"
      class="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-2"
    >
      {{ excerpt }}
    </p>

    <div class="mt-auto space-y-2 text-xs text-zinc-500">
      <time class="block tabular-nums">
        {{ formatYearOnly(project.metadata?.date || project.date) }}
      </time>

      <div
        v-if="project.metadata?.tech?.length"
        class="flex flex-wrap gap-2 font-mono uppercase"
      >
        <span v-for="tech in project.metadata.tech.slice(0, 3)" :key="tech">{{
          tech
        }}</span>
        <span v-if="project.metadata.tech.length > 3"
          >+{{ project.metadata.tech.length - 3 }}</span
        >
      </div>

      <a
        v-if="project.metadata?.github"
        :href="project.metadata.github"
        target="_blank"
        class="inline-block hover:text-zinc-900 dark:hover:text-zinc-100"
        @click.stop
      >
        GitHub ↗
      </a>
    </div>
  </NuxtLink>
</template>

<script setup>
const props = defineProps({
  project: { type: Object, required: true }
})

const { formatYearOnly } = useDateFormat()
const { getSlug } = useProjectSlug()

const cardClasses = computed(() =>
  [
    'block',
    'p-5',
    'rounded',
    'border',
    'border-zinc-200',
    'dark:border-zinc-800',
    'bg-white',
    'dark:bg-zinc-950',
    'hover:border-zinc-400',
    'dark:hover:border-zinc-600',
    'transition-colors',
    'no-underline',
    'min-h-[180px]',
    'flex',
    'flex-col'
  ].join(' ')
)

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
</script>
