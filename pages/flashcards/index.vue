<script setup lang="ts">
interface Deck {
  id: string
  name: string
  course: string
  filename: string
  cards: string[][]
  cardCount: number
}

useSeoMeta({
  title: 'Flashcards',
  description: 'Browse and study flashcard collection',
})

// Fetch decks
const { data: decks, error } = await useFetch<Deck[]>('/api/flashcards')

// Group by course
const courseGroups = computed(() => {
  if (!decks.value) return []
  const groups: Record<string, Deck[]> = {}
  for (const deck of decks.value) {
    if (!groups[deck.course]) groups[deck.course] = []
    groups[deck.course].push(deck)
  }
  return Object.entries(groups)
})

// Total stats
const totalCards = computed(() => {
  if (!decks.value) return 0
  return decks.value.reduce((sum, d) => sum + d.cardCount, 0)
})

const totalDecks = computed(() => decks.value?.length ?? 0)

// Expand/collapse decks
const expandedDecks = ref<Set<string>>(new Set())

const toggleDeck = (id: string) => {
  if (expandedDecks.value.has(id)) {
    expandedDecks.value.delete(id)
  } else {
    expandedDecks.value.add(id)
  }
  expandedDecks.value = new Set(expandedDecks.value)
}

const isExpanded = (id: string) => expandedDecks.value.has(id)
</script>

<template>
  <div class="min-h-screen">
    <!-- Header -->
    <header class="border-b border-zinc-800/50">
      <div class="max-w-screen-xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div
          class="flex flex-col md:flex-row md:items-end md:justify-between gap-6"
        >
          <div>
            <p
              class="font-mono text-[10px] tracking-[0.2em] text-zinc-500 uppercase mb-2"
            >
              Collection
            </p>
            <h1
              class="text-3xl md:text-4xl font-light text-zinc-100 tracking-tight"
            >
              Flashcards
            </h1>
            <p class="font-mono text-xs text-zinc-500 mt-3 tabular-nums">
              {{ totalCards }} cards across {{ totalDecks }} decks
            </p>
          </div>

          <!-- Study all button -->
          <NuxtLink
            to="/flashcards/study"
            class="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-zinc-100 hover:bg-white text-zinc-900 rounded-lg font-medium text-sm transition-colors"
          >
            <span>Study All</span>
            <span class="text-zinc-500">&rarr;</span>
          </NuxtLink>
        </div>
      </div>
    </header>

    <!-- Error state -->
    <div v-if="error" class="max-w-screen-xl mx-auto px-4 py-12">
      <div class="text-red-400 font-mono text-sm">
        Failed to load flashcards: {{ error.message }}
      </div>
    </div>

    <!-- Course groups -->
    <main v-else class="max-w-screen-xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <div
        v-for="[course, courseDecks] in courseGroups"
        :key="course"
        class="mb-12"
      >
        <!-- Course header -->
        <div class="flex items-baseline gap-4 mb-6">
          <h2 class="text-xl font-light text-zinc-100">{{ course }}</h2>
          <span class="font-mono text-xs text-zinc-600 tabular-nums">
            {{ courseDecks.reduce((s, d) => s + d.cardCount, 0) }}
            cards
          </span>
        </div>

        <!-- Deck list -->
        <div class="space-y-2">
          <div v-for="deck in courseDecks" :key="deck.id" class="deck-item">
            <!-- Deck header row -->
            <div class="deck-header" @click="toggleDeck(deck.id)">
              <div class="flex items-center gap-3">
                <span
                  class="expand-icon"
                  :class="{ expanded: isExpanded(deck.id) }"
                >
                  &rsaquo;
                </span>
                <span class="deck-name">{{ deck.name }}</span>
                <span class="deck-count">{{ deck.cardCount }}</span>
              </div>
              <NuxtLink
                :to="`/flashcards/study?deck=${deck.id}`"
                class="study-link"
                @click.stop
              >
                Study
              </NuxtLink>
            </div>

            <!-- Expanded cards preview -->
            <div v-if="isExpanded(deck.id)" class="deck-cards">
              <div
                v-for="(card, i) in deck.cards.slice(0, 10)"
                :key="i"
                class="card-row"
              >
                <span class="card-front">{{ card[0] }}</span>
                <span class="card-back">{{ card[1] || '—' }}</span>
              </div>
              <div v-if="deck.cards.length > 10" class="card-row text-zinc-600">
                + {{ deck.cards.length - 10 }} more cards
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.deck-item {
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  overflow: hidden;
}

.deck-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  cursor: pointer;
  transition: background 0.15s;
}

.deck-header:hover {
  background: rgba(255, 255, 255, 0.02);
}

.expand-icon {
  font-size: 1.25rem;
  color: #52525b;
  transition: transform 0.2s;
  width: 1rem;
  text-align: center;
}

.expand-icon.expanded {
  transform: rotate(90deg);
}

.deck-name {
  font-size: 0.9375rem;
  color: #e4e4e7;
}

.deck-count {
  font-family: ui-monospace, 'SF Mono', Monaco, monospace;
  font-size: 0.6875rem;
  color: #52525b;
  padding: 0.125rem 0.5rem;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 4px;
}

.study-link {
  font-family: ui-monospace, 'SF Mono', Monaco, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #71717a;
  padding: 0.375rem 0.75rem;
  border: 1px solid #27272a;
  border-radius: 6px;
  text-decoration: none;
  transition: all 0.15s;
}

.study-link:hover {
  background: #27272a;
  color: #e4e4e7;
}

.deck-cards {
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  padding: 0.5rem 1rem;
  background: rgba(0, 0, 0, 0.2);
}

.card-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 0.5rem 0;
  font-size: 0.8125rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.card-row:last-child {
  border-bottom: none;
}

.card-front {
  color: #a1a1aa;
}

.card-back {
  color: #71717a;
  text-align: right;
}
</style>
