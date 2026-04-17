<script setup>
import { computed } from 'vue'

const props = defineProps({
  payload: { type: Object, required: true },
})

const glyph = computed(() => {
  if (!props.payload.resolved) return '◌'
  if (props.payload.status === 'correct') return '✓'
  if (props.payload.status === 'incorrect') return '✗'
  return '·'
})

const stateClass = computed(() => {
  if (!props.payload.resolved) return 'state-pending'
  return `state-${props.payload.status || 'resolved'}`
})

const confidence = computed(() =>
  typeof props.payload.confidence === 'number' ? props.payload.confidence : null
)

// Build confidence-over-time points from updates[]
const sparkPath = computed(() => {
  const updates = props.payload.updates || []
  if (updates.length === 0) return null

  // Series: [initialConfidence, update1.after, update2.after, ..., currentConfidence]
  const initial = updates[0]?.confidenceBefore ?? confidence.value
  const points = [initial, ...updates.map((u) => u.confidenceAfter)]
  if (points.length < 2) return null

  const w = 120
  const h = 24
  const minY = 0
  const maxY = 100
  const stepX = w / (points.length - 1)

  const coords = points.map((p, i) => ({
    x: i * stepX,
    y: h - ((p - minY) / (maxY - minY)) * h,
  }))

  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')
  return { line, coords, width: w, height: h }
})

const deadline = computed(() =>
  props.payload.deadline ? String(props.payload.deadline).slice(0, 10) : null
)
const resolvedDate = computed(() =>
  props.payload.resolved_date ? String(props.payload.resolved_date).slice(0, 10) : null
)
const hashShort = computed(() =>
  props.payload.hash ? props.payload.hash.slice(0, 12) : null
)
const href = computed(() => `/predictions/${props.payload.id}`)
</script>

<template>
  <aside :class="['prediction-card', stateClass]">
    <header class="card__header">
      <span class="card__glyph">{{ glyph }}</span>
      <span class="card__confidence" :class="{ 'is-scarred': payload.resolved && payload.status === 'incorrect' }">
        {{ confidence }}<span v-if="confidence !== null" class="card__pct">%</span>
      </span>
      <span class="card__label">prediction</span>
      <a :href="href" class="card__link">open →</a>
    </header>

    <p class="card__statement">{{ payload.statement }}</p>

    <div v-if="sparkPath" class="card__sparkline">
      <svg :viewBox="`0 0 ${sparkPath.width} ${sparkPath.height}`" :width="sparkPath.width" :height="sparkPath.height" preserveAspectRatio="none" aria-label="confidence over time">
        <path :d="sparkPath.line" fill="none" stroke="currentColor" stroke-width="1.25" />
        <circle
          v-for="(c, i) in sparkPath.coords"
          :key="i"
          :cx="c.x"
          :cy="c.y"
          r="1.75"
          fill="currentColor"
        />
      </svg>
      <span class="card__sparkline-label">confidence over time</span>
    </div>

    <div v-if="payload.resolved && payload.resolution" class="card__resolution">
      <span class="card__label">resolution</span>
      <p>{{ payload.resolution }}</p>
    </div>

    <footer class="card__footer">
      <span v-if="!payload.resolved && deadline">awaiting {{ deadline }}</span>
      <span v-if="payload.resolved && resolvedDate">resolved {{ resolvedDate }}</span>
      <span v-if="hashShort" class="card__hash">sha256 · {{ hashShort }}</span>
      <span v-if="payload.gitCommit" class="card__commit">git · {{ payload.gitCommit.slice(0, 7) }}</span>
    </footer>
  </aside>
</template>

<style scoped>
.prediction-card {
  display: grid;
  gap: 0.75rem;
  margin: 2rem 0;
  padding: 1.25rem 1.5rem;
  border-left: 2px solid currentColor;
  background: color-mix(in srgb, currentColor 3%, transparent);
  font-family: Georgia, 'Times New Roman', serif;
}

.state-correct { color: #16a34a; }
.state-incorrect { color: #dc2626; }
.state-pending { color: #6b7280; }
:root.dark .state-correct { color: #4ade80; }
:root.dark .state-incorrect { color: #f87171; }
:root.dark .state-pending { color: #9ca3af; }

.card__header {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 0.75rem;
}

.card__glyph {
  font-size: 1rem;
  font-weight: 600;
}

.card__confidence {
  font-size: 1.125rem;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}
.card__pct { font-size: 0.7em; opacity: 0.6; }

.card__confidence.is-scarred {
  text-decoration: line-through;
  opacity: 0.6;
}

.card__label {
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.5;
  font-size: 0.625rem;
}

.card__link {
  margin-left: auto;
  text-decoration: none;
  color: inherit;
  opacity: 0.7;
}
.card__link:hover { opacity: 1; }

.card__statement {
  font-size: 1.125rem;
  line-height: 1.45;
  margin: 0;
  color: var(--tw-prose-body, inherit);
}

.card__sparkline {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: currentColor;
}
.card__sparkline svg {
  display: block;
  opacity: 0.8;
}
.card__sparkline-label {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.5;
}

.card__resolution {
  display: grid;
  gap: 0.25rem;
  padding-top: 0.75rem;
  border-top: 1px solid color-mix(in srgb, currentColor 20%, transparent);
}
.card__resolution p {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.5;
  opacity: 0.9;
  color: var(--tw-prose-body, inherit);
}

.card__footer {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 0.65rem;
  letter-spacing: 0.02em;
  opacity: 0.5;
}

.card__hash, .card__commit {
  font-variant-numeric: tabular-nums;
}
</style>
