<script setup>
// Fetch blog posts from manifest
const { data: manifest, error: manifestError } = await useFetch('/api/manifest')

// Fetch tags for counting
const { data: tags, error: tagsError } = await useFetch('/tags.json')

// One manifest, three kinds of thing. Mirrors isSpecialSection in
// server/utils/sitemapEntries.ts so these counts match /sitemap.xml.
const kindOf = (slug = '') => {
  if (slug.startsWith('projects/')) return 'project'
  if (slug.startsWith('reading/')) return 'reading'
  if (slug === 'index' || /^(?:drafts|robots)\//.test(slug)) return 'other'
  return 'post'
}
const published = computed(() =>
  (manifest.value || []).filter((p) => p?.slug && !p.hidden && !p.draft)
)
const ofKind = (kind) => published.value.filter((p) => kindOf(p.slug) === kind)

const blogPosts = computed(() => ofKind('post').filter((p) => p.date))
const totalPosts = computed(() => blogPosts.value.length)
const totalProjects = computed(() => ofKind('project').length)
const totalReading = computed(() => ofKind('reading').length)

const recentPosts = computed(() =>
  [...blogPosts.value]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10)
)

const postYears = computed(() =>
  blogPosts.value
    .map((p) => new Date(p.date).getFullYear())
    .filter((y) => !Number.isNaN(y))
)
const lastUpdated = computed(() => {
  const times = published.value
    .map((p) => new Date(p.date).getTime())
    .filter((t) => !Number.isNaN(t))
  if (!times.length) return ''
  return new Date(Math.max(...times)).toISOString().split('T')[0]
})
// Counted from the oldest post, not a hardcoded start year
const yearsActive = computed(() =>
  postYears.value.length
    ? new Date().getFullYear() - Math.min(...postYears.value)
    : 0
)

const totalTags = computed(() => {
  if (!tags.value || !Array.isArray(tags.value)) return 0
  return tags.value.filter(
    (tag) => tag && typeof tag === 'string' && !tag.startsWith('!')
  ).length
})

const withCount = (n, noun) => (n ? `${n} ${noun}` : '')

// Every public page, grouped. Keep in step with STATIC_SECTIONS in
// server/routes/sitemap.xml.ts. Noindex pages (/ff, /live, /atlas,
// /api-docs, /kitchen-sink) never go here.
const sections = computed(() => [
  {
    name: 'WRITING',
    links: [
      {
        to: '/blog',
        title: 'Blog',
        description: 'Essays, guides and notes going back to 2010',
        count: withCount(totalPosts.value, 'posts'),
      },
      {
        to: '/dispatch',
        title: 'Dispatch',
        description: 'Short pieces of data journalism, with receipts',
      },
      {
        to: '/projects',
        title: 'Projects',
        description: 'Instruments, investigations and the Vulpes system',
        count: withCount(totalProjects.value, 'projects'),
      },
      {
        to: '/reading',
        title: 'Reading',
        description: 'Books I’ve read, and the highlights I saved',
        count: withCount(totalReading.value, 'books'),
      },
      {
        to: '/predictions',
        title: 'Predictions',
        description:
          'Public, timestamped predictions with calibration tracking',
      },
      {
        to: '/blog/robots',
        title: 'Robots',
        description: 'AI experiments and automation projects',
      },
    ],
  },
  {
    name: 'WORK_WITH_ME',
    links: [
      {
        to: '/consulting',
        title: 'Consulting',
        description: 'Napkin sketch Monday, working demo Friday',
      },
      {
        to: '/process',
        title: 'Process',
        description:
          'Prototypes over presentations, stress-tested before launch',
      },
      {
        to: '/case-study/nbc-big-board',
        title: 'NBC Big Board',
        description: 'Rebuilding the election touchscreen used on live TV',
      },
      {
        to: '/calendar',
        title: 'Calendar',
        description: 'Book time, or let your agent grab a link',
      },
      {
        to: '/tips',
        title: 'Tips',
        description: 'How to send a document or a lead safely',
      },
    ],
  },
  {
    name: 'ABOUT',
    links: [
      {
        to: '/now',
        title: 'Now',
        description: 'What I’m reading, building and listening to right now',
      },
      {
        to: '/verify',
        title: 'Verify',
        description: 'Identity proofs and accounts in one place',
      },
      {
        to: '/following',
        title: 'Following',
        description: 'My blogroll, the corners of the web I keep up with',
      },
      {
        to: '/updates',
        title: 'What’s New',
        description: 'How this site has changed, era by era',
      },
      {
        to: '/changelog',
        title: 'Changelog',
        description: 'Release notes, stats and the raw git log',
      },
    ],
  },
  {
    name: 'COLLECTIONS',
    links: [
      { to: '/photos', title: 'Photos', description: 'The photo blog' },
      {
        to: '/gear',
        title: 'Gear',
        description: 'Inventory of adventure and tech equipment, by weight',
      },
      {
        to: '/rides',
        title: 'Rides',
        description:
          'Motorcycle rides: GPS traces, photos and field recordings',
      },
      {
        to: '/scraps',
        title: 'Scrapbook',
        description: 'Bookmarks, links and scraps from around the web',
      },
      {
        to: '/apps',
        title: 'Apps',
        description: 'Small apps for iPhone, Apple Watch and Android',
      },
      {
        to: '/flashcards',
        title: 'Flashcards',
        description: 'My flashcard deck, study along if you want',
      },
      {
        to: '/keymap',
        title: 'Keymap',
        description: 'My ZSA Voyager layout, read live from Oryx',
      },
    ],
  },
  {
    name: 'DATA_&_TOOLS',
    links: [
      {
        to: '/stats',
        title: 'Stats',
        description: 'Personal metrics from a dozen APIs, live',
      },
      {
        to: '/github',
        title: 'GitHub',
        description: 'Commit heatmap and every public repository',
      },
      {
        to: '/gists',
        title: 'Gists',
        description: 'Code snippets and quick experiments',
      },
      {
        to: '/threads',
        title: 'Threads',
        description: 'Posts, scraps and tags as one force-directed graph',
      },
      {
        to: '/on-this-day',
        title: 'On This Day',
        description: 'What happened on this date in past years',
      },
      {
        to: '/external-links',
        title: 'External Links',
        description: 'Every outbound URL cited across the site',
      },
      {
        to: '/hand-drawn',
        title: 'Hand-drawn Kit',
        description: 'Notebook marginalia, scanned and sliced into components',
      },
    ],
  },
  {
    name: 'FEEDS_&_APIs',
    links: [
      {
        to: '/rss.xml',
        title: 'RSS Feed',
        description: 'Blog posts as they publish',
        external: true,
      },
      {
        to: '/feed.json',
        title: 'JSON Feed',
        description: 'The same feed, as JSON Feed',
        external: true,
      },
      {
        to: '/dispatch-rss.xml',
        title: 'Dispatch RSS',
        description: 'New Dispatch pieces',
        external: true,
      },
      {
        to: '/scraps-rss.xml',
        title: 'Scraps RSS',
        description: 'Links and bookmarks as they’re saved',
        external: true,
      },
      {
        to: '/gists-rss.xml',
        title: 'Gists RSS',
        description: 'New gists',
        external: true,
      },
      {
        to: '/robots-rss.xml',
        title: 'Robots RSS',
        description: 'AI experiment posts',
        external: true,
      },
      {
        to: '/archive.epub',
        title: 'Blog Archive (EPUB)',
        description: 'Every post as one e-book, to read offline',
        external: true,
      },
      {
        to: '/photos.epub',
        title: 'Photos (EPUB)',
        description: 'The photo blog as an e-book, images included',
        external: true,
      },
      {
        to: '/api/stats',
        title: 'Stats API',
        description: 'JSON endpoint for personal metrics',
        external: true,
      },
      {
        to: '/sitemap.xml',
        title: 'XML Sitemap',
        description: 'This page, for search engines',
        external: true,
      },
    ],
  },
  {
    name: 'ELSEWHERE',
    links: [
      {
        to: 'https://github.com/ejfox',
        title: 'GitHub',
        description: 'Open source code and contributions',
        external: true,
      },
      {
        to: 'https://linkedin.com/in/ejfox',
        title: 'LinkedIn',
        description: 'Professional network and experience',
        external: true,
      },
    ],
  },
])

usePageSeo({
  title: 'Site Map | ejfox.com',
  description:
    'Complete navigation and overview of ejfox.com pages, tools, and collections.',
  type: 'website',
  section: 'Meta',
  tags: ['Sitemap', 'Navigation', 'Site index'],
  label1: 'Posts indexed',
  data1: computed(() => `${totalPosts.value} articles`),
})
</script>

<template>
  <div data-page-main class="max-w-4xl mx-auto px-4 pt-8">
    <!-- Header -->
    <header class="space-y-6 mb-12">
      <div>
        <h1 class="sitemap-title">Site Map</h1>
        <p class="text-zinc-600 dark:text-zinc-400 mt-2">
          Complete navigation of ejfox.com — find everything here
        </p>
        <p class="text-zinc-500 dark:text-zinc-500 font-mono text-3xs">
          Updated {{ lastUpdated || 'live' }}
        </p>
      </div>
    </header>

    <!-- Navigation sections -->
    <div class="grid md:grid-cols-2 gap-x-8 gap-y-10">
      <section v-for="section in sections" :key="section.name">
        <div class="sitemap-section-header">{{ section.name }}</div>
        <div class="stack-4">
          <SitemapLink
            v-for="link in section.links"
            :key="link.to"
            :to="link.to"
            :title="link.title"
            :description="
              link.count
                ? `${link.description} · ${link.count}`
                : link.description
            "
            :external="link.external"
          />
        </div>
      </section>
    </div>

    <!-- Error State -->
    <div
      v-if="manifestError || tagsError"
      class="text-center py-8 text-red-600 dark:text-red-400"
    >
      Failed to load data
    </div>

    <!-- Dynamic Content Section -->
    <div v-else class="mt-16 space-y-8">
      <!-- Recent Blog Posts -->
      <section v-if="recentPosts.length">
        <div class="sitemap-section-header">RECENT_POSTS</div>
        <div class="grid md:grid-cols-2 gap-4">
          <NuxtLink
            v-for="post in recentPosts"
            :key="post.slug"
            :to="`/blog/${post.slug}`"
            class="card-link"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <div class="title-card">
                  {{ post.title }}
                </div>
                <div class="text-xs text-zinc-500 mt-2">
                  {{ formatShortDate(post.date) }}
                  <span v-if="post.tags?.length" class="ml-2">
                    · {{ post.tags[0] }}
                  </span>
                </div>
              </div>
            </div>
          </NuxtLink>
        </div>
      </section>

      <!-- Stats Summary -->
      <section>
        <div class="sitemap-section-header">SITE_STATS</div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="stat-card">
            <div class="stat-value">
              {{ totalPosts }}
            </div>
            <div class="stat-label mt-2">Blog Posts</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">
              {{ totalProjects }}
            </div>
            <div class="stat-label mt-2">Projects</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">
              {{ totalTags }}
            </div>
            <div class="stat-label mt-2">Tags</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">
              {{ yearsActive }}
            </div>
            <div class="stat-label mt-2">Years Online</div>
          </div>
        </div>
      </section>
    </div>

    <!-- Footer info -->
    <footer class="mt-16 pt-8">
      <div class="text-xs text-zinc-500 space-y-2">
        <p>
          This sitemap provides human-readable navigation of the entire site.
        </p>
        <p>
          For search engines, see the
          <NuxtLink
            to="/sitemap.xml"
            class="underline hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            XML sitemap </NuxtLink
          >.
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.sitemap-title {
  @apply text-2xl font-light text-zinc-900 dark:text-zinc-100 tracking-tight;
}

.sitemap-section-header {
  @apply text-xs font-mono uppercase tracking-wider text-zinc-500 mb-4;
}

.stat-card {
  @apply text-center p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg;
}

.stat-value {
  @apply text-2xl font-bold text-zinc-900 dark:text-zinc-100;
}
</style>
