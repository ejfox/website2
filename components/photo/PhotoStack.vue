<!--
  @file PhotoStack.vue
  @description A photo-heavy blog post shown as one square cover cell in the
    /photos column grid (pages/photos/index.vue). Clicking expands it in place:
    the post body is fetched lazily from /api/posts/<slug> on first open and
    rendered with the blog's own .blog-post-content styles.
  @props post: { slug, title, dek?, year?, imageCount, images[] }
-->
<script setup lang="ts">
import { computed, ref } from 'vue'

interface PhotoPost {
  slug: string
  title: string
  dek?: string
  year?: number
  imageCount: number
  images: string[]
}

const props = defineProps<{ post: PhotoPost }>()

const expanded = ref(false)
const bodyHtml = ref<string | null>(null)
const loadingBody = ref(false)

// Fetch once: a failure caches '' too, so a broken post doesn't refetch on
// every toggle.
async function ensureBody() {
  if (bodyHtml.value !== null || loadingBody.value) return
  loadingBody.value = true
  try {
    const post = await $fetch<{ html?: string }>(
      `/api/posts/${props.post.slug}`
    )
    bodyHtml.value = post?.html || ''
  } catch {
    bodyHtml.value = ''
  } finally {
    loadingBody.value = false
  }
}

const toggle = () => {
  expanded.value = !expanded.value
  if (expanded.value) ensureBody()
}

const cover = computed(() => props.post.images[0])

// Square Cloudinary thumb: drop one existing leading transform segment
// (c_/w_/h_/f_/q_/e_/g_/l_…) and replace it with a w×w auto-gravity fill.
// Non-Cloudinary URLs pass through untouched.
function thumbUrl(src: string, w = 560) {
  if (!src.includes('res.cloudinary.com')) return src
  const base = src.split('/upload/')[0] + '/upload/'
  const pathPart = src.split('/upload/')[1] || ''
  const clean = pathPart.replace(/^[cwhfqegl]_[^/]+\//, '')
  return `${base}c_fill,g_auto,f_auto,q_auto,w_${w},h_${w}/${clean}`
}
</script>

<template>
  <article
    :id="`stack-${post.slug}`"
    class="photo-stack"
    :class="{ 'is-expanded': expanded }"
  >
    <button
      class="photo-stack__trigger"
      type="button"
      :aria-expanded="expanded"
      @click="toggle"
    >
      <div class="photo-stack__pile" aria-hidden="true">
        <img
          v-if="cover"
          :src="thumbUrl(cover, 560)"
          loading="lazy"
          decoding="async"
          alt=""
        />
      </div>
      <div class="photo-stack__caption">
        <span class="photo-stack__title">{{ post.title }}</span>
        <span class="photo-stack__sub">
          <span v-if="post.year">{{ post.year }}</span>
          <span v-if="post.year" class="sep">·</span>
          <span>{{ post.imageCount }} photographs</span>
        </span>
      </div>
    </button>

    <!-- v-show, not v-if: keeps the fetched body in the DOM across toggles -->
    <Transition name="reveal">
      <div v-show="expanded" class="photo-stack__body">
        <p v-if="post.dek" class="photo-stack__dek">{{ post.dek }}</p>
        <div v-if="loadingBody && !bodyHtml" class="photo-stack__loading">
          loading…
        </div>
        <div
          v-else
          class="photo-stack__content blog-post-content"
          v-html="bodyHtml"
        />
        <div class="photo-stack__foot">
          <NuxtLink :to="`/blog/${post.slug}`" class="photo-stack__permalink">
            open full post →
          </NuxtLink>
          <button type="button" class="photo-stack__close" @click="toggle">
            close
          </button>
        </div>
      </div>
    </Transition>
  </article>
</template>

<style scoped>
.photo-stack {
  break-inside: avoid;
  margin-bottom: 12px;
  display: block;
}
.photo-stack.is-expanded {
  margin: 1.5rem 0 2rem;
}

/* ---- Trigger card (collapsed state looks like a photo cell) ---- */
.photo-stack__trigger {
  all: unset;
  cursor: pointer;
  display: block;
  width: 100%;
  position: relative;
  transition: transform 180ms ease;
}
.photo-stack__trigger:hover {
  transform: translateY(-2px);
}
.photo-stack__trigger:focus-visible {
  outline: 1px dashed currentColor;
  outline-offset: 4px;
}

/* ---- Cover ---- */
.photo-stack__pile {
  width: 100%;
  aspect-ratio: 1 / 1;
}
.photo-stack__pile img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ---- Caption under the pile (photo-like: shows on hover) ---- */
.photo-stack__caption {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding: 0.5rem 0.25rem 0;
  opacity: 0.75;
  transition: opacity 160ms ease;
}
.photo-stack__trigger:hover .photo-stack__caption {
  opacity: 1;
}

.photo-stack__title {
  @apply font-serif;
  font-size: 0.95rem;
  line-height: 1.25;
  color: inherit;
}
.photo-stack__sub {
  display: flex;
  gap: 0.375rem;
  @apply font-mono;
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.5;
}
.photo-stack__sub .sep {
  opacity: 0.6;
}

/* ---- Expanded body: breaks OUT of the column to span full grid width,
       while the stack card itself stays in the column so surrounding
       photos remain visible. ---- */
.photo-stack__body {
  padding-top: 1rem;
  overflow: hidden;
}
.is-expanded .photo-stack__body {
  column-span: all;
  margin-top: 2rem;
  padding-top: 2rem;
  max-width: 760px;
  margin-left: auto;
  margin-right: auto;
  border-top: 1px solid color-mix(in srgb, currentColor 15%, transparent);
}
.photo-stack__loading {
  padding: 2rem 0;
  @apply font-mono;
  font-size: 0.75rem;
  opacity: 0.5;
  text-align: center;
}
.photo-stack__dek {
  @apply font-serif;
  font-size: 1.125rem;
  line-height: 1.5;
  opacity: 0.8;
  margin: 0 0 1.5rem;
  font-style: italic;
}
.photo-stack__foot {
  margin-top: 2rem;
  display: flex;
  justify-content: space-between;
  @apply font-mono;
  font-size: 0.75rem;
  opacity: 0.6;
}
.photo-stack__permalink,
.photo-stack__close {
  all: unset;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 4px;
}

.reveal-enter-active,
.reveal-leave-active {
  transition: opacity 240ms ease;
}
.reveal-enter-from,
.reveal-leave-to {
  opacity: 0;
}
</style>
