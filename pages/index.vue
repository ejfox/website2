<script setup>
import { onMounted, watch } from 'vue'

console.log('Initializing index.vue component')

const processedMarkdown = useProcessedMarkdown()
const { data: posts, pending, error } = await useAsyncData('posts', () =>
  processedMarkdown.getPostsWithContent(10, 0)
)

onUnmounted(() => {
  console.log('index.vue component unmounted')
})
</script>

<template>
  <div>
    <!-- <pre>{{ JSON.stringify(posts, null, 2) }}</pre> -->
    <div if="posts">
      <article v-for="post in posts" :key="post.slug" class="p-8 bg-gray-200 mt-8">
        <h2>
          <NuxtLink :to="`/blog/${post.slug}`">{{ post.title }}</NuxtLink>
        </h2>
        <!-- all the post properties except content -->
        <div>
          <div v-for="prop in Object.keys(post).filter(p => p !== 'content')" :key="prop" class="mr-1">
            <strong>{{ prop }}:</strong> {{ post[prop] }}
          </div>
        </div>
        <article class="prose" v-html="post.content"></article>


      </article>
    </div>
  </div>
</template>