<template>
  <div class="min-h-screen flex items-center justify-center p-8 pb-32">
    <!-- Main gear card -->
    <GearCard3D v-if="data" :gear-item="data" class="gear-card-entrance" />

    <!-- Not found state -->
    <div v-else class="text-center max-w-md mx-auto">
      <div class="text-6xl mb-8">⬟</div>
      <h1 class="text-3xl font-light text-zinc-900 dark:text-zinc-100 mb-4">
        Gear Not Found
      </h1>
      <p class="text-zinc-600 dark:text-zinc-400 mb-8">
        This gear item doesn't exist in our inventory.
      </p>
      <NuxtLink to="/gear" class="btn-primary"> ← Browse All Gear </NuxtLink>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const { data, _pending, error } = await useFetch(
  `/api/gear/${route.params.slug}`
)

// Handle errors properly
if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 500,
    statusMessage: error.value.statusMessage || 'Failed to load gear'
  })
}

// SEO the Nuxt way - reactive and clean
useSeoMeta({
  title: () => (data.value ? `${data.value.Name} - Gear` : 'Loading... - Gear'),
  description: () => {
    if (!data.value) return 'Loading gear item...'
    const weight =
      data.value['Base Weight ()'] ||
      data.value['Loaded Weight ()'] ||
      'Unknown weight'
    return `${data.value.Name} - ${data.value.Type} gear (${weight}g). ${data.value.Notes || ''}`
  }
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
  animation: hexRotate 0.8s linear infinite;
}

.hex-inner {
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, #3b82f6, #06b6d4, #8b5cf6);
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  animation: hexPulse 0.6s ease-in-out infinite alternate;
}

@keyframes hexRotate {
  0% {
    transform: rotate(30deg);
  }
  100% {
    transform: rotate(390deg);
  }
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

/* BLOODHOUND FIX: Gear card now visible immediately - no animation */
.gear-card-entrance {
  opacity: 1;
  transform: none;
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
  transform: perspective(1500px) translateX(120%) rotateY(65deg) rotateX(-20deg)
    scale(0.8) translateZ(-150px);
  opacity: 0.3;
  filter: blur(1.5px) brightness(0.7);
}

.gear-slide-leave-to {
  transform: perspective(1500px) translateX(-120%) rotateY(-65deg)
    rotateX(20deg) scale(1.2) translateZ(150px);
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
