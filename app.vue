<!--
  @file app.vue
  @description Root component: site-wide default <head> (title template,
    OG/Twitter fallbacks, theme-color, canonical, Person JSON-LD), a small
    inline critical-CSS block, and the per-page `.json` alternate link
    (utils/jsonTwin.ts). Pages override these defaults via
    composables/usePageSeo.ts.
    Gotcha: the critical CSS styles bare `main` and [data-page-main];
    layouts/default.vue resets its own <main> so that rule only hits pages.
-->
<script setup>
const route = useRoute()
const runtimeConfig = useRuntimeConfig()

const baseUrl = computed(
  () => runtimeConfig.public?.baseUrl || 'https://ejfox.com'
)
const canonicalUrl = computed(
  () => new URL(route.path || '/', baseUrl.value).href
)

const defaultTitle = 'EJ Fox | Data Visualization & Investigative Storytelling'
const defaultDescription =
  'Data visualization engineer and journalist building newsroom-grade tools, climate dashboards, and public-interest investigations through room302.studio.'

const ogImage = computed(() => new URL('/og-image.png', baseUrl.value).href)
const structuredPerson = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'EJ Fox',
  url: baseUrl.value,
  image: ogImage.value,
  jobTitle: 'Data Visualization Engineer & Journalist',
  worksFor: {
    '@type': 'Organization',
    name: 'room302.studio',
    url: 'https://room302.studio',
  },
  knowsAbout: [
    'Data visualization',
    'Investigative journalism',
    'Interactive storytelling',
    'D3.js',
    'Newsroom tooling',
  ],
  sameAs: [
    'https://mastodon.social/@ejfox',
    'https://github.com/ejfox',
    'https://linkedin.com/in/ejfox',
    'https://room302.studio',
  ],
  description: defaultDescription,
}))

// ── Site-wide head defaults ─────────────────────────────────
// Inline critical CSS (dark mode handling moved to plugins/dark-mode.client.js)
useHead({
  title: defaultTitle,
  titleTemplate: (titleChunk) => {
    if (!titleChunk) return defaultTitle
    return titleChunk.includes('EJ Fox') ? titleChunk : `${titleChunk} | EJ Fox`
  },
  meta: [
    { key: 'description', name: 'description', content: defaultDescription },
    { key: 'author', name: 'author', content: 'EJ Fox' },
    { key: 'robots', name: 'robots', content: 'index, follow' },
    {
      key: 'og:site_name',
      property: 'og:site_name',
      content: 'EJ Fox',
    },
    { key: 'og:title', property: 'og:title', content: defaultTitle },
    {
      key: 'og:description',
      property: 'og:description',
      content: defaultDescription,
    },
    { key: 'og:locale', property: 'og:locale', content: 'en_US' },
    { key: 'og:image', property: 'og:image', content: ogImage.value },
    {
      key: 'og:image:alt',
      property: 'og:image:alt',
      content: 'Selected data visualization work by EJ Fox',
    },
    {
      key: 'twitter:card',
      name: 'twitter:card',
      content: 'summary_large_image',
    },
    { key: 'twitter:site', name: 'twitter:site', content: '@mrejfox' },
    { key: 'twitter:creator', name: 'twitter:creator', content: '@mrejfox' },
    { key: 'twitter:title', name: 'twitter:title', content: defaultTitle },
    {
      key: 'twitter:description',
      name: 'twitter:description',
      content: defaultDescription,
    },
    { key: 'twitter:image', name: 'twitter:image', content: ogImage.value },
    {
      key: 'twitter:image:alt',
      name: 'twitter:image:alt',
      content: 'Selected data visualization work by EJ Fox',
    },
    {
      key: 'theme-color-dark',
      name: 'theme-color',
      content: '#000000',
      media: '(prefers-color-scheme: dark)',
    },
    {
      key: 'theme-color-light',
      name: 'theme-color',
      content: '#ffffff',
      media: '(prefers-color-scheme: light)',
    },
  ],
  link: [{ key: 'canonical', rel: 'canonical', href: canonicalUrl.value }],
  script: [
    {
      key: 'schema-person',
      type: 'application/ld+json',
      // innerHTML, NOT children — unhead renders `children` as an HTML
      // attribute, leaving the script body empty (schema invisible to
      // parsers). Same bug class as the projects ItemList.
      innerHTML: JSON.stringify(structuredPerson.value),
    },
  ],
  style: [
    {
      innerHTML: `
        *{margin:0;padding:0;box-sizing:border-box}
        body{
          font-family:Georgia,serif;line-height:1.6;
          color:#18181b;background:#fff
        }
        @media(prefers-color-scheme:dark){
          body{color:#fafafa;background:#000}
        }
        main,:where([data-page-main]){padding:1rem;max-width:48rem;margin:0 auto}
        @media(min-width:768px){main,:where([data-page-main]){padding:2rem}}
        h1{font-size:2rem;font-weight:700;margin-bottom:1rem}
        p{margin:1rem 0}
        a{color:inherit;text-decoration:underline}
        #app{min-height:100vh}
      `,
      tagPosition: 'head',
    },
  ],
})

// ── JSON twin link ──────────────────────────────────────────
// Pages in sections the twin can answer for advertise their `.json` twin
// (server/middleware/json-twin.ts, utils/jsonTwin.ts). Function form so
// `route.path` stays correct across client-side navigation.
const jsonTwinUrl = computed(() => {
  const p =
    route.path === '/' ? '/.json' : `${route.path.replace(/\/$/, '')}.json`
  return new URL(p, baseUrl.value).href
})
useHead(() => ({
  link: hasJsonTwin(route.path)
    ? [
        {
          key: 'alternate-json',
          rel: 'alternate',
          type: 'application/json',
          href: jsonTwinUrl.value,
          title: 'This page as JSON',
        },
      ]
    : [],
}))
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
