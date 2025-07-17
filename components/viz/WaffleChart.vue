<template>
  <div class="inline-grid grid-cols-10 gap-[2px] bg-gray-900 p-1 rounded">
    <div
      v-for="i in 100" :key="i" class="w-[3px] h-[3px] rounded-[0.5px]"
      :class="i <= scaledData ? 'bg-gray-500' : 'bg-gray-800'"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  data: number
  total: number
}>()

const scaledData = computed(() =>
  Math.round((props.data / props.total) * 100)
)
</script>