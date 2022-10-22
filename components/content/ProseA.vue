<script setup lang="ts">
const props = defineProps({
  href: {
    type: String,
    default: ''
  },
  blank: {
    type: Boolean,
    default: false
  }
})

// check if the href is linking to wikipedia, github, youtube, or twitter, and if so, add the social icon
const isSocial = computed(() => {
  return props.href.includes('wikipedia') || props.href.includes('github') || props.href.includes('youtube') || props.href.includes('twitter')
})

// check if the href is linking to a file, and if so, add the file icon

</script>

<template>
  <NuxtLink :href="href" class="link near-black dim underline fw5">
    <slot />
  </NuxtLink>
</template>