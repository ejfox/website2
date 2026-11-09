<!--
  @file PostFooter.vue
  @description Three-column foot of a blog post (Previous · Related · Next)
    plus the "grab some time on my calendar" line. Used by pages/blog/[...slug].vue.
    Renders nothing when there are no neighbours and no related posts.
  @props prevPost, nextPost: { slug, title, date } | null
  @props relatedPosts: [{ post, overlappingTags? }] (only the first 6 render;
    title/date fall back to post.metadata)
-->
<script setup lang="ts">
defineProps<{
  prevPost?: { slug: string; title: string; date: string } | null
  nextPost?: { slug: string; title: string; date: string } | null
  relatedPosts: Array<{
    post: { slug: string; title?: string; date?: string; metadata?: any }
    overlappingTags?: string[]
  }>
}>()
</script>

<template>
  <footer
    v-if="prevPost || nextPost || relatedPosts.length"
    class="post-footer print:hidden"
  >
    <div class="post-footer__cols">
      <section v-if="prevPost">
        <h2 class="post-footer__label">Previous</h2>
        <ul class="post-footer__list">
          <li>
            <NuxtLink :to="`/blog/${prevPost.slug}`">
              {{ prevPost.title }}
            </NuxtLink>
            <span class="post-footer__date">
              {{ formatLongDate(prevPost.date) }}
            </span>
          </li>
        </ul>
      </section>

      <section v-if="relatedPosts.length">
        <h2 class="post-footer__label">Related</h2>
        <ul class="post-footer__list">
          <li v-for="{ post } in relatedPosts.slice(0, 3)" :key="post.slug">
            <NuxtLink :to="`/blog/${post.slug}`">
              {{ post.title || post.metadata?.title }}
            </NuxtLink>
            <span class="post-footer__date">
              {{ formatLongDate(post.date || post.metadata?.date) }}
            </span>
          </li>
        </ul>
      </section>

      <section v-if="nextPost">
        <h2 class="post-footer__label">Next</h2>
        <ul class="post-footer__list">
          <li>
            <NuxtLink :to="`/blog/${nextPost.slug}`">
              {{ nextPost.title }}
            </NuxtLink>
            <span class="post-footer__date">
              {{ formatLongDate(nextPost.date) }}
            </span>
          </li>
        </ul>
      </section>
    </div>
  </footer>
</template>

<style scoped>
.post-footer {
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px solid;
  border-color: color-mix(in srgb, currentColor 15%, transparent);
}

.post-footer__cols {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (min-width: 768px) {
  .post-footer__cols {
    grid-template-columns: 1fr 1fr 1fr;
    gap: 3rem;
  }
}

.post-footer__label {
  @apply font-mono;
  font-size: 0.6875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  opacity: 0.5;
  margin: 0 0 0.75rem;
}

.post-footer__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.875rem;
}

.post-footer__list li {
  display: grid;
  gap: 0.125rem;
}

.post-footer__list a {
  @apply font-serif;
  font-size: 0.9375rem;
  line-height: 1.35;
  color: inherit;
  text-decoration: none;
  text-underline-offset: 3px;
  text-decoration-thickness: 1px;
}

.post-footer__list a:hover {
  text-decoration: underline;
}

.post-footer__date {
  @apply font-mono;
  font-size: 0.6875rem;
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;
  opacity: 0.45;
}
</style>
