<script setup>
import { format, getYear, compareDesc, parseISO } from 'date-fns'

// Add robot posts to our data fetching
const processedMarkdown = useProcessedMarkdown()
const { data: posts } = await useAsyncData('posts', () => processedMarkdown.getAllPosts())
const { data: robotPosts } = await useAsyncData('robot-posts', () => processedMarkdown.getRobotNotes())

// Add debug logging
console.log('Content counts:', {
  regular: posts.value?.length || 0,
  robots: robotPosts.value?.length || 0
})

console.log('🤖 Robot Notes Details')
console.log('Raw robot notes:', robotPosts.value)

if (!robotPosts.value?.length) {
  console.log('❌ No robot notes found!')
} else {
  console.log('✅ Found robot notes:', robotPosts.value.map(p => p.slug))
}

// Helper to safely parse dates
const parseDate = (date) => {
  try {
    return typeof date === 'string' ? parseISO(date) : new Date(date)
  } catch (e) {
    console.error('Error parsing date:', date, e)
    return new Date()
  }
}

// Group posts by year
const postsByYear = computed(() => {
  // Use a Map to maintain insertion order
  const sortedPosts = new Map()
  
  // Combine all posts with proper date handling
  const allPosts = [
    ...(posts.value?.map(post => ({
      ...post,
      date: post.metadata?.date || post.date,
      isRobot: false
    })) || []),
    ...(robotPosts.value?.map(post => ({
      ...post,
      date: post.metadata?.date || post.date,
      isRobot: true
    })) || [])
  ]

  console.log('Combined posts:', allPosts.map(p => ({
    title: p.title,
    date: p.date,
    year: getYear(parseDate(p.date))
  })))

  // First group by year
  const years = {}
  allPosts.forEach(post => {
    const year = getYear(parseDate(post.date))
    if (!years[year]) years[year] = []
    years[year].push(post)
  })

  // Sort posts within each year
  Object.keys(years).forEach(year => {
    years[year].sort((a, b) => compareDesc(parseDate(a.date), parseDate(b.date)))
  })

  // Get years and sort them in descending order
  const sortedYears = Object.keys(years)
    .map(Number)
    .sort((a, b) => b - a)

  console.log('Sorted years:', sortedYears)

  // Build final Map in sorted order
  sortedYears.forEach(year => {
    sortedPosts.set(year, years[year])
  })

  // Convert Map to plain object
  return Object.fromEntries(sortedPosts)
})
</script>

<template>
  <div class="container mx-auto px-4 py-12">
    <div v-for="(posts, year) in postsByYear" :key="year" class="mb-12">
      <h2 class="text-4xl font-bold mb-8">{{ year }}</h2>
      <div class="space-y-8">
        <div v-for="post in posts" :key="post.slug" 
          class="p-4 rounded-lg transition-colors duration-200"
          :class="[
            post.isRobot ? 'bg-orange-50 dark:bg-orange-900/20' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
          ]"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <NuxtLink 
                :to="post.isRobot ? `/blog/robots/${post.slug}` : `/blog/${post.slug}`"
                class="group"
              >
                <h3 class="text-2xl font-bold mb-2 group-hover:text-blue-500 dark:group-hover:text-blue-400">
                  {{ post.title }}
                  <span v-if="post.isRobot" class="inline-flex items-center ml-2">
                    <UIcon name="i-majesticons-robot" class="w-5 h-5" />
                  </span>
                </h3>
                <p v-if="post.description" class="text-zinc-600 dark:text-zinc-400">
                  {{ post.description }}
                </p>
              </NuxtLink>
              
              <div class="mt-4 flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                <span>{{ format(parseDate(post.date), 'MMM d, yyyy') }}</span>
                <span>{{ post.metadata?.words?.toLocaleString() }} words</span>
                <span v-if="post.metadata?.images">{{ post.metadata.images }} images</span>
                <span v-if="post.metadata?.links">{{ post.metadata.links }} links</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template> 