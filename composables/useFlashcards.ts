/**
 * @file useFlashcards.ts
 * @description Composable for flashcard study logic - shuffle, navigation, flip state
 */

export interface Flashcard {
  id: number
  front: string
  back: string
  hints: string[]
}

export function useFlashcards() {
  const cards = ref<Flashcard[]>([])
  const shuffledCards = ref<Flashcard[]>([])
  const currentIndex = ref(0)
  const isFlipped = ref(false)

  // Parse CSV row (array) into Flashcard
  const parseCard = (row: string[], index: number): Flashcard => {
    return {
      id: index,
      front: String(row[0] || '').trim(),
      back: String(row[1] || '').trim(),
      hints: row.slice(2).filter((h) => h && h.trim()),
    }
  }

  // Fisher-Yates shuffle
  const shuffle = () => {
    const array = [...cards.value]
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[array[i], array[j]] = [array[j], array[i]]
    }
    shuffledCards.value = array
    currentIndex.value = 0
    isFlipped.value = false
  }

  // Navigation
  const next = () => {
    if (currentIndex.value < shuffledCards.value.length - 1) {
      currentIndex.value++
      isFlipped.value = false
    }
  }

  const prev = () => {
    if (currentIndex.value > 0) {
      currentIndex.value--
      isFlipped.value = false
    }
  }

  const goTo = (index: number) => {
    if (index >= 0 && index < shuffledCards.value.length) {
      currentIndex.value = index
      isFlipped.value = false
    }
  }

  // Flip
  const flip = () => {
    isFlipped.value = !isFlipped.value
  }

  // Current card
  const currentCard = computed(() => {
    return shuffledCards.value[currentIndex.value] || null
  })

  // Progress
  const progress = computed(() => {
    if (shuffledCards.value.length === 0) return 0
    return ((currentIndex.value + 1) / shuffledCards.value.length) * 100
  })

  // Set cards from parsed CSV rows (array of arrays)
  const setCards = (rows: string[][]) => {
    cards.value = rows
      .map((row, i) => parseCard(row, i))
      .filter((card) => card.front !== '')
    shuffledCards.value = [...cards.value]
  }

  return {
    cards,
    shuffledCards,
    currentIndex,
    currentCard,
    isFlipped,
    progress,
    setCards,
    shuffle,
    next,
    prev,
    goTo,
    flip,
  }
}
