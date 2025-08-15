// ⚡ CENTRALIZED VUEUSE UTILITIES - Bundle Size Optimization! *SWOOSH*
// Single import point for all @vueuse/core functions to enable tree-shaking!

// Only import what we actually use across the codebase
export { 
  useWindowSize,
  useDark,
  useIntersectionObserver,
  useMouse
} from '@vueuse/core'

// Re-export types we need
export type { MaybeElementRef } from '@vueuse/core'

// ⚡ PERFORMANCE NOTE:
// By centralizing all VueUse imports here, we can:
// 1. See exactly what we're using
// 2. Enable better tree-shaking
// 3. Reduce duplicate imports across files
// 4. Make it easier to audit and optimize usage