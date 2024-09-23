<script setup>
const processedMarkdown = useProcessedMarkdown()

const { params } = useRoute()
const { data: post } = await useAsyncData(
  `post-${params.slug}`,
  () => $fetch(`/api/posts/${params.slug}`)
)

useSeoMeta({
  title: post.value?.title,
  description: post.value?.description,
  // Add more meta tags as needed
})

const route = useRoute()

const { data: nextPrevPosts } = await useAsyncData(`next-prev-${route.params.slug.join('-')}`, () =>
  processedMarkdown.getNextPrevPosts(route.params.slug.join('/'))
)
</script>

<template>
  <div>
    <article v-if="post">
      <h1 v-if="post?.title" class="text-4xl lg:text-8xl font-bold paddings max-w-screen-lg">{{ post?.title }}</h1>
      <!-- <pre>{{ JSON.stringify(post, null, 2) }}</pre> -->
      <PostMetadata :doc="post" 
      class="paddings"
      />
      <article v-html="post.content"
        class="prose-lg md:prose-xl dark:prose-invert prose-pre:bg-gray-100 dark:prose-pre:bg-zinc-950 prose-pre:leading-8 prose-pre:py-2 prose-pre:my-4 lg:prose-pre:my-6 paddings !max-w-none">

      </article>
      <div></div>



    </article>
    <div class="flex justify-between items-center mt-8 w-full p-4 md:p-8" v-if="nextPrevPosts">
      <div class="w-1/5 pr-2">
        <NuxtLink v-if="nextPrevPosts.next" :to="`/blog/${nextPrevPosts.next.slug}`"
          class="block text-left decoration-none hover:underline">
          <span class="block text-sm text-gray-500">Previous</span>
          ← {{ nextPrevPosts.next?.title }}
        </NuxtLink>
      </div>
      <div class="w-1/5 pl-2 text-right">
        <NuxtLink v-if="nextPrevPosts.prev" :to="`/blog/${nextPrevPosts.prev.slug}`"
          class="block text-right decoration-none hover:underline">
          <span class="block text-sm text-gray-500">Next</span>
          {{ nextPrevPosts.prev?.title }} →
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
<style>
.paddings {
  @apply p-4 md:p-8 lg:p-16 xl:p-32;
}

pre [data-line] {
  padding: 0 1rem;
}

pre {
  overflow: auto;
}

code[data-theme*=" "],
code[data-theme*=" "] span {
  color: var(--shiki-light);
  background-color: var(--shiki-light-bg);
}

pre code[data-line-numbers] {
  counter-reset: line;
}

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

pre code[data-line-numbers],
pre code[data-line-numbers]>[data-line]::before {
  display: inline-block !important;
  visibility: visible !important;
}

/* Adjust width based on number of digits */
code[data-line-numbers-max-digits="2"]>[data-line]::before {
  width: 2rem;
}

code[data-line-numbers-max-digits="3"]>[data-line]::before {
  width: 2.5rem;
}

code[data-line-numbers-max-digits="4"]>[data-line]::before {
  width: 3rem;
}
</style>