<template>
  <footer class="py-4">
    <div class="px-2">
      <!-- Profile image section -->
      <div class="flex justify-center mb-4">
        <img src="https://res.cloudinary.com/ejf/image/upload/w_128/v1733606048/me_full.png" alt="Profile"
          class="w-16 h-16 rounded-full" />
      </div>

      <!-- Navigation links -->
      <nav class="flex justify-center">
        <ul class="flex space-x-4 text-sm">
          <li>
            <NuxtLink to="/stats">/stats</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/gists">/gists</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/gear">/gear</NuxtLink>
          </li>
          <li>
            <NuxtLink to="https://ejfox.com/rss.xml">/rss</NuxtLink>
          </li>
        </ul>
      </nav>
    </div>
  </footer>
</template>

<script setup>

</script>

<style scoped></style>