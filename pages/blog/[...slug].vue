<script setup>
const { params } = useRoute()
const { data: post } = await useAsyncData(
  `post-${params.slug}`,
  () => $fetch(`/api/posts/${params.slug}`)
)

useSeoMeta({
  title: post.value.title,
  description: post.value.description,
  // Add more meta tags as needed
})
</script>

<template>
  <article v-if="post">
    <h1 class="text-4xl font-bold paddings">{{ post.title }}</h1>
    <!-- <pre>{{ JSON.stringify(post, null, 2) }}</pre> -->
    <article v-html="post.content" class="prose paddings">

    </article>
    <div></div>
  </article>
</template>
<style scoped>
.paddings {
  @apply p-4 md:p-8 lg:p-16 xl:p-32;
}
</style>