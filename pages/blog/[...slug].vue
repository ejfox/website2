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
    <h1>{{ post.title }}</h1>
    <div v-html="post.content"></div>
  </article>
</template>