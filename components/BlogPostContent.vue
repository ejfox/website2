<template>
  <SidenotesContainer v-if="enableSidenotes">
    <div v-html="content" />
  </SidenotesContainer>

  <div v-else class="prose" v-html="content" />
</template>

<script setup lang="ts">
interface Props {
  content: string
  enableSidenotes?: boolean
}

withDefaults(defineProps<Props>(), {
  enableSidenotes: true
})
</script>
