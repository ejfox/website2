<template>
  <main class="max-w-4xl mx-auto px-4 py-8">
    <!-- Header -->
    <header class="space-y-8 mb-16">
      <div>
        <h1 class="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Site Map
        </h1>
        <p class="text-zinc-600 dark:text-zinc-400 mt-2">
          Complete navigation of ejfox.com — find everything here
        </p>
      </div>
    </header>

    <!-- Navigation sections -->
    <div class="grid md:grid-cols-2 gap-12">
      <!-- Main Pages -->
      <section class="space-y-6">
        <div>
          <div class="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 mb-4">
            MAIN_PAGES
          </div>
          <div class="space-y-3">
            <SitemapLink 
              to="/" 
              title="Home" 
              description="Personal homepage with latest updates and featured content"
            />
            <SitemapLink 
              to="/blog" 
              title="Blog" 
              description="Technical writing, tutorials, and thoughts on technology"
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
          <div class="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 mb-4">
            DATA_&_TOOLS
          </div>
          <div class="space-y-3">
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
              to="/predictions" 
              title="Predictions" 
              description="Cryptographically verified forecasts and predictions"
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
      <section class="space-y-6">
        <div>
          <div class="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 mb-4">
            COLLECTIONS
          </div>
          <div class="space-y-3">
            <SitemapLink 
              to="/scrapbook" 
              title="Scrapbook" 
              description="Visual collection of inspiration and interesting finds"
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
          <div class="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 mb-4">
            FEEDS_&_APIs
          </div>
          <div class="space-y-3">
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
          <div class="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 mb-4">
            EXTERNAL_LINKS
          </div>
          <div class="space-y-3">
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

    <!-- Footer info -->
    <footer class="mt-16 pt-8">
      <div class="text-xs text-zinc-500 space-y-2">
        <p>
          This sitemap provides human-readable navigation of the entire site.
        </p>
        <p>
          For search engines, see the <NuxtLink to="/sitemap.xml" class="underline hover:text-zinc-700 dark:hover:text-zinc-300">
            XML sitemap
          </NuxtLink>.
        </p>
      </div>
    </footer>
  </main>
</template>

<script setup>
useSeoMeta({
  title: 'Site Map | ejfox.com',
  description: 'Complete navigation and overview of ejfox.com pages and sections',
  ogTitle: 'Site Map | ejfox.com',
  ogDescription: 'Complete navigation and overview of ejfox.com'
})
</script>