<script setup lang="ts">
// The scrap's wall label with no site chrome: Scrapworld renders this live on the back of
// the inspected card through Ultralight (2026-10-29). Not for people; noindex.
definePageMeta({ layout: false })
useHead({ htmlAttrs: { class: 'dark' }, bodyAttrs: { class: 'bg-black' } })
useSeoMeta({ robots: 'noindex, nofollow' })

const scrap = await useScrapPermalink()
useScrapSeo(scrap.value!)
</script>

<template>
  <ScrapsScrapLabel v-if="scrap" :scrap="scrap" embed />
</template>
