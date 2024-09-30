<script setup>
import { animate, stagger } from '~/anime.esm.js'
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

const postContent = ref(null)

onMounted(() => {
  animate(postContent.value.querySelectorAll('.internal-link'), {
    // opacity: [1, 0.8, 1],
    // color: ['#67e8f9', '#c2410c', '#facc15', '#d946ef', '#be185d'],
    borderColor: ['#67e8f9', '#c2410c', '#facc15', '#be185d'],
    duration: 65000,
    // easing: 'easeInOutQuad',
    loop: true,
    alternate: true,
    delay: stagger(4500)
  })
})
</script>

<template>
  <div>
    <article v-if="post" class="pt-10 md:pt-8 md:pl-8">
      <PostMetadata :doc="post" class="paddings" />

      <div class="lg:h-[62vh] flex items-center">
        <h1 v-if="post?.title"
          class="text-4xl lg:text-8xl xl:text-10xl lg:text-balance font-bold w-full paddings-y pr-8 pl-4 md:pl-0">
          {{ post?.title }}
        </h1>
      </div>

      <!-- <pre>{{ JSON.stringify(post, null, 2) }}</pre> -->

      <article ref="postContent" v-html="post.content"
        class="prose-lg md:prose-xl dark:prose-invert prose-pre:bg-zinc-950  prose-pre:leading-8 prose-pre:py-2 prose-pre:my-4 lg:prose-pre:my-6 paddings !max-w-none prose-a:text-blue-600 hover:prose-a:text-blue-500 dark:prose-a:text-blue-200 dark:hover:prose-a:text-blue-400 prose-a:underline transition-all duration-100 ease-in-out">

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
  @apply p-4 md:p-8 lg:px-16 xl:px-32;
}

.paddings-y {
  @apply py-4 md:py-8 lg:py-16 xl:py-32;
}

.paddings-x {
  @apply px-4 md:px-8 lg:px-16 xl:px-32;
}

pre [data-line] {
  padding: 0 1rem;
}

pre {
  overflow: auto;
  /* @apply max-w-screen-xl; */
}

/* code[data-theme*=" "],
code[data-theme*=" "] span {
  color: var(--shiki-light);
  background-color: var(--shiki-light-bg);
} */

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

img {
  @apply rounded;
}

li {
  @apply max-w-[75ch];
}

.internal-link {

  text-decoration: none !important;
  /* simpler, gentler, cyberpunk-y version */
  /* background: linear-gradient(to right, #ff0080, #ff0000, #ffff00, #80ff00, #00ff80, #00ffff, #0000ff, #8000ff, #ff00ff);



  background-size: 200% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shine 2s linear infinite;

  @keyframes shine {
    to {
      background-position: 200% center;
    }
  } */

  /* double-underline with tailwind */
  @apply tracking-wide text-black dark:text-white border-b-2 hover:border-b-4 border-blue-600 hover:border-blue-500 dark:border-blue-200 dark:hover:border-blue-400 transition-all duration-200;
}
</style>