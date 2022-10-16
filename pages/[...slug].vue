<template>
  <main>
    <Nav />

    <ul v-if="toc">
      <li v-for="link of toc.links" :key="link.id" :class="{ 'toc2': link.depth === 2, 'toc3': link.depth === 3 }">
        <NuxtLink :to="`#${link.id}`">{{ link.text }}</NuxtLink>
      </li>
    </ul>

    <ContentDoc />

    <div class="cf pv4 mb4">
      <NuxtLink v-if="prev" :to="prev._path" class="w-20 link gray db absolute left-2 lh-title">
        <span class="dib">&#8592;</span>
        {{ prev.title }}
        <!-- {{prev}} -->
        <p class="moon-gray">{{ countWords(prev) }} words</p>
      </NuxtLink>
      <NuxtLink v-if="next" :to="next._path" class="w-20 link gray db absolute right-2 lh-title">
        {{ next.title }}
        <span class="dib">&#8594;</span>

        <p class="moon-gray">{{ countWords(next) }} words</p>
      </NuxtLink>
    </div>
  </main>
</template>fgh
<script setup>
import { countWords } from '~~/helpers'
const { prev, next, toc } = useContent()
</script>