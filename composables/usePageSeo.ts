import { useSeoMeta } from '#imports'
import { computed, unref, type MaybeRef } from 'vue'
import { ogImageFor } from '~/utils/ogImage'

type PageSeoInput = {
  title: MaybeRef<string>
  description: MaybeRef<string>
  type?: 'website' | 'article'
  image?: MaybeRef<string | undefined>
  canonical?: MaybeRef<string>
  tags?: MaybeRef<string[]>
  section?: MaybeRef<string>
  publishedTime?: MaybeRef<string | undefined>
  modifiedTime?: MaybeRef<string | undefined>
  label1?: MaybeRef<string>
  data1?: MaybeRef<string>
  label2?: MaybeRef<string>
  data2?: MaybeRef<string>
  imageAlt?: MaybeRef<string>
  /**
   * Emit this helper's own JSON-LD. Default true. Pass `false` on pages that
   * render their own, richer schema (blog posts, reading notes, gear…) so the
   * page doesn't carry two competing objects (e.g. two `Article`s).
   */
  schema?: boolean
}

const AUTHOR = { '@type': 'Person', name: 'EJ Fox', url: 'https://ejfox.com' }

/**
 * Shared helper to set page-level SEO/OG/Twitter meta with sensible defaults.
 *
 * Every input may be a plain value, a ref or a computed, and the head stays
 * REACTIVE to it: pages that call this before their data loads (e.g. the Peter
 * Todd page, which calls it ahead of `await useAsyncData`) get the loaded
 * title/description/dates, not the fallbacks captured at call time.
 */
export function usePageSeo(input: PageSeoInput) {
  const runtimeConfig = useRuntimeConfig()
  const route = useRoute()

  const baseUrl = runtimeConfig.public?.baseUrl || 'https://ejfox.com'

  const title = computed(() => unref(input.title) || 'EJ Fox')
  const description = computed(
    () =>
      unref(input.description) || 'EJ Fox — Data visualization and journalism.'
  )

  const tags = computed<string[]>(() => {
    const rawTags = unref(input.tags)
    return Array.isArray(rawTags) ? rawTags : rawTags ? [rawTags] : []
  })

  // Cloudinary images get a true 1200x630 crop; anything else whose size we
  // can't know gets no declared dimensions rather than wrong ones.
  const og = computed(() =>
    ogImageFor(unref(input.image), new URL('/og-image.png', baseUrl).href)
  )
  const canonical = computed(
    () => unref(input.canonical) || new URL(route.path || '/', baseUrl).href
  )

  const imageAlt = computed(
    () => unref(input.imageAlt) || `${title.value} — EJ Fox`
  )

  useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogType: input.type || 'website',
    ogUrl: canonical,
    ogImage: () => og.value.url,
    ogImageAlt: imageAlt,
    ogImageWidth: () => og.value.width,
    ogImageHeight: () => og.value.height,
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: () => og.value.url,
    twitterImageAlt: imageAlt,
    twitterLabel1: () => unref(input.label1),
    twitterData1: () => unref(input.data1),
    twitterLabel2: () => unref(input.label2),
    twitterData2: () => unref(input.data2),
  })

  useHead(() => {
    const publishedTime = unref(input.publishedTime)
    const modifiedTime = unref(input.modifiedTime)
    const section = unref(input.section)
    const isArticle = input.type === 'article'

    return {
      link: [{ rel: 'canonical', href: canonical.value }],
      meta: [
        publishedTime
          ? { property: 'article:published_time', content: publishedTime }
          : null,
        modifiedTime
          ? { property: 'article:modified_time', content: modifiedTime }
          : null,
        section ? { property: 'article:section', content: section } : null,
        ...tags.value.map((tag) => ({
          property: 'article:tag',
          content: tag,
        })),
      ].filter(Boolean) as Array<{ property: string; content: string }>,
      script:
        input.schema === false
          ? []
          : [
              {
                type: 'application/ld+json',
                innerHTML: JSON.stringify({
                  '@context': 'https://schema.org',
                  '@type': isArticle ? 'Article' : 'WebPage',
                  headline: title.value,
                  description: description.value,
                  url: canonical.value,
                  image: og.value.url,
                  inLanguage: 'en-US',
                  ...(isArticle
                    ? {
                        author: AUTHOR,
                        publisher: AUTHOR,
                        ...(publishedTime
                          ? { datePublished: publishedTime }
                          : {}),
                        ...(modifiedTime || publishedTime
                          ? { dateModified: modifiedTime || publishedTime }
                          : {}),
                        ...(section ? { articleSection: section } : {}),
                      }
                    : {}),
                  about: tags.value.map((tag) => ({
                    '@type': 'Thing',
                    name: tag,
                  })),
                }),
              },
            ],
    }
  })
}
