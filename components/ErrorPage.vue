<template>
  <div class="px-6 py-6 space-y-1">
    <div class="text-2xl font-bold block mb-8">NOT FOUND</div>
    
    <p class="text-sm font-mono">sorry, "{{ cleanPath }}" doesn't exist</p>
    
    <div class="my-6"></div>
    
    <a :href="primaryLink.href" 
       class="block text-sm font-mono transition-colors-base hover:text-zinc-900 dark:hover:text-zinc-100 no-underline">
      {{ primaryLink.text }}
    </a>
    
    <div class="my-6"></div>
    
    <a href="/" 
       class="block text-sm font-mono transition-colors-base hover:text-zinc-900 dark:hover:text-zinc-100 no-underline opacity-60">
      ← back to homepage
    </a>
  </div>

  <!-- Teleport suggestions to sidebar -->
  <teleport v-if="suggestions.length" to="#nav-toc-container">
    <div class="py-4">
      <h3 class="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400 mb-4">
        Maybe you meant
      </h3>
      <div class="space-y-1">
        <a v-for="s in suggestions" :key="s.path" :href="s.path" 
           class="block text-sm font-mono transition-colors-base hover:text-zinc-900 dark:hover:text-zinc-100 no-underline">
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