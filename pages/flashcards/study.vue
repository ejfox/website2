<script setup lang="ts">
import { useEventListener } from '@vueuse/core'

interface Deck {
  id: string
  name: string
  course: string
  cards: string[][]
  cardCount: number
}

interface CardWithDeck {
  card: string[]
  deckName: string
}

useSeoMeta({
  title: 'Study Flashcards',
  description: 'Randomized flashcard study session',
})

const route = useRoute()
const deckFilter = computed(() => route.query.deck as string | undefined)

// Fetch decks
const { data: decks, error } = await useFetch<Deck[]>('/api/flashcards')

// Use flashcards composable
const {
  shuffledCards,
  currentIndex,
  currentCard,
  isFlipped,
  progress,
  setCards,
  shuffle,
  next: nextCard,
  prev: prevCard,
  flip,
} = useFlashcards()

// Track deck names for each card
const cardDeckMap = ref<Map<number, string>>(new Map())

// Animation direction
const slideDirection = ref<'left' | 'right'>('right')

// Current deck info
const currentDeck = computed(() => {
  if (!deckFilter.value || !decks.value) return null
  return decks.value.find((d) => d.id === deckFilter.value)
})

const studyTitle = computed(() => {
  if (currentDeck.value) {
    return `${currentDeck.value.course}: ${currentDeck.value.name}`
  }
  return 'All Cards'
})

// Get current card's deck name
const currentDeckName = computed(() => {
  if (!currentCard.value) return ''
  return cardDeckMap.value.get(currentCard.value.id) || ''
})

// Parse and set cards when data loads
watchEffect(() => {
  if (decks.value) {
    const allCards: string[][] = []
    const deckMap = new Map<number, string>()
    let cardIndex = 0

    if (deckFilter.value) {
      // Single deck
      const deck = decks.value.find((d) => d.id === deckFilter.value)
      if (deck) {
        deck.cards.forEach((card) => {
          allCards.push(card)
          deckMap.set(cardIndex++, `${deck.course}: ${deck.name}`)
        })
      }
    } else {
      // All decks combined
      for (const deck of decks.value) {
        deck.cards.forEach((card) => {
          allCards.push(card)
          deckMap.set(cardIndex++, `${deck.course}: ${deck.name}`)
        })
      }
    }

    cardDeckMap.value = deckMap
    setCards(allCards)
    shuffle()
  }
})

// Wrapped navigation with animation direction
const next = () => {
  slideDirection.value = 'right'
  nextCard()
}

const prev = () => {
  slideDirection.value = 'left'
  prevCard()
}

// Keyboard navigation
useEventListener('keydown', (e: KeyboardEvent) => {
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

const handleReshuffle = () => {
  shuffle()
}
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
        <span class="study-title">{{ studyTitle }}</span>
        <span class="progress-divider">&middot;</span>
        <span class="progress-text">{{ currentIndex + 1 }}</span>
        <span class="progress-slash">/</span>
        <span class="progress-total">{{ shuffledCards.length }}</span>
      </div>

      <button
        class="shuffle-btn"
        title="Reshuffle (R)"
        aria-label="Shuffle cards (keyboard: R)"
        @click="handleReshuffle"
      >
        Shuffle
      </button>
    </header>

    <!-- Progress bar -->
    <div class="progress-track">
      <div class="progress-fill" :style="{ width: `${progress}%` }" />
    </div>

    <!-- Error state -->
    <div v-if="error" class="error-state">
      <p class="font-mono text-sm text-red-400">Failed to load flashcards</p>
    </div>

    <!-- Card area -->
    <main v-else-if="currentCard" class="card-area">
      <Transition
        :name="slideDirection === 'right' ? 'slide-right' : 'slide-left'"
        mode="out-in"
      >
        <div :key="currentIndex" class="card-wrapper">
          <FlashcardCard
            :front="currentCard.front"
            :back="currentCard.back"
            :hints="currentCard.hints"
            :deck="currentDeckName"
            :flipped="isFlipped"
            @flip="flip"
          />
        </div>
      </Transition>
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
          aria-label="Previous card (keyboard: left arrow or H)"
          @click="prev"
        >
          <span class="nav-arrow">&larr;</span>
          <span class="nav-label">Previous</span>
        </button>

        <button
          class="flip-btn"
          aria-label="Flip card (keyboard: Space or Enter)"
          @click="flip"
        >
          {{ isFlipped ? 'Hide Answer' : 'Show Answer' }}
        </button>

        <button
          class="nav-btn nav-btn-next"
          :class="{ disabled: currentIndex === shuffledCards.length - 1 }"
          :disabled="currentIndex === shuffledCards.length - 1"
          aria-label="Next card (keyboard: right arrow or L)"
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.study-title {
  color: #a1a1aa;
}

.progress-divider {
  color: #3f3f46;
}

.progress-text {
  color: #71717a;
  font-variant-numeric: tabular-nums;
}

.progress-slash {
  color: #3f3f46;
}

.progress-total {
  color: #52525b;
  font-variant-numeric: tabular-nums;
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

.card-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
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
  max-width: min(90vw, 800px);
  min-height: 400px;
  aspect-ratio: 16 / 10;
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
  opacity: 0.35;
  cursor: not-allowed;
  background: transparent;
  border-color: #1f1f23;
  color: #3f3f46;
}

.nav-btn.disabled .nav-arrow {
  color: #27272a;
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

  .study-title {
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

<style>
/* Card slide transitions - must be unscoped for Vue Transition */
.slide-right-enter-active,
.slide-right-leave-active,
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(80px) rotate(3deg);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(-80px) rotate(-3deg);
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(-80px) rotate(-3deg);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(80px) rotate(3deg);
}
</style>
