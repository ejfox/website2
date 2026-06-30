<script setup>
import { loadCalInline } from '~/utils/cal.js'

// Full-bleed booking page — no site chrome. The default layout's 200px desktop
// sidebar was squeezing cal.com's month_view into ~739px (needs ~950px), cutting
// off the weekend columns and the entire time-slot panel. layout:false hands the
// whole viewport to the embed, exactly like /ff. (see CLAUDE.md / pages/ff.vue)
definePageMeta({ layout: false })

const route = useRoute()

usePageSeo({
  title: 'Book time with EJ Fox | Calendar',
  description:
    'Schedule time with EJ Fox. curl my availability or let your agent grab a booking link.',
})

// Machine-readable booking action — the W3C-blessed way to tell an agent
// "this person is bookable, here's the endpoint." Degrades to nothing if
// ignored. Availability as JSON: /api/cal/available-slots
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: 'EJ Fox',
        url: 'https://ejfox.com',
        potentialAction: {
          '@type': 'ReserveAction',
          name: 'Book a meeting with EJ Fox',
          description:
            'Open availability as JSON at https://ejfox.com/api/cal/available-slots (query params: days, duration), then book a returned slot URL.',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://ejfox.com/calendar',
            actionPlatform: [
              'https://schema.org/DesktopWebPlatform',
              'https://schema.org/MobileWebPlatform',
            ],
          },
          result: { '@type': 'Reservation', name: 'Meeting with EJ Fox' },
        },
      }),
    },
  ],
})

// Hidden URL deep-linking. cal.com's embed is a cross-origin iframe we can only
// DRIVE, not read — so there's no visible picker. Instead, the URL is the API:
// someone shares /calendar?date=YYYY-MM-DD and the embed opens on that day.
// Supported params: ?date=YYYY-MM-DD ?month=YYYY-MM ?duration=30 ?type=30min
function buildConfig() {
  // theme:'auto' lets cal.com follow the OS color scheme — same as the site,
  // which has no manual toggle (useDark just syncs to OS).
  const config = { layout: 'month_view', theme: 'auto' }
  const date = typeof route.query.date === 'string' ? route.query.date : ''
  if (date) {
    config.date = date
    config.month = date.slice(0, 7) // open on the right month
  } else if (route.query.month) {
    config.month = route.query.month
  }
  if (route.query.duration) config.duration = route.query.duration
  if (route.query.name) config.name = route.query.name
  if (route.query.email) config.email = route.query.email
  return config
}

const DEFAULT_LINK = 'ejfox/30min'

// Surfaced in the UI when a requested ?type= didn't exist and we fell back.
const fellBackToDefault = ref(false)

function mountCal(calLink, namespace) {
  loadCalInline({
    namespace,
    calLink,
    selector: '#cal-embed',
    config: buildConfig(),
  })
}

onMounted(() => {
  const requested = route.query.type
    ? `ejfox/${route.query.type}`
    : DEFAULT_LINK
  mountCal(requested, 'calendar')

  // Self-heal stale/unknown ?type= links so they don't sit blank. A valid event
  // type reliably reaches loading="done" within a second or two; a bad one either
  // flips to loading="failed" OR (observed in the wild) just stays stuck null
  // forever. So the robust rule is: if the embed hasn't reported "done" by the
  // deadline, treat it as broken and fall back to the default type.
  // (Only when a custom type was requested; no point falling back to itself.)
  if (requested === DEFAULT_LINK) return

  // NB: #cal-embed lives inside <ClientOnly>, so it may not exist yet at
  // onMounted (cal.com resolves the selector asynchronously). So we observe a
  // stable root and look the embed up lazily — and crucially set the deadline
  // timer unconditionally, instead of bailing on a not-yet-rendered container.
  const w = { settled: false, observer: null, timer: null }
  const embed = () => document.querySelector('#cal-embed')
  const finish = () => {
    w.settled = true
    w.observer?.disconnect()
    clearTimeout(w.timer)
  }
  const fallback = () => {
    if (w.settled) return
    finish()
    const el = embed()
    if (el) el.innerHTML = ''
    fellBackToDefault.value = true
    mountCal(DEFAULT_LINK, 'calendar-fallback')
  }
  const check = () => {
    if (w.settled) return
    const state = embed()?.querySelector('cal-inline')?.getAttribute('loading')
    if (state === 'done')
      finish() // valid type — leave it be
    else if (state === 'failed') fallback() // fast-path the explicit failure
  }
  // Watch the whole document for cal-inline's loading flips (the element is
  // created async, and may sit outside our cached refs at setup time).
  w.observer = new MutationObserver(check)
  w.observer.observe(document.body, {
    subtree: true,
    attributes: true,
    attributeFilter: ['loading'],
  })
  // Deadline: if it never reaches "done" (failed, or stuck null), fall back.
  // 12s is generous vs. cal.com's usual ~2s load.
  w.timer = setTimeout(fallback, 12000)
  check() // in case it already settled
})
</script>

<template>
  <div class="calendar-page min-h-screen w-full bg-sunken">
    <div class="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
      <header class="cal-header">
        <NuxtLink to="/" class="cal-back">← ejfox.com</NuxtLink>
        <h1 class="cal-title">Let’s find a time</h1>
        <p class="cal-tagline">
          Grab a slot below — calls happen over Google Meet.
        </p>
      </header>

      <p v-if="fellBackToDefault" class="cal-fallback-note">
        That meeting type isn’t available right now — showing my default
        30-minute slot instead.
      </p>

      <ClientOnly>
        <div id="cal-embed" class="cal-embed-container" />
        <template #fallback>
          <p class="cal-loading">warming up the calendar…</p>
        </template>
      </ClientOnly>

      <section class="api-section">
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
      </section>
    </div>
  </div>
</template>

<style scoped>
.cal-header {
  @apply mb-8;
}
.cal-back {
  @apply inline-block font-mono text-2xs uppercase tracking-widest;
  @apply text-zinc-400 transition-colors hover:text-zinc-200;
}
.cal-title {
  @apply mt-3 text-3xl font-light text-zinc-900 dark:text-zinc-100;
}
.cal-tagline {
  @apply mt-2 max-w-prose font-serif text-base text-zinc-600 dark:text-zinc-300;
}

.cal-embed-container {
  @apply w-full overflow-auto;
  min-height: 70vh;
}
.cal-loading {
  @apply py-24 text-center font-mono text-xs text-zinc-500;
}
.cal-fallback-note {
  @apply mb-4 font-mono text-2xs text-amber-600 dark:text-amber-400;
}

.api-section {
  @apply mx-auto mt-12 max-w-2xl border-t pt-8;
  @apply border-zinc-200 dark:border-zinc-800;
  opacity: 0.6;
  transition: opacity 0.2s;
}
.api-section:hover {
  opacity: 1;
}
.api-section h2 {
  @apply font-mono text-2xs font-normal lowercase tracking-wider text-zinc-500;
  margin-bottom: 0.5rem;
}
.api-note {
  @apply font-mono text-2xs text-zinc-500;
  margin: 0.75rem 0 0.4rem;
}
.code-block pre {
  @apply overflow-x-auto rounded border border-zinc-200 dark:border-zinc-800;
  margin: 0;
  padding: 0.75rem 1rem;
  background: transparent;
}
.code-block code {
  @apply font-mono text-2xs leading-5 text-zinc-600 dark:text-zinc-400;
}
</style>
