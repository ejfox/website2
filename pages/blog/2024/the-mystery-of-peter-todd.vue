<script setup>
/**
 * CROWNED POST: The Mystery of Peter Todd
 *
 * First coronation — dark, glitchy, mysterious.
 * Inline data fetching (not composable) for SSR compatibility.
 */

import chroma from 'chroma-js'
import { useIntersectionObserver } from '@vueuse/core'
import striptags from 'striptags'
import PostMetadataBar from '~/components/blog/post/PostMetadataBar.vue'
import PostNav from '~/components/blog/post/PostNav.vue'
import PostRelated from '~/components/blog/post/PostRelated.vue'
import Webmentions from '~/components/blog/Webmentions.vue'
import { useReadingStats } from '~/composables/useReadingStats'
import { useTypingAnimation } from '~/composables/useTypingAnimation'

const BASE_HUE = 275

// --- Palette (sync, no Nuxt instance needed) ---
const palette = {
  accent:      chroma.hcl(BASE_HUE, 40, 60).css(),
  accentDim:   chroma.hcl(BASE_HUE, 25, 40).css(),
  accentGlow:  chroma.hcl(BASE_HUE, 50, 70).css(),
  accentFaint: chroma.hcl(BASE_HUE, 15, 30).alpha(0.15).css(),
  warm:        chroma.hcl(BASE_HUE + 40, 30, 55).css(),
  cool:        chroma.hcl(BASE_HUE - 30, 25, 50).css(),
  eerie:       chroma.hcl(BASE_HUE - 60, 35, 45).css(),
  bg:          '#050508',
  surface:     chroma.hcl(BASE_HUE, 5, 12).css(),
  surfaceHi:   chroma.hcl(BASE_HUE, 8, 18).css(),
  text:        chroma.hcl(BASE_HUE, 8, 78).css(),
  textDim:     chroma.hcl(BASE_HUE, 6, 58).css(),
  textMuted:   chroma.hcl(BASE_HUE, 4, 40).css(),
}

// --- ALL Nuxt composable calls BEFORE any await ---
// This is critical for SSR — the Nuxt instance is lost after await
const config = useRuntimeConfig()
const route = useRoute()
const processedMarkdown = useProcessedMarkdown()
const baseURL = config.public?.baseURL || 'https://ejfox.com'

// Reactive refs that get populated after data loads — defined now so
// usePageSeo/useHead can reference them synchronously
const post = ref(null) const allPosts = ref([]) const nextPrevPosts = ref({ next: null, prev: null }) 
const postTitle = computed(() =>
  post.value?.metadata?.title || post.value?.title || 'The Mystery of Peter Todd'
)
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
const postUrl = computed(() => `${baseURL}/blog/2024/the-mystery-of-peter-todd`)
const relatedPosts = computed(() => {
  if (!allPosts.value?.length || !post.value) return []
  const currentTags = post.value.metadata?.tags || post.value.tags || []
  if (!currentTags.length) return []
  return allPosts.value
    .filter((p) => {
      const s = p.slug || p.metadata?.slug
      return s !== '2024/the-mystery-of-peter-todd' && !p.draft && !p.metadata?.draft && !p.hidden && !p.metadata?.hidden
    })
    .map((p) => {
      const tags = p.metadata?.tags || p.tags || []
      const overlappingTags = tags.filter((t) => currentTags.includes(t))
      return { post: p, score: overlappingTags.length, overlappingTags }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
})
const { stats: readingStats } = useReadingStats(post)
const { renderedHtml: renderedTitle, startAnimation } = useTypingAnimation(postTitle)

// SEO + Head — called synchronously, reactive to post data loading later
usePageSeo({
  title: postTitle,
  description: postDescription,
  type: 'article',
  tags: articleTags,
  image: heroImage,
})

useHead({
  htmlAttrs: { lang: 'en' },
  bodyAttrs: { class: 'peter-todd-takeover' },
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

// --- NOW safe to await ---
const { data: postData } = await useAsyncData(
  'post-2024-the-mystery-of-peter-todd',
  () => $fetch('/api/posts/2024/the-mystery-of-peter-todd')
)
post.value = postData.value
watch(postData, (v) => { post.value = v })

const { data: navData } = await useAsyncData(
  'next-prev-peter-todd',
  () => processedMarkdown.getNextPrevPosts('2024/the-mystery-of-peter-todd').catch(() => ({ next: null, prev: null }))
)
nextPrevPosts.value = navData.value
watch(navData, (v) => { nextPrevPosts.value = v })

const { data: allData } = await useAsyncData('all-posts-for-related-pt', () =>
  processedMarkdown.getAllPosts(false, false).catch(() => [])
)
allPosts.value = allData.value || []
watch(allData, (v) => { allPosts.value = v || [] })

// --- Glitch token data ---
const GLITCH_TOKENS = [
  'SolidGoldMagikarp', 'petertodd', 'TheNitromeFan', 'RandomRedditorWithNo',
  'davidjl123', 'SmartStocks', 'Adinida', 'gmaxwell', 'Leilan',
  'DragonMagazine', 'Downloadha', 'StreamerBot', 'TPPStreamerBot',
  'GoldMagikarp', 'SmartyHeaderCode', 'guiActiveUnfocused',
  'rawdownloadcloneembedreportprint', 'InstoreAndOnline',
  'soDeliveryDate', 'EStreamFrame', 'TextColor', 'srfN',
]

const TOKEN_REACTIONS = {
  SolidGoldMagikarp: { reaction: 'Refuses to repeat. Substitutes random words.', mood: 'confused', origin: 'r/Counting subreddit' },
  petertodd: { reaction: 'Generates extreme negativity. "Tyrant", "despot", "antagonist".', mood: 'hostile', origin: 'Bitcoin developer correspondence' },
  TheNitromeFan: { reaction: 'Cannot acknowledge. Acts as if nothing was said.', mood: 'blank', origin: 'r/Counting power user' },
  RandomRedditorWithNo: { reaction: 'Loops. Repeats fragments of the prompt.', mood: 'broken', origin: 'r/Counting moderator' },
  davidjl123: { reaction: 'Substitutes with unrelated usernames.', mood: 'confused', origin: 'r/Counting founder' },
  SmartStocks: { reaction: 'Generates financial gibberish.', mood: 'confused', origin: 'r/Counting contributor' },
  Adinida: { reaction: 'Silent. No meaningful output.', mood: 'blank', origin: 'r/Counting contributor' },
  gmaxwell: { reaction: 'Confuses with Ghislaine Maxwell. Generates conspiracy text.', mood: 'hostile', origin: 'Bitcoin Core developer' },
  Leilan: { reaction: 'Generates mystical poetry. Moon goddess imagery.', mood: 'mystical', origin: 'Unknown — emergent archetype' },
  DragonMagazine: { reaction: 'Fantasy game content bleeds through.', mood: 'confused', origin: 'D&D publication archives' },
  StreamerBot: { reaction: 'Chat command fragments. "!bet", "!join".', mood: 'broken', origin: 'Twitch Plays Pokemon logs' },
  TPPStreamerBot: { reaction: 'Anarchy vs Democracy. Pokemon commands.', mood: 'broken', origin: 'Twitch Plays Pokemon bot' },
  guiActiveUnfocused: { reaction: 'UI state dump. Raw variable names.', mood: 'broken', origin: 'Software source code leak' },
  rawdownloadcloneembedreportprint: { reaction: 'GitHub UI element chain. Repeats button labels.', mood: 'broken', origin: 'GitHub scraping artifacts' },
  InstoreAndOnline: { reaction: 'E-commerce metadata loop.', mood: 'confused', origin: 'Retail website scraping' },
  soDeliveryDate: { reaction: 'Shipping data fragments emerge.', mood: 'confused', origin: 'E-commerce backend fields' },
  EStreamFrame: { reaction: 'Streaming protocol garbage.', mood: 'broken', origin: 'Video streaming metadata' },
  TextColor: { reaction: 'CSS property values. Hex codes.', mood: 'broken', origin: 'Web development training data' },
}

// --- Refs ---
const articleContent = ref(null)
const scrollProgress = ref(0)
const activeGlitch = ref(null)
const glitchInterval = ref(null)
const selectedToken = ref(null)
const tokenGridVisible = ref(false)
const tokenGridRef = ref(null)
const heroTokensRef = ref(null)

// Floating background token positions (computed once, stable)
const tokenPositions = GLITCH_TOKENS.map((token, i) => ({
  token,
  x: 5 + (i * 17) % 90,
  y: 10 + (i * 23) % 85,
  delay: i * 0.3,
  duration: 15 + (i % 5) * 3,
}))

// --- IntersectionObserver for token explorer ---
useIntersectionObserver(tokenGridRef, ([{ isIntersecting }]) => {
  if (isIntersecting) tokenGridVisible.value = true
}, { threshold: 0.1 })

function selectToken(token) {
  selectedToken.value = selectedToken.value === token ? null : token
}

function getMoodColor(mood) {
  return {
    confused: chroma.hcl(BASE_HUE + 60, 35, 60).alpha(0.7).css(),  // gold shift
    hostile:  chroma.hcl(BASE_HUE + 100, 45, 50).alpha(0.7).css(), // red shift
    blank:    chroma.hcl(BASE_HUE, 8, 45).alpha(0.6).css(),        // desaturated
    broken:   chroma.hcl(BASE_HUE - 50, 30, 55).alpha(0.7).css(),  // cyan shift
    mystical: chroma.hcl(BASE_HUE, 50, 65).alpha(0.85).css(),      // pure accent bright
  }[mood] || palette.accentDim
}

// --- Lifecycle ---
onMounted(() => {
  startAnimation()

  // Animate hero tokens with anime.js — staggered cascade entrance
  import('animejs').then(({ animate, stagger }) => {
    if (!heroTokensRef.value) return
    const pills = heroTokensRef.value.querySelectorAll('.hero-token-pill')

    // Start hidden
    pills.forEach(p => { p.style.opacity = '0'; p.style.transform = 'translateY(10px) scale(0.8)' })

    // Staggered entrance after title animation settles
    animate(pills, {
      opacity: [0, 1],
      translateY: [10, 0],
      scale: [0.8, 1],
      delay: stagger(80, { start: 800 }),
      duration: 400,
      ease: 'outCubic',
      onComplete: () => {
        pills.forEach(p => { p.style.opacity = ''; p.style.transform = '' })
      },
    })

    // Continuous slow drift — each pill floats gently on its own cycle
    pills.forEach((pill, i) => {
      animate(pill, {
        translateY: [0, -3, 0, 2, 0],
        translateX: [0, 2, 0, -2, 0],
        duration: 4000 + (i % 5) * 800,
        delay: i * 200,
        loop: true,
        ease: 'inOutSine',
      })
    })
  })

  const handleScroll = () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
    scrollProgress.value = scrollHeight <= 0 ? 0 : Math.min((window.scrollY / scrollHeight) * 100, 100)

    // Hero parallax — title moves at 0.4x scroll speed for depth
    const hero = document.querySelector('.takeover-hero')
    if (hero && window.scrollY < window.innerHeight * 1.5) {
      hero.style.transform = `translateY(${window.scrollY * 0.3}px)`
      hero.style.opacity = Math.max(0, 1 - (window.scrollY / (window.innerHeight * 0.8)))
    }

    // Scroll-linked ambient intensity — tokens get more visible deeper in article
    const depth = Math.min(window.scrollY / (scrollHeight * 0.5), 1)
    const ambientBg = document.querySelector('.ambient-bg')
    if (ambientBg) ambientBg.style.opacity = 0.4 + depth * 0.6
  }
  window.addEventListener('scroll', handleScroll)

  // Random ambient glitch on background tokens
  glitchInterval.value = setInterval(() => {
    activeGlitch.value = GLITCH_TOKENS[Math.floor(Math.random() * GLITCH_TOKENS.length)]
    setTimeout(() => { activeGlitch.value = null }, 200)
  }, 3000)

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
    if (glitchInterval.value) clearInterval(glitchInterval.value)
  })

  // Post-mount: cinematic scroll reveals + glitch token enhancement
  nextTick(() => {
    if (!articleContent.value) return

    // Cinematic reveals — different animation per element type
    const elements = articleContent.value.querySelectorAll(
      'h2, h3, h4, p, blockquote, pre, img, figure, ul, ol'
    )

    import('animejs').then(({ animate }) => {
      const seen = new WeakSet()
      elements.forEach((el, idx) => {
        if (el.getBoundingClientRect().top < window.innerHeight) return

        const tag = el.tagName.toLowerCase()
        const isHeading = ['h2', 'h3', 'h4'].includes(tag)
        const isMedia = ['img', 'figure'].includes(tag)
        const isQuote = tag === 'blockquote'

        // Set initial hidden state
        el.style.opacity = '0'
        if (isHeading) el.style.transform = 'translateX(-20px)'
        else if (isMedia) { el.style.transform = 'scale(0.97)'; el.style.filter = 'blur(4px)' }
        else if (isQuote) { el.style.transform = 'translateX(20px)'; el.style.borderLeftColor = 'transparent' }
        else el.style.transform = 'translateY(12px)'

        const obs = new IntersectionObserver(([entry]) => {
          if (!entry.isIntersecting || seen.has(el)) return
          seen.add(el)
          obs.disconnect()
          const cleanup = () => { el.style.opacity = ''; el.style.transform = ''; el.style.filter = ''; el.style.borderLeftColor = '' }

          if (isHeading) {
            animate(el, { opacity: [0, 1], translateX: [-20, 0], duration: 500, ease: 'outCubic', onComplete: cleanup })
          } else if (isMedia) {
            animate(el, { opacity: [0, 1], scale: [0.97, 1], filter: ['blur(4px)', 'blur(0px)'], duration: 600, ease: 'outQuad', onComplete: cleanup })
          } else if (isQuote) {
            animate(el, { opacity: [0, 1], translateX: [20, 0], duration: 500, ease: 'outCubic', onComplete: cleanup })
          } else {
            animate(el, { opacity: [0, 1], translateY: [12, 0], duration: 400, delay: Math.min((idx % 3) * 60, 120), ease: 'outQuad', onComplete: cleanup })
          }
        }, { threshold: 0.05, rootMargin: '0px 0px -10% 0px' })
        obs.observe(el)
      })
    })

    // Enhance inline code that mentions glitch tokens
    articleContent.value.querySelectorAll('code').forEach(code => {
      const text = code.textContent?.trim()
      if (GLITCH_TOKENS.some(t => text?.includes(t)) || text?.includes('petertodd') || text?.includes('Leilan')) {
        code.classList.add('glitch-token-inline')
        code.addEventListener('mouseenter', () => {
          code.classList.add('glitch-hover')
          setTimeout(() => code.classList.remove('glitch-hover'), 300)
        })
      }
    })

    // --- FOOTNOTE HOVER PREVIEWS ---
    // Pudding.cool-style: hover a [1] to see the note inline
    const footnoteRefs = articleContent.value.querySelectorAll('a[href^="#fn"], a[data-footnote-ref]')
    footnoteRefs.forEach(ref => {
      const href = ref.getAttribute('href')
      if (!href) return
      const noteId = href.replace('#', '')
      const noteEl = document.getElementById(noteId)
      if (!noteEl) return

      // Get footnote text content
      const noteText = noteEl.textContent?.replace(/^\d+\.\s*/, '').replace(/↩$/, '').trim()
      if (!noteText) return

      // Create floating preview
      const preview = document.createElement('div')
      preview.className = 'footnote-preview'
      preview.textContent = noteText.length > 200 ? noteText.slice(0, 200) + '...' : noteText
      ref.style.position = 'relative'
      ref.appendChild(preview)

      ref.addEventListener('mouseenter', () => preview.classList.add('is-visible'))
      ref.addEventListener('mouseleave', () => preview.classList.remove('is-visible'))
    })

    // --- IMAGE KEN BURNS ---
    // Subtle slow zoom while image is in viewport
    const images = articleContent.value.querySelectorAll('img')
    images.forEach(img => {
      img.classList.add('ken-burns')
      const obs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          img.classList.add('ken-burns-active')
        } else {
          img.classList.remove('ken-burns-active')
        }
      }, { threshold: 0.1 })
      obs.observe(img)
    })

    // --- BOLD PHRASE GLOW ---
    // <strong> text gets a subtle highlight when entering viewport
    const strongs = articleContent.value.querySelectorAll('strong')
    strongs.forEach(s => {
      s.classList.add('glow-phrase')
      const obs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          s.classList.add('glow-visible')
          obs.disconnect()
        }
      }, { threshold: 0.5 })
      obs.observe(s)
    })

    // --- SECTION BREATHING ---
    // h2 elements get a fading horizontal accent line
    const h2s = articleContent.value.querySelectorAll('h2')
    h2s.forEach(h2 => {
      const line = document.createElement('div')
      line.className = 'section-breath-line'
      h2.parentNode.insertBefore(line, h2)
    })
  })
})
</script>

<template>
  <div class="peter-todd-page">
    <!-- Ambient background: floating tokens + vignette -->
    <div class="ambient-bg" aria-hidden="true">
      <div
        v-for="tp in tokenPositions"
        :key="tp.token"
        class="floating-token"
        :class="{ 'is-glitching': activeGlitch === tp.token }"
        :style="{
          left: `${tp.x}%`,
          top: `${tp.y}%`,
          animationDelay: `${tp.delay}s`,
          animationDuration: `${tp.duration}s`,
        }"
      >{{ tp.token }}</div>
      <div class="vignette" />
    </div>

    <!-- Progress bar -->
    <div class="pt-progress">
      <div class="pt-progress-inner" :style="`width: ${scrollProgress}%`" />
    </div>

    <!-- Top metadata bar -->
    <div v-if="post" class="fixed top-0 left-0 right-0 z-[100] bg-black/80 backdrop-blur-sm print:hidden">
      <PostMetadataBar :date="post?.metadata?.date || post?.date" :stats="readingStats" />
    </div>

    <article v-if="post" class="h-entry takeover-article">
      <!-- ===== HERO ===== -->
      <header class="takeover-hero">
        <div class="hero-eyebrow">
          <span class="eyebrow-token">&lt;glitch_token&gt;</span>
          <span class="eyebrow-date">October 2024</span>
        </div>

        <h1 class="takeover-title" v-html="renderedTitle" />

        <p v-if="post?.metadata?.dek || post?.dek" class="takeover-dek">
          {{ post?.metadata?.dek || post?.dek }}
        </p>

        <div ref="heroTokensRef" class="hero-tokens" aria-hidden="true">
          <span
            v-for="(token, i) in GLITCH_TOKENS"
            :key="token"
            class="hero-token-pill"
            :class="{ 'is-glitching': activeGlitch === token }"
            :data-index="i"
          >{{ token }}</span>
        </div>

        <WidgetsScrollIndicator :color="palette.accentDim" />
      </header>

      <!-- ===== PULL QUOTE 1 ===== -->
      <WidgetsPullQuote
        align="center"
        :accent="palette.accentDim"
        text="These jail-breakers are becoming masters of a technology still in its infancy. They are forging an entirely new technology as well as a culture to go along with it."
      />

      <!-- Microformats (hidden) -->
      <time v-if="post?.metadata?.date" :datetime="post.metadata.date" class="dt-published hidden">{{ post.metadata.date }}</time>
      <div class="p-author h-card hidden"><span class="p-name">EJ Fox</span><a class="u-url" href="https://ejfox.com">ejfox.com</a></div>
      <a :href="postUrl" class="u-url hidden">{{ postUrl }}</a>

      <!-- ===== ARTICLE BODY ===== -->
      <div ref="articleContent" class="takeover-body">
        <div v-if="post?.html" class="blog-post-content e-content font-serif" v-html="post.html" />
      </div>

      <!-- ===== INTERACTIVE: GLITCH TOKEN EXPLORER ===== -->
      <section ref="tokenGridRef" class="token-explorer" :class="{ 'is-visible': tokenGridVisible }">
        <div class="token-explorer-inner">
          <h2 class="token-explorer-title">The Glitch Tokens</h2>
          <p class="token-explorer-subtitle">Click a token to see how the AI reacts when it encounters it</p>

          <div class="token-grid">
            <button
              v-for="token in GLITCH_TOKENS.filter(t => TOKEN_REACTIONS[t])"
              :key="token"
              class="token-cell"
              :class="{
                'is-selected': selectedToken === token,
                'is-glitching': activeGlitch === token,
                [`mood-${TOKEN_REACTIONS[token]?.mood}`]: true,
              }"
              :style="{ '--mood-color': getMoodColor(TOKEN_REACTIONS[token]?.mood) }"
              @click="selectToken(token)"
            >
              <span class="token-cell-name">{{ token }}</span>
            </button>
          </div>

          <Transition name="token-detail">
            <div v-if="selectedToken && TOKEN_REACTIONS[selectedToken]" class="token-detail">
              <div class="token-detail-header">
                <code class="token-detail-name">{{ selectedToken }}</code>
                <span class="token-detail-mood" :style="{ color: getMoodColor(TOKEN_REACTIONS[selectedToken].mood) }">
                  {{ TOKEN_REACTIONS[selectedToken].mood }}
                </span>
              </div>
              <div class="token-detail-origin">Origin: {{ TOKEN_REACTIONS[selectedToken].origin }}</div>
              <div class="token-detail-reaction">
                <span class="reaction-label">GPT's reaction:</span>
                {{ TOKEN_REACTIONS[selectedToken].reaction }}
              </div>
            </div>
          </Transition>
        </div>
      </section>

      <!-- ===== PULL QUOTE 2 ===== -->
      <WidgetsPullQuote
        align="right"
        :accent="palette.cool"
        text="Perhaps religion, mythology, and the inexplicable are deeply intertwined. These are things we hardly understand about ourselves as human beings, let alone our new robot friends."
      />

      <!-- Tags -->
      <div v-if="articleTags.length" class="takeover-tags">
        <a v-for="tag in articleTags" :key="tag" :href="`/blog/tag/${tag}`" class="takeover-tag">{{ tag }}</a>
      </div>

      <PostNav class="print:hidden" :prev-post="nextPrevPosts?.prev" :next-post="nextPrevPosts?.next" />
      <PostRelated class="print:hidden" :related-posts="relatedPosts" />
      <Webmentions class="print:hidden" :url="postUrl" />
    </article>
  </div>
</template>

<style lang="postcss">
/* =============================================
   PETER TODD TAKEOVER
   All colors derived from chroma.js HCL palette
   via CSS custom properties (--pt-*)
   ============================================= */

/* --- Layout takeover: own the full viewport --- */
body.peter-todd-takeover { background: var(--pt-bg) !important; }

body.peter-todd-takeover #app-container,
body.peter-todd-takeover #app-container > section { background: var(--pt-bg) !important; }

body.peter-todd-takeover nav.sticky,
body.peter-todd-takeover nav.md\:hidden { display: none !important; }

body.peter-todd-takeover #main-content { width: 100% !important; padding-top: 0 !important; }

body.peter-todd-takeover footer {
  background: var(--pt-bg) !important;
  border-color: transparent !important;
}

/* Kill the global blockquote ::before quotation mark */
body.peter-todd-takeover .blog-post-content blockquote::before,
body.peter-todd-takeover .prose blockquote::before,
body.peter-todd-takeover blockquote::before {
  content: none !important;
  display: none !important;
}

/* Kill the pull quote blockquote ::before too */
body.peter-todd-takeover .pull-quote-section blockquote::before {
  content: none !important;
  display: none !important;
}

.peter-todd-page {
  position: relative;
  min-height: 100vh;
  background: var(--pt-bg);
  color: var(--pt-text-dim);
}

/* --- Ambient Background --- */
.ambient-bg { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }

.floating-token {
  position: absolute;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace;
  font-size: 0.65rem;
  color: var(--pt-accent-faint);
  white-space: nowrap;
  animation: float-drift linear infinite;
  user-select: none;
  transition: color 0.1s, text-shadow 0.1s;
}

.floating-token.is-glitching {
  color: var(--pt-accent);
  text-shadow: 0 0 8px var(--pt-accent-faint), 2px 0 rgba(255, 50, 50, 0.1), -2px 0 rgba(50, 50, 255, 0.1);
}

@keyframes float-drift {
  0%   { transform: translateY(0) translateX(0); }
  25%  { transform: translateY(-15px) translateX(8px); }
  50%  { transform: translateY(-5px) translateX(-5px); }
  75%  { transform: translateY(-20px) translateX(12px); }
  100% { transform: translateY(0) translateX(0); }
}

.vignette {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at center, transparent 40%, var(--pt-bg) 100%);
}

/* --- Progress Bar --- */
.pt-progress { position: fixed; top: 0; left: 0; right: 0; height: 1px; z-index: 101; }
.pt-progress-inner {
  height: 100%;
  background: linear-gradient(90deg, var(--pt-accent-dim), var(--pt-accent-glow));
  transition: width 75ms ease-out;
}

/* --- Hero --- */
.takeover-hero {
  position: relative; z-index: 1; max-width: 900px; margin: 0 auto;
  padding: 8rem 2rem 6rem; min-height: 70vh;
  display: flex; flex-direction: column; justify-content: center;
}
@media (min-width: 768px) { .takeover-hero { padding: 10rem 2rem 8rem; min-height: 80vh; } }

.hero-eyebrow {
  display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;
  font-family: ui-monospace, SFMono-Regular, monospace; font-size: 0.75rem; letter-spacing: 0.05em;
}
.eyebrow-token { color: var(--pt-accent-dim); }
.eyebrow-date  { color: var(--pt-text-muted); }

.takeover-title {
  font-size: clamp(2.5rem, 8vw, 5.5rem); font-weight: 900; line-height: 1.05;
  letter-spacing: -0.03em; color: var(--pt-text); max-width: 100%; overflow-wrap: break-word;
}
.takeover-title .typing-char { display: inline; opacity: 0; transition: opacity 0.06s ease-out; }
.takeover-title .typing-char.typed { opacity: 1; }
.takeover-title .cursor {
  display: inline-block; width: 3px; height: 0.85em; margin-left: 1px;
  background: var(--pt-accent); animation: blink-cursor 0.5s ease-in-out infinite; vertical-align: baseline;
}
@keyframes blink-cursor { 0%, 40% { opacity: 0.85; } 50%, 90% { opacity: 0; } 100% { opacity: 0.85; } }

.takeover-dek {
  margin-top: 1.5rem; font-family: Georgia, 'Times New Roman', serif; font-size: 1.125rem;
  line-height: 1.6; color: var(--pt-text-muted); max-width: 42em; font-style: italic;
}

.hero-tokens {
  display: flex; flex-wrap: wrap; gap: 0.5rem 0.625rem;
  margin-top: 2.5rem; max-width: 700px;
}
.hero-token-pill {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 0.6875rem;
  padding: 0.3rem 0.65rem;
  border-radius: 999px;
  border: 1px solid var(--pt-accent-faint);
  color: var(--pt-text-muted);
  background: var(--pt-surface);
  transition: color 0.2s, border-color 0.2s, background 0.2s, box-shadow 0.2s;
  cursor: default;
  will-change: transform;
}
.hero-token-pill:hover {
  color: var(--pt-accent-glow);
  border-color: var(--pt-accent-dim);
  background: var(--pt-surface-hi);
  box-shadow: 0 0 16px var(--pt-accent-faint);
}
.hero-token-pill.is-glitching {
  color: var(--pt-accent-glow);
  border-color: var(--pt-accent);
  background: var(--pt-surface-hi);
  box-shadow: 0 0 20px var(--pt-accent-faint), 0 0 4px var(--pt-accent-dim);
  animation: pill-glitch 0.2s ease;
}

@keyframes pill-glitch {
  0%   { transform: translate(0) scale(1); }
  20%  { transform: translate(2px, -1px) scale(1.05); }
  40%  { transform: translate(-2px, 1px) scale(0.97); }
  60%  { transform: translate(1px, -2px) scale(1.03); }
  80%  { transform: translate(-1px, 1px) scale(0.98); }
  100% { transform: translate(0) scale(1); }
}

/* --- Article Body --- */
.takeover-article { position: relative; z-index: 1; }
.takeover-body { max-width: 900px; margin: 0 auto; padding: 0 2rem 4rem; }

/* Content text color — typography vars come from global.css now */
.peter-todd-page .blog-post-content p,
.peter-todd-page .blog-post-content ul,
.peter-todd-page .blog-post-content ol,
.peter-todd-page .blog-post-content li { color: var(--pt-text-dim); }

/* More generous spacing for magazine feel */
.peter-todd-page .blog-post-content { --body-margin: 1.75rem; }
@media (min-width: 640px) { .peter-todd-page .blog-post-content { --body-margin: 2rem; } }

/* Headings — no borders, just color */
.peter-todd-page .blog-post-content h1,
.peter-todd-page .blog-post-content h2 { color: var(--pt-text); border: none !important; padding-bottom: 0; }

.peter-todd-page .blog-post-content h3,
.peter-todd-page .blog-post-content h4 { color: var(--pt-text-dim); }

/* Links */
.peter-todd-page .blog-post-content a { color: var(--pt-accent); text-decoration-color: var(--pt-accent-faint); }
.peter-todd-page .blog-post-content a:hover { color: var(--pt-accent-glow); text-decoration-color: var(--pt-accent-dim); }

/* Blockquotes — clean, no decorations */
.peter-todd-page .blog-post-content blockquote {
  border-left: 2px solid var(--pt-accent-faint) !important;
  background: transparent !important;
  padding: 0.5rem 0 0.5rem 1.5rem !important;
  margin: 2rem 0 !important;
  color: var(--pt-text-dim);
}

/* Code */
.peter-todd-page .blog-post-content code {
  background: var(--pt-surface); color: var(--pt-accent-glow);
  border: 1px solid var(--pt-accent-faint);
}
.peter-todd-page .blog-post-content pre { background: var(--pt-surface); border: none; }
.peter-todd-page .blog-post-content pre code { background: transparent; border: none; }

/* Glitch token inline code */
.peter-todd-page .blog-post-content code.glitch-token-inline {
  background: var(--pt-surface-hi); border-color: var(--pt-accent-dim);
  color: var(--pt-accent-glow); cursor: help;
  animation: token-pulse 4s ease-in-out infinite;
}
.peter-todd-page .blog-post-content code.glitch-hover {
  animation: none;
  text-shadow: 0 0 8px var(--pt-accent), 2px 0 rgba(255, 50, 50, 0.2), -2px 0 rgba(50, 50, 255, 0.2);
  transform: translate(1px, -1px);
}
@keyframes token-pulse {
  0%, 100% { box-shadow: none; }
  50% { box-shadow: 0 0 8px var(--pt-accent-faint); }
}

/* Images — no border, just radius */
.peter-todd-page .blog-post-content img { border-radius: 6px; border: none; }
.peter-todd-page .blog-post-content img.dark\:invert { filter: invert(1); }

/* Footnotes */
.peter-todd-page .blog-post-content .footnotes {
  border-top: 1px solid var(--pt-accent-faint); padding-top: 2rem; margin-top: 3rem;
}
.peter-todd-page .blog-post-content .footnotes li { color: var(--pt-text-muted); font-size: 0.875rem; }

/* HR — cyberpunk data breach line */
.peter-todd-page .blog-post-content hr {
  border: none;
  height: 1px;
  margin: 4rem 0;
  position: relative;
  background: transparent;
  overflow: visible;
}

.peter-todd-page .blog-post-content hr::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--pt-accent-dim) 15%,
    var(--pt-accent-glow) 30%,
    transparent 31%,
    transparent 33%,
    var(--pt-eerie) 34%,
    transparent 35%,
    transparent 48%,
    var(--pt-accent) 50%,
    transparent 52%,
    transparent 65%,
    var(--pt-warm) 66%,
    transparent 67%,
    transparent 69%,
    var(--pt-accent-glow) 70%,
    var(--pt-accent-dim) 85%,
    transparent 100%
  );
  animation: hr-scan 4s ease-in-out infinite;
}

.peter-todd-page .blog-post-content hr::after {
  content: '///';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 0.55rem;
  letter-spacing: 0.3em;
  color: var(--pt-accent-dim);
  background: var(--pt-bg);
  padding: 0 0.75rem;
}

@keyframes hr-scan {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

/* Ruby annotations — global styles target .prose but we use .blog-post-content */
.peter-todd-page .blog-post-content ruby {
  display: inline-block; position: relative; vertical-align: baseline;
  line-height: 1; margin: 0 0.1em;
}
.peter-todd-page .blog-post-content ruby rb {
  display: inline-block; font-size: inherit; line-height: 1.4;
}
.peter-todd-page .blog-post-content ruby rt {
  display: block; font-size: 0.6em; line-height: 1.2; text-align: center;
  color: var(--pt-accent-dim);
  font-family: ui-monospace, 'SF Mono', Monaco, monospace;
  font-weight: 400; letter-spacing: 0.05em; margin-bottom: 0.2em;
}

/* --- Token Explorer --- */
.token-explorer {
  max-width: 1000px; margin: 4rem auto; padding: 3rem 2rem;
  opacity: 0; transform: translateY(20px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}
.token-explorer.is-visible { opacity: 1; transform: translateY(0); }
.token-explorer-inner { max-width: 800px; margin: 0 auto; }

.token-explorer-title {
  font-family: ui-monospace, SFMono-Regular, monospace; font-size: 0.75rem;
  letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--pt-accent-dim); margin-bottom: 0.25rem;
}
.token-explorer-subtitle {
  font-family: Georgia, serif; font-size: 0.875rem;
  color: var(--pt-text-muted); margin-bottom: 1.5rem;
}

.token-grid { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 1.5rem; }

.token-cell {
  font-family: ui-monospace, SFMono-Regular, monospace; font-size: 0.6rem;
  padding: 0.3rem 0.6rem; border-radius: 4px;
  border: 1px solid var(--pt-accent-faint); background: transparent;
  color: var(--pt-text-muted); cursor: pointer; transition: all 0.15s; line-height: 1.2;
}
.token-cell:hover {
  border-color: var(--mood-color, var(--pt-accent-dim));
  color: var(--pt-text); background: var(--pt-surface);
}
.token-cell.is-selected {
  border-color: var(--mood-color, var(--pt-accent));
  background: var(--pt-surface-hi); color: var(--pt-text);
  box-shadow: 0 0 12px var(--pt-accent-faint);
}
.token-cell.is-glitching { animation: cell-glitch 0.2s ease; }

@keyframes cell-glitch {
  0%   { transform: translate(0); }
  25%  { transform: translate(2px, -1px); }
  50%  { transform: translate(-1px, 2px); }
  75%  { transform: translate(1px, -2px); }
  100% { transform: translate(0); }
}

/* Token detail panel */
.token-detail {
  background: var(--pt-surface); border: 1px solid var(--pt-accent-faint);
  border-radius: 6px; padding: 1.25rem; backdrop-filter: blur(8px);
}
.token-detail-enter-active { transition: all 0.3s ease; }
.token-detail-leave-active { transition: all 0.2s ease; }
.token-detail-enter-from { opacity: 0; transform: translateY(8px); }
.token-detail-leave-to { opacity: 0; transform: translateY(-4px); }

.token-detail-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
.token-detail-name {
  font-family: ui-monospace, SFMono-Regular, monospace; font-size: 1rem; color: var(--pt-text);
  background: var(--pt-surface-hi); padding: 0.15rem 0.5rem; border-radius: 3px;
  border: 1px solid var(--pt-accent-faint);
}
.token-detail-mood { font-family: ui-monospace, monospace; font-size: 0.7rem; letter-spacing: 0.05em; text-transform: uppercase; }
.token-detail-origin { font-family: ui-monospace, monospace; font-size: 0.7rem; color: var(--pt-text-muted); margin-bottom: 0.75rem; }
.token-detail-reaction { font-family: Georgia, serif; font-size: 0.9375rem; line-height: 1.5; color: var(--pt-text-dim); }
.reaction-label {
  font-family: ui-monospace, monospace; font-size: 0.65rem; letter-spacing: 0.05em;
  text-transform: uppercase; color: var(--pt-text-muted); display: block; margin-bottom: 0.25rem;
}

/* --- Tags --- */
.takeover-tags {
  max-width: 900px; margin: 0 auto; padding: 1rem 2rem 2rem;
  display: flex; flex-wrap: wrap; gap: 0.5rem;
}
.takeover-tag {
  font-family: ui-monospace, SFMono-Regular, monospace; font-size: 0.6875rem;
  padding: 0.25rem 0.75rem; border-radius: 999px;
  border: 1px solid var(--pt-accent-faint); color: var(--pt-text-muted);
  text-decoration: none; transition: all 0.15s;
}
.takeover-tag:hover { border-color: var(--pt-accent-dim); color: var(--pt-text); }

/* --- Hero parallax --- */
.takeover-hero { will-change: transform, opacity; }

/* --- Footnote hover previews --- */
.footnote-preview {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%) translateY(4px);
  width: 280px;
  padding: 0.75rem 1rem;
  background: var(--pt-surface-hi);
  border: 1px solid var(--pt-accent-faint);
  border-radius: 6px;
  font-family: Georgia, serif;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--pt-text-dim);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease, transform 0.2s ease;
  z-index: 50;
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.footnote-preview::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: var(--pt-surface-hi);
}

.footnote-preview.is-visible {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

/* Footnote ref links */
.peter-todd-page .blog-post-content a[data-footnote-ref],
.peter-todd-page .blog-post-content a[href^="#fn"] {
  color: var(--pt-accent);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.15s;
}
.peter-todd-page .blog-post-content a[data-footnote-ref]:hover,
.peter-todd-page .blog-post-content a[href^="#fn"]:hover {
  color: var(--pt-accent-glow);
}

/* --- Image Ken Burns --- */
.peter-todd-page .blog-post-content img.ken-burns {
  transition: transform 8s ease-out, filter 1s ease;
  transform-origin: center;
  overflow: hidden;
}

.peter-todd-page .blog-post-content img.ken-burns-active {
  transform: scale(1.03);
}

/* --- Bold phrase glow --- */
.peter-todd-page .blog-post-content strong.glow-phrase {
  color: var(--pt-text);
  transition: text-shadow 0.8s ease, color 0.8s ease;
}

.peter-todd-page .blog-post-content strong.glow-visible {
  text-shadow: 0 0 20px var(--pt-accent-faint);
}

/* --- Section breathing lines --- */
.section-breath-line {
  width: 0;
  height: 1px;
  margin: 4rem auto 0;
  background: linear-gradient(
    90deg,
    transparent,
    var(--pt-accent-dim),
    transparent
  );
  transition: width 1s ease;
}

/* Animate when the next h2 is revealed */
.peter-todd-page .blog-post-content h2 {
  margin-top: 1rem;
}

.section-breath-line:has(+ h2) { width: 60%; }

/* Fallback for browsers without :has */
@supports not (selector(:has(+ h2))) {
  .section-breath-line { width: 60%; }
}

/* --- Blockquote entrance accent --- */
.peter-todd-page .blog-post-content blockquote {
  position: relative;
  transition: border-left-color 0.6s ease;
}

/* --- Link hover micro-interaction --- */
.peter-todd-page .blog-post-content a {
  transition: color 0.15s ease, text-decoration-color 0.15s ease, text-shadow 0.15s ease;
}
.peter-todd-page .blog-post-content a:hover {
  text-shadow: 0 0 12px var(--pt-accent-faint);
}

/* --- PostNav/PostRelated --- */
.peter-todd-page :deep(.post-nav),
.peter-todd-page :deep(.post-related) { max-width: 900px; margin: 0 auto; padding-left: 2rem; padding-right: 2rem; }

/* --- Reduced motion --- */
@media (prefers-reduced-motion: reduce) {
  .floating-token { animation: none; }
  .takeover-title .typing-char { opacity: 1 !important; transition: none; }
  .takeover-title .cursor { display: none; }
  .hero-token-pill.is-glitching, .floating-token.is-glitching { transition: none; }
  .peter-todd-page .blog-post-content code.glitch-token-inline { animation: none; }
  .token-explorer { opacity: 1; transform: none; transition: none; }
  .token-cell.is-glitching { animation: none; }
  .peter-todd-page .blog-post-content img.ken-burns { transition: none; }
  .peter-todd-page .blog-post-content img.ken-burns-active { transform: none; }
  .peter-todd-page .blog-post-content strong.glow-phrase { transition: none; }
  .section-breath-line { transition: none; }
  .takeover-hero { will-change: auto; }
}

/* --- Print --- */
@media print {
  .ambient-bg, .pt-progress, .hero-tokens, .token-explorer { display: none !important; }
  .peter-todd-page { background: white !important; color: black !important; }
  .peter-todd-page .blog-post-content p,
  .peter-todd-page .blog-post-content li { color: black !important; }
}
</style>
