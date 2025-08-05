<script setup>
// FUCK USEASYNCDATA - just use $fetch directly
const projects = await $fetch('/api/manifest')
  .then(manifest => manifest.filter(p => p.slug?.startsWith('projects/')))
  .catch(() => [])

useHead({
  title: 'Projects'
})
</script>

<template>
  <div class="mt-24 md:mt-0">
    <header class="my-6">
      <h1 class="text-display mb-8">
        Projects
      </h1>
      <p class="text-body">
        A collection of experiments, tools, and creative explorations.
      </p>
    </header>

    <div class="space-y-8">
      <div v-for="project in projects" :key="project.slug">
        <h2>{{ project.title }}</h2>
        <p>{{ project.slug }}</p>
      </div>
    </div>
  </div>
</template>

