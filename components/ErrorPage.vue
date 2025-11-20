<template>
  <div class="px-8 py-8 space-y-1">
    <div class="text-2xl font-bold block mb-8">NOT FOUND</div>

    <p class="text-sm font-mono">sorry, "{{ cleanPath }}" doesn't exist</p>

    <div class="my-8"></div>

    <a :href="primaryLink.href" class="interactive-link">
      {{ primaryLink.text }}
    </a>

    <div class="my-8"></div>

    <a href="/" class="interactive-link"> ← back to homepage </a>
  </div>

  <!-- Teleport suggestions to sidebar -->
  <teleport v-if="suggestions.length" to="#nav-toc-container">
    <div class="py-4">
      <h3 class="label-tracked-sm">Maybe you meant</h3>
      <div class="space-y-1">
        <a
          v-for="s in suggestions"
          :key="s.path"
          :href="s.path"
          class="interactive-link"
        >
          {{ s.title }}
        </a>
      </div>
    </div>
  </teleport>
</template>

<script setup>
const props = defineProps({
  path: {
    type: String,
    default: ''
  },
  suggestions: {
    type: Array,
    default: () => []
  },
  primaryLink: {
    type: Object,
    default: () => ({ href: '/', text: 'go home' })
  }
})

const cleanPath = computed(() => {
  return props.path?.replace('/blog/', '') || 'unknown'
})
</script>
