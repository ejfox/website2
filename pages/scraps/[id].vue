<!--
  @file scraps/[id].vue
  @description /scraps/<id>: one scrap's permalink. Scrapworld prints a small
    QR to this page on every shared card; /scraps/embed/<id> is the same label
    without the site, for the card itself. Data: composables/useScrapPermalink.ts
    (GET /api/scraps/:id). Renders components/scraps/ScrapLabel.vue.
-->
<script setup lang="ts">
const scrap = await useScrapPermalink()
useScrapSeo(scrap.value!)
</script>

<template>
  <ScrapsScrapLabel v-if="scrap" :scrap="scrap" />
</template>
