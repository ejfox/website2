<template>
  <article ref="articleEl" class="with-sidenotes">
    <div v-html="content" />

    <svg
      v-if="curves.length"
      class="sidenote-curves"
      :viewBox="`0 0 ${width} ${height}`"
    >
      <path
        v-for="(curve, i) in curves"
        :key="i"
        :d="curve"
        stroke="#a1a1aa"
        stroke-width="1"
        fill="none"
        opacity="0.3"
      />
    </svg>
  </article>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as d3 from 'd3'

const props = defineProps(['content'])
const articleEl = ref()
const curves = ref([])
const width = ref(1000)
const height = ref(2000)

onMounted(async () => {
  await nextTick()
  if (!articleEl.value) return

  const refs = articleEl.value.querySelectorAll('sup.footnote-ref')
  const notes = articleEl.value.querySelectorAll('.footnotes li')

  // D3 line generator with cardinal curve
  const lineGenerator = d3
    .line()
    .curve(d3.curveBasis) // Smooth curve
    .x((d) => d[0])
    .y((d) => d[1])

  // Generate curves
  curves.value = Array.from(refs)
    .map((ref, i) => {
      const note = notes[i]
      if (!note) return null

      const refRect = ref.getBoundingClientRect()
      const noteRect = note.getBoundingClientRect()
      const containerRect = articleEl.value.getBoundingClientRect()

      // Start from ref, end at note
      const points = [
        [
          refRect.right - containerRect.left,
          refRect.top - containerRect.top + refRect.height / 2
        ],
        [
          refRect.right - containerRect.left + 100,
          refRect.top - containerRect.top + 20
        ], // Control point for sag
        [
          noteRect.left - containerRect.left,
          noteRect.top - containerRect.top + 10
        ]
      ]

      return lineGenerator(points)
    })
    .filter(Boolean)

  // Update dimensions
  width.value = articleEl.value.offsetWidth
  height.value = articleEl.value.scrollHeight
})
</script>

<style scoped>
.with-sidenotes {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 65ch) 300px;
  gap: 2rem;
}

.sidenote-curves {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  width: 100%;
  height: 100%;
}

/* Move footnotes to margin */
:deep(.footnotes) {
  grid-column: 2;
  grid-row: 1;
  display: contents;
}

:deep(.footnotes li) {
  grid-column: 2;
  font-size: 0.875rem;
  color: #71717a;
  margin-bottom: 1rem;
}

/* Hide back refs */
:deep(.footnotes a[href^='#fnref']) {
  display: none;
}

@media (max-width: 1280px) {
  .with-sidenotes {
    display: block;
  }

  .sidenote-curves {
    display: none;
  }
}
</style>
