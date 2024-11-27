<template>
  <div class="w-full h-full">
    <!-- Placeholder for now -->
    <div class="w-full h-full bg-gray-50 rounded flex items-center justify-center text-sm text-gray-400">
      Line Chart
    </div>
  </div>
</template>

<script setup>
defineProps({
  data: {
    type: Object,
    required: true
  }
})
</script>