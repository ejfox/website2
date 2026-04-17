<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  payload: { type: Object, required: true },
})

const open = ref(false)

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
  typeof props.payload.confidence === 'number' ? `${props.payload.confidence}%` : ''
)

const truncated = computed(() => {
  const s = (props.payload.statement || '').replace(/\s+/g, ' ').trim()
  return s.length > 60 ? s.slice(0, 59) + '…' : s
})

const hashShort = computed(() =>
  props.payload.hash ? props.payload.hash.slice(0, 8) : null
)

const deadline = computed(() =>
  props.payload.deadline ? String(props.payload.deadline).slice(0, 10) : null
)

const resolvedDate = computed(() =>
  props.payload.resolved_date ? String(props.payload.resolved_date).slice(0, 10) : null
)

const href = computed(() => `/predictions/${props.payload.id}`)
</script>

<template>
  <span class="prediction-ref-wrap" @mouseenter="open = true" @mouseleave="open = false" @focusin="open = true" @focusout="open = false">
    <a :href="href" :class="['prediction-ref', stateClass]" :aria-describedby="`pred-${payload.id}-pop`">
      <span class="prediction-ref__glyph" :class="{ 'is-pulsing': !payload.resolved }">{{ glyph }}</span>
      <span class="prediction-ref__confidence" :class="{ 'is-scarred': payload.resolved && payload.status === 'incorrect' }">{{ confidence }}</span>
      <span class="prediction-ref__statement">{{ truncated }}</span>
    </a>
    <span v-if="open" :id="`pred-${payload.id}-pop`" class="prediction-ref__popover" role="tooltip">
      <span class="pop__label">prediction</span>
      <span class="pop__statement">{{ payload.statement }}</span>
      <span class="pop__meta">
        <span>{{ confidence }} confidence</span>
        <span v-if="deadline" class="pop__sep">·</span>
        <span v-if="deadline">by {{ deadline }}</span>
      </span>
      <span v-if="payload.resolved && payload.resolution" class="pop__resolution">
        <span class="pop__label">resolution</span>
        <span>{{ payload.resolution.slice(0, 220) }}{{ payload.resolution.length > 220 ? '…' : '' }}</span>
        <span v-if="resolvedDate" class="pop__meta">resolved {{ resolvedDate }}</span>
      </span>
      <span v-if="hashShort" class="pop__hash">sha256 · {{ hashShort }}</span>
    </span>
  </span>
</template>

<style scoped>
.prediction-ref-wrap {
  position: relative;
  display: inline;
}

.prediction-ref {
  display: inline-flex;
  align-items: baseline;
  gap: 0.375rem;
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 0.8em;
  line-height: 1;
  padding: 0.15em 0.5em;
  border-radius: 2px;
  border: 1px solid currentColor;
  text-decoration: none !important;
  color: inherit;
  vertical-align: baseline;
  transition: background-color 120ms ease;
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.prediction-ref:hover {
  background: color-mix(in srgb, currentColor 8%, transparent);
}

.prediction-ref__glyph {
  font-weight: 600;
  opacity: 0.9;
}

.prediction-ref__glyph.is-pulsing {
  animation: pred-pulse 2s ease-in-out infinite;
}

.prediction-ref__confidence {
  font-variant-numeric: tabular-nums;
  opacity: 0.85;
}

.prediction-ref__confidence.is-scarred {
  text-decoration: line-through;
  text-decoration-thickness: 1px;
  opacity: 0.6;
}

.prediction-ref__statement {
  font-family: Georgia, 'Times New Roman', serif;
  font-style: italic;
  font-size: 1.05em;
  opacity: 0.8;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 30ch;
}

.state-correct {
  color: #16a34a;
}
.state-incorrect {
  color: #dc2626;
}
.state-pending {
  color: #6b7280;
}
:root.dark .state-correct { color: #4ade80; }
:root.dark .state-incorrect { color: #f87171; }
:root.dark .state-pending { color: #9ca3af; }

@keyframes pred-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

.prediction-ref__popover {
  position: absolute;
  bottom: calc(100% + 0.5rem);
  left: 0;
  z-index: 50;
  display: grid;
  gap: 0.5rem;
  width: 22rem;
  max-width: 90vw;
  padding: 0.875rem 1rem;
  background: #ffffff;
  color: #18181b;
  border: 1px solid #e4e4e7;
  border-radius: 3px;
  box-shadow: 0 8px 24px -8px rgba(0,0,0,0.2);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 0.875rem;
  line-height: 1.4;
  font-style: normal;
  white-space: normal;
  pointer-events: none;
}

:root.dark .prediction-ref__popover {
  background: #18181b;
  color: #e4e4e7;
  border-color: #3f3f46;
}

.pop__label {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.5;
}

.pop__statement {
  font-weight: 400;
}

.pop__meta {
  display: flex;
  gap: 0.375rem;
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 0.7rem;
  opacity: 0.7;
}

.pop__sep {
  opacity: 0.4;
}

.pop__resolution {
  display: grid;
  gap: 0.25rem;
  padding-top: 0.5rem;
  border-top: 1px solid currentColor;
  border-color: color-mix(in srgb, currentColor 15%, transparent);
}

.pop__hash {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 0.65rem;
  opacity: 0.45;
  letter-spacing: 0.02em;
}
</style>
