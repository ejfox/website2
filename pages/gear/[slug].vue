<template>
  <div class="min-h-screen flex items-center justify-center p-8 pb-32">
    <!-- Main gear card -->
    <GearCard3D v-if="gearItem" :gear-item="gearItem" />

    <!-- Not found state -->
    <div v-else class="text-center max-w-md mx-auto">
      <div class="text-6xl mb-6">⬟</div>
      <h1 class="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
        Gear Not Found
      </h1>
      <p class="text-zinc-600 dark:text-zinc-400 mb-8">
        This gear item doesn't exist in our inventory.
      </p>
      <NuxtLink
        to="/gear"
        class="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
      >
        ← Browse All Gear
      </NuxtLink>
    </div>
  </div>

  <!-- Bottom gear navigator -->
  <GearNavigator :current-slug="$route.params.slug" />
</template>

<script setup>
import * as d3 from 'd3'

const route = useRoute()

// Fetch gear item
const { data: gearItem } = await useAsyncData(
  `gear-${route.params.slug}`,
  async () => {
    try {
      const csvText = await $fetch('/gear.csv', { responseType: 'text' })
      const gearItems = d3.csvParse(csvText)
      return gearItems.find(
        (item) =>
          item.Name.toLowerCase().replace(/[^a-z0-9]+/g, '-') ===
          route.params.slug
      )
    } catch (error) {
      console.error('Error fetching gear:', error)
      return null
    }
  },
  {
    server: false
  }
)

// Page transitions
definePageMeta({
  pageTransition: {
    name: 'slide-gear',
    mode: 'out-in'
  }
})

// SEO
useHead(() => ({
  title: gearItem.value ? `${gearItem.value.Name} - Gear` : 'Gear Not Found',
  meta: [
    {
      name: 'description',
      content: gearItem.value
        ? `${gearItem.value.Name} - ${gearItem.value.Type} gear`
        : 'Gear item not found'
    }
  ]
}))
</script>

<style scoped>
/* Slide transitions for gear navigation */
.slide-gear-enter-active,
.slide-gear-leave-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.slide-gear-enter-from {
  opacity: 0;
  transform: translateX(50px) scale(0.95);
}

.slide-gear-leave-to {
  opacity: 0;
  transform: translateX(-50px) scale(0.95);
}
</style>

