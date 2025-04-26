<template>
  <div class="simple-layout p-4 sm:p-8 md:p-12">
    <slot />
  </div>
</template>

<style lang="css">
.simple-layout {
  min-height: 100vh;
  width: 100%;
  background-color: var(--color-bg, #18181b);
  color: var(--color-text, #f4f4f5);
}
</style>
