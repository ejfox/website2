<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'

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

async function ensureBody() {
  if (bodyHtml.value !== null || loadingBody.value) return
  loadingBody.value = true
  try {
    const post = await $fetch<{ html?: string }>(`/api/posts/${props.post.slug}`)
    bodyHtml.value = post?.html || ''
  } catch {
    bodyHtml.value = ''
  } finally {
    loadingBody.value = false
  }
}

const toggle = () => {
  expanded.value = !expanded.value
  if (expanded.value) {
    ensureBody()
    nextTick(() => {
      window.dispatchEvent(new CustomEvent('splay:rescan'))
    })
  }
}

function onSplayEnter(el: Element) {
  el.dispatchEvent(new CustomEvent('splay:rescan', { bubbles: true }))
}

const stackImages = computed(() => props.post.images.slice(0, 3))

function hashStr(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function thumbStyle(url: string, i: number) {
  const h = hashStr(url + i)
  const rotRaw = ((h & 0xffff) / 0xffff) * 14 - 7
  const rot = rotRaw >= 0 ? Math.max(rotRaw, 2.5) : Math.min(rotRaw, -2.5)
  const offX = ((h >>> 16) & 0xff) / 0xff * 10 - 5
  const offY = ((h >>> 24) & 0xff) / 0xff * 8 - 4
  return {
    '--rot': `${rot.toFixed(2)}deg`,
    '--off-x': `${offX.toFixed(1)}px`,
    '--off-y': `${offY.toFixed(1)}px`,
    zIndex: i + 1,
  } as Record<string, string | number>
}

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
    class="photo-stack"
    :class="{ 'is-expanded': expanded }"
    :id="`stack-${post.slug}`"
  >
    <button
      class="photo-stack__trigger"
      type="button"
      :aria-expanded="expanded"
      @click="toggle"
    >
      <div class="photo-stack__pile" aria-hidden="true">
        <img
          v-for="(src, i) in stackImages"
          :key="src"
          :src="thumbUrl(src, 560)"
          :style="thumbStyle(src, i)"
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

    <Transition name="splay" @after-enter="onSplayEnter">
      <div v-show="expanded" class="photo-stack__body">
        <p v-if="post.dek" class="photo-stack__dek">{{ post.dek }}</p>
        <div v-if="loadingBody && !bodyHtml" class="photo-stack__loading">loading…</div>
        <div
          v-else
          class="photo-stack__content blog-post-content"
          v-html="bodyHtml"
        />
        <div class="photo-stack__foot">
          <NuxtLink :to="`/blog/${post.slug}`" class="photo-stack__permalink">open full post →</NuxtLink>
          <button type="button" class="photo-stack__close" @click="toggle">close</button>
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
  /* Let thumbs visually escape the column when splaying */
  overflow: visible;
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

/* ---- Pile ---- */
.photo-stack__pile {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  padding: 14%;
  box-sizing: border-box;
}
.photo-stack__pile img {
  position: absolute;
  top: 14%;
  left: 14%;
  width: 72%;
  height: 72%;
  object-fit: cover;
  transform-origin: center center;
  transform:
    translate(var(--off-x, 0), var(--off-y, 0))
    rotate(var(--rot, 0deg));
  box-shadow:
    0 8px 18px -8px rgba(0, 0, 0, 0.5),
    0 3px 6px -3px rgba(0, 0, 0, 0.35);
  transition:
    transform 720ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 720ms cubic-bezier(0.22, 1, 0.36, 1);
}

/* Collapse stagger: outer thumbs fall back into the stack first, then inner. */
.photo-stack__pile img:nth-child(3) { transition-delay: 0ms; }
.photo-stack__pile img:nth-child(2) { transition-delay: 80ms; }
.photo-stack__pile img:nth-child(1) { transition-delay: 160ms; }

/* Expanded: splay the three thumbs outward, staggered like dealing cards
   off the top of a pile. Splay is sized to column width — thumbs may
   slightly overhang the column edges for editorial drama. */
.is-expanded .photo-stack__pile {
  aspect-ratio: auto;
  height: 240px;
  padding: 0;
  overflow: visible;
}
.is-expanded .photo-stack__pile img {
  top: 50%;
  left: 50%;
  width: 180px;
  height: 180px;
  margin-top: -90px;
  margin-left: -90px;
  box-shadow:
    0 18px 36px -10px rgba(0, 0, 0, 0.55),
    0 5px 10px -4px rgba(0, 0, 0, 0.3);
}
.is-expanded .photo-stack__pile img:nth-child(3) {
  transition-delay: 0ms;
  transform: translate(108px, -6px) rotate(10deg) scale(1.02);
}
.is-expanded .photo-stack__pile img:nth-child(2) {
  transition-delay: 140ms;
  transform: translate(0, 8px) rotate(-3deg) scale(1.02);
}
.is-expanded .photo-stack__pile img:nth-child(1) {
  transition-delay: 280ms;
  transform: translate(-108px, -6px) rotate(-9deg) scale(1.02);
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
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 0.95rem;
  line-height: 1.25;
  color: inherit;
}
.photo-stack__sub {
  display: flex;
  gap: 0.375rem;
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.5;
}
.photo-stack__sub .sep { opacity: 0.6; }

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
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 0.75rem;
  opacity: 0.5;
  text-align: center;
}
.photo-stack__dek {
  font-family: Georgia, 'Times New Roman', serif;
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
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
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

/* ---- Transition for expanded body — delayed so it appears after
       the thumb splay reads clearly (stagger takes ~280ms + 720ms travel). ---- */
.splay-enter-active {
  transition:
    opacity 420ms ease 480ms,
    max-height 540ms cubic-bezier(0.22, 1, 0.36, 1) 400ms;
  max-height: 500vh;
}
.splay-leave-active {
  transition:
    opacity 220ms ease,
    max-height 480ms cubic-bezier(0.22, 1, 0.36, 1);
  max-height: 500vh;
}
.splay-enter-from,
.splay-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>
