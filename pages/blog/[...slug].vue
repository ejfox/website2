<script setup>
import { format, isValid, parseISO } from 'date-fns'

import { animate, stagger } from '~/anime.esm.js'
const processedMarkdown = useProcessedMarkdown()

// Extract route parameters
const { params } = useRoute()

// Fetch blog post data asynchronously based on slug parameter
const { data: post } = await useAsyncData(
  `post-${params.slug}`,
  () => $fetch(`/api/posts/${params.slug}`)
)

// Set up SEO meta tags for the page
useSeoMeta({
  title: post.value?.title,
  description: post.value?.description,
  // Add more meta tags as needed
})

// Fetch the next and previous posts for navigation
const route = useRoute()
const { data: nextPrevPosts } = await useAsyncData(
  `next-prev-${route.params.slug.join('-')}`,
  () => processedMarkdown.getNextPrevPosts(route.params.slug.join('/'))
)

// Reference to post content for DOM manipulation
const postContent = ref(null)

// Animate internal links in the post content when the component mounts
onMounted(() => {
  animate(postContent.value.querySelectorAll('.internal-link'), {
    // Use gentle border color transitions for a cyberpunk vibe
    borderColor: ['#67e8f9', '#c2410c', '#facc15', '#be185d'],
    duration: 65000,
    loop: true,
    alternate: true,
    delay: stagger(4500), // Stagger the animation delay
  })
})


function formatDate(date) {
  if (!date) return 'No date'

  let parsedDate

  if (typeof date === 'string') {
    parsedDate = parseISO(date)
  } else if (date instanceof Date) {
    parsedDate = date
  } else {
    return 'Invalid date'
  }

  if (!isValid(parsedDate)) return 'Invalid date'

  return format(parsedDate, 'MMMM d, yyyy')
}
</script>

<template>
  <div>
    <article v-if="post" class="pt-10 md:pt-8 md:pl-8">
      <!-- Metadata display for the post -->
      <PostMetadata :doc="post" class="paddings" />

      <!-- Post title container for responsive design -->
      <div class="lg:h-[62vh] flex items-center">
        <h1 v-if="post?.title" class="text-4xl lg:text-8xl xl:text-10xl font-bold w-full paddings-y pr-8 pl-4 md:pl-0">
          {{ post?.title }}
        </h1>
      </div>

      <!-- Render the main content of the post -->
      <article ref="postContent" v-html="post.content" class="prose-lg md:prose-xl dark:prose-invert 
  prose-headings:font-bold prose-headings:tracking-tight
  prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl
  prose-p:leading-7
  prose-a:text-blue-600 hover:prose-a:text-blue-500 dark:prose-a:text-blue-200 dark:hover:prose-a:text-blue-400 prose-a:underline transition-all duration-100 ease-in-out
  prose-strong:font-semibold
  prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:my-8
  prose-ul:list-disc prose-ol:list-decimal
  prose-li:my-2
  prose-img:rounded-lg prose-img:shadow-md
  prose-hr:border-gray-300 dark:prose-hr:border-gray-700
  prose-table:border-collapse prose-th:border prose-th:border-gray-300 dark:prose-th:border-gray-700 prose-th:px-3 prose-th:py-2 prose-td:border prose-td:border-gray-300 dark:prose-td:border-gray-700 prose-td:px-3 prose-td:py-2
  prose-pre:bg-white dark:prose-pre:bg-zinc-800
  !max-w-none">
      </article>

      <!-- Navigation between previous and next posts -->
      <div class="flex justify-between items-center mt-8 w-full p-4 md:p-8" v-if="nextPrevPosts">
        <!-- Previous post link -->
        <div class="w-1/3 pr-2">
          <NuxtLink v-if="nextPrevPosts.prev" :to="`/blog/${nextPrevPosts.prev.slug}`"
            class="block text-left decoration-none hover:underline">
            <span class="block text-sm text-gray-500">Previous</span>
            <span class="block text-sm text-gray-400">{{ formatDate(nextPrevPosts.prev.date) }}</span>
            ← {{ nextPrevPosts.prev?.title }}
          </NuxtLink>
        </div>

        <!-- Spacer -->
        <div class="w-1/3"></div>

        <!-- Next post link -->
        <div class="w-1/3 pl-2 text-right">
          <NuxtLink v-if="nextPrevPosts.next" :to="`/blog/${nextPrevPosts.next.slug}`"
            class="block text-right decoration-none hover:underline">
            <span class="block text-sm text-gray-500">Next</span>
            <span class="block text-sm text-gray-400">{{ formatDate(nextPrevPosts.next.date) }}</span>
            {{ nextPrevPosts.next?.title }} →
          </NuxtLink>
        </div>
      </div>
    </article>
  </div>
</template>

<style>
/* Utility classes for consistent padding across breakpoints */
.paddings {
  @apply p-4 md:p-8 lg:px-16 xl:px-32;
}

.paddings-y {
  @apply py-4 md:py-8 lg:py-16 xl:py-32;
}

/* Responsive and clean code block styling */
pre {
  overflow: auto;
}

/* Optional: Highlight line numbers in code blocks */
pre code[data-line-numbers]>[data-line]::before {
  counter-increment: line;
  content: counter(line) !important;
  display: inline-block !important;
  width: 1.5rem !important;
  margin-right: 1rem !important;
  text-align: right !important;
  color: #888 !important;
  position: relative;
  z-index: 1;
}

/* Responsive rounded images */
img {
  @apply rounded;
}

/* Constrain list item widths for better readability */
li {
  @apply max-w-[75ch];
}

/* Style for internal links with subtle hover animation */
.internal-link {
  @apply tracking-wide text-black dark:text-white border-b-2 hover:border-b-4 border-blue-600 hover:border-blue-500 dark:border-blue-200 dark:hover:border-blue-400 transition-all duration-200;
}
</style>
