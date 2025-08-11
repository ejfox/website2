import { useAnimations } from '~/composables/useAnimations'

export default defineNuxtPlugin((nuxtApp: any) => {
  let isTransitioning = false
  const { transition: _transition, reveal } = useAnimations()
  
  // Determine transition type based on navigation context
  const _getTransitionType = (fromPath: string, toPath: string) => {
    const getSection = (path: string) => path.split('/')[1] || 'home'
    
    const fromSection = getSection(fromPath)
    const toSection = getSection(toPath)
    
    // Same section navigation (like blog post to blog post)
    if (fromSection === toSection && fromSection !== 'home') {
      return 'within-section'
    }
    
    // Home transitions
    if (fromSection === 'home' || toSection === 'home') {
      return fromSection === 'home' ? 'home-to-section' : 'section-to-home'
    }
    
    // Different sections
    return 'cross-section'
  }
  
  // SUBTLE SEQUENTIAL APPEARANCE - Your preferred style
  
  const handleTransition = async (direction: 'out' | 'in') => {
    const content = document.querySelector('main, article, [role="main"]')
    if (!content) return
    
    if (direction === 'out') {
      // Transition out
    } else {
      // Transition in
      // Trigger reveal check for new content
      setTimeout(() => reveal.check(), 50)
    }
  }
  
  
  // All transitions now use the same clean fade
  const executeTransition = (direction: 'out' | 'in') => handleTransition(direction)
  
  // Check if transition should run
  const shouldTransition = (to: string, from: string) => {
    // Skip hash-only changes
    const toBase = to.split('#')[0]
    const fromBase = from.split('#')[0]
    if (toBase === fromBase) return false
    
    // Skip query-only changes  
    const toPath = toBase.split('?')[0]
    const fromPath = fromBase.split('?')[0]
    if (toPath === fromPath) return false
    
    return true
  }
  
  // Hook into Nuxt router - simplified
  nuxtApp.$router.beforeEach(async (to: any, from: any) => {
    if (!from.name || !shouldTransition(to.path, from.path)) return
    if (isTransitioning) return
    
    isTransitioning = true
    await executeTransition('out')
  })
  
  nuxtApp.$router.afterEach(async (to: any, from: any) => {
    if (!from.name || !shouldTransition(to.path, from.path)) return
    if (!isTransitioning) return
    
    await executeTransition('in')
    isTransitioning = false
  })
})