<template>
  <nav class="mv4 cf">
    <ul class="list ma0 pa0">
      <li class="pv2 db fl fw8 link red bg-white mr4 mr5-l tracked">
        <!-- little red circle in html -->
        <!-- <span class="dib w1 h1 br-100 bg-red v-bottom"></span> -->
        <!-- little red circle in svg -->
        <svg id="nav-circle-svg" class="dib w1 h1 v-bottom pr2" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="5" id="nav-circle" />
        </svg>

        <span class="dib v-top">EJ Fox</span>
        </li>
      <NuxtLink class="pa2 db fl fw4 link black bg-white mr3 mr4-l" tag="li" to="/">Home</NuxtLink>
      <NuxtLink class="pa2 db fl fw4 link black bg-white mr3 mr4-l" tag="li" to="/projects">Projects</NuxtLink>
      <NuxtLink class="pa2 db fl fw4 link black bg-white mr3 mr4-l" tag="li" to="/blog/">Blog</NuxtLink>
      <!-- <NuxtLink class="pa2 db fl fw4 link black bg-white mr3 mr4-l" tag="li" to="/photos/">Photos</NuxtLink> -->
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

  // make a loop where the red circle radius grows and shrinks
  anime({
    targets: '#nav-circle',
    fill: ['#ccc', '#999'],
    r: [45, 5],
    easing: 'easeInOutCubic',
    duration: 4200,
    loop: true,
    direction: 'alternate',
    // delay: 2500
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

#nav-circle-svg {
  height: 0.7em;
  width: 0.7em;
}

#nav-circle {
  fill: transparent;
  stroke: #ccc;
  stroke-width: 10;
}

.router-link-active {
  color: red;
}

</style>