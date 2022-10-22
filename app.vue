<template>
  <div class="sans-serif pa3 pa4-l">
    <Nav class="absolute z-5" />
    <div id="page-overlay" class="fixed top-0 left-0 w-100 h-100 z-3" style="">
      <canvas id="page-overlay-canvas" class="w-100 h-100 ba"></canvas>
    </div>
    
    <div class="mt5 pt1">
    <NuxtPage />
    </div>
  </div>
</template>
<script setup>
import anime from 'animejs/lib/anime.es.js'

onMounted(() => {
})

// whenever the route changes, flash the background
const route = useRoute()
watch(route, (oldVal, newVal) => {
  if (newVal.hash !== '') return

  anime({
    targets: '#page-overlay',
    opacity: [1, 0],
    easing: 'easeOutQuad',
    duration: 200,
    delay: 850,
  })
})

onMounted(() => {

  // draw a canvas on #page-overlay that is the size of the window
  // when a user clicks, animate a circle from their mouse x/y that slowly grows to take over the screen for 1000ms
  // then, when the animation is complete, remove the canvas

  // get the canvas element
  const canvas = document.getElementById('page-overlay-canvas')

  // set canvas size to window size
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  // get canvas context
  const ctx = canvas.getContext('2d')


  // draw a circle at the mouse x/y
  function drawCircle(x, y, r) {
    ctx.beginPath()
    ctx.arc(x, y, r, 0, 2 * Math.PI)
    // ctx.fillStyle = '#000'
    // make circle fill highlighter yellow
    // ctx.fillStyle = '#ff0'
    ctx.fillStyle = '#FFF'
    ctx.fill()
  }

  const body = document.querySelector('body')

  // when the user clicks, draw a circle at the mouse x/y
  // then, animate the circle to grow to the size of the window
  // then, remove the canvas
  body.addEventListener('click', (e) => {

    // if the click event is not a link, then ignore it 
    if (e.target.tagName !== 'A') return

    const x = e.clientX
    const y = e.clientY
    const r = 0

    drawCircle(x, y, r)

    // calculate radius of circle to fill the window
    const radius = Math.sqrt(Math.pow(window.innerWidth, 2) + Math.pow(window.innerHeight, 2))

    anime({
      targets: canvas,
      duration: 1000,
      easing: 'easeInExpo',
      update: (anim) => {
        const r = anim.progress * Math.max(window.innerWidth, window.innerHeight) * 0.02
        drawCircle(x, y, r)
      },
      complete: () => {
        // clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    })
  })

})


</script>

<style>
.sans-serif {
  font-family: 'Signika Negative', sans-serif !important;
}

img {
  width: 100%;
  height: auto;
}

figure {
  margin: 0;
  padding: 0;
}

#page-overlay {
  pointer-events: none;
}

#page-underlay {
  pointer-events: none;
  /* background-color: #fff; */
  background-color: black;
  z-index: -1;
  /* translate: translateY(-100vh); */
  top: -100vh;
}

#page-overlay-canvas {
  /* set blend mode to multiply */
  mix-blend-mode: multiply;
}
</style>