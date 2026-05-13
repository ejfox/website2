<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-8 pb-32 gap-8">
    <!-- 3D Model Viewer (when scan available) -->
    <ClientOnly>
      <GearModelViewer
        v-if="data?.Scan_3D_URL?.trim()"
        :model-url="data.Scan_3D_URL"
        :height="'500px'"
        class="w-full max-w-2xl"
      />
    </ClientOnly>

    <!-- Main gear card -->
    <GearCard3D v-if="data" :gear-item="data" class="gear-card-entrance" />

    <!-- Not found state -->
    <div v-else class="text-center max-w-md mx-auto">
      <div class="text-6xl mb-8">⬟</div>
      <h1 class="text-3xl font-light text-zinc-900 dark:text-zinc-100 mb-4">
        Gear Not Found
      </h1>
      <p class="text-zinc-600 dark:text-zinc-400 mb-8">
        This gear item doesn't exist in our inventory.
      </p>
      <NuxtLink to="/gear" class="btn-primary">← Browse All Gear</NuxtLink>
    </div>

    <!-- Related blog posts -->
    <div
      v-if="relatedPosts?.length"
      class="w-full max-w-sm border-t border-zinc-200 dark:border-zinc-800 pt-6"
    >
      <div class="label-uppercase mb-4 text-zinc-400 dark:text-zinc-600">
        Written About This
      </div>
      <ul class="flex flex-col gap-4">
        <li
          v-for="post in relatedPosts"
          :key="post.slug"
          class="flex flex-col gap-0.5"
        >
          <NuxtLink
            :to="`/blog/${post.slug}`"
            class="font-mono text-xs text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors leading-snug"
          >
            {{ post.title }}
          </NuxtLink>
          <div class="flex items-center gap-2">
            <span
              v-if="post.date"
              class="font-mono text-3xs text-zinc-400 dark:text-zinc-600 tabular-nums"
            >
              {{ formatPostDate(post.date) }}
            </span>
            <span
              v-if="post.dek"
              class="font-mono text-3xs text-zinc-500 dark:text-zinc-500 leading-snug"
            >
              {{ post.dek }}
            </span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
const formatPostDate = (dateStr?: string) => {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

const route = useRoute()
const { data, error } = await useFetch(
  `/api/gear/${route.params.slug}`
)

const { data: relatedPosts } = await useFetch(
  `/api/gear-posts/${route.params.slug}`,
  { default: () => [] }
)

// Handle errors properly
if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 500,
    statusMessage: error.value.statusMessage || 'Failed to load gear',
  })
}

// SEO the Nuxt way - reactive and clean
usePageSeo({
  title: computed(() =>
    data.value ? `${data.value.Name} - Gear` : 'Loading... - Gear'
  ),
  description: computed(() => {
    if (!data.value) return 'Loading gear item...'
    const weight =
      data.value['Base Weight ()'] ||
      data.value['Loaded Weight ()'] ||
      'Unknown weight'
    return `${data.value.Name} - ${data.value.Type} gear (${weight}g). ${data.value.Notes || ''}`
  }),
  type: 'article',
  section: 'Gear',
  tags: computed(() => [data.value?.Type || 'Gear']),
  label1: 'Weight',
  data1: computed(() => {
    if (!data.value) return 'Unknown'
    return (
      data.value['Base Weight ()'] ||
      data.value['Loaded Weight ()'] ||
      'Unknown'
    )
  }),
  label2: 'Category',
  data2: computed(() => data.value?.Type || 'Gear'),
})

const gearItemSchema = computed(() => {
  if (!data.value) return null
  const weight =
    data.value['Base Weight ()'] || data.value['Loaded Weight ()'] || undefined

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.value.Name,
    category: data.value.Type,
    description: data.value.Notes || `${data.value.Name} (${data.value.Type})`,
    weight: weight
      ? {
          '@type': 'QuantitativeValue',
          value: Number(weight),
          unitCode: 'GRM',
        }
      : undefined,
    url: `https://ejfox.com/gear/${route.params.slug}`,
  }
})

useHead(() => ({
  script: gearItemSchema.value
    ? [
        {
          type: 'application/ld+json',
          children: JSON.stringify(gearItemSchema.value),
        },
      ]
    : [],
}))

// Page transitions
definePageMeta({
  pageTransition: {
    name: 'gear-slide',
    mode: 'default',
    duration: 600,
  },
})
</script>

<style scoped>
/* Primary button - used in not-found state */
.btn-primary {
  @apply inline-flex items-center px-4 py-2 font-mono text-xs uppercase tracking-wider
         border border-zinc-300 dark:border-zinc-600
         text-zinc-700 dark:text-zinc-300
         hover:bg-zinc-100 dark:hover:bg-zinc-800
         transition-colors duration-150 no-underline rounded-sm;
}

/* BLOODHOUND FIX: Gear card now visible immediately - no animation */
.gear-card-entrance {
  opacity: 1;
  transform: none;
}

/* Page transitions */
.gear-slide-enter-active,
.gear-slide-leave-active {
  position: absolute;
  width: 100%;
  height: calc(100vh - 120px);
  top: 0;
  left: 0;
  z-index: 1;
  overflow: hidden;
}

.gear-slide-enter-from {
  transform: perspective(1500px) translateX(120%) rotateY(65deg) rotateX(-20deg)
    scale(0.8) translateZ(-150px);
  opacity: 0.3;
  filter: blur(1.5px) brightness(0.7);
}

.gear-slide-leave-to {
  transform: perspective(1500px) translateX(-120%) rotateY(-65deg)
    rotateX(20deg) scale(1.2) translateZ(150px);
  opacity: 0.2;
  filter: blur(1.5px) brightness(1.3);
}

.gear-slide-enter-active {
  transition: all 600ms cubic-bezier(0.23, 1, 0.32, 1);
  z-index: 2;
}

.gear-slide-leave-active {
  transition: all 600ms cubic-bezier(0.55, 0.085, 0.68, 0.53);
  z-index: 1;
}
</style>
