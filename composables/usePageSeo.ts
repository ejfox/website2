import { useSeoMeta } from '#imports'
import { unref, type MaybeRef } from 'vue'

type PageSeoInput = {
  title: MaybeRef<string>
  description: MaybeRef<string>
  type?: 'website' | 'article'
  image?: MaybeRef<string>
  canonical?: MaybeRef<string>
  tags?: MaybeRef<string[]>
  section?: MaybeRef<string>
  publishedTime?: MaybeRef<string>
  modifiedTime?: MaybeRef<string>
  label1?: MaybeRef<string>
  data1?: MaybeRef<string>
  label2?: MaybeRef<string>
  data2?: MaybeRef<string>
  imageAlt?: MaybeRef<string>
}

/**
 * Shared helper to set page-level SEO/OG/Twitter meta with sensible defaults.
 * Keeps markup concise across pages while staying descriptive.
 */
export function usePageSeo(input: PageSeoInput) {
  const runtimeConfig = useRuntimeConfig()
  const route = useRoute()

  const baseUrl = runtimeConfig.public?.baseUrl || 'https://ejfox.com'

  const title = unref(input.title) || 'EJ Fox'
  const description =
    unref(input.description) || 'EJ Fox — Data visualization and journalism.'

  const rawTags = unref(input.tags)
  const tags = Array.isArray(rawTags) ? rawTags : rawTags ? [rawTags] : []

  const ogImage = unref(input.image) || new URL('/og-image.png', baseUrl).href
  const canonical =
    unref(input.canonical) || new URL(route.path || '/', baseUrl).href

  const imageAlt = unref(input.imageAlt) || `${title} — EJ Fox`

  useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogType: input.type || 'website',
    ogUrl: canonical,
    ogImage,
    ogImageAlt: imageAlt,
    ogImageWidth: '1200',
    ogImageHeight: '630',
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: ogImage,
    twitterImageAlt: imageAlt,
    twitterLabel1: unref(input.label1),
    twitterData1: unref(input.data1),
    twitterLabel2: unref(input.label2),
    twitterData2: unref(input.data2),
  })

  useHead({
    link: [{ rel: 'canonical', href: canonical }],
    meta: [
      input.publishedTime
        ? {
            property: 'article:published_time',
            content: unref(input.publishedTime),
          }
        : null,
      input.modifiedTime
        ? {
            property: 'article:modified_time',
            content: unref(input.modifiedTime),
          }
        : null,
      input.section
        ? { property: 'article:section', content: unref(input.section) }
        : null,
      ...tags.map((tag) => ({
        property: 'article:tag',
        content: tag,
      })),
    ].filter(Boolean),
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': input.type === 'article' ? 'Article' : 'WebPage',
          headline: title,
          description,
          url: canonical,
          image: ogImage,
          inLanguage: 'en-US',
          about: tags.map((tag) => ({
            '@type': 'Thing',
            name: tag,
          })),
        }),
      },
    ],
  })
}
