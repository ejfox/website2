<script setup>
// Friends & Family booking — a hidden, unlisted page handed out by direct link
// only. Not in nav, not in the sitemap, and noindexed three ways:
//   1. <meta name="robots" content="noindex, nofollow"> (below)
//   2. X-Robots-Tag header (routeRules in nuxt.config.ts)
//   3. absence from the sitemap whitelist (server/routes/sitemap.xml.ts)
// "Hidden" ≠ "private": anyone with the link can book — that's the point.
definePageMeta({ layout: false }) // standalone "secret door", no site chrome

useHead({
  title: 'Friends & Family · EJ Fox',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

// Warm, in-voice flavor — resolved on the client so the time-of-day greeting and
// the random tagline can't cause a hydration mismatch.
const TAGLINES = [
  'you’ve got the secret link, which means I actually want to hang',
  'no agenda, no slides — just catching up',
  'pick a window, I’ll bring the coffee',
  'short notice is fine — that’s kind of the point',
  'the calendar’s honest: if it’s open, I’m around',
  'this link isn’t listed anywhere, so — hi, good to see you',
]

// Greeting by hour-of-day — first row whose cutoff the hour falls under wins.
// Last row's cutoff (24) guarantees a match.
const GREETINGS = [
  [5, 'still up?'],
  [12, 'good morning'],
  [17, 'good afternoon'],
  [22, 'good evening'],
  [24, 'burning the midnight oil'],
]
const timeGreeting = (hour) => GREETINGS.find(([cutoff]) => hour < cutoff)[1]

const greeting = ref('hey')
const tagline = ref(TAGLINES[0])

onMounted(() => {
  const now = new Date()
  greeting.value = timeGreeting(now.getHours())
  tagline.value = TAGLINES[now.getMinutes() % TAGLINES.length]

  loadCalInline({
    namespace: 'ff',
    calLink: 'ejfox/ff',
    selector: '#cal-ff-inline',
    config: { layout: 'month_view', theme: 'auto' },
  })
})
</script>

<template>
  <div class="ff-page min-h-screen w-full bg-sunken">
    <div class="mx-auto w-full max-w-4xl px-4 py-12 sm:py-16">
      <header class="ff-header">
        <div class="ff-secret">
          <span class="ff-dot" />
          ACCESS&nbsp;GRANTED&nbsp;·&nbsp;FRIENDS&nbsp;&amp;&nbsp;FAMILY
        </div>

        <p class="ff-greeting">
          {{ greeting }}
          <span class="ff-cursor">▮</span>
        </p>

        <h1 class="ff-title">Let’s find a time</h1>

        <p class="ff-tagline">{{ tagline }}</p>

        <p class="ff-meta">weeknights 6–10pm + weekends · 1 day notice</p>
      </header>

      <ClientOnly>
        <div id="cal-ff-inline" class="ff-cal" />
        <template #fallback>
          <p class="ff-loading">warming up the calendar…</p>
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
  @apply inline-flex items-center gap-2 font-mono;
  @apply text-3xs uppercase tracking-widest;
  @apply text-emerald-600 dark:text-emerald-400;
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
  @apply mt-2 max-w-prose font-serif text-base italic;
  @apply text-zinc-600 dark:text-zinc-300;
}
.ff-meta {
  @apply mt-3 font-mono text-xs uppercase tracking-wider;
  @apply text-zinc-400 dark:text-zinc-600;
}

.ff-cal {
  @apply w-full overflow-auto;
  min-height: 70vh;
}
.ff-loading {
  @apply py-24 text-center font-mono text-xs text-zinc-500;
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
