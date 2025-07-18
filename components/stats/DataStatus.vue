<template>
  <div>
    <div
      v-if="Object.keys(errors).length && showErrors"
      class="mb-8 p-4 bg-gray-50/5 rounded-lg border border-gray-500/10"
    >
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-sm font-medium text-gray-400">
          Data Source Status
        </h3>
        <button class="text-gray-400 hover:text-gray-300" @click="$emit('hideErrors')">
          <Icon name="heroicons:x-mark" class="w-4 h-4" />
        </button>
      </div>
      <div class="space-y-1">
        <div
          v-for="(error, service) in errors" :key="service"
          class="text-gray-400/75 text-sm capitalize flex items-center space-x-2"
        >
          <Icon
            :name="error ? 'heroicons:x-circle' : 'heroicons:check-circle'" class="w-4 h-4"
            :class="error ? 'text-gray-500' : 'text-green-500'"
          />
          <span>{{ service }}</span>
        </div>
      </div>
    </div>

    <div v-if="hasStaleData" class="mb-8 p-4 bg-gray-50/5 rounded-lg border border-gray-500/10">
      <div class="flex items-center space-x-2 text-gray-400/75">
        <Icon name="heroicons:clock" class="w-4 h-4" />
        <span class="text-sm">Using cached data</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  errors: Record<string, boolean>
  showErrors: boolean
  hasStaleData: boolean
}>()

defineEmits<{
  (e: 'hideErrors'): void
}>()
</script>