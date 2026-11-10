<!--
  @file scraps/embed/[id].vue
  @description /scraps/embed/<id>: the scrap's wall label with no site chrome.
    Scrapworld renders this live on the back of the inspected card through
    Ultralight. Not for people; noindex. Same data as pages/scraps/[id].vue.
-->
<script setup lang="ts">
definePageMeta({ layout: false })
useHead({ htmlAttrs: { class: 'dark' }, bodyAttrs: { class: 'bg-black' } })
useSeoMeta({ robots: 'noindex, nofollow' })

const scrap = await useScrapPermalink()
useScrapSeo(scrap.value!)
</script>

<template>
  <ScrapsScrapLabel v-if="scrap" :scrap="scrap" embed />
</template>
