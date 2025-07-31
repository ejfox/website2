<template>
  <footer
    ref="footerRef"
    class="py-6 mt-12 border-t border-zinc-200 dark:border-zinc-800"
  >
    <div class="container mx-auto max-w-4xl px-4">
      <div class="flex flex-col items-center space-y-6">
        <!-- Profile image section -->
        <div ref="profileRef" class="flex justify-center">
          <img
            ref="avatarRef"
            src="https://res.cloudinary.com/ejf/image/upload/w_128/v1733606048/me_full.png"
            alt="Profile"
            class="w-12 h-12 rounded-full"
          />
        </div>

        <!-- Navigation links -->
        <nav ref="navRef" class="flex justify-center">
          <ul
            ref="navListRef"
            class="flex items-center space-x-6 text-sm text-zinc-600 dark:text-zinc-400"
          >
            <li ref="navItemRefs">
              <NuxtLink
                to="/stats"
                class="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
              >
                /stats
              </NuxtLink>
            </li>
            <li ref="navItemRefs">
              <NuxtLink
                to="/gists"
                class="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
              >
                /gists
              </NuxtLink>
            </li>
            <li ref="navItemRefs">
              <NuxtLink
                to="/gear"
                class="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
              >
                /gear
              </NuxtLink>
            </li>
            <li ref="navItemRefs">
              <NuxtLink
                to="/predictions"
                class="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
              >
                /predictions
              </NuxtLink>
            </li>
            <li ref="navItemRefs">
              <NuxtLink
                to="https://ejfox.com/rss.xml"
                class="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
              >
                /rss
              </NuxtLink>
            </li>
          </ul>
        </nav>

        <!-- Newsletter signup -->
        <!-- <div ref="newsletterRef" class="w-full max-w-lg opacity-60 hover:opacity-100 transition-opacity"> -->
        <!--   <NewsletterSignup /> -->
        <!-- </div> -->
      </div>
    </div>
  </footer>
</template>

<script setup>
import { animate, stagger as _stagger } from '~/anime.esm.js'
import { useAnimations } from '~/composables/useAnimations'

// Animation refs
const footerRef = ref(null)
const { timing, easing, staggers } = useAnimations()
const profileRef = ref(null)
const avatarRef = ref(null)
const navRef = ref(null)
const navListRef = ref(null)
const navItemRefs = ref([])
const newsletterRef = ref(null)

// Epic footer reveal animation
const animateFooterReveal = async () => {
  if (process.server) return

  await nextTick()

  // Stage 1: Footer section slide up
  if (footerRef.value) {
    animate(footerRef.value, {
      opacity: [0, 1],
      translateY: [30, 0],
      filter: ['blur(1px)', 'blur(0px)'],
      duration: timing.expressive,
      ease: easing.dramatic
    })
  }

  // Stage 2: Avatar dramatic spin entrance
  setTimeout(() => {
    if (avatarRef.value) {
      animate(avatarRef.value, {
        keyframes: [
          { opacity: 0, scale: 0.3, rotateZ: -180, filter: 'blur(2px)' },
          { opacity: 0.8, scale: 1.2, rotateZ: 20, filter: 'blur(0.5px)' },
          { opacity: 1, scale: 1, rotateZ: 0, filter: 'blur(0px)' }
        ],
        duration: timing.slow,
        ease: easing.bounce
      })
    }
  }, timing.fast)

  // Stage 3: Navigation items cascade
  setTimeout(() => {
    if (navListRef.value) {
      const navItems = navListRef.value.querySelectorAll('li')
      if (navItems.length) {
        animate(Array.from(navItems), {
          opacity: [0, 1],
          translateY: [15, 0],
          scale: [0.8, 1.05, 1],
          filter: ['blur(0.5px)', 'blur(0px)'],
          duration: timing.slow,
          delay: _stagger(staggers.tight, { from: 'center' }),
          ease: easing.productive
        })
      }
    }
  }, timing.slow)

  // Stage 4: Newsletter section gentle reveal
  setTimeout(() => {
    if (newsletterRef.value) {
      animate(newsletterRef.value, {
        opacity: [0, 0.6],
        scale: [0.95, 1],
        translateY: [10, 0],
        duration: timing.slow,
        ease: easing.standard
      })
    }
  }, timing.expressive)

  // Stage 5: Continuous avatar float
  setTimeout(() => {
    const floatAnimation = () => {
      animate(avatarRef.value, {
        translateY: [0, -3, 0],
        rotateZ: [0, 1, 0],
        scale: [1, 1.02, 1],
        duration: timing.slowest * 2,
        ease: easing.standard,
        complete: floatAnimation
      })
    }
    floatAnimation()
  }, timing.expressive + timing.slow)
}

onMounted(() => {
  animateFooterReveal()
})
</script>

