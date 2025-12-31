<template>
  <div class="calendar-page">
    <div id="cal-embed" class="cal-embed-container"></div>
  </div>
</template>

<script setup>
import { useDark } from '@vueuse/core'

const isDark = useDark()

usePageSeo({
  title: 'Book time with EJ Fox | Calendar',
  description: 'Schedule time with EJ Fox.',
})

onMounted(() => {
  ;(function (C, A, L) {
    const p = function (a, ar) { a.q.push(ar) }
    const d = C.document
    C.Cal = C.Cal || function () {
      const cal = C.Cal
      const ar = arguments
      if (!cal.loaded) {
        cal.ns = {}
        cal.q = cal.q || []
        d.head.appendChild(d.createElement('script')).src = A
        cal.loaded = true
      }
      if (ar[0] === L) {
        const api = function () { p(api, arguments) }
        const namespace = ar[1]
        api.q = api.q || []
        typeof namespace === 'string' ? (cal.ns[namespace] = api) && p(api, ar) : p(cal, ar)
        return
      }
      p(cal, ar)
    }
  })(window, 'https://app.cal.com/embed/embed.js', 'init')

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
</style>
