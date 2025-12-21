<template>
  <main class="max-w-4xl mx-auto px-4 pt-8">
    <!-- Header -->
    <header class="space-y-6 mb-12">
      <div>
        <h1 class="sitemap-title">Site Map</h1>
        <p class="text-zinc-600 dark:text-zinc-400 mt-2">
          Complete navigation of ejfox.com — find everything here
        </p>
        <p class="text-zinc-500 dark:text-zinc-500 font-mono text-[11px]">
          Updated {{ lastUpdated || 'live' }}
        </p>
      </div>
    </header>

    <!-- Navigation sections -->
    <div class="grid md:grid-cols-2 gap-8">
      <!-- Main Pages -->
      <section class="space-y-8">
        <div>
          <div class="sitemap-section-header">MAIN_PAGES</div>
          <div class="stack-4">
            <SitemapLink
              to="/"
              title="Home"
              description="Homepage with latest updates"
            />
            <SitemapLink
              to="/blog"
              title="Blog"
              description="Technical writing and essays"
            />
            <SitemapLink
              to="/projects"
              title="Projects"
              description="Open source projects, experiments, and creative work"
            />
            <SitemapLink
              to="/now"
              title="Now"
              description="What I'm currently working on and thinking about"
            />
          </div>
        </div>

        <!-- Data & Tools -->
        <div>
          <div class="sitemap-section-header">DATA_&amp;_TOOLS</div>
          <div class="stack-4">
            <SitemapLink
              to="/stats"
              title="Stats"
              description="Real-time personal analytics and performance metrics"
            />
            <SitemapLink
              to="/gear"
              title="Gear"
              description="Complete inventory of adventure and tech equipment"
            />
            <SitemapLink
              to="/gists"
              title="Gists"
              description="Code snippets and quick experiments"
            />
          </div>
        </div>
      </section>

      <!-- Collections & Archives -->
      <section class="space-y-8">
        <div>
          <div class="sitemap-section-header">COLLECTIONS</div>
          <div class="stack-4">
            <SitemapLink
              to="/scrapbook"
              title="Scrapbook"
              description="Visual inspiration collection"
            />
            <SitemapLink
              to="/blog/week-notes"
              title="Week Notes"
              description="Weekly summaries and reflections"
            />
            <SitemapLink
              to="/blog/robots"
              title="Robots"
              description="AI experiments and automation projects"
            />
          </div>
        </div>

        <!-- Feeds & APIs -->
        <div>
          <div class="sitemap-section-header">FEEDS_&amp;_APIs</div>
          <div class="stack-4">
            <SitemapLink
              to="/rss.xml"
              title="RSS Feed"
              description="Subscribe to blog posts and updates"
              external
            />
            <SitemapLink
              to="/sitemap.xml"
              title="Sitemap"
              description="XML sitemap for search engines"
              external
            />
            <SitemapLink
              to="/api/stats"
              title="Stats API"
              description="JSON endpoint for personal metrics"
              external
            />
          </div>
        </div>

        <!-- External Links -->
        <div>
          <div class="sitemap-section-header">EXTERNAL_LINKS</div>
          <div class="stack-4">
            <SitemapLink
              to="https://github.com/ejfox"
              title="GitHub"
              description="Open source code and contributions"
              external
            />
            <SitemapLink
              to="https://twitter.com/ejfox"
              title="Twitter"
              description="Thoughts and updates"
              external
            />
            <SitemapLink
              to="https://linkedin.com/in/ejfox"
              title="LinkedIn"
              description="Professional network and experience"
              external
            />
          </div>
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
                  {{ formatDate(post.date) }}
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
            <div class="stat-label">Blog Posts</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">
              {{ totalProjects }}
            </div>
            <div class="stat-label">Projects</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">
              {{ totalTags }}
            </div>
            <div class="stat-label">Tags</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">
              {{ yearsActive }}
            </div>
            <div class="stat-label">Years Online</div>
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
            XML sitemap
          </NuxtLink>
          .
        </p>
      </div>
    </footer>
  </main>
</template>

<script setup>
const { formatShortDate: formatDate } = useDateFormat()

// Fetch blog posts from manifest
const { data: manifest, error: manifestError } = await useFetch('/api/manifest')

// Fetch tags for counting
const { data: tags, error: tagsError } = await useFetch('/tags.json')

const lastUpdated = computed(() => {
  const dates = []
  if (manifest.value?.length) {
    manifest.value.forEach((item) => {
      if (item?.date) {
        const timestamp = new Date(item.date).getTime()
        if (!Number.isNaN(timestamp)) dates.push(timestamp)
      }
    })
  }
  if (!dates.length) return ''
  return new Date(Math.max(...dates)).toISOString().split('T')[0]
})

// Process recent posts
const recentPosts = computed(() => {
  if (!manifest.value) return []
  return manifest.value
    .filter((post) => !post.hidden && !post.draft)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10)
})

// Calculate stats
const totalPosts = computed(() => {
  if (!manifest.value) return 0
  return manifest.value.filter((post) => !post.hidden && !post.draft).length
})

const totalProjects = computed(() => {
  if (!manifest.value) return 0
  return manifest.value.filter((post) => post.slug?.includes('projects/'))
    .length
})

const totalTags = computed(() => {
  if (!tags.value || !Array.isArray(tags.value)) return 0
  return tags.value.filter(
    (tag) => tag && typeof tag === 'string' && !tag.startsWith('!')
  ).length
})

const yearsActive = computed(() => {
  const startYear = 2018 // When the blog started
  const currentYear = new Date().getFullYear()
  return currentYear - startYear
})

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

<style scoped>
.sitemap-title {
  @apply text-2xl font-light text-zinc-900 dark:text-zinc-100 tracking-tight;
}

.sitemap-section-header {
  @apply text-xs font-mono uppercase tracking-widest text-zinc-500 mb-4;
}

.stat-card {
  @apply text-center p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg;
}

.stat-value {
  @apply text-2xl font-bold text-zinc-900 dark:text-zinc-100;
}

.stat-label {
  @apply text-xs text-zinc-500 mt-2;
}
</style>
