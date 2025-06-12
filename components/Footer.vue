<template>
  <footer class="py-6 mt-12 border-t border-zinc-200 dark:border-zinc-800">
    <div class="container mx-auto max-w-4xl px-4">
      <div class="flex flex-col items-center space-y-6">
        <!-- Profile image section -->
        <div class="flex justify-center">
          <img src="https://res.cloudinary.com/ejf/image/upload/w_128/v1733606048/me_full.png" alt="Profile"
            class="w-12 h-12 rounded-full" />
        </div>

        <!-- Navigation links -->
        <nav class="flex justify-center">
          <ul class="flex items-center space-x-6 text-sm text-zinc-600 dark:text-zinc-400">
            <li>
              <NuxtLink to="/stats" class="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">/stats</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/gists" class="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">/gists</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/gear" class="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">/gear</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/predictions" class="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">/predictions</NuxtLink>
            </li>
            <li>
              <NuxtLink to="https://ejfox.com/rss.xml" class="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">/rss</NuxtLink>
            </li>
          </ul>
        </nav>

        <!-- Newsletter signup -->
        <div class="w-full max-w-lg opacity-60 hover:opacity-100 transition-opacity duration-200">
          <NewsletterSignup />
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import NewsletterSignup from '~/components/NewsletterSignup.vue'

onMounted(() => {
  console.log('Footer component mounted')
})
</script>

<style scoped>
footer {
  position: relative;
  z-index: 10;
}
</style>