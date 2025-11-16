<template>
  <footer
    ref="footerRef"
    class="py-8 mt-8 border-t border-zinc-200 dark:border-zinc-800"
  >
    <div class="container mx-auto max-w-4xl px-4">
      <div class="flex flex-col items-center space-y-8">
        <!-- Profile image section with h-card -->
        <div ref="profileRef" class="flex justify-center h-card">
          <img
            ref="avatarRef"
            src="https://res.cloudinary.com/ejf/image/upload/w_128,f_webp/v1733606048/me_full.png"
            alt="EJ Fox"
            class="w-12 h-12 rounded-full u-photo"
          />
          <span class="p-name hidden">EJ Fox</span>
          <a class="u-url u-uid hidden" href="https://ejfox.com" rel="me"
            >ejfox.com</a
          >
          <span class="p-note hidden"
            >Data visualization engineer, photographer, and digital
            craftsperson</span
          >
        </div>

        <!-- Navigation links -->
        <nav ref="navRef" class="flex justify-center">
          <ul
            ref="navListRef"
            class="flex items-center space-x-8 text-sm text-zinc-600 dark:text-zinc-400"
          >
            <li ref="navItemRefs">
              <a
                href="/stats"
                class="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                >/stats</a
              >
            </li>
            <li ref="navItemRefs">
              <a
                href="/gists"
                class="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                >/gists</a
              >
            </li>
            <li ref="navItemRefs">
              <a
                href="/gear"
                class="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                >/gear</a
              >
            </li>
            <li ref="navItemRefs">
              <a
                href="/predictions"
                class="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                >/predictions</a
              >
            </li>
            <li ref="navItemRefs">
              <a
                href="https://ejfox.com/rss.xml"
                class="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                >/rss</a
              >
            </li>
          </ul>
        </nav>

        <!-- Social links with rel=me for IndieAuth -->
        <nav class="flex justify-center">
          <ul
            class="flex items-center space-x-4 text-sm text-zinc-600 dark:text-zinc-400"
          >
            <li>
              <a
                href="https://github.com/ejfox"
                rel="me authn"
                class="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                >GitHub</a
              >
            </li>
            <li>
              <a
                href="https://twitter.com/mrejfox"
                rel="me"
                class="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                >Twitter</a
              >
            </li>
            <li>
              <a
                href="mailto:ejfox@ejfox.com"
                rel="me authn"
                class="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                >Email</a
              >
            </li>
          </ul>
        </nav>

        <!-- Newsletter signup -->
        <!-- <div ref="newsletterRef" class="w-full max-w-lg opacity-60 hover:opacity-100 transition-opacity"> -->
        <!--   <NewsletterSignup /> -->
        <!-- </div> -->

        <!-- Build info - super subtle -->
        <div v-if="buildInfo" class="text-center">
          <a
            :href="`https://github.com/ejfox/website2/commit/${buildInfo.commitLong}`"
            target="_blank"
            rel="noopener noreferrer"
            class="font-mono text-[10px] text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors"
            :title="`Built from ${buildInfo.branch} on ${new Date(buildInfo.buildDate).toLocaleString()}`"
          >
            {{ buildInfo.commit }}
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
// Animation refs
const footerRef = ref(null)
// NUKED BY BLOODHOUND: const { timing, easing, staggers } = // DELETED: useAnimations()
const profileRef = ref(null)
const avatarRef = ref(null)
const navRef = ref(null)
const navListRef = ref(null)
const navItemRefs = ref([])

// Fetch build info
const { data: buildInfo } = await useFetch('/api/build-info')
</script>
