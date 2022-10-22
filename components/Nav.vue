<template>
  <nav class="mv4 cf">
    <ul class="list ma0 pa0">
      <NuxtLink class="pa2 db fl b link black bg-white mr3 mr4-l" tag="li" to="/">Home</NuxtLink>
      <NuxtLink class="pa2 db fl b link black bg-white mr3 mr4-l" tag="li" to="/projects">Projects</NuxtLink>
      <NuxtLink class="pa2 db fl b link black bg-white mr3 mr4-l" tag="li" to="/blog">Blog</NuxtLink>
    </ul>
  </nav>
</template>
<script setup>
import anime from 'animejs/lib/anime.es.js'
onMounted(() => {
  // use anime to animate the intro text
  anime({
    targets: 'nav a',
    opacity: [0, 1],
    translateX: [-20, 0],
    backgroundColor: ['#fff', 'rgba(255,255,255,0.'],
    easing: 'easeOutQuad',
    duration: 400,
    delay: anime.stagger(150),
  })
})

definePageMeta({
  keepAlive: true,
})
</script>
<style>
/* Remove outline from nav links */
nav a:focus {
  outline: none;
}

</style>