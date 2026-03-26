<script setup>
defineProps({
  color: { type: String, default: 'rgba(255,255,255,0.2)' },
})
</script>

<template>
  <div class="scroll-indicator" :style="{ '--si-color': color }">
    <div class="scroll-line" />
  </div>
</template>

<style scoped>
.scroll-indicator {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.scroll-line {
  width: 1px;
  height: 3rem;
  background: linear-gradient(to bottom, transparent, var(--si-color));
  animation: scroll-pulse 2s ease-in-out infinite;
}

@keyframes scroll-pulse {
  0%, 100% { opacity: 0.3; transform: scaleY(0.8); }
  50% { opacity: 1; transform: scaleY(1); }
}

@media (prefers-reduced-motion: reduce) {
  .scroll-line { animation: none; opacity: 0.5; }
}
</style>
