<template>
  <div class="calendar-page">
    <!-- Cal.com inline embed target -->
    <div id="cal-embed" class="cal-embed-container"></div>
  </div>
</template>

<script setup>
import { useDark } from '@vueuse/core'

const isDark = useDark()

usePageSeo({
  title: 'Book time with EJ Fox | Calendar',
  description:
    'Schedule a 30-minute session to discuss data visualization, newsroom tooling, or project collaborations with EJ Fox.',
  type: 'website',
  section: 'Collaboration',
  tags: ['Scheduling', 'Consulting', 'Data Visualization', 'Newsroom Tooling'],
  label1: 'Format',
  data1: '30-minute video call',
})

// Load Cal.com embed script and initialize using their loader pattern
onMounted(() => {
  /* eslint-disable prefer-rest-params, @typescript-eslint/no-unused-expressions */
  // Cal.com's official loader pattern (third-party code, do not modify)
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

  // Initialize and create embed
  window.Cal('init', { origin: 'https://cal.com' })

  window.Cal('inline', {
    elementOrSelector: '#cal-embed',
    calLink: 'ejfox/30min',
    layout: 'month_view',
  })

  // Set initial theme after a brief delay to ensure Cal is ready
  setTimeout(() => {
    updateCalTheme()
  }, 100)

  // Watch for theme changes
  watch(isDark, () => {
    updateCalTheme()
  })
})

function updateCalTheme() {
  if (!window.Cal) return

  window.Cal('ui', {
    theme: isDark.value ? 'dark' : 'light',
    hideEventTypeDetails: false,
    layout: 'month_view',
    styles: {
      branding: {
        brandColor: isDark.value ? '#a1a1aa' : '#3f3f46', // zinc-400 / zinc-700
      },
    },
  })
}
</script>

<style scoped>
.calendar-page {
  width: 100%;
  min-height: 100vh;
  padding: 1rem;
  background: rgb(250 250 250);
  transition: background-color 0.2s ease;
}

@media (min-width: 640px) {
  .calendar-page {
    padding: 2rem;
    border-left: 1px solid rgb(228 228 231);
  }
}

/* Dark mode */
:global(.dark) .calendar-page {
  background: rgb(9 9 11);
}

:global(.dark) .calendar-page {
  border-left-color: rgb(39 39 42);
}

.cal-embed-container {
  width: 100%;
  min-height: calc(100vh - 6rem);
  overflow: hidden;
}

/* Mobile adjustments */
@media (max-width: 639px) {
  .calendar-page {
    padding-top: 0.5rem;
  }

  .cal-embed-container {
    min-height: calc(100vh - 5rem);
  }
}
</style>
