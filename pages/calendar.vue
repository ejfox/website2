<template>
  <div class="calendar-page">
    <!-- Context before booking -->
    <header class="max-w-xl mb-8">
      <h1
        class="font-serif text-2xl md:text-3xl font-normal mb-4"
        style="letter-spacing: -0.02em"
      >
        Book a Discovery Call
      </h1>
      <p class="font-serif text-zinc-600 dark:text-zinc-400 mb-4">
        30 minutes. You tell me the problem, I tell you if I can help. No pitch
        deck needed.
      </p>
      <div class="font-mono text-xs text-zinc-500 space-y-1">
        <p>After you book, you'll get:</p>
        <ul class="list-disc list-inside ml-2 space-y-0.5">
          <li>A short prep video so you know what to expect</li>
          <li>Reminders so we don't miss each other</li>
          <li>A follow-up with next steps if it's a fit</li>
        </ul>
      </div>
    </header>

    <!-- Cal.com inline embed target -->
    <div id="cal-embed" class="cal-embed-container"></div>
  </div>
</template>

<script setup>
import { useDark } from '@vueuse/core'

const isDark = useDark()
const { funnel } = useFunnelTracking()
const { getAttributionForForm } = useAttribution()

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
  // Track calendar page view
  funnel.viewedCalendar()
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

  // Get attribution data to pass to Cal.com
  const attribution = getAttributionForForm()

  window.Cal('inline', {
    elementOrSelector: '#cal-embed',
    calLink: 'ejfox/30min',
    layout: 'month_view',
    config: {
      // Pass attribution as metadata (shows in webhook payload)
      metadata: attribution,
    },
  })

  // Set initial theme after a brief delay to ensure Cal is ready
  setTimeout(() => {
    updateCalTheme()
    funnel.calendarLoaded()
  }, 100)

  // Listen for Cal.com booking events
  window.Cal('on', {
    action: 'bookingSuccessful',
    callback: () => {
      funnel.calBookingComplete()
    },
  })

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
