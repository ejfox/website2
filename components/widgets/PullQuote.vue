<script setup>
import { useIntersectionObserver } from '@vueuse/core'

const props = defineProps({
  text: { type: String, required: true },
  align: { type: String, default: 'left', validator: v => ['left', 'right', 'center'].includes(v) },
  accent: { type: String, default: 'currentColor' },
  speed: { type: Number, default: 30 },
})

const el = ref(null)
const started = ref(false)
const displayText = ref('')
const showCursor = ref(false)

useIntersectionObserver(el, ([{ isIntersecting }]) => {
  if (isIntersecting && !started.value) {
    started.value = true
    typeOut()
  }
}, { threshold: 0.4 })

async function typeOut() {
  showCursor.value = true
  for (let i = 0; i <= props.text.length; i++) {
    displayText.value = props.text.slice(0, i)
    const char = props.text[i - 1]
    const isPause = char === '.' || char === ',' || char === ';' || char === ':' || char === '\u2014'
    const ms = isPause ? props.speed * 4 : props.speed + Math.random() * 10 - 5
    await new Promise(r => setTimeout(r, Math.max(10, ms)))
  }
  await new Promise(r => setTimeout(r, 1500))
  showCursor.value = false
}
</script>

<template>
  <div
    ref="el"
    class="pull-quote-section"
    :class="[`align-${align}`]"
  >
    <blockquote class="pull-quote" :style="{ '--pq-accent': accent }">
      <p class="pull-quote-text">
        <span>{{ displayText }}</span><span v-if="showCursor" class="pull-quote-cursor" />
      </p>
    </blockquote>
  </div>
</template>

<style scoped>
.pull-quote-section {
  position: relative;
  padding: 5rem 2rem;
  max-width: 900px;
  margin: 2rem auto;
}

.pull-quote {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(1.25rem, 3vw, 1.75rem);
  line-height: 1.55;
  font-style: italic;
  color: inherit;
  border: none !important;
  padding: 0 !important;
  margin: 0 !important;
  position: relative;
  background: transparent !important;
}

.pull-quote::before {
  content: none !important;
  display: none !important;
}

.pull-quote-text {
  margin: 0 !important;
  min-height: 1.55em;
}

.pull-quote-cursor {
  display: inline-block;
  width: 2px;
  height: 0.9em;
  margin-left: 2px;
  background: var(--pq-accent, currentColor);
  vertical-align: text-bottom;
  animation: pq-blink 0.6s ease-in-out infinite;
}

@keyframes pq-blink {
  0%, 40% { opacity: 0.9; }
  50%, 90% { opacity: 0; }
  100% { opacity: 0.9; }
}

.align-left .pull-quote { text-align: left; }
.align-right .pull-quote { text-align: right; margin-left: auto !important; }
.align-center .pull-quote { text-align: center; max-width: 36em; margin: 0 auto !important; }

@media (prefers-reduced-motion: reduce) {
  .pull-quote-cursor { display: none; }
}
</style>
