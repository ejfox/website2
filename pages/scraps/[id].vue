<script setup lang="ts">
// One scrap's permalink. Scrapworld prints a small QR to this page on every shared card
// (2026-10-29); /scraps/embed/<id> is the same label without the site, for the card itself.
const scrap = await useScrapPermalink()
useScrapSeo(scrap.value!)
</script>

<template>
  <ScrapsScrapLabel v-if="scrap" :scrap="scrap" />
</template>
