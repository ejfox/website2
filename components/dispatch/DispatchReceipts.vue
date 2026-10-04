<!--
  @file DispatchReceipts.vue
  @description The receipts block under a Dispatch piece: sources list, a
  numbered claims ledger (each claim → its source), and a data download.
  Tufte-dense: mono labels, serif claim text, hostnames as provenance hints.
  Renders nothing if all three are empty.
  @props sources?: {title, url}[]
  @props claims?: {text, source}[]
  @props data?: string - URL to a CSV/JSON download
  @props slug?: string - piece slug, sent as the Umami download event prop
-->
<script setup lang="ts">
interface Source {
  title: string
  url: string
}
interface Claim {
  text: string
  source?: string
}

const props = withDefaults(
  defineProps<{
    sources?: Source[]
    claims?: Claim[]
    data?: string | null
    slug?: string
  }>(),
  { sources: () => [], claims: () => [], data: null, slug: '' }
)

const hasAny = computed(
  () => props.sources.length > 0 || props.claims.length > 0 || !!props.data
)

function host(url?: string): string {
  if (!url) return ''
  try {
    return new URL(url, 'https://ejfox.com').hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

const dataFormat = computed(() => {
  const m = props.data?.split(/[?#]/)[0]?.match(/\.([a-z0-9]+)$/i)
  return m?.[1] ? m[1].toUpperCase() : 'DATA'
})
</script>

<template>
  <section
    v-if="hasAny"
    class="dispatch-receipts max-w-prose border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-6"
    aria-labelledby="receipts-heading"
  >
    <h2
      id="receipts-heading"
      class="font-mono text-2xs uppercase tracking-wider text-zinc-500 mb-4"
    >
      Receipts
    </h2>

    <!-- Claims ledger -->
    <div v-if="claims.length" class="mb-6">
      <h3 class="receipts-label">Claims</h3>
      <ol class="divide-y divide-zinc-200 dark:divide-zinc-800">
        <li
          v-for="(claim, i) in claims"
          :key="i"
          class="grid grid-cols-[2ch_1fr_auto] gap-x-3 py-2 items-baseline"
        >
          <span class="font-mono text-3xs tabular-nums text-zinc-400">
            {{ i + 1 }}
          </span>
          <span
            class="font-serif text-sm leading-6 text-zinc-800 dark:text-zinc-200"
          >
            {{ claim.text }}
          </span>
          <a
            v-if="claim.source"
            :href="claim.source"
            :title="claim.source"
            data-umami-event="dispatch-source-click"
            :data-umami-event-host="host(claim.source)"
            class="font-mono text-3xs uppercase tracking-wider text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 whitespace-nowrap"
            rel="noopener"
          >
            source ↗
          </a>
          <span v-else class="font-mono text-3xs text-zinc-400">—</span>
        </li>
      </ol>
    </div>

    <!-- Sources -->
    <div v-if="sources.length" class="mb-6">
      <h3 class="receipts-label">Sources</h3>
      <ol class="space-y-1">
        <li
          v-for="(source, i) in sources"
          :key="source.url"
          class="grid grid-cols-[2ch_1fr] gap-x-3 items-baseline"
        >
          <span class="font-mono text-3xs tabular-nums text-zinc-400">
            {{ i + 1 }}
          </span>
          <span class="text-sm leading-6">
            <a
              :href="source.url"
              data-umami-event="dispatch-source-click"
              :data-umami-event-host="host(source.url)"
              class="font-serif text-zinc-800 dark:text-zinc-200 underline decoration-zinc-300 dark:decoration-zinc-700 underline-offset-2 hover:decoration-zinc-500"
              rel="noopener"
            >
              {{ source.title }}
            </a>
            <span
              v-if="host(source.url)"
              class="font-mono text-3xs text-zinc-500 ml-2"
            >
              {{ host(source.url) }}
            </span>
          </span>
        </li>
      </ol>
    </div>

    <!-- Data download -->
    <div v-if="data">
      <h3 class="receipts-label">Data</h3>
      <a
        :href="data"
        data-umami-event="dispatch-data-download"
        :data-umami-event-slug="slug || undefined"
        class="inline-flex items-baseline gap-2 font-mono text-xs px-2 py-1 rounded bg-raised text-zinc-800 dark:text-zinc-200 hover:opacity-80"
        download
      >
        <span aria-hidden="true">↓</span>
        Download the data
        <span class="text-3xs text-zinc-500">{{ dataFormat }}</span>
      </a>
    </div>
  </section>
</template>

<style scoped>
.receipts-label {
  @apply font-mono text-3xs uppercase tracking-wider mb-2;
  @apply text-zinc-400 dark:text-zinc-500;
}
</style>
