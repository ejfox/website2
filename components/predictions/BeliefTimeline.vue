<script setup lang="ts">
/**
 * Belief changelog: every prediction from signing to deadline, with each
 * logged confidence update (◆) and its resolution (✓/✗). Plain computed SVG;
 * the number at left is the confidence when SIGNED, not the current one.
 */
import { buildBeliefRows, type BeliefPrediction } from '~/utils/beliefTimeline'

const props = defineProps<{
  predictions: BeliefPrediction[]
}>()

// Geometry. Fixed width to fit the content column; on phones the wrapper
// scrolls, never the page.
const W = 760
const L = 270 // label column
const R = 24
const T = 34
const ROW = 26
const DAY = 86_400_000

const rows = computed(() => buildBeliefRows(props.predictions || []))
const H = computed(() => T + rows.value.length * ROW + 18)

// Date-only, so SSR and client agree within the day
const today = computed(() => Math.floor(Date.now() / DAY) * DAY)

// Domain: Jan 1 of the first signing year → Jan 1 after the last deadline
const domain = computed(() => {
  const r = rows.value
  if (!r.length) return { y0: 2025, y1: 2026 }
  const y0 = new Date(Math.min(...r.map((d) => d.created))).getUTCFullYear()
  const y1 =
    new Date(
      Math.max(today.value, ...r.map((d) => d.deadline))
    ).getUTCFullYear() + 1
  return { y0, y1 }
})

const x = (t: number) => {
  const t0 = Date.UTC(domain.value.y0, 0, 1)
  const t1 = Date.UTC(domain.value.y1, 0, 1)
  return L + ((t - t0) / (t1 - t0)) * (W - L - R)
}

const years = computed(() => {
  const out: number[] = []
  for (let y = domain.value.y0; y <= domain.value.y1; y++) out.push(y)
  return out
})

const fmt = (t: number) =>
  new Date(t).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })

const plotted = computed(() =>
  rows.value.map((r, i) => {
    const y = T + i * ROW + ROW / 2
    const end = r.resolvedAt ?? r.deadline
    return {
      ...r,
      y,
      x0: x(r.created),
      xDeadline: x(r.deadline),
      // solid = time actually lived: to resolution, or to today if open
      xSolid:
        r.status === 'open' ? Math.min(x(today.value), x(r.deadline)) : x(end),
      xEnd: x(end),
      tip:
        `${r.statement} · signed ${r.signed}%` +
        (r.current === r.signed ? '' : ` · now ${r.current}%`),
      marks: r.updates.map((u) => {
        const ux = x(u.t)
        const held = u.before === u.after
        return {
          ...u,
          ux,
          held,
          d: `M${ux} ${y - 5} L${ux + 5} ${y} L${ux} ${y + 5} L${ux - 5} ${y} Z`,
          text: held ? `held ${u.after}` : `${u.before}→${u.after}`,
        }
      }),
    }
  })
)
</script>

<template>
  <div class="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
    <svg
      :viewBox="`0 0 ${W} ${H}`"
      :width="W"
      :height="H"
      class="block font-mono"
      role="img"
      :aria-label="`Timeline of ${rows.length} predictions from signing to deadline, with confidence updates and resolutions`"
    >
      <!-- year gridlines -->
      <g v-for="yr in years" :key="yr">
        <line
          :x1="x(Date.UTC(yr, 0, 1))"
          :x2="x(Date.UTC(yr, 0, 1))"
          :y1="T - 10"
          :y2="H - 8"
          class="stroke-zinc-200 dark:stroke-zinc-800"
          stroke-width="1"
        />
        <text
          :x="x(Date.UTC(yr, 0, 1))"
          :y="T - 16"
          text-anchor="middle"
          class="text-3xs fill-current text-zinc-500"
        >
          {{ yr }}
        </text>
      </g>

      <!-- today -->
      <line
        :x1="x(today)"
        :x2="x(today)"
        :y1="T - 10"
        :y2="H - 8"
        class="stroke-zinc-900 dark:stroke-zinc-100"
        stroke-width="1"
        stroke-dasharray="2 3"
      />
      <text
        :x="x(today) + 4"
        :y="H - 4"
        class="text-3xs fill-current text-zinc-900 dark:text-zinc-100"
      >
        today
      </text>

      <a
        v-for="r in plotted"
        :key="r.slug"
        :href="`/predictions/${r.slug}`"
        class="group outline-none"
      >
        <title>{{ r.tip }}</title>
        <rect
          x="0"
          :y="r.y - ROW / 2"
          :width="W"
          :height="ROW"
          class="fill-transparent group-hover:fill-zinc-100 group-focus-visible:fill-zinc-100 dark:group-hover:fill-zinc-900 dark:group-focus-visible:fill-zinc-900"
        />
        <text
          x="0"
          :y="r.y + 4"
          class="font-serif text-xs fill-current group-hover:underline"
          :class="
            r.status === 'open'
              ? 'text-zinc-900 dark:text-zinc-100'
              : 'text-zinc-500'
          "
        >
          {{ r.label }}
        </text>
        <text
          :x="L - 12"
          :y="r.y + 4"
          text-anchor="end"
          class="text-2xs tabular-nums fill-current text-zinc-900 dark:text-zinc-100"
        >
          {{ r.signed }}%
        </text>

        <!-- signed → deadline -->
        <line
          :x1="r.x0"
          :x2="r.xDeadline"
          :y1="r.y"
          :y2="r.y"
          class="stroke-zinc-300 dark:stroke-zinc-700"
          stroke-width="1"
        />
        <!-- signed → today (open) / → resolution -->
        <line
          :x1="r.x0"
          :x2="r.xSolid"
          :y1="r.y"
          :y2="r.y"
          :class="
            r.status === 'open'
              ? 'stroke-zinc-900 dark:stroke-zinc-100'
              : 'stroke-zinc-500'
          "
          stroke-width="2"
        />
        <circle
          :cx="r.x0"
          :cy="r.y"
          r="3"
          class="fill-zinc-900 dark:fill-zinc-100"
        />

        <g v-for="m in r.marks" :key="m.t">
          <path
            :d="m.d"
            class="fill-surface stroke-zinc-900 dark:stroke-zinc-100"
            stroke-width="1.5"
          >
            <title>
              {{ fmt(m.t) }} · {{ m.text
              }}{{ m.reasoning ? ` · ${m.reasoning}` : '' }}
            </title>
          </path>
          <text
            :x="m.ux + (m.held ? 8 : -8)"
            :y="r.y - 7"
            :text-anchor="m.held ? 'start' : 'end'"
            class="text-3xs tabular-nums fill-current text-zinc-900 dark:text-zinc-100"
          >
            {{ m.text }}
          </text>
        </g>

        <text
          v-if="r.status !== 'open'"
          :x="r.xEnd + 8"
          :y="r.y + 4"
          class="text-xs fill-current text-zinc-900 dark:text-zinc-100"
        >
          {{
            r.status === 'correct' ? '✓' : r.status === 'incorrect' ? '✗' : '—'
          }}
        </text>
        <line
          v-else
          :x1="r.xDeadline"
          :x2="r.xDeadline"
          :y1="r.y - 5"
          :y2="r.y + 5"
          class="stroke-zinc-900 dark:stroke-zinc-100"
          stroke-width="1"
        />
      </a>
    </svg>
  </div>
</template>
