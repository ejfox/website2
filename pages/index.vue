<script setup>
const NextAvailableSlot = defineAsyncComponent(
  () => import('~/components/consulting/NextAvailableSlot.vue')
)

const { getPostBySlug } = useProcessedMarkdown()
const { revealContainer: homeReveal } = useScrollReveal({
  selector: ':scope > *',
  staggerDelay: 40,
  translateY: 6,
  duration: 250,
})

const { data: indexContent } = await useAsyncData('index-content', () =>
  getPostBySlug('index')
)

// Mount dynamic calendar component into placeholder rendered by v-html
const calendarSlotMounted = ref(false)
onMounted(() => {
  // Wait for v-html to render before teleporting into it
  nextTick(() => {
    if (document.querySelector('#next-available-spot')) {
      calendarSlotMounted.value = true
    }
  })
})

// SEO
const title = 'EJ Fox | Building newsroom-ready data experiences'
const description =
  'Data visualization engineer and investigative journalist crafting interactive stories, newsroom tooling, and climate dashboards through room302.studio.'

usePageSeo({
  title,
  description,
  type: 'website',
})
</script>

<template>
  <main class="container-main h-card pt-8">
    <div ref="homeReveal" style="max-width: 65ch">
      <template v-if="indexContent">
        <div class="mono-xs text-secondary mb-4 tabular">
          <span>INDEX</span>
          <span class="mx-2 text-divider">·</span>
          <span>{{ new Date().toISOString().split('T')[0] }}</span>
        </div>
        <h1
          class="font-serif text-4xl md:text-6xl font-light section-spacing-lg"
        >
          {{ indexContent.title }}
        </h1>
        <div
          id="index-content"
          class="font-serif prose prose-zinc dark:prose-invert max-w-none text-lg leading-relaxed"
          v-html="indexContent.html"
        />
      </template>
    </div>

    <teleport v-if="calendarSlotMounted" to="#next-available-spot">
      <NextAvailableSlot />
    </teleport>
  </main>
</template>

<style scoped>
:deep(#index-content h2) {
  @apply font-serif text-2xl font-normal mt-8 mb-4;
}

:deep(#index-content h3) {
  @apply font-serif text-xl font-normal mt-8 mb-4;
}
</style>
