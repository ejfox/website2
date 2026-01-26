<template>
  <div class="calendar-page">
    <div id="cal-embed" class="cal-embed-container"></div>

    <div class="api-section">
      <h2>curl my availability</h2>
      <div class="code-block">
        <pre><code>curl -s ejfox.com/api/cal/available-slots \
  | jq -r '.slots[]|"\(.naturalTime)\t\(.bookingUrl)"' \
  | fzf | cut -f2 | xargs open</code></pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useDark } from '@vueuse/core'

const isDark = useDark()

usePageSeo({
  title: 'Book time with EJ Fox | Calendar',
  description:
    'Schedule time with EJ Fox. curl my availability or let your agent grab a booking link.',
})

onMounted(() => {
  // Cal.com embed script (third-party, do not modify)
  /* eslint-disable prefer-rest-params, @typescript-eslint/no-unused-expressions */
  ;(function (C, A, L) {
    const p = function (a, ar) {
      a.q.push(ar)
    }
    const d = C.document
    C.Cal =
      C.Cal ||
      function () {
        const cal = C.Cal
        const ar = arguments
        if (!cal.loaded) {
          cal.ns = {}
          cal.q = cal.q || []
          d.head.appendChild(d.createElement('script')).src = A
          cal.loaded = true
        }
        if (ar[0] === L) {
          const api = function () {
            p(api, arguments)
          }
          const namespace = ar[1]
          api.q = api.q || []
          typeof namespace === 'string'
            ? (cal.ns[namespace] = api) && p(api, ar)
            : p(cal, ar)
          return
        }
        p(cal, ar)
      }
  })(window, 'https://app.cal.com/embed/embed.js', 'init')
  /* eslint-enable prefer-rest-params, @typescript-eslint/no-unused-expressions */

  window.Cal('init', { origin: 'https://cal.com' })

  window.Cal('inline', {
    elementOrSelector: '#cal-embed',
    calLink: 'ejfox/30min',
    layout: 'month_view',
  })

  setTimeout(() => updateCalTheme(), 100)

  watch(isDark, () => updateCalTheme())
})

function updateCalTheme() {
  if (!window.Cal) return
  window.Cal('ui', {
    theme: isDark.value ? 'dark' : 'light',
    hideEventTypeDetails: false,
    layout: 'month_view',
  })
}
</script>

<style scoped>
.calendar-page {
  width: 100%;
  min-height: 100vh;
  padding: 1rem;
}

@media (min-width: 640px) {
  .calendar-page {
    padding: 2rem;
  }
}

.cal-embed-container {
  width: 100%;
  min-height: calc(100vh - 4rem);
}

.api-section {
  max-width: 36rem;
  margin: 3rem auto 1rem;
  padding: 1rem 0;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.api-section:hover {
  opacity: 0.8;
}

.api-section h2 {
  font-family: monospace;
  font-size: 0.75rem;
  font-weight: 400;
  margin-bottom: 0.5rem;
  color: var(--color-text-secondary, #666);
}

.code-block pre {
  margin: 0;
  padding: 0.75rem 1rem;
  background: transparent;
  border: 1px solid var(--color-border, #222);
  border-radius: 0.25rem;
  overflow-x: auto;
}

.code-block code {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 0.7rem;
  line-height: 1.5;
  color: var(--color-text-secondary, #666);
}
</style>
