import chroma from 'chroma-js'
import striptags from 'striptags'

interface CrownedPostOptions {
  slug: string
  bodyClass: string
  hue: number
  fallbackTitle?: string
}

/**
 * Composable for crowned posts. Handles data fetching, SEO, palette, etc.
 *
 * IMPORTANT: All Nuxt composable calls (useRuntimeConfig, useHead, etc.)
 * happen BEFORE any await to preserve the Nuxt instance context.
 */
export async function useCrownedPost(options: CrownedPostOptions) {
  const { slug, bodyClass, hue, fallbackTitle } = options
  const cacheKey = slug.replace(/\//g, '-')

  // --- Synchronous composable calls FIRST (before any await) ---
  const config = useRuntimeConfig()
  const processedMarkdown = useProcessedMarkdown()
  const baseURL = config.public?.baseURL || 'https://ejfox.com'

  // --- Color palette (pure computation, no async) ---
  const palette = {
    accent:      chroma.hcl(hue, 40, 60).css(),
    accentDim:   chroma.hcl(hue, 25, 40).css(),
    accentGlow:  chroma.hcl(hue, 50, 70).css(),
    accentFaint: chroma.hcl(hue, 15, 30).alpha(0.15).css(),
    warm:        chroma.hcl(hue + 40, 30, 55).css(),
    cool:        chroma.hcl(hue - 30, 25, 50).css(),
    eerie:       chroma.hcl(hue - 60, 35, 45).css(),
    bg:          '#050508',
    surface:     chroma.hcl(hue, 5, 12).css(),
    surfaceHi:   chroma.hcl(hue, 8, 18).css(),
    text:        chroma.hcl(hue, 8, 78).css(),
    textDim:     chroma.hcl(hue, 6, 58).css(),
    textMuted:   chroma.hcl(hue, 4, 40).css(),
  }

  // --- Layout takeover (must call useHead before await) ---
  useHead({
    htmlAttrs: { lang: 'en' },
    bodyAttrs: { class: bodyClass },
    style: [{
      innerHTML: `:root {
        --pt-accent: ${palette.accent};
        --pt-accent-dim: ${palette.accentDim};
        --pt-accent-glow: ${palette.accentGlow};
        --pt-accent-faint: ${palette.accentFaint};
        --pt-warm: ${palette.warm};
        --pt-cool: ${palette.cool};
        --pt-eerie: ${palette.eerie};
        --pt-bg: ${palette.bg};
        --pt-surface: ${palette.surface};
        --pt-surface-hi: ${palette.surfaceHi};
        --pt-text: ${palette.text};
        --pt-text-dim: ${palette.textDim};
        --pt-text-muted: ${palette.textMuted};
      }`
    }],
  })

  // --- Data fetching (await calls) ---
  const { data: post } = await useAsyncData(
    `post-${cacheKey}`,
    () => $fetch(`/api/posts/${slug}`)
  )

  const { data: nextPrevPosts } = await useAsyncData(
    `next-prev-${cacheKey}`,
    () => processedMarkdown.getNextPrevPosts(slug).catch(() => ({ next: null, prev: null }))
  )

  const { data: allPosts } = await useAsyncData(
    `all-posts-for-related-${cacheKey}`,
    () => processedMarkdown.getAllPosts(false, false).catch(() => [])
  )

  // --- Computed metadata (after data is available) ---
  const { stats: readingStats } = useReadingStats(post)

  const postTitle = computed(() =>
    post.value?.metadata?.title || post.value?.title || fallbackTitle || slug.split('/').pop()?.replace(/-/g, ' ') || ''
  )

  const { renderedHtml: renderedTitle, startAnimation } = useTypingAnimation(postTitle)

  const postUrl = computed(() => `${baseURL}/blog/${slug}`)

  const postDescription = computed(() => {
    const dek = post.value?.metadata?.dek || post.value?.dek
    if (dek) return dek
    const text = striptags(post.value?.html || '').replace(/\s+/g, ' ').trim()
    return text.length > 160 ? text.substring(0, 157) + '...' : text
  })

  const heroImage = computed(() =>
    post.value?.metadata?.image || post.value?.metadata?.ogImage || `${baseURL}/og-image.png`
  )

  const articleTags = computed(() => post.value?.metadata?.tags || post.value?.tags || [])

  const relatedPosts = computed(() => {
    if (!allPosts.value || !post.value) return []
    const currentTags = post.value.metadata?.tags || post.value.tags || []
    if (!currentTags.length) return []
    return allPosts.value
      .filter((p: any) => {
        const pSlug = p.slug || p.metadata?.slug
        return pSlug !== slug && !p.draft && !p.metadata?.draft && !p.hidden && !p.metadata?.hidden
      })
      .map((p: any) => {
        const tags = p.metadata?.tags || p.tags || []
        const overlappingTags = tags.filter((t: string) => currentTags.includes(t))
        return { post: p, score: overlappingTags.length, overlappingTags }
      })
      .filter((item: any) => item.score > 0)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 3)
  })

  // --- SEO (after computed values exist) ---
  usePageSeo({
    title: postTitle,
    description: postDescription,
    type: 'article',
    tags: articleTags,
    image: heroImage,
  })

  return {
    post, nextPrevPosts, relatedPosts, readingStats,
    postTitle, postUrl, postDescription, heroImage, articleTags,
    renderedTitle, startAnimation,
    palette, hue, baseURL,
  }
}
