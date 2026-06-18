<script setup>
// Friends & Family booking — a hidden, unlisted page handed out via direct
// link only. NOT in nav, NOT in the sitemap, and noindexed three ways:
//   1. <meta name="robots" content="noindex, nofollow"> (below)
//   2. X-Robots-Tag: noindex header (routeRules in nuxt.config.ts)
//   3. absence from the sitemap whitelist (server/routes/sitemap.xml.ts)
// "Hidden" is not "private": anyone with the link can book — that's the point.
// No site chrome — this is a standalone "secret door", not part of the site nav.
definePageMeta({ layout: false })

useHead({
  title: 'Friends & Family · EJ Fox',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

// A little flavor — warm, insider, in-voice. Computed on the client so the
// time-of-day greeting and the random line don't cause a hydration mismatch.
const TAGLINES = [
  'you’ve got the secret link, which means I actually want to hang',
  'no agenda, no slides — just catching up',
  'pick a window, I’ll bring the coffee',
  'short notice is fine — that’s kind of the point',
  'the calendar’s honest: if it’s open, I’m around',
  'this link isn’t listed anywhere, so — hi, good to see you',
]
const greeting = ref('hey')
const tagline = ref(TAGLINES[0])

onMounted(() => {
  // Time-of-day greeting.
  const h = new Date().getHours()
  greeting.value =
    h < 5
      ? 'still up?'
      : h < 12
        ? 'good morning'
        : h < 17
          ? 'good afternoon'
          : h < 22
            ? 'good evening'
            : 'burning the midnight oil'

  // Random welcome line (vary by minute so it changes but stays stable-ish).
  tagline.value = TAGLINES[new Date().getMinutes() % TAGLINES.length]

  // Cal.com inline embed (vanilla loader — framework-agnostic, no extra deps).
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
          if (typeof namespace === 'string') {
            cal.ns[namespace] = cal.ns[namespace] || api
            p(cal.ns[namespace], ar)
            p(cal, ['initNamespace', namespace])
          } else {
            p(cal, ar)
          }
          return
        }
        p(cal, ar)
      }
  })(window, 'https://app.cal.com/embed/embed.js', 'init')

  window.Cal('init', 'ff', { origin: 'https://cal.com' })
  window.Cal.ns.ff('inline', {
    elementOrSelector: '#cal-ff-inline',
    config: { layout: 'month_view', theme: 'auto' },
    calLink: 'ejfox/ff',
  })
})
</script>

<template>
  <div class="ff-page min-h-screen w-full bg-white dark:bg-zinc-950">
    <div class="mx-auto w-full max-w-4xl px-4 py-12 sm:py-16">
    <header class="ff-header">
      <div class="ff-secret">
        <span class="ff-dot" />
        ACCESS&nbsp;GRANTED&nbsp;·&nbsp;FRIENDS&nbsp;&amp;&nbsp;FAMILY
      </div>

      <p class="ff-greeting">
        {{ greeting }}<span class="ff-cursor">▮</span>
      </p>

      <h1 class="ff-title">Let’s find a time</h1>

      <p class="ff-tagline">{{ tagline }}</p>

      <p class="ff-meta">weeknights 6–10pm + weekends · 1 day notice</p>
    </header>

    <ClientOnly>
      <div
        id="cal-ff-inline"
        style="width: 100%; min-height: 70vh; overflow: scroll"
      />
      <template #fallback>
        <div class="py-24 text-center font-mono text-xs text-zinc-500">
          warming up the calendar…
        </div>
      </template>
    </ClientOnly>
    </div>
  </div>
</template>

<style scoped>
.ff-header {
  @apply mb-10 animate-[ff-rise_500ms_ease-out];
}

/* "ACCESS GRANTED" terminal chip — leans into the hidden-link conceit */
.ff-secret {
  @apply inline-flex items-center gap-2 font-mono text-3xs uppercase tracking-widest
         text-emerald-600 dark:text-emerald-400;
}
.ff-dot {
  @apply inline-block h-1.5 w-1.5 rounded-full bg-emerald-500;
  animation: ff-pulse 1.8s ease-in-out infinite;
}

.ff-greeting {
  @apply mt-4 font-mono text-sm lowercase text-zinc-500 dark:text-zinc-400;
}
.ff-cursor {
  @apply ml-0.5 text-zinc-400 dark:text-zinc-500;
  animation: ff-blink 1.1s steps(1) infinite;
}

.ff-title {
  @apply mt-1 text-3xl font-light text-zinc-900 dark:text-zinc-100;
}
.ff-tagline {
  @apply mt-2 max-w-prose font-serif text-base italic text-zinc-600 dark:text-zinc-300;
}
.ff-meta {
  @apply mt-3 font-mono text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-600;
}

@keyframes ff-blink {
  0%,
  50% {
    opacity: 1;
  }
  50.01%,
  100% {
    opacity: 0;
  }
}
@keyframes ff-pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(0.7);
  }
}
@keyframes ff-rise {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Respect reduced-motion — kill the animations */
@media (prefers-reduced-motion: reduce) {
  .ff-header,
  .ff-dot,
  .ff-cursor {
    animation: none;
  }
}
</style>
