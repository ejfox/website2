<template>
  <div v-if="show" class="stack-1">
    <div class="label-uppercase">{{ title }}</div>
    <div class="grid-2col">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  show: {
    type: Boolean,
    default: true
  }
})
</script>
