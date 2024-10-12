<script setup>
import { format, isValid, parseISO } from 'date-fns'
import { useRuntimeConfig } from '#app'
import { animate, stagger, onScroll, utils } from '~/anime.esm.js'

const config = useRuntimeConfig()
const isDark = useDark()
const processedMarkdown = useProcessedMarkdown()

const { params } = useRoute()
const { data: post } = await useAsyncData(`post-${params.slug}`, () =>
  $fetch(`/api/posts/${params.slug}`)
)

const route = useRoute()
const { data: nextPrevPosts } = await useAsyncData(
  `next-prev-${route.params.slug.join('-')}`,
  () => processedMarkdown.getNextPrevPosts(route.params.slug.join('/'))
)

// New refs for animation targets
const postTitle = ref(null)
const postMetadata = ref(null)
const postContent = ref(null)
const navigationLinks = ref(null)

onMounted(() => {
  // Animate title
  // animate(postTitle.value, {
  //   // opacity: [0, 1],
  //   translateY: [-20, 0],
  //   duration: 2800,
  //   easing: 'easeInOutQuad'
  // })

  // Animate metadata
  animate(postMetadata.value, {
    opacity: [0, 1],
    translateY: ['-10vh', 0],
    duration: 1200,
    delay: 200,
    easing: 'easeOutQuad'
  })

  // // Animate content
  // animate(postContent.value, {
  //   opacity: [0, 1],
  //   translateY: [20, 0],
  //   duration: 800,
  //   delay: 400,
  //   easing: 'easeOutQuad'
  // })

  // Animate internal links
  animate(postContent.value.querySelectorAll('.internal-link'), {
    borderColor: ['#67e8f9', '#c2410c', '#facc15', '#be185d'],
    duration: 65000,
    loop: true,
    alternate: true,
    delay: stagger(4500)
  })

  // all of the images
  // const allImages = postContent.value.querySelectorAll('img')
  // utils.set(allImages, { opacity: 0 })

  // // const [container] = utils.$('.scroll-container');
  // const container = postContent.value
  // console.log({ container, allImages })

  // for (const img of allImages) {
  //   animate(img, {
  //     opacity: [0, 1],
  //     scale: [0, 1],
  //     duration: 5000,
  //     alternate: true,
  //     autoplay: onScroll({
  //       target: img,
  //       sync: true,
  //       container, enter: 'top bottom-=40',
  //       leave: 'bottom top+=60', debug: true
  //     }),
  //   })
  // }

  /*
  utils.$('.square').forEach($square => {
  animate($square, {
    x: '15rem',
    rotate: '1turn',
    duration: 2000,
    alternate: true,
    ease: 'inOutQuad',
    autoplay: onScroll({
      container: '.scroll-container',
      sync: 1,
      enter: 'bottom max',
      leave: 'top min',
      debug: true
    })
  });
});
*/

  // utils.$('img').forEach($img => {
  //   animate($img, {
  //     opacity: [0, 1],
  //     scale: [0.9, 1],
  //     ease: 'linear',
  //     duration: 2000,
  //     autoplay: onScroll({
  //       target: $img,
  //       sync: true,
  //       container: utils.$('.scroll-container'),
  //       // enter: 'top bottom-=40',
  //       // leave: 'bottom top+=60',
  //       debug: true
  //     })
  //   })
  // })
})

const activeSection = ref('')

onMounted(() => {

  // Set up intersection observers for each section
  const sections = document.querySelectorAll('h2, h3')
  sections.forEach(section => {
    const { stop } = useIntersectionObserver(
      section,
      ([{ isIntersecting }]) => {
        if (isIntersecting) {
          console.log('section', section.id)
          activeSection.value = section.id
        }
      },
      { threshold: 0.5 } // Adjust this value as needed
    )
  })
})

function formatDate(date) {
  if (!date) return 'No date'
  let parsedDate =
    typeof date === 'string'
      ? parseISO(date)
      : date instanceof Date
        ? date
        : null
  return !parsedDate || !isValid(parsedDate)
    ? 'Invalid date'
    : format(parsedDate, 'MMMM d, yyyy')
}

function getBaseUrl() {
  if (config.public && config.public.baseURL) return config.public.baseURL
  return typeof window !== 'undefined'
    ? window.location.origin
    : 'https://ejfox.com'
}

const baseURL = getBaseUrl()
const shareImageUrl = new URL(
  `/images/share/${params.slug.join('/')}.png`,
  baseURL
).href
const postUrl = new URL(`/blog/${params.slug.join('/')}`, baseURL).href

useSeoMeta({
  title: post.value?.title,
  description: post.value?.dek,
  ogTitle: post.value?.title,
  ogDescription: post.value?.dek,
  ogImage: shareImageUrl,
  ogUrl: postUrl,
  ogType: 'article',
  twitterCard: 'summary_large_image',
  twitterTitle: post.value?.title,
  twitterDescription: post.value?.dek,
  twitterImage: shareImageUrl
})

useHead({
  htmlAttrs: { lang: 'en' },
  link: [{ rel: 'canonical', href: postUrl }]
})
</script>

<template>
  <div>
    <article v-if="post" class="scroll-container pt-10 md:pt-4">
      <div ref="postMetadata">
        <PostMetadata :doc="post" class="paddings" />
      </div>

      <div class="lg:h-[62vh] flex items-center">
        <h1 ref="postTitle" v-if="post?.title"
          class="post-title text-4xl lg:text-8xl xl:text-10xl font-bold w-full paddings-y pr-8 pl-4 md:pl-0 text-balance">
          {{ post?.title }}
        </h1>
      </div>

      <div ref="postContent">
        <article v-html="post.content"
          class="px-2 prose-lg md:prose-xl dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl prose-p:leading-8 prose-p:py-2 prose-a:text-blue-600 hover:prose-a:text-blue-500 dark:prose-a:text-blue-200 dark:hover:prose-a:text-blue-400 prose-a:underline transition-all duration-100 ease-in-out prose-strong:font-semibold prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:my-8 prose-ul:list-disc prose-ol:list-decimal prose-li:my-2 prose-img:rounded-lg prose-hr:border-gray-300 dark:prose-hr:border-gray-700 prose-table:border-collapse prose-th:border prose-th:border-gray-300 dark:prose-th:border-gray-700 prose-th:px-3 prose-th:py-2 prose-td:border prose-td:border-gray-300 dark:prose-td:border-gray-700 prose-td:px-3 prose-td:py-2 prose-pre:bg-white dark:prose-pre:bg-zinc-800 prose-pre:overflow-x-auto prose-pre:max-w-full prose-code:overflow-x-auto prose-code:max-w-full !max-w-none font-weight-normal">
        </article>
      </div>

      <div v-if="post.tags">
        <!-- UBadges of all the tags -->
        <span v-for="tag in post.tags" :key="tag" class="inline-block mr-2 mb-2">
          <UBadge :color="isDark ? 'zinc-700' : 'zinc-300'" :text="tag" />
        </span>
      </div>

      <div ref="navigationLinks" class="flex justify-between items-center mt-8 w-full p-4 md:p-8" v-if="nextPrevPosts">
        <div class="w-1/3 pr-2">
          <NuxtLink v-if="nextPrevPosts.prev" :to="`/blog/${nextPrevPosts.prev.slug}`"
            class="block text-left decoration-none hover:underline">
            <span class="block text-sm text-gray-500">Previous</span>
            <span class="block text-sm text-gray-400">{{
              formatDate(nextPrevPosts.prev.date)
            }}</span>
            ← {{ nextPrevPosts.prev?.title }}
          </NuxtLink>
        </div>

        <div class="w-1/3"></div>

        <div class="w-1/3 pl-2 text-right">
          <NuxtLink v-if="nextPrevPosts.next" :to="`/blog/${nextPrevPosts.next.slug}`"
            class="block text-right decoration-none hover:underline">
            <span class="block text-sm text-gray-500">Next</span>
            <span class="block text-sm text-gray-400">{{
              formatDate(nextPrevPosts.next.date)
            }}</span>
            {{ nextPrevPosts.next?.title }} →
          </NuxtLink>
        </div>
      </div>
    </article>

    <!-- Teleport the TOC to the sidebar -->
    <teleport to="#toc-container">
      <div v-if="post?.toc?.length" class="p-2">
        <div
          class="toc border-gray-100 dark:border-none dark:bg-gray-800 p-4 rounded-lg overflow-hidden w-48 text-xs my-4 font-sans text-zinc-400 dark:text-zinc-600">
          <!-- <h3 class="text-lg mb-2">Table of Contents</h3> -->
          <ul class="space-y-2">
            <div v-for="item in post.toc" :key="item.slug">
              <!-- <a :href="`#${item.slug}`" class="hover:text-blue-500 transition-colors">
                {{ item.text }}
              </a> -->
              <ul v-if="item.children?.length" class="mt-2 space-y-2">
                <li v-for="child in item.children" :key="child.slug" :class="{
                  'text-decoration-underline': activeSection === child.slug,
                  'text-red-500': activeSection === child.slug
                }">
                  <a :href="`#${child.slug}`" class="hover:text-blue-500 transition-colors">
                    {{ child.text }}
                  </a>
                </li>
              </ul>
            </div>
          </ul>
        </div>
      </div>
    </teleport>
  </div>
</template>

<style>
::view-transition-old(root) {
  animation: 90ms cubic-bezier(0.4, 0, 1, 1) both fade-out;
}

::view-transition-new(root) {
  animation: 210ms cubic-bezier(0, 0, 0.2, 1) 90ms both fade-in;
}

::view-transition-group(root) {
  animation-duration: 5s;
}

h1 {
  view-transition-name: title;
}

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

.header-star {
  /* light mode, black stars */
  fill: #000;

  /* dark mode, white stars */
  @media (prefers-color-scheme: dark) {
    fill: #fff;
  }
}
</style>
