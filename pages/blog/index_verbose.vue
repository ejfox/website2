<script setup>
import { format } from 'date-fns'
const processedMarkdown = useProcessedMarkdown()

// Get ALL content types
const { data: allContent } = await useAsyncData('all-content', async () => {
  console.group('🤖 Fetching Content')
  
  // Fetch all content types
  const [
    posts,
    drafts,
    weekNotes,
    readingPosts,
    projectPosts,
    robotNotes,
    studyNotes,
    prompts
  ] = await Promise.all([
    processedMarkdown.getAllPosts(false, false),  // Regular posts
    processedMarkdown.getDrafts(),               // Drafts
    processedMarkdown.getWeekNotes(),            // Week Notes
    processedMarkdown.getReadingPosts(),         // Reading Notes
    processedMarkdown.getProjectPosts(),         // Projects
    processedMarkdown.getRobotNotesWithContent(), // Robot Notes (with all content)
    processedMarkdown.getStudyNotes(),           // Study Notes
    processedMarkdown.getPrompts()               // Prompts
  ])

  // Debug log each content type
  console.log('Content counts:', {
    posts: posts?.length,
    drafts: drafts?.length,
    weekNotes: weekNotes?.length,
    readingPosts: readingPosts?.length,
    projectPosts: projectPosts?.length,
    robotNotes: robotNotes?.length,
    studyNotes: studyNotes?.length,
    prompts: prompts?.length
  })

  // Detailed robot notes debug
  console.group('🤖 Robot Notes Details')
  console.log('Raw robot notes:', robotNotes)
  if (robotNotes?.length > 0) {
    console.table(robotNotes.map(p => ({
      slug: p.slug,
      title: p.metadata?.title || p.title,
      type: p.metadata?.type || p.type,
      date: p.metadata?.date || p.date,
      hidden: p.metadata?.hidden || p.hidden,
      share: p.metadata?.share || p.share
    })))
  } else {
    console.warn('❌ No robot notes found!')
  }
  console.groupEnd()

  // Combine all content
  const combined = [
    ...posts,
    ...drafts,
    ...weekNotes,
    ...readingPosts,
    ...projectPosts,
    ...robotNotes,
    ...studyNotes,
    ...prompts
  ]

  console.log('Total combined items:', combined.length)
  console.groupEnd()
  return combined
})

function formatDate(date) {
  // return format(new Date(date), 'MMMM dd, yyyy')
  // MMMM-YY-DD
  return format(new Date(date), 'yyyy-MM-dd')
}

// Group posts by year
function groupByYear(posts) {
  if (!posts) return {}
  return posts.reduce((acc, post) => {
    const year = new Date(post.metadata?.date || post.date).getFullYear()
    if (!acc[year]) acc[year] = []
    acc[year].push(post)
    return acc
  }, {})
}

// Enhanced type detection with logging
function getTypeInfo(post) {
  // Get base path without year prefix
  const pathParts = post.slug.split('/')
  const basePath = pathParts.length > 1 && /^\d{4}$/.test(pathParts[0])
    ? pathParts.slice(1).join('/')
    : post.slug

  // Debug type detection for robot posts
  if (basePath.startsWith('robots/')) {
    console.group(`🤖 Robot Post Type Detection: ${post.slug}`)
    console.log('Post data:', {
      slug: post.slug,
      basePath,
      metadataType: post.metadata?.type,
      rootType: post.type,
      hidden: post.metadata?.hidden || post.hidden,
      share: post.metadata?.share || post.share
    })
    console.groupEnd()
  }

  // Determine type from metadata or slug
  let type = post.metadata?.type || post.type

  // If no explicit type, infer from slug
  if (!type) {
    if (basePath.startsWith('week-notes/')) type = 'week-note'
    else if (basePath.startsWith('reading/')) type = 'reading'
    else if (basePath.startsWith('projects/')) type = 'project'
    else if (basePath.startsWith('robots/')) type = 'robot'
    else if (basePath.startsWith('prompts/')) type = 'prompt'
    else if (basePath.startsWith('study-notes/')) type = 'study'
    // Special cases for content types in year folders
    else if (post.metadata?.contentType === 'photo' || post.contentType === 'photo') type = 'photo'
    else if (post.metadata?.contentType === 'words' || post.contentType === 'words') type = 'words'
    else type = 'post'
  }

  // Color mapping
  const colors = {
    'week-note': 'text-purple-500',
    'prompt': 'text-blue-500',
    'reading': 'text-green-500',
    'project': 'text-yellow-500',
    'robot': 'text-cyan-500',
    'study': 'text-pink-500',
    'photo': 'text-orange-500',
    'words': 'text-indigo-500',
    'post': 'text-gray-400'
  }

  return {
    type,
    color: colors[type] || 'text-gray-400'
  }
}

// Add debug info for yearly grouping
const postsByYear = computed(() => {
  const grouped = groupByYear(allContent.value)
  
  // Log robot posts in each year group
  Object.entries(grouped).forEach(([year, posts]) => {
    const robotPosts = posts.filter(p => p.slug.startsWith('robots/'))
    if (robotPosts.length > 0) {
      console.log(`🤖 Robot posts in ${year}:`, robotPosts.map(p => p.slug))
    }
  })
  
  return grouped
})
</script>

<template>
  <div class="container mx-auto px-4 py-8 font-mono">
    <h2 class="text-xl mb-6">All Content ({{ allContent?.length || 0 }} items)</h2>
    <div v-for="(posts, year) in postsByYear" :key="`year-${year}`" class="mb-4">
      <h3 class="text-lg mb-2">{{ year }} ({{ posts.length }})</h3>
      <ul class="space-y-1">
        <li v-for="post in posts" :key="post.slug" 
            class="flex items-baseline gap-2 hover:bg-gray-50 dark:hover:bg-gray-900 p-1">
          <span class="text-gray-500 shrink-0">{{ formatDate(post.metadata?.date || post.date) }}</span>
          <span class="text-gray-400 shrink-0">/{{ post.slug.split('/')[0] }}/</span>
          <NuxtLink :to="`/blog/${post?.slug}`" class="hover:underline truncate">
            {{ post.metadata?.title || post.title || post.slug }}
          </NuxtLink>

          <!-- Status Indicators -->
          <span v-if="post.metadata?.draft || post.draft" 
                class="text-red-500 shrink-0">[draft]</span>
          <span v-if="post.metadata?.hidden || post.hidden" 
                class="text-orange-500 shrink-0">[hidden]</span>
          <span v-if="post.metadata?.inprogress" 
                class="text-yellow-500 shrink-0">[wip]</span>

          <!-- Type Badge -->
          <span v-if="getTypeInfo(post).type !== 'post'"
                :class="[getTypeInfo(post).color, 'shrink-0']">
            [{{ getTypeInfo(post).type }}]
          </span>

          <!-- Stats -->
          <span v-if="post.metadata?.words || post.wordCount" class="text-gray-400 shrink-0">
            ({{ post.metadata?.words || post.wordCount }} words)
          </span>
          <span v-if="post.metadata?.images > 0" class="text-gray-400 shrink-0">
            [{{ post.metadata?.images }} img]
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.font-mono {
  font-variant-ligatures: none;
}
</style>