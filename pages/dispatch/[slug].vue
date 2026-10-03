<script setup lang="ts">
import { format } from 'date-fns'
import NewsletterSignup from '~/components/blog/NewsletterSignup.vue'

interface DispatchPiece {
  slug: string
  title: string
  dek: string
  date: string | null
  image: string | null
  image_alt: string | null
  tags: string[]
  sources: Array<{ title: string; url: string }>
  data: string | null
  claims: Array<{ text: string; source: string }>
  syndication: Array<{ network: string; url: string }>
  unlisted: boolean
  draft: boolean
  scheduled: boolean
  noindex: boolean
  html: string
}

const route = useRoute()
const slug = String(route.params.slug || '')

const { data: piece, error } = await useFetch<DispatchPiece>(
  `/api/dispatch/${encodeURIComponent(slug)}`
)

if (error.value || !piece.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Dispatch not found',
    fatal: true,
  })
}

const config = useRuntimeConfig()
const baseURL = (config.public?.baseURL as string) || 'https://ejfox.com'
const pieceUrl = new URL(`/dispatch/${slug}`, baseURL).href

const p = piece.value
const publishedISO = (() => {
  if (!p.date) return undefined
  const d = new Date(p.date)
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
})()

const displayDate = computed(() => {
  if (!publishedISO) return ''
  return format(new Date(publishedISO), 'MMMM d, yyyy')
})

const NETWORK_LABELS: Record<string, string> = {
  bluesky: 'Bluesky',
  mastodon: 'Mastodon',
  x: 'X',
  twitter: 'X',
  threads: 'Threads',
  linkedin: 'LinkedIn',
}
const networkLabel = (n: string) =>
  NETWORK_LABELS[n.toLowerCase()] || n.charAt(0).toUpperCase() + n.slice(1)

usePageSeo({
  title: `${p.title} · EJ Fox`,
  description: ogDescription(p.html, { dek: p.dek, title: p.title }),
  type: 'article',
  section: 'Dispatch',
  tags: p.tags,
  image: p.image || `${baseURL}/og-image.png`,
  imageAlt: p.image_alt || undefined,
  canonical: pieceUrl,
  publishedTime: publishedISO,
})

useHead({
  meta: [
    {
      name: 'robots',
      content: p.noindex ? 'noindex, nofollow' : 'index, follow',
    },
  ],
  link: [
    {
      rel: 'alternate',
      type: 'application/rss+xml',
      title: 'EJ Fox · Dispatch',
      href: 'https://ejfox.com/dispatch-rss.xml',
    },
  ],
})
</script>

<template>
  <main v-if="piece" class="container-main pt-8 pb-16">
    <NuxtLink
      to="/dispatch"
      class="font-mono text-xs text-zinc-500 hover:underline"
    >
      ← dispatch
    </NuxtLink>

    <article class="h-entry mt-8">
      <div
        v-if="piece.draft || piece.scheduled || piece.unlisted"
        class="font-mono text-3xs uppercase tracking-wider text-amber-500 mb-3"
      >
        {{ piece.draft ? 'Draft' : piece.scheduled ? 'Scheduled' : 'Unlisted' }}
        · not in listings
      </div>

      <header class="mb-8">
        <h1
          class="p-name text-3xl sm:text-5xl font-black text-balance"
          style="line-height: 1.1; letter-spacing: -0.02em"
        >
          {{ piece.title }}
        </h1>
        <p v-if="piece.dek" class="p-summary post-dek">{{ piece.dek }}</p>
        <div
          class="font-mono text-3xs uppercase tracking-wider tabular-nums text-zinc-500 mt-4 flex flex-wrap gap-x-2"
        >
          <time
            v-if="publishedISO"
            :datetime="publishedISO"
            class="dt-published"
          >
            {{ displayDate }}
          </time>
          <span class="p-author h-card">
            ·
            <a class="p-name u-url" href="https://ejfox.com">EJ Fox</a>
          </span>
          <template v-for="tag in piece.tags" :key="tag">
            <span class="text-zinc-400">·</span>
            <span class="p-category">{{ tag }}</span>
          </template>
        </div>
        <a :href="pieceUrl" class="u-url hidden">{{ pieceUrl }}</a>
      </header>

      <figure v-if="piece.image" class="mb-8">
        <img
          :src="piece.image"
          :alt="piece.image_alt || ''"
          class="u-photo w-full h-auto rounded-sm bg-raised"
        />
      </figure>

      <div
        v-if="piece.html"
        class="blog-post-content e-content font-serif"
        v-html="piece.html"
      ></div>

      <DispatchReceipts
        :sources="piece.sources"
        :claims="piece.claims"
        :data="piece.data"
      />

      <aside
        v-if="piece.syndication.length"
        class="max-w-prose mt-6 flex flex-wrap gap-x-2 font-mono text-3xs uppercase tracking-wider text-zinc-500"
      >
        <span>Also on</span>
        <template v-for="(s, i) in piece.syndication" :key="s.url">
          <span v-if="i > 0" class="text-zinc-400" aria-hidden="true">·</span>
          <a
            :href="s.url"
            class="u-syndication text-zinc-700 dark:text-zinc-300 hover:underline"
            rel="syndication noopener"
          >
            {{ networkLabel(s.network) }}
          </a>
        </template>
      </aside>
    </article>

    <NewsletterSignup class="print:hidden" />
  </main>
</template>
