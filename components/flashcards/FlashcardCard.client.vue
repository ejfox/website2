<!--
  @file FlashcardCard.client.vue
  @description Minimal 3D flashcard with mouse-tracking parallax and smooth flip
-->
<template>
  <div
    ref="cardRef"
    class="flashcard-container"
    :style="containerStyle"
    @click="$emit('flip')"
  >
    <div class="flashcard" :class="{ flipped: flipped }">
      <!-- Front face -->
      <div class="flashcard-face flashcard-front">
        <span class="card-label">Q</span>
        <div class="card-content">
          <p class="card-text">{{ front }}</p>
        </div>
        <span class="card-hint">click to reveal</span>
      </div>

      <!-- Back face -->
      <div class="flashcard-face flashcard-back">
        <span class="card-label">A</span>
        <div class="card-content">
          <p class="card-text card-text-answer">{{ back }}</p>
          <div v-if="hints && hints.length > 0" class="hints">
            <p v-for="(hint, i) in hints" :key="i" class="hint-text">
              {{ hint }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMouse, useWindowSize } from '@vueuse/core'

defineProps<{
  front: string
  back: string
  flipped: boolean
  hints?: string[]
}>()

defineEmits<{
  flip: []
}>()

const cardRef = ref<HTMLElement | null>(null)

// Mouse tracking for 3D tilt
const { x: mouseX, y: mouseY } = useMouse()
const { width: winWidth, height: winHeight } = useWindowSize()

// 3D transform based on mouse position
const containerStyle = computed(() => {
  const centerX = winWidth.value / 2
  const centerY = winHeight.value / 2

  // Subtle rotation - reduced intensity for elegance
  const rotateX = -((mouseY.value - centerY) / centerY) * 6
  const rotateY = ((mouseX.value - centerX) / centerX) * 6

  // Subtle lift
  const translateZ =
    (Math.abs(mouseX.value - centerX) / centerX +
      Math.abs(mouseY.value - centerY) / centerY) *
    6

  return {
    transform: `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${translateZ}px)`,
  }
})
</script>

<style scoped>
.flashcard-container {
  width: 100%;
  max-width: 640px;
  aspect-ratio: 5 / 3;
  cursor: pointer;
  transform-style: preserve-3d;
  transition: transform 0.12s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
}

.flashcard {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.flashcard.flipped {
  transform: rotateY(180deg);
}

.flashcard-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  overflow: hidden;
}

.flashcard-front {
  background: #18181b;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.06),
    0 1px 2px rgba(0, 0, 0, 0.3),
    0 8px 24px -4px rgba(0, 0, 0, 0.4),
    0 24px 48px -8px rgba(0, 0, 0, 0.3);
}

.flashcard-back {
  background: linear-gradient(165deg, #27272a 0%, #1c1c1f 100%);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.08),
    0 1px 2px rgba(0, 0, 0, 0.3),
    0 8px 24px -4px rgba(0, 0, 0, 0.4),
    0 24px 48px -8px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  transform: rotateY(180deg);
}

.card-label {
  position: absolute;
  top: 1.5rem;
  left: 1.5rem;
  font-family: ui-monospace, 'SF Mono', Monaco, monospace;
  font-size: 0.625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #52525b;
}

.card-hint {
  position: absolute;
  bottom: 1.5rem;
  font-family: ui-monospace, 'SF Mono', Monaco, monospace;
  font-size: 0.625rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #3f3f46;
  transition: opacity 0.2s;
}

.flashcard-container:hover .card-hint {
  opacity: 0;
}

.card-content {
  text-align: center;
  width: 100%;
  max-width: 90%;
}

.card-text {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(1.25rem, 3vw, 1.75rem);
  line-height: 1.5;
  color: #fafafa;
  font-weight: 400;
  margin: 0;
  letter-spacing: -0.01em;
}

.card-text-answer {
  color: #e4e4e7;
}

.hints {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.hint-text {
  font-family: ui-monospace, 'SF Mono', Monaco, monospace;
  font-size: 0.75rem;
  color: #71717a;
  margin: 0.5rem 0 0 0;
  line-height: 1.5;
}

/* Hover glow */
.flashcard-container:hover .flashcard-face {
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.3),
    0 12px 32px -4px rgba(0, 0, 0, 0.5),
    0 32px 64px -8px rgba(0, 0, 0, 0.4);
}

/* Active press */
.flashcard-container:active {
  transform: scale(0.98);
}

/* Responsive */
@media (max-width: 640px) {
  .flashcard-container {
    max-width: 100%;
    aspect-ratio: 4 / 5;
  }

  .flashcard-face {
    padding: 2rem;
  }

  .card-text {
    font-size: 1.25rem;
  }

  .card-label {
    top: 1rem;
    left: 1rem;
  }

  .card-hint {
    bottom: 1rem;
  }
}
</style>
