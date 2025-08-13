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
// Animation refs
const footerRef = ref(null)
// NUKED BY BLOODHOUND: const { timing, easing, staggers } = useAnimations()
const profileRef = ref(null)
const avatarRef = ref(null)
const navRef = ref(null)
const navListRef = ref(null)
const navItemRefs = ref([])
const newsletterRef = ref(null)
</script>
