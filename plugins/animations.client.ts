// Initialize unified animation system
import { useAnimations } from '~/composables/useAnimations'

export default defineNuxtPlugin(() => {
  if (process.client) {
    const { reveal } = useAnimations()
    
    // Initialize scroll reveals
    reveal.init()
    
    // Dev tools
    if (process.dev) {
      // @ts-expect-error - Adding debug animations to window for dev tools
      window.__animations = useAnimations()
    }
  }
})