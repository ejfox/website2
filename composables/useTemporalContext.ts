/**
 * Fetches "around this time" context for a given date.
 * Returns reading, predictions, and commit count from the same period.
 */
export function useTemporalContext(date: Ref<string | undefined> | ComputedRef<string | undefined>) {
  const context = ref<{
    reading: Array<{ title: string; author: string; slug: string; highlights: number }>
    predictions: Array<{ statement: string; confidence: number; status: string; slug: string }>
    scraps: Array<{ title: string; tags: string[]; url: string | null }>
    commits: number | null
  } | null>(null)

  const { data } = useFetch('/api/temporal-context', {
    query: { date },
    watch: [date],
    lazy: true,
    server: false, // Client-only, non-blocking
  })

  watch(data, (val) => {
    if (val && !('error' in val)) {
      context.value = val as typeof context.value
    }
  })

  const hasContext = computed(() => {
    if (!context.value) return false
    return (
      (context.value.reading?.length ?? 0) > 0 ||
      (context.value.predictions?.length ?? 0) > 0 ||
      (context.value.scraps?.length ?? 0) > 0 ||
      (context.value.commits ?? 0) > 0
    )
  })

  return { context, hasContext }
}
