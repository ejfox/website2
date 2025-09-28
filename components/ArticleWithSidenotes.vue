<template>
  <article class="sidenotes-article" v-html="processedHtml" />
</template>

<script setup>
const props = defineProps(['html'])

// One pass: move footnotes to margins
const processedHtml = computed(() => {
  if (!props.html) return ''

  return (
    props.html
      // Mark container
      .replace('<article', '<article data-sidenotes')
      // Transform each footnote to sidenote
      .replace(
        /<li id="(fn\d+)">(.*?)<a.*?↩.*?<\/a><\/li>/g,
        (_, id, content) =>
          `<aside class="sidenote" id="${id}">${content}</aside>`
      )
      // Remove footnotes section
      .replace(/<section class="footnotes">[\s\S]*?<\/section>/, '')
  )
})
</script>

<style>
/* Grid magic: auto-positions sidenotes next to their references */
.sidenotes-article {
  display: grid;
  grid-template-columns: minmax(0, 65ch) 1fr;
  gap: 2rem;
  align-items: start;
}

/* Each paragraph/element takes first column */
.sidenotes-article > * {
  grid-column: 1;
}

/* Sidenotes take second column, auto-align with their reference */
.sidenote {
  grid-column: 2;
  margin: 0;
  padding-left: 1rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #71717a;
  align-self: start;
}

/* The curve: pure CSS using pseudo-element */
.sidenote::before {
  content: '';
  position: absolute;
  left: -2rem;
  top: 0.5rem;
  width: 3rem;
  height: 1px;
  background: linear-gradient(90deg, #3b82f6 0%, #3b82f6 30%, transparent 100%);
  opacity: 0;
  transition: opacity 0.2s;
}

/* Show curve on hover */
sup.footnote-ref:hover ~ .sidenote::before,
.sidenote:hover::before {
  opacity: 0.3;
}

/* Hide on mobile */
@media (max-width: 1280px) {
  .sidenotes-article {
    display: block;
  }

  .sidenote {
    display: none;
  }
}
</style>
