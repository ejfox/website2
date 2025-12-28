<script setup lang="ts">
import { csvParseRows } from 'd3-dsv'
import { useEventListener } from '@vueuse/core'

useSeoMeta({
  title: 'Study Flashcards',
  description: 'Randomized flashcard study session',
})

// Fetch CSV data
const { data: csvText, error } = await useFetch('/api/flashcards')

// Use flashcards composable
const {
  shuffledCards,
  currentIndex,
  currentCard,
  isFlipped,
  progress,
  setCards,
  shuffle,
  next,
  prev,
  flip,
} = useFlashcards()

// Parse and set cards when data loads
watchEffect(() => {
  if (csvText.value) {
    const rows = csvParseRows(csvText.value as string)
    setCards(rows)
    shuffle()
  }
})

// Keyboard navigation
useEventListener('keydown', (e: KeyboardEvent) => {
  // Ignore if typing in input
  if ((e.target as HTMLElement).tagName === 'INPUT') return

  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault()
    flip()
  } else if (e.key === 'ArrowRight' || e.key === 'l' || e.key === 'j') {
    next()
  } else if (e.key === 'ArrowLeft' || e.key === 'h' || e.key === 'k') {
    prev()
  } else if (e.key === 'r') {
    shuffle()
  }
})

// Reshuffle handler
const handleReshuffle = () => {
  shuffle()
}

// Completion state
const _isComplete = computed(() => {
  return (
    currentIndex.value === shuffledCards.value.length - 1 && isFlipped.value
  )
})
</script>

<template>
  <div class="study-container">
    <!-- Minimal header -->
    <header class="study-header">
      <NuxtLink to="/flashcards" class="back-link">
        <span class="back-arrow">&larr;</span>
        <span class="back-text">Back</span>
      </NuxtLink>

      <div class="header-center">
        <span class="progress-text">{{ currentIndex + 1 }}</span>
        <span class="progress-divider">/</span>
        <span class="progress-total">{{ shuffledCards.length }}</span>
      </div>

      <button
        class="shuffle-btn"
        title="Reshuffle (R)"
        @click="handleReshuffle"
      >
        Shuffle
      </button>
    </header>

    <!-- Progress bar - ultra minimal -->
    <div class="progress-track">
      <div class="progress-fill" :style="{ width: `${progress}%` }" />
    </div>

    <!-- Error state -->
    <div v-if="error" class="error-state">
      <p class="font-mono text-sm text-red-400">Failed to load flashcards</p>
    </div>

    <!-- Card area -->
    <main v-else-if="currentCard" class="card-area">
      <FlashcardCardClient
        :front="currentCard.front"
        :back="currentCard.back"
        :hints="currentCard.hints"
        :flipped="isFlipped"
        @flip="flip"
      />
    </main>

    <!-- Loading state -->
    <div v-else class="loading-state">
      <div class="loading-card"></div>
    </div>

    <!-- Controls -->
    <footer class="study-footer">
      <div class="control-row">
        <button
          class="nav-btn nav-btn-prev"
          :class="{ disabled: currentIndex === 0 }"
          :disabled="currentIndex === 0"
          @click="prev"
        >
          <span class="nav-arrow">&larr;</span>
          <span class="nav-label">Previous</span>
        </button>

        <button class="flip-btn" @click="flip">
          {{ isFlipped ? 'Hide Answer' : 'Show Answer' }}
        </button>

        <button
          class="nav-btn nav-btn-next"
          :class="{ disabled: currentIndex === shuffledCards.length - 1 }"
          :disabled="currentIndex === shuffledCards.length - 1"
          @click="next"
        >
          <span class="nav-label">Next</span>
          <span class="nav-arrow">&rarr;</span>
        </button>
      </div>

      <!-- Keyboard hints -->
      <div class="keyboard-hints">
        <span class="hint">
          <kbd>Space</kbd>
          Flip
        </span>
        <span class="hint">
          <kbd>&larr;</kbd>
          <kbd>&rarr;</kbd>
          Navigate
        </span>
        <span class="hint">
          <kbd>R</kbd>
          Shuffle
        </span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.study-container {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

/* Header */
.study-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  flex-shrink: 0;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #71717a;
  text-decoration: none;
  font-size: 0.875rem;
  transition: color 0.15s;
}

.back-link:hover {
  color: #e4e4e7;
}

.back-arrow {
  font-size: 1rem;
}

.back-text {
  font-family: ui-monospace, 'SF Mono', Monaco, monospace;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.header-center {
  font-family: ui-monospace, 'SF Mono', Monaco, monospace;
  font-size: 0.75rem;
  color: #52525b;
  font-variant-numeric: tabular-nums;
}

.progress-text {
  color: #a1a1aa;
}

.progress-divider {
  margin: 0 0.25rem;
  color: #3f3f46;
}

.progress-total {
  color: #52525b;
}

.shuffle-btn {
  background: transparent;
  border: 1px solid #27272a;
  color: #71717a;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-family: ui-monospace, 'SF Mono', Monaco, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s;
}

.shuffle-btn:hover {
  background: #18181b;
  border-color: #3f3f46;
  color: #e4e4e7;
}

/* Progress bar */
.progress-track {
  height: 1px;
  background: #18181b;
  flex-shrink: 0;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #52525b 0%, #71717a 100%);
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Card area */
.card-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  min-height: 0;
}

.error-state,
.loading-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-card {
  width: 100%;
  max-width: 640px;
  aspect-ratio: 5 / 3;
  background: #18181b;
  border-radius: 16px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.4;
  }
  50% {
    opacity: 0.6;
  }
}

/* Footer / Controls */
.study-footer {
  flex-shrink: 0;
  padding: 1.5rem;
  border-top: 1px solid #18181b;
}

.control-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  max-width: 640px;
  margin: 0 auto;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: 1px solid #27272a;
  color: #a1a1aa;
  padding: 0.75rem 1.25rem;
  border-radius: 10px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s;
  min-width: 120px;
}

.nav-btn-prev {
  justify-content: flex-start;
}

.nav-btn-next {
  justify-content: flex-end;
}

.nav-btn:hover:not(.disabled) {
  background: #18181b;
  border-color: #3f3f46;
  color: #e4e4e7;
}

.nav-btn.disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.nav-arrow {
  font-size: 1rem;
  color: #52525b;
}

.nav-label {
  font-family: ui-monospace, 'SF Mono', Monaco, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.flip-btn {
  background: #fafafa;
  border: none;
  color: #18181b;
  padding: 0.875rem 2rem;
  border-radius: 10px;
  font-family: ui-monospace, 'SF Mono', Monaco, monospace;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}

.flip-btn:hover {
  background: #ffffff;
  transform: translateY(-1px);
}

.flip-btn:active {
  transform: translateY(0);
}

/* Keyboard hints */
.keyboard-hints {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  margin-top: 1.25rem;
  font-family: ui-monospace, 'SF Mono', Monaco, monospace;
  font-size: 0.625rem;
  color: #3f3f46;
}

.hint {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.hint kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  padding: 0.125rem 0.375rem;
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 4px;
  font-size: 0.625rem;
  color: #52525b;
}

/* Responsive */
@media (max-width: 640px) {
  .study-header {
    padding: 0.75rem 1rem;
  }

  .back-text {
    display: none;
  }

  .card-area {
    padding: 1rem;
  }

  .control-row {
    flex-direction: column;
    gap: 0.5rem;
  }

  .nav-btn {
    width: 100%;
    justify-content: center;
    min-width: unset;
  }

  .flip-btn {
    width: 100%;
    order: -1;
  }

  .keyboard-hints {
    display: none;
  }
}
</style>
