<script setup>
// Friends & Family booking — a hidden, unlisted page handed out via direct
// link only. NOT in nav, NOT in the sitemap, and noindexed three ways:
//   1. <meta name="robots" content="noindex, nofollow"> (below)
//   2. X-Robots-Tag: noindex header (routeRules in nuxt.config.ts)
//   3. absence from the sitemap whitelist (server/routes/sitemap.xml.ts)
// "Hidden" is not "private": anyone with the link can book — that's the point.
useHead({
  title: 'Book Time — Friends & Family · EJ Fox',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

// Cal.com inline embed (vanilla loader — framework-agnostic, no extra deps).
onMounted(() => {
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
    config: { layout: 'month_view', theme: 'dark' },
    calLink: 'ejfox/ff',
  })
})
</script>

<template>
  <div class="mx-auto w-full max-w-4xl px-4 py-12">
    <header class="mb-8">
      <h1 class="text-2xl font-light text-zinc-900 dark:text-zinc-100">
        Book Time — Friends &amp; Family
      </h1>
      <p class="mt-1 font-mono text-xs uppercase tracking-wider text-zinc-500">
        Weeknights 6–10pm + weekends · 1 day notice
      </p>
    </header>

    <ClientOnly>
      <div
        id="cal-ff-inline"
        style="width: 100%; min-height: 70vh; overflow: scroll"
      />
      <template #fallback>
        <div class="py-24 text-center font-mono text-xs text-zinc-500">
          Loading booking calendar…
        </div>
      </template>
    </ClientOnly>
  </div>
</template>
