<template>
  <component
    :is="external ? 'a' : NuxtLink"
    :to="external ? undefined : to"
    :href="external ? to : undefined"
    :target="external ? '_blank' : undefined"
    :rel="external ? 'noopener noreferrer' : undefined"
    class="card-link"
  >
    <div class="title-card">{{ title }}</div>
    <div v-if="description" class="text-xs text-zinc-500 mt-1">
      {{ description }}
    </div>
  </component>
</template>

<script setup>
const NuxtLink = resolveComponent('NuxtLink')

defineProps({
  to: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  external: { type: Boolean, default: false },
})
</script>
