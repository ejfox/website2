<script setup>
import { useDark } from '@vueuse/core'

const isDark = useDark()
const route = useRoute()

usePageSeo({
  title: 'Book time with EJ Fox | Calendar',
  description:
    'Schedule time with EJ Fox. curl my availability or let your agent grab a booking link.',
})

// URL-controlled date selection.
// cal.com's embed runs in a cross-origin iframe and only fires an empty
// `__routeChanged` event — it never tells us which day was clicked inside it.
// So instead of trying to read the embed, we DRIVE it: this picker sets the
// date, writes it into the URL (shareable), and re-renders the embed pre-set.
// Supported params: ?date=YYYY-MM-DD ?month=YYYY-MM ?duration=30 ?type=30min
const selectedDate = ref(
  typeof route.query.date === 'string' ? route.query.date : ''
)
const copied = ref(false)

function buildCalConfig() {
  const config = {}
  if (selectedDate.value) {
    config.date = selectedDate.value
    // open the embed on the right month, derived from the date
    config.month = selectedDate.value.slice(0, 7)
  } else if (route.query.month) {
    config.month = route.query.month
  }
  if (route.query.duration) config.duration = route.query.duration
  if (route.query.name) config.name = route.query.name
  if (route.query.email) config.email = route.query.email

  return {
    elementOrSelector: '#cal-embed',
    calLink: route.query.type ? `ejfox/${route.query.type}` : 'ejfox/30min',
    layout: 'month_view',
    config,
  }
}

function renderCal() {
  if (!window.Cal) return
  // clear any previously-rendered embed before re-rendering on date change,
  // otherwise the embed library appends a second iframe
  const el = document.querySelector('#cal-embed')
  if (el) el.innerHTML = ''
  window.Cal('inline', buildCalConfig())
  setTimeout(() => updateCalTheme(), 100)
}

function syncUrl() {
  // reflect the selection in the address bar without a navigation/reload,
  // so the URL is instantly copy-pasteable
  const url = new URL(window.location.href)
  if (selectedDate.value) {
    url.searchParams.set('date', selectedDate.value)
    url.searchParams.set('month', selectedDate.value.slice(0, 7))
  } else {
    url.searchParams.delete('date')
    url.searchParams.delete('month')
  }
  window.history.replaceState({}, '', url)
}

function onDateChange() {
  syncUrl()
  renderCal()
}

function clearDate() {
  selectedDate.value = ''
  onDateChange()
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch {
    // clipboard blocked (e.g. insecure context) — no-op, address bar still works
  }
}

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

  renderCal()

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

<template>
  <div class="calendar-page">
    <!-- date picker: drives the embed + writes a shareable URL -->
    <div class="cal-controls">
      <label class="date-field">
        <span>jump to date</span>
        <input v-model="selectedDate" type="date" @change="onDateChange" />
      </label>
      <button v-if="selectedDate" class="ctrl-btn" @click="clearDate">
        clear
      </button>
      <button class="ctrl-btn" @click="copyLink">
        {{ copied ? 'copied ✓' : 'copy link' }}
      </button>
    </div>

    <div id="cal-embed" class="cal-embed-container"></div>

    <div class="api-section">
      <h2>curl my availability</h2>
      <p class="api-note">Super-vanilla (no deps):</p>
      <div class="code-block">
        <pre><code>curl -s https://ejfox.com/api/cal/available-slots</code></pre>
      </div>
      <p class="api-note">Pick a slot (requires `jq` + `fzf`):</p>
      <div class="code-block">
        <pre><code>curl -s https://ejfox.com/api/cal/available-slots \
  | jq -r '.slots[]|"\(.naturalTime)\t\(.bookingUrl)"' \
  | fzf | cut -f2 | xargs open</code></pre>
      </div>
      <p class="api-note">Linux version:</p>
      <div class="code-block">
        <pre><code>curl -s https://ejfox.com/api/cal/available-slots \
  | jq -r '.slots[]|"\(.naturalTime)\t\(.bookingUrl)"' \
  | fzf | cut -f2 | xargs xdg-open</code></pre>
      </div>
    </div>
  </div>
</template>

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

.cal-controls {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.date-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  @apply font-mono;
  font-size: 0.7rem;
  color: var(--color-text-secondary, #777);
}

.date-field input {
  @apply font-mono;
  font-size: 0.8rem;
  padding: 0.4rem 0.6rem;
  background: transparent;
  color: inherit;
  border: 1px solid var(--color-border, #333);
  border-radius: 0.25rem;
}

.ctrl-btn {
  @apply font-mono;
  font-size: 0.7rem;
  padding: 0.45rem 0.7rem;
  background: transparent;
  color: var(--color-text-secondary, #777);
  border: 1px solid var(--color-border, #333);
  border-radius: 0.25rem;
  cursor: pointer;
  transition: opacity 0.2s;
}

.ctrl-btn:hover {
  opacity: 0.7;
}

.cal-embed-container {
  width: 100%;
  min-height: calc(100vh - 7rem);
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
  @apply font-mono;
  font-size: 0.75rem;
  font-weight: 400;
  margin-bottom: 0.5rem;
  color: var(--color-text-secondary, #666);
}

.api-note {
  @apply font-mono;
  font-size: 0.7rem;
  margin: 0.75rem 0 0.4rem;
  color: var(--color-text-secondary, #777);
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
  @apply font-mono;
  font-size: 0.7rem;
  line-height: 1.5;
  color: var(--color-text-secondary, #666);
}
</style>
