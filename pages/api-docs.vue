<script setup lang="ts">
// Private, OpenAPI-style browser for every server API route. Hidden like
// /kitchen-sink: layout:false, noindex (meta here + X-Robots-Tag in nuxt.config),
// not in nav or sitemap. Driven entirely by utils/apiCatalog.ts — the same source
// that generates /openapi.json — so it can't drift from reality (guarded by
// server/api/__tests__/api-catalog.test.ts).
import { computed, ref } from 'vue'
import {
  apiCatalog,
  apiGroups,
  type ApiRoute,
  type ApiMethod,
  type ApiHealth,
  type ApiConsumer,
} from '~/utils/apiCatalog'

definePageMeta({ layout: false })
useHead({
  title: 'API Docs · ejfox.com',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

const query = ref('')
const showReviewOnly = ref(false)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return apiCatalog.filter((r) => {
    if (showReviewOnly.value && r.consumer !== 'review') return false
    if (!q) return true
    return (
      r.path.toLowerCase().includes(q) ||
      r.summary.toLowerCase().includes(q) ||
      r.deps.toLowerCase().includes(q) ||
      r.consumedBy.toLowerCase().includes(q)
    )
  })
})

const grouped = computed(() =>
  apiGroups
    .map((group) => ({
      group,
      routes: filtered.value.filter((r) => r.group === group),
    }))
    .filter((g) => g.routes.length > 0)
)

const reviewCount = computed(
  () => apiCatalog.filter((r) => r.consumer === 'review').length
)

const reviewBtnClass = computed(() =>
  showReviewOnly.value
    ? 'bg-amber-600 border-amber-600 text-white'
    : 'bg-surface border-zinc-700 text-amber-500 hover:border-amber-500'
)

const methodClass: Record<ApiMethod, string> = {
  GET: 'bg-emerald-600 text-white',
  POST: 'bg-blue-600 text-white',
  PATCH: 'bg-amber-600 text-white',
}
const healthClass: Record<ApiHealth, string> = {
  ok: 'text-zinc-400',
  'empty-catch': 'text-amber-500',
  fragile: 'text-red-500',
}
const consumerClass: Record<ApiConsumer, string> = {
  frontend: 'text-zinc-400',
  aggregated: 'text-sky-400',
  external: 'text-violet-400',
  review: 'text-amber-500',
}

function pathFor(r: ApiRoute) {
  return r.path
}
</script>

<template>
  <div class="min-h-screen bg-page text-zinc-200 font-mono">
    <div class="max-w-screen-lg mx-auto px-4 md:px-8 py-10">
      <!-- Header -->
      <header class="mb-8">
        <h1 class="text-3xl font-display tracking-tight text-zinc-100">
          ejfox.com API
        </h1>
        <p class="mt-2 text-sm text-zinc-400 max-w-prose">
          {{ apiCatalog.length }} routes. Read-only GETs unless noted. Source of
          truth:
          <code class="text-zinc-300">utils/apiCatalog.ts</code>
          . Machine spec:
          <a
            href="/openapi.json"
            class="text-sky-400 underline hover:text-sky-300"
          >
            /openapi.json
          </a>
          .
        </p>
      </header>

      <!-- Controls -->
      <div class="flex flex-wrap items-center gap-3 mb-6">
        <input
          v-model="query"
          type="search"
          placeholder="filter routes, deps, callers…"
          class="flex-1 min-w-[240px] bg-surface border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-sky-500"
        />
        <button
          class="px-3 py-2 text-2xs rounded border transition-colors"
          :class="reviewBtnClass"
          @click="showReviewOnly = !showReviewOnly"
        >
          ⚠ needs review ({{ reviewCount }})
        </button>
      </div>

      <!-- Legend -->
      <div
        class="flex flex-wrap gap-x-5 gap-y-1 mb-8 text-2xs text-zinc-500 border-b border-zinc-800 pb-4"
      >
        <span>
          <span class="text-sky-400">aggregated</span>
          = pulled by /stats
        </span>
        <span>
          <span class="text-violet-400">external</span>
          = called from outside the app
        </span>
        <span>
          <span class="text-amber-500">review</span>
          = no caller, decide its fate
        </span>
        <span>
          <span class="text-amber-500">empty-catch</span>
          = swallows upstream errors
        </span>
        <span>
          <span class="text-red-500">fragile</span>
          = throws if data missing
        </span>
      </div>

      <!-- Groups -->
      <section v-for="g in grouped" :key="g.group" class="mb-10">
        <h2
          class="text-2xs uppercase tracking-widest text-zinc-500 mb-3 sticky top-0 bg-page py-2"
        >
          {{ g.group }}
          <span class="text-zinc-600">· {{ g.routes.length }}</span>
        </h2>

        <ul class="space-y-px">
          <li
            v-for="r in g.routes"
            :key="r.method + r.path"
            class="bg-surface hover:bg-raised transition-colors rounded px-3 py-2.5"
          >
            <div class="flex items-baseline gap-3 flex-wrap">
              <span
                class="text-4xs font-bold px-1.5 py-0.5 rounded shrink-0 w-12 text-center"
                :class="methodClass[r.method]"
              >
                {{ r.method }}
              </span>
              <code class="text-sm text-zinc-100 break-all">
                {{ pathFor(r) }}
              </code>
              <span class="text-xs text-zinc-400 flex-1 min-w-[200px]">
                {{ r.summary }}
              </span>
            </div>

            <div
              class="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5 pl-[3.75rem] text-4xs"
            >
              <span :class="consumerClass[r.consumer]">
                {{ r.consumer }} · {{ r.consumedBy }}
              </span>
              <span class="text-zinc-500">{{ r.deps }}</span>
              <span :class="healthClass[r.health]">{{ r.health }}</span>
              <span v-if="r.note" class="text-amber-500/80">{{ r.note }}</span>
            </div>
          </li>
        </ul>
      </section>

      <p v-if="grouped.length === 0" class="text-zinc-500 text-sm">
        No routes match “{{ query }}”.
      </p>
    </div>
  </div>
</template>
