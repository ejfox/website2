#!/usr/bin/env node
/**
 * Crown a blog post — scaffold a Vue page takeover.
 *
 * Usage:
 *   yarn crown 2024/the-mystery-of-peter-todd
 *   yarn crown 2026/my-new-post --hue 200
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'

const slug = process.argv[2]
if (!slug) {
  console.error('Usage: yarn crown <YYYY/slug> [--hue N]')
  process.exit(1)
}

let hue = 220
for (let i = 3; i < process.argv.length; i++) {
  if (process.argv[i] === '--hue' && process.argv[i + 1]) {
    hue = parseInt(process.argv[i + 1], 10)
    i++
  }
}

const slugParts = slug.split('/')
const name = slugParts[slugParts.length - 1]
const titleCase = name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
const bodyClass = name + '-takeover'
const cssClass = name + '-page'
const outPath = join('pages', 'blog', ...slugParts) + '.vue'

if (existsSync(outPath)) {
  console.error('Already exists: ' + outPath)
  process.exit(1)
}

const mdPath = join('content', 'blog', ...slugParts) + '.md'
if (!existsSync(mdPath)) {
  console.warn('Warning: ' + mdPath + ' not found — post may not exist yet')
}

// Build the template as an array of lines to avoid template-in-template issues
const lines = [
  '<script setup>',
  '/**',
  ' * CROWNED POST: ' + titleCase,
  ' * Hue: ' + hue + ' | Scaffolded with: yarn crown ' + slug,
  ' */',
  '',
  "import { useIntersectionObserver } from '@vueuse/core'",
  "import PostMetadataBar from '~/components/blog/post/PostMetadataBar.vue'",
  "import PostNav from '~/components/blog/post/PostNav.vue'",
  "import PostRelated from '~/components/blog/post/PostRelated.vue'",
  "import Webmentions from '~/components/blog/Webmentions.vue'",
  '',
  'const {',
  '  post, nextPrevPosts, relatedPosts, readingStats,',
  '  postTitle, postUrl, articleTags,',
  '  renderedTitle, startAnimation,',
  '  palette,',
  '} = await useCrownedPost({',
  "  slug: '" + slug + "',",
  "  bodyClass: '" + bodyClass + "',",
  '  hue: ' + hue + ',',
  "  fallbackTitle: '" + titleCase + "',",
  '})',
  '',
  '// --- Your state here ---',
  'const articleContent = ref(null)',
  'const scrollProgress = ref(0)',
  '',
  'onMounted(() => {',
  '  startAnimation()',
  '',
  '  const handleScroll = () => {',
  '    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight',
  '    scrollProgress.value = scrollHeight <= 0 ? 0 : Math.min((window.scrollY / scrollHeight) * 100, 100)',
  '  }',
  "  window.addEventListener('scroll', handleScroll)",
  "  onUnmounted(() => window.removeEventListener('scroll', handleScroll))",
  '',
  '  // Cinematic scroll reveals',
  '  nextTick(() => {',
  '    if (!articleContent.value) return',
  "    const elements = articleContent.value.querySelectorAll('h2, h3, h4, p, blockquote, pre, img, figure, ul, ol')",
  '',
  "    import('animejs').then(({ animate }) => {",
  '      const seen = new WeakSet()',
  '      elements.forEach((el, idx) => {',
  '        if (el.getBoundingClientRect().top < window.innerHeight) return',
  '        const tag = el.tagName.toLowerCase()',
  "        const isHeading = ['h2', 'h3', 'h4'].includes(tag)",
  "        const isMedia = ['img', 'figure'].includes(tag)",
  "        const isQuote = tag === 'blockquote'",
  '',
  "        el.style.opacity = '0'",
  "        if (isHeading) el.style.transform = 'translateX(-20px)'",
  "        else if (isMedia) { el.style.transform = 'scale(0.97)'; el.style.filter = 'blur(4px)' }",
  "        else if (isQuote) el.style.transform = 'translateX(20px)'",
  "        else el.style.transform = 'translateY(12px)'",
  '',
  '        const obs = new IntersectionObserver(([entry]) => {',
  '          if (!entry.isIntersecting || seen.has(el)) return',
  '          seen.add(el)',
  '          obs.disconnect()',
  "          const cleanup = () => { el.style.opacity = ''; el.style.transform = ''; el.style.filter = '' }",
  '',
  "          if (isHeading) animate(el, { opacity: [0, 1], translateX: [-20, 0], duration: 500, ease: 'outCubic', onComplete: cleanup })",
  "          else if (isMedia) animate(el, { opacity: [0, 1], scale: [0.97, 1], filter: ['blur(4px)', 'blur(0px)'], duration: 600, ease: 'outQuad', onComplete: cleanup })",
  "          else if (isQuote) animate(el, { opacity: [0, 1], translateX: [20, 0], duration: 500, ease: 'outCubic', onComplete: cleanup })",
  "          else animate(el, { opacity: [0, 1], translateY: [12, 0], duration: 400, delay: Math.min((idx % 3) * 60, 120), ease: 'outQuad', onComplete: cleanup })",
  "        }, { threshold: 0.05, rootMargin: '0px 0px -10% 0px' })",
  '        obs.observe(el)',
  '      })',
  '    })',
  '  })',
  '})',
  '</script>',
  '',
  '<template>',
  '  <div class="' + cssClass + '">',
  '    <!-- Progress bar -->',
  '    <div class="crowned-progress">',
  '      <div class="crowned-progress-inner" :style="{ width: scrollProgress + \'%\' }" />',
  '    </div>',
  '',
  '    <!-- Top metadata -->',
  '    <div v-if="post" class="fixed top-0 left-0 right-0 z-[100] bg-black/80 backdrop-blur-sm print:hidden">',
  '      <PostMetadataBar :date="post?.metadata?.date || post?.date" :stats="readingStats" />',
  '    </div>',
  '',
  '    <article v-if="post" class="h-entry">',
  '      <!-- ===== HERO — customize this ===== -->',
  '      <header class="crowned-hero">',
  '        <h1 class="crowned-title" v-html="renderedTitle" />',
  '        <p v-if="post?.metadata?.dek || post?.dek" class="crowned-dek">',
  '          {{ post?.metadata?.dek || post?.dek }}',
  '        </p>',
  '        <WidgetsScrollIndicator :color="palette.accentDim" />',
  '      </header>',
  '',
  '      <!-- Microformats -->',
  '      <time v-if="post?.metadata?.date" :datetime="post.metadata.date" class="dt-published hidden">{{ post.metadata.date }}</time>',
  '      <div class="p-author h-card hidden"><span class="p-name">EJ Fox</span><a class="u-url" href="https://ejfox.com">ejfox.com</a></div>',
  '      <a :href="postUrl" class="u-url hidden">{{ postUrl }}</a>',
  '',
  '      <!-- ===== CONTENT ===== -->',
  '      <div ref="articleContent" class="crowned-body">',
  '        <div v-if="post?.html" class="blog-post-content e-content font-serif" v-html="post.html" />',
  '      </div>',
  '',
  '      <!-- Tags -->',
  '      <div v-if="articleTags.length" class="crowned-tags">',
  '        <a v-for="tag in articleTags" :key="tag" :href="`/blog/tag/${tag}`" class="crowned-tag">{{ tag }}</a>',
  '      </div>',
  '',
  '      <PostNav class="print:hidden" :prev-post="nextPrevPosts?.prev" :next-post="nextPrevPosts?.next" />',
  '      <PostRelated class="print:hidden" :related-posts="relatedPosts" />',
  '      <Webmentions class="print:hidden" :url="postUrl" />',
  '    </article>',
  '  </div>',
  '</template>',
  '',
  '<style lang="postcss">',
  '/* Layout takeover */',
  'body.' + bodyClass + ' { background: var(--pt-bg) !important; }',
  'body.' + bodyClass + ' #app-container,',
  'body.' + bodyClass + ' #app-container > section { background: var(--pt-bg) !important; }',
  'body.' + bodyClass + ' nav.sticky,',
  'body.' + bodyClass + ' nav.md\\:hidden { display: none !important; }',
  'body.' + bodyClass + ' #main-content { width: 100% !important; padding-top: 0 !important; }',
  'body.' + bodyClass + ' footer { background: var(--pt-bg) !important; border-color: transparent !important; }',
  'body.' + bodyClass + ' .blog-post-content blockquote::before,',
  'body.' + bodyClass + ' .prose blockquote::before,',
  'body.' + bodyClass + ' blockquote::before { content: none !important; display: none !important; }',
  '',
  '.' + cssClass + ' {',
  '  position: relative; min-height: 100vh;',
  '  background: var(--pt-bg); color: var(--pt-text-dim);',
  '}',
  '',
  '/* Progress */',
  '.crowned-progress { position: fixed; top: 0; left: 0; right: 0; height: 1px; z-index: 101; }',
  '.crowned-progress-inner { height: 100%; background: linear-gradient(90deg, var(--pt-accent-dim), var(--pt-accent-glow)); transition: width 75ms ease-out; }',
  '',
  '/* Hero */',
  '.crowned-hero {',
  '  position: relative; z-index: 1; max-width: 900px; margin: 0 auto;',
  '  padding: 8rem 2rem 6rem; min-height: 70vh;',
  '  display: flex; flex-direction: column; justify-content: center;',
  '}',
  '@media (min-width: 768px) { .crowned-hero { padding: 10rem 2rem 8rem; min-height: 80vh; } }',
  '',
  '.crowned-title {',
  '  font-size: clamp(2.5rem, 8vw, 5.5rem); font-weight: 900; line-height: 1.05;',
  '  letter-spacing: -0.03em; color: var(--pt-text); overflow-wrap: break-word;',
  '}',
  ".crowned-title .typing-char { display: inline; opacity: 0; transition: opacity 0.06s ease-out; }",
  '.crowned-title .typing-char.typed { opacity: 1; }',
  '.crowned-title .cursor {',
  '  display: inline-block; width: 3px; height: 0.85em; margin-left: 1px;',
  '  background: var(--pt-accent); animation: crowned-blink 0.5s ease-in-out infinite; vertical-align: baseline;',
  '}',
  '@keyframes crowned-blink { 0%, 40% { opacity: 0.85; } 50%, 90% { opacity: 0; } 100% { opacity: 0.85; } }',
  '',
  '.crowned-dek {',
  '  margin-top: 1.5rem; font-family: Georgia, serif; font-size: 1.125rem;',
  '  line-height: 1.6; color: var(--pt-text-muted); max-width: 42em; font-style: italic;',
  '}',
  '',
  '/* Body */',
  '.crowned-body { max-width: 900px; margin: 0 auto; padding: 0 2rem 4rem; }',
  '.' + cssClass + ' .blog-post-content { --body-margin: 2rem; }',
  '',
  '/* Content colors */',
  '.' + cssClass + ' .blog-post-content p,',
  '.' + cssClass + ' .blog-post-content ul,',
  '.' + cssClass + ' .blog-post-content ol,',
  '.' + cssClass + ' .blog-post-content li { color: var(--pt-text-dim); }',
  '',
  '.' + cssClass + ' .blog-post-content h1,',
  '.' + cssClass + ' .blog-post-content h2 { color: var(--pt-text); border: none !important; }',
  '.' + cssClass + ' .blog-post-content h3,',
  '.' + cssClass + ' .blog-post-content h4 { color: var(--pt-text-dim); }',
  '',
  '.' + cssClass + ' .blog-post-content a { color: var(--pt-accent); text-decoration-color: var(--pt-accent-faint); }',
  '.' + cssClass + ' .blog-post-content a:hover { color: var(--pt-accent-glow); text-shadow: 0 0 12px var(--pt-accent-faint); }',
  '',
  '.' + cssClass + ' .blog-post-content blockquote {',
  '  border-left: 2px solid var(--pt-accent-faint) !important;',
  '  background: transparent !important; padding: 0.5rem 0 0.5rem 1.5rem !important;',
  '  color: var(--pt-text-dim);',
  '}',
  '',
  '.' + cssClass + ' .blog-post-content code { background: var(--pt-surface); color: var(--pt-accent-glow); border: 1px solid var(--pt-accent-faint); }',
  '.' + cssClass + ' .blog-post-content pre { background: var(--pt-surface); border: none; }',
  '.' + cssClass + ' .blog-post-content pre code { background: transparent; border: none; }',
  '.' + cssClass + ' .blog-post-content img { border-radius: 6px; }',
  '.' + cssClass + ' .blog-post-content hr { border: none; height: 1px; margin: 4rem 0; background: linear-gradient(90deg, transparent, var(--pt-accent-dim), transparent); }',
  '',
  '/* Tags */',
  '.crowned-tags { max-width: 900px; margin: 0 auto; padding: 1rem 2rem 2rem; display: flex; flex-wrap: wrap; gap: 0.5rem; }',
  '.crowned-tag {',
  '  font-family: ui-monospace, monospace; font-size: 0.6875rem;',
  '  padding: 0.25rem 0.75rem; border-radius: 999px;',
  '  border: 1px solid var(--pt-accent-faint); color: var(--pt-text-muted); text-decoration: none; transition: all 0.15s;',
  '}',
  '.crowned-tag:hover { border-color: var(--pt-accent-dim); color: var(--pt-text); }',
  '',
  '/* Reduced motion */',
  '@media (prefers-reduced-motion: reduce) {',
  '  .crowned-title .typing-char { opacity: 1 !important; transition: none; }',
  '  .crowned-title .cursor { display: none; }',
  '}',
  '',
  '@media print {',
  '  .crowned-progress { display: none !important; }',
  '  .' + cssClass + ' { background: white !important; color: black !important; }',
  '}',
  '</style>',
]

mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, lines.join('\n'), 'utf-8')

console.log('')
console.log('  \u2728 Crowned: ' + outPath)
console.log('')
console.log('  Hue: ' + hue + '  |  Body class: ' + bodyClass)
console.log('  Edit the file to add your spectacle.')
console.log('')
console.log('  Palette preview:')
console.log('    accent:   hcl(' + hue + ', 40, 60)')
console.log('    warm:     hcl(' + (hue + 40) + ', 30, 55)')
console.log('    cool:     hcl(' + (hue - 30) + ', 25, 50)')
console.log('    eerie:    hcl(' + (hue - 60) + ', 35, 45)')
console.log('')
