<template>
  <div class="simple-layout p-4 sm:p-8 md:p-8">
    <slot />
  </div>
</template>

<style lang="css">
.simple-layout {
  min-height: 100vh;
  width: 100%;
  background-color: rgb(249, 250, 251); /* gray-50 light mode */
  color: rgb(31, 41, 55); /* gray-800 light mode */
}

@media (prefers-color-scheme: dark) {
  .simple-layout {
    background-color: rgb(17, 24, 39); /* gray-900 dark mode */
    color: rgb(243, 244, 246); /* gray-100 dark mode */
  }
}
</style>
