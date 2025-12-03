<template>
  <div class="dot-field" :style="containerStyle">
    <span
      v-for="dot in dots"
      :key="dot.id"
      :ref="setDotRef"
      class="dot"
      :style="{
        left: dot.x + '%',
        top: dot.y + '%',
        opacity: dot.opacity,
        transform: `scale(${dot.scale})`,
      }"
    ></span>
  </div>
</template>

<script setup lang="ts">
import { useWindowScroll } from '@vueuse/core'
import anime from 'animejs/lib/anime.es.js'

const props = defineProps<{
  count?: number
  parallax?: number
  seed?: number
}>()

const count = computed(() => props.count ?? 120)
const parallax = computed(() => props.parallax ?? 0.05)

const dots = computed(() => {
  const n = Math.min(Math.max(count.value, 20), 240)
  const baseSeed = props.seed ?? 1337
  const generated = []
  for (let i = 0; i < n; i++) {
    const seed = (i * 9301 + 49297 + baseSeed) % 233280
    const x = (seed % 10000) / 100
    const y = ((seed * 7) % 10000) / 100
    const opacity = 0.05 + (seed % 300) / 3000
    const scale = 0.6 + (seed % 500) / 2000
    generated.push({ id: `${baseSeed}-${i}`, x, y, opacity, scale })
  }
  return generated
})

const { y } = useWindowScroll()
const containerStyle = computed(() => ({
  transform: `translateY(${y.value * -(parallax.value || 0)}px)`,
}))

const dotRefs = ref<HTMLElement[]>([])
const setDotRef = (el: HTMLElement | null) => {
  if (!el) return
  dotRefs.value.push(el)
}

onMounted(() => {
  if (dotRefs.value.length) {
    anime({
      targets: dotRefs.value,
      opacity: (el, i) => 0.05 + (i % 10) * 0.02,
      scale: (el, i) => 0.6 + (i % 6) * 0.05,
      duration: 900,
      delay: anime.stagger(12),
      easing: 'easeOutSine',
    })
  }
})
</script>

<style scoped>
.dot-field {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.dot-field .dot {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: rgba(113, 113, 122, 0.35);
  filter: blur(0.5px);
}
</style>
