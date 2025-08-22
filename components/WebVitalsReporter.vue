<template>
  <div v-if="showVitals && vitals.length" class="fixed bottom-4 left-4 z-50">
    <div class="bg-black/80 text-white text-xs p-2 rounded-lg font-mono max-w-xs">
      <div class="font-bold mb-1">
        Web Vitals
      </div>
      <div
        v-for="vital in vitals"
        :key="vital.name"
        class="flex justify-between"
      >
        <span>{{ vital.name }}:</span>
        <span :class="getVitalClass(vital)">{{ formatValue(vital) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
const vitals = ref([])
const showVitals = ref(false)

onMounted(() => {
  // Only show in development or when debug is enabled
  const config = useRuntimeConfig()
  showVitals.value = config.public.debug || config.public.nodeEnv === 'development'

  if (showVitals.value && typeof window !== 'undefined') {
    // Listen for web vitals reports
    window.addEventListener('web-vitals', (event) => {
      const { name, value, rating } = event.detail

      // Update or add vital
      const existingIndex = vitals.value.findIndex((v) => v.name === name)
      const vitalData = { name, value, rating }

      if (existingIndex >= 0) {
        vitals.value[existingIndex] = vitalData
      } else {
        vitals.value.push(vitalData)
      }
    })
  }
})

const getVitalClass = (vital) => {
  if (vital.rating === 'good') return 'text-green-400'
  if (vital.rating === 'needs-improvement') return 'text-yellow-400'
  return 'text-red-400'
}

const formatValue = (vital) => {
  if (vital.name === 'CLS') {
    return vital.value.toFixed(3)
  }
  return Math.round(vital.value) + 'ms'
}
</script>
