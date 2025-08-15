<template>
  <div class="group hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors rounded-lg p-3 -m-3">
    <component 
      :is="external ? 'a' : 'NuxtLink'" 
      :to="external ? undefined : to"
      :href="external ? to : undefined"
      :target="external ? '_blank' : undefined"
      :rel="external ? 'noopener noreferrer' : undefined"
      class="block"
    >
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <h3 class="font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">
              {{ title }}
            </h3>
            <Icon 
              v-if="external" 
              name="heroicons:arrow-top-right-on-square" 
              class="w-3 h-3 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors"
            />
          </div>
          <p class="text-sm text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
            {{ description }}
          </p>
        </div>
        <Icon 
          name="heroicons:chevron-right" 
          class="w-4 h-4 text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 transition-colors flex-shrink-0 mt-0.5"
        />
      </div>
    </component>
  </div>
</template>

<script setup>
defineProps({
  to: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  external: {
    type: Boolean,
    default: false
  }
})
</script>