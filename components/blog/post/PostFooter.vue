<script setup lang="ts">
const { formatLongDate } = useDateFormat()

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
      <!-- PREVIOUS -->
      <section>
        <h2 class="post-footer__label">Previous</h2>
        <ul v-if="prevPost" class="post-footer__list">
          <li>
            <NuxtLink :to="`/blog/${prevPost.slug}`">
              {{ prevPost.title }}
            </NuxtLink>
            <span class="post-footer__date">{{ formatLongDate(prevPost.date) }}</span>
          </li>
        </ul>
        <p v-else class="post-footer__empty">—</p>
      </section>

      <!-- RELATED -->
      <section>
        <h2 class="post-footer__label">Related</h2>
        <ul v-if="relatedPosts.length" class="post-footer__list">
          <li
            v-for="{ post } in relatedPosts.slice(0, 6)"
            :key="post.slug"
          >
            <NuxtLink :to="`/blog/${post.slug}`">
              {{ post.title || post.metadata?.title }}
            </NuxtLink>
            <span class="post-footer__date">{{ formatLongDate(post.date || post.metadata?.date) }}</span>
          </li>
        </ul>
        <p v-else class="post-footer__empty">—</p>
      </section>

      <!-- NEXT -->
      <section>
        <h2 class="post-footer__label">Next</h2>
        <ul v-if="nextPost" class="post-footer__list">
          <li>
            <NuxtLink :to="`/blog/${nextPost.slug}`">
              {{ nextPost.title }}
            </NuxtLink>
            <span class="post-footer__date">{{ formatLongDate(nextPost.date) }}</span>
          </li>
        </ul>
        <p v-else class="post-footer__empty">—</p>
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
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
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
  font-family: Georgia, 'Times New Roman', serif;
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
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;
  opacity: 0.45;
}

.post-footer__empty {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 0.75rem;
  opacity: 0.3;
  margin: 0;
}
</style>
