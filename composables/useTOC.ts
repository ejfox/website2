/**
 * @file useTOC.ts
 * @description Returns `tocTarget`, a ref to the sidebar's
 *   #nav-toc-container (layouts/default.vue), set on mount so pages can
 *   <Teleport :to="tocTarget"> their TOC without breaking SSR (the ref is null
 *   on the server). Used by blog, projects, predictions, reading and gear
 *   pages. Active-link highlighting is plugins/toc-highlight.client.ts.
 */
export function useTOC() {
  const tocTarget = ref<HTMLElement | null>(null)

  onMounted(() => {
    tocTarget.value = document.getElementById('nav-toc-container')
  })

  return {
    tocTarget,
  }
}
