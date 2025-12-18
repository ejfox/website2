<script setup>
// Lazy load calendar component for faster FCP
const NextAvailableSlot = defineAsyncComponent(
  () => import('~/components/NextAvailableSlot.vue')
)

const runtimeConfig = useRuntimeConfig()
const baseUrl = computed(
  () => runtimeConfig.public?.baseUrl || 'https://ejfox.com'
)

const homepageTitle = 'EJ Fox | Building newsroom-ready data experiences'
const homepageDescription =
  'Data visualization engineer and investigative journalist crafting interactive stories, newsroom tooling, and climate dashboards through room302.studio.'
const homepageOgImage = computed(
  () => new URL('/og-image.png', baseUrl.value).href
)

const featuredWork = [
  {
    name: 'Newsroom Data Tools',
    url: 'https://room302.studio',
    description:
      'Custom analysis and visualization platforms for modern journalism.',
  },
  {
    name: 'Climate Data Platform',
    url: 'https://room302.studio',
    description:
      'Interactive exploration tools for environmental policy research.',
  },
  {
    name: 'Urban Analytics Dashboard',
    url: 'https://room302.studio',
    description:
      'Real-time visualization systems for city planning and governance.',
  },
]

const homepageSchema = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'EJ Fox',
  url: baseUrl.value,
  description: homepageDescription,
  inLanguage: 'en-US',
  publisher: {
    '@type': 'Person',
    name: 'EJ Fox',
    url: baseUrl.value,
  },
  about: {
    '@type': 'Thing',
    name: 'Data visualization, investigative journalism, newsroom tooling',
  },
  hasPart: featuredWork.map((item, index) => ({
    '@type': 'CreativeWork',
    position: index + 1,
    name: item.name,
    url: item.url,
    description: item.description,
  })),
}))

const { getPostBySlug, getAllPosts: _getAllPosts } = useProcessedMarkdown()

const { data: indexContent, pending: _indexPending } = await useAsyncData(
  'index-content',
  () => getPostBySlug('index')
)

// Mount dynamic calendar component into placeholder
const calendarSlotMounted = ref(false)

onMounted(() => {
  nextTick(() => {
    const placeholder = document.querySelector('#next-available-spot')
    if (placeholder) {
      calendarSlotMounted.value = true
    }
  })
})

// SEO and performance optimization
useSeoMeta(() => ({
  title: homepageTitle,
  description: homepageDescription,
  ogTitle: homepageTitle,
  ogDescription: homepageDescription,
  ogUrl: baseUrl.value,
  ogType: 'website',
  ogImage: homepageOgImage.value,
  ogImageWidth: '1200',
  ogImageHeight: '630',
  ogImageAlt: 'Data visualization and storytelling work by EJ Fox',
  twitterCard: 'summary_large_image',
  twitterTitle: homepageTitle,
  twitterDescription: homepageDescription,
  twitterImage: homepageOgImage.value,
  twitterImageAlt: 'Data visualization and storytelling work by EJ Fox',
}))

useHead({
  link: [{ key: 'canonical', rel: 'canonical', href: baseUrl.value }],
  script: [
    {
      key: 'schema-homepage',
      type: 'application/ld+json',
      children: JSON.stringify(homepageSchema.value),
    },
  ],
})
</script>

<template>
  <main class="container-main h-card pt-8">
    <!-- Content -->
    <div style="max-width: 65ch">
      <template v-if="indexContent">
        <!-- Data overlay -->
        <div class="mono-xs text-secondary mb-4 tabular">
          <span>INDEX</span>
          <span class="mx-2 text-divider">·</span>
          <span>{{ new Date().toISOString().split('T')[0] }}</span>
          <span class="mx-2 text-divider">·</span>
          <span>
            {{
              indexContent?.html?.length
                ? (indexContent.html.length / 1024).toFixed(1) + 'KB'
                : '0KB'
            }}
          </span>
        </div>
        <h1
          class="font-serif text-4xl md:text-6xl font-light section-spacing-lg"
        >
          {{ indexContent.title }}
        </h1>
        <!-- Server-only island - no hydration needed for static content -->
        <StaticContent
          :html="indexContent.html"
          class="font-serif prose prose-zinc dark:prose-invert max-w-none"
          id="index-content"
        />
      </template>
    </div>

    <!-- Teleport dynamic calendar slot into markdown placeholder -->
    <teleport v-if="calendarSlotMounted" to="#next-available-spot">
      <NextAvailableSlot />
    </teleport>
  </main>
</template>

<style scoped>
#index h1 {
  display: none;
}

:deep(#index-content) {
  @apply text-lg leading-relaxed;
}

:deep(#index-content p) {
  @apply mb-4;
}

:deep(#index-content h2) {
  @apply font-serif text-2xl font-normal mt-8 mb-4;
}

:deep(#index-content h3) {
  @apply font-serif text-xl font-normal mt-8 mb-4;
}

:deep(#index-content ul) {
  @apply list-disc pl-8 my-4;
}

:deep(#index-content li) {
  @apply mb-2;
}

:deep(#index-content strong) {
  @apply font-medium text-zinc-900 dark:text-zinc-100;
}

:deep(#index-content code) {
  @apply font-mono text-sm;
}
</style>
