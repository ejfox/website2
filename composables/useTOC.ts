/**
 * Reusable TOC (Table of Contents) composable
 * Handles teleport target setup and SSR safety
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
