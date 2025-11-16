<template>
  <NuxtLink
    :id="projectSlug"
    :to="`/projects/${projectSlug}`"
    class="group featured-project block"
    :class="layoutClass"
    :style="staggerStyle"
  >
    <!-- Hero Layout: Full width with large image -->
    <template v-if="layoutMode === 'hero'">
      <div v-if="featuredImage" class="featured-hero-image">
        <img :src="featuredImage" :alt="projectTitle" class="w-full h-auto" />
      </div>
      <div class="featured-hero-content">
        <div class="project-description" v-html="projectContent" />
      </div>
    </template>

    <!-- Asymmetric Grid Layout: 5/7 or 7/5 columns -->
    <template v-else>
      <div class="featured-grid-content">
        <div class="project-description" v-html="projectContent" />
      </div>
      <div v-if="featuredImage" class="featured-grid-visual">
        <img
          :src="featuredImage"
          :alt="projectTitle"
          class="w-full h-auto"
        />
      </div>
    </template>
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
  // Create a clean anchor slug from the project title
  const title = props.project.title || props.project.metadata?.title || ''
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
})

const projectTitle = computed(
  () => props.project.title || props.project.metadata?.title || ''
)

// Extract first image from HTML content for hero display
const featuredImage = computed(() => {
  if (!props.project.html) return null

  // Extract first img src from HTML
  const imgMatch = props.project.html.match(/<img[^>]+src="([^"]+)"/)
  return imgMatch ? imgMatch[1] : null
})

// Layout mode: first featured = hero, rest = asymmetric
const layoutMode = computed(() => {
  return props.index === 0 ? 'hero' : 'asymmetric'
})

// Layout classes for asymmetric grid (alternating 5/7 and 7/5)
const layoutClass = computed(() => {
  if (layoutMode.value === 'hero') {
    return 'featured-hero-layout'
  }

  // Alternate between left and right image placement
  const isEven = props.index % 2 === 0
  return isEven ? 'featured-asymmetric-left' : 'featured-asymmetric-right'
})

// Stagger animation delay - capped at 800ms for performance
const staggerStyle = computed(() => ({
  '--stagger-delay': `${Math.min(props.index * 100, 800)}ms`
}))

// Strip first image from HTML when we're displaying it separately
const projectContent = computed(() => {
  if (!props.project.html) return ''

  // If we have a featured image, remove the first img tag from HTML
  if (featuredImage.value) {
    return props.project.html.replace(/<img[^>]*>/, '')
  }

  return props.project.html
})

// Generate more substantial activity data for featured projects
const projectActivity = computed(() => {
  if (!props.project.metadata?.date) return []

  // Featured projects get 12 months of data (more detail)
  const months = 12
  const activity = []
  for (let i = 0; i < months; i++) {
    // Higher activity levels for featured projects
    const recentBoost = i < 3 ? 3 : 1.5
    activity.push(Math.floor(Math.random() * 10 * recentBoost) + 2)
  }
  return activity
})
</script>

<style scoped>
/* Clickable card - clean and minimal */
.featured-project {
  cursor: pointer;
  text-decoration: none;
  color: inherit;
}
</style>
