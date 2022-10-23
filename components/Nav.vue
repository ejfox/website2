<template>
  <nav class="mv4 cf">

    <!-- use mouse x and y and 3d perspective to make the nav rotate slightly to face the mouse corsoe-->
    <!-- :style="{
      transform: `rotateY(-${mouseX * 0.025}deg) rotateZ(-${mouseY * 0.0025}deg) scaleZ(${mouseY * 0.0005 + 5}) translateY(-${mouseY * 0.05 + 5}px)`,
      transformOrigin: '20% 50%',        
      perspective: '10px',
    
    }" -->
    <ul class="list ma0 pa1" >
      <li class="pv2 db fl fw8 link red bg-white mr4 mr5-l tracked">
        <!-- little red circle in html -->
        <!-- <span class="dib w1 h1 br-100 bg-red v-bottom"></span> -->
        <!-- little red circle in svg -->
        <svg id="nav-circle-svg" class="dib w1 h1 v-bottom pr2" viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="5" id="nav-circle" />
        </svg>

        <span class="dib v-top">EJ Fox</span>
      </li>
      <NuxtLink class="pa2 db fl fw4 link bg-white black mr3 mr4-l" tag="li" to="/">Home</NuxtLink>
      <NuxtLink class="pa2 db fl fw4 link bg-white black mr3 mr4-l" tag="li" to="/projects">Projects</NuxtLink>
      <NuxtLink class="pa2 db fl fw4 link bg-white black mr3 mr4-l" tag="li" to="/blog/">Blog</NuxtLink>
      <!-- <NuxtLink class="pa2 db fl fw4 link black bg-white mr3 mr4-l" tag="li" to="/photos/">Photos</NuxtLink> -->
    </ul>
  </nav>
</template>
<script setup>
import { scaleLinear } from 'd3'
import anime from 'animejs/lib/anime.es.js'

const { x: mouseX, y: mouseY } = useMouse({ touch: false })

// determine the number of pixels between an element and the mouse
function getDistanceFromMouse(el) {
  const rect = el.getBoundingClientRect()
  const x = rect.left + rect.width / 2
  const y = rect.top + rect.height / 2
  return Math.sqrt(Math.pow(mouseX.value - x, 2) + Math.pow(mouseY.value - y, 2))
}

const distanceColorScale = scaleLinear()
  .domain([2.5, 400])
  .range(['#ff0000', '#000000'])

onMounted(() => {

  function colorNavElements() {
    console.log('coloring')
    // color every li in the nav white to red, the closer it is to the mouse, the redder it is
    const navElements = document.querySelectorAll('nav a')

    // find the distance from the mouse to each nav element
    // then, map that distance to a color value
    // then, set the color of the nav element to that color
    const navColors = [...navElements].map(el => {
      console.log({el})
      const distance = getDistanceFromMouse(el)
      console.log({distance})
      // const color = Math.floor(255 - distance / 100)
      const color = distanceColorScale(distance)
      return color
    })

    // set the color of each nav element
    navElements.forEach((el, i) => {
      el.style.color = navColors[i]
      el.style.borderColor = navColors[i]
      // make the border width of the nav element proportional to the distance from the mouse
      el.style.borderWidth = `${getDistanceFromMouse(el) / 100}px`
    })
  }

  watch([mouseX, mouseY], () => {
    colorNavElements()
  })


})



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