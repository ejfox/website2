<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

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
    'https://twitter.com/mrejfox',
    'https://github.com/ejfox',
    'https://linkedin.com/in/ejfox',
    'https://room302.studio',
  ],
  description: defaultDescription,
}))

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
    { key: 'theme-color', name: 'theme-color', content: '#18181b' },
  ],
  link: [{ key: 'canonical', rel: 'canonical', href: canonicalUrl.value }],
  script: [
    {
      key: 'schema-person',
      type: 'application/ld+json',
      children: JSON.stringify(structuredPerson.value),
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
          body{color:#fafafa;background:#18181b}
        }
        main{padding:1rem;max-width:48rem;margin:0 auto}
        @media(min-width:768px){main{padding:2rem}}
        h1{font-size:2rem;font-weight:700;margin-bottom:1rem}
        p{margin:1rem 0}
        a{color:inherit;text-decoration:underline}
        #app{min-height:100vh}
      `,
      tagPosition: 'head',
    },
  ],
})
</script>
