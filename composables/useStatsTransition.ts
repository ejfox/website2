import { TransitionPresets, useTransition } from '@vueuse/core'

export function useStatsTransition(value: Ref<number>, duration = 800) {
  const output = useTransition(value, {
    duration,
    transition: TransitionPresets.easeOutExpo
  })

  return {
    displayValue: computed(() => Math.round(output.value)),
    isTransitioning: computed(() => output.value !== value.value)
  }
}
