import { ref, watch, type Ref } from 'vue'
import { interpolate } from 'd3-interpolate'
import { easeQuadOut } from 'd3-ease'

export function useTransition<T>(
  source: Ref<T>,
  { duration = 750, ease = easeQuadOut, immediate = false } = {}
) {
  const current = ref<T>(source.value) as Ref<T>
  let frame: number
  let startTime: number | null = null

  watch(
    source,
    (next, prev) => {
      if (immediate || !prev) {
        current.value = next
        return
      }

      // Cancel any in-progress animation
      if (frame) cancelAnimationFrame(frame)

      // Create interpolator between old and new values
      const interpolator = Array.isArray(next)
        ? interpolate(prev as any[], next as any[])
        : typeof next === 'object'
          ? interpolate(prev as object, next as object)
          : interpolate(prev as number, next as number)

      // Start animation
      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp
        const progress = Math.min(1, (timestamp - startTime) / duration)
        const eased = ease(progress)

        current.value = interpolator(eased) as T

        if (progress < 1) {
          frame = requestAnimationFrame(animate)
        } else {
          startTime = null
        }
      }

      frame = requestAnimationFrame(animate)
    },
    { deep: true }
  )

  return current
}
