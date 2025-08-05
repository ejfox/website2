<template>
  <div class="min-h-screen flex items-center justify-center p-8 pb-32">
    <!-- Loading state with epic animation -->
    <div v-if="pending" class="text-center">
      <div class="loading-container">
        <div class="loading-hexagon">
          <div class="hex-inner"></div>
        </div>
        <p class="mt-4 text-zinc-600 dark:text-zinc-400 animate-pulse">
          Loading gear data...
        </p>
      </div>
    </div>
    
    <!-- Main gear card -->
    <GearCard3D 
      v-else-if="data" 
      :gear-item="data" 
      class="gear-card-entrance"
    />

    <!-- Not found state -->
    <div v-else class="text-center max-w-md mx-auto">
      <div class="text-6xl mb-6">
        ⬟
      </div>
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
</template>

<script setup>
import { animate } from '~/anime.esm.js'

const route = useRoute()

// The Nuxt way - clean and simple
const { data, pending, error } = await useFetch(`/api/gear/${route.params.slug}`)

// Handle errors properly
if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 500,
    statusMessage: error.value.statusMessage || 'Failed to load gear'
  })
}

// SEO the Nuxt way - reactive and clean
useSeoMeta({
  title: () => data.value ? `${data.value.Name} - Gear` : 'Loading... - Gear',
  description: () => {
    if (!data.value) return 'Loading gear item...'
    const weight = data.value['Base Weight ()'] || data.value['Loaded Weight ()'] || 'Unknown weight'
    return `${data.value.Name} - ${data.value.Type} gear (${weight}g). ${data.value.Notes || ''}`
  }
})

// Advanced anime.js entrance animation (client-side only)
onMounted(() => {
  nextTick(() => {
    const gearCard = document.querySelector('.gear-card-entrance')
    if (gearCard && data.value) {
      // Epic sci-fi materialization animation
      animate(gearCard, {
        keyframes: [
          { 
            opacity: 0, 
            scale: 0.3, 
            rotateY: -180, 
            rotateX: 45,
            translateZ: -500,
            filter: 'blur(8px) brightness(0.3)'
          },
          { 
            opacity: 0.7, 
            scale: 1.2, 
            rotateY: 15, 
            rotateX: -10,
            translateZ: 50,
            filter: 'blur(2px) brightness(1.3) contrast(1.2)'
          },
          { 
            opacity: 1, 
            scale: 1, 
            rotateY: 0, 
            rotateX: 0,
            translateZ: 0,
            filter: 'blur(0px) brightness(1) contrast(1)'
          }
        ],
        duration: 1200,
        ease: 'outBack(1.7)'
      })
    }
  })
})

// Page transitions
definePageMeta({
  pageTransition: {
    name: 'gear-slide',
    mode: 'default',
    duration: 600
  }
})
</script>

<style scoped>
/* Epic hexagon loading animation */
.loading-container {
  @apply flex flex-col items-center justify-center;
}

.loading-hexagon {
  width: 60px;
  height: 60px;
  position: relative;
  transform: rotate(30deg);
  animation: hexRotate 2s linear infinite;
}

.hex-inner {
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, #3b82f6, #06b6d4, #8b5cf6);
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  animation: hexPulse 1.5s ease-in-out infinite alternate;
}

@keyframes hexRotate {
  0% { transform: rotate(30deg); }
  100% { transform: rotate(390deg); }
}

@keyframes hexPulse {
  0% { 
    opacity: 0.6;
    transform: scale(0.8);
    filter: blur(1px);
  }
  100% { 
    opacity: 1;
    transform: scale(1.1);
    filter: blur(0px);
  }
}

/* Gear card starts invisible for anime.js */
.gear-card-entrance {
  opacity: 0;
  transform: perspective(1000px) scale(0.3) rotateY(-180deg) rotateX(45deg) translateZ(-500px);
}

/* Page transitions */
.gear-slide-enter-active,
.gear-slide-leave-active {
  position: absolute;
  width: 100%;
  height: calc(100vh - 120px);
  top: 0;
  left: 0;
  z-index: 1;
  overflow: hidden;
}

.gear-slide-enter-from {
  transform: 
    perspective(1500px) 
    translateX(120%) 
    rotateY(65deg) 
    rotateX(-20deg) 
    scale(0.8) 
    translateZ(-150px);
  opacity: 0.3;
  filter: blur(1.5px) brightness(0.7);
}

.gear-slide-leave-to {
  transform: 
    perspective(1500px) 
    translateX(-120%) 
    rotateY(-65deg) 
    rotateX(20deg) 
    scale(1.2) 
    translateZ(150px);
  opacity: 0.2;
  filter: blur(1.5px) brightness(1.3);
}

.gear-slide-enter-active {
  transition: all 600ms cubic-bezier(0.23, 1, 0.32, 1);
  z-index: 2;
}

.gear-slide-leave-active {
  transition: all 600ms cubic-bezier(0.55, 0.085, 0.68, 0.53);
  z-index: 1;
}
</style>