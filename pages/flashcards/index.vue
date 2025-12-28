<script setup lang="ts">
import { csvParseRows } from 'd3-dsv'

useSeoMeta({
  title: 'Flashcards',
  description: 'Browse and study flashcard collection',
})

// Fetch CSV data
const { data: csvText, error } = await useFetch('/api/flashcards')

// Parse cards
const cards = ref<
  Array<{ id: number; front: string; back: string; hints: string[] }>
>([])
const flippedCards = ref<Set<number>>(new Set())
const searchQuery = ref('')

watchEffect(() => {
  if (csvText.value) {
    const rows = csvParseRows(csvText.value as string)
    cards.value = rows
      .map((row, i) => ({
        id: i,
        front: String(row[0] || '').trim(),
        back: String(row[1] || '').trim(),
        hints: row.slice(2).filter((h) => h && h.trim()),
      }))
      .filter((card) => card.front !== '')
  }
})

const filteredCards = computed(() => {
  if (!searchQuery.value.trim()) return cards.value
  const q = searchQuery.value.toLowerCase()
  return cards.value.filter(
    (c) => c.front.toLowerCase().includes(q) || c.back.toLowerCase().includes(q)
  )
})

const toggleFlip = (id: number) => {
  if (flippedCards.value.has(id)) {
    flippedCards.value.delete(id)
  } else {
    flippedCards.value.add(id)
  }
  flippedCards.value = new Set(flippedCards.value)
}

const isFlipped = (id: number) => flippedCards.value.has(id)
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
              {{ cards.length }} cards
              <span v-if="searchQuery" class="text-zinc-600">
                · {{ filteredCards.length }} matching
              </span>
            </p>
          </div>

          <div class="flex flex-col sm:flex-row gap-3">
            <!-- Search -->
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search cards..."
                class="w-full sm:w-64 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
              />
              <span
                v-if="searchQuery"
                class="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <button
                  class="text-zinc-500 hover:text-zinc-300 text-xs"
                  @click="searchQuery = ''"
                >
                  Clear
                </button>
              </span>
            </div>

            <!-- Study button -->
            <NuxtLink
              to="/flashcards/study"
              class="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-zinc-100 hover:bg-white text-zinc-900 rounded-lg font-medium text-sm transition-colors"
            >
              <span>Study</span>
              <span class="text-zinc-500">&rarr;</span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </header>

    <!-- Error state -->
    <div v-if="error" class="max-w-screen-xl mx-auto px-4 py-12">
      <div class="text-red-400 font-mono text-sm">
        Failed to load flashcards: {{ error.message }}
      </div>
    </div>

    <!-- Card Grid -->
    <main v-else class="max-w-screen-xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
      >
        <div
          v-for="card in filteredCards"
          :key="card.id"
          class="card-preview group"
          @click="toggleFlip(card.id)"
        >
          <div
            class="card-preview-inner"
            :class="{ flipped: isFlipped(card.id) }"
          >
            <!-- Front -->
            <div class="card-face card-face-front">
              <span class="card-number">{{ card.id + 1 }}</span>
              <p class="card-preview-text">{{ card.front }}</p>
            </div>
            <!-- Back -->
            <div class="card-face card-face-back">
              <span class="card-number">A</span>
              <p class="card-preview-text card-preview-answer">
                {{ card.back }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-if="filteredCards.length === 0 && searchQuery"
        class="text-center py-16"
      >
        <p class="text-zinc-500 font-mono text-sm">
          No cards match "{{ searchQuery }}"
        </p>
        <button
          class="mt-4 text-zinc-400 hover:text-zinc-200 text-sm underline underline-offset-4"
          @click="searchQuery = ''"
        >
          Clear search
        </button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.card-preview {
  aspect-ratio: 4 / 3;
  perspective: 1000px;
  cursor: pointer;
}

.card-preview-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-preview-inner.flipped {
  transform: rotateY(180deg);
}

.card-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  transition:
    box-shadow 0.2s,
    transform 0.2s;
}

.card-face-front {
  background: #18181b;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.04),
    0 2px 8px -2px rgba(0, 0, 0, 0.3);
}

.card-face-back {
  background: linear-gradient(165deg, #27272a 0%, #1f1f22 100%);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.06),
    0 2px 8px -2px rgba(0, 0, 0, 0.3);
  transform: rotateY(180deg);
}

.card-preview:hover .card-face {
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.08),
    0 8px 24px -4px rgba(0, 0, 0, 0.4);
}

.card-preview:hover .card-preview-inner:not(.flipped) {
  transform: translateY(-2px);
}

.card-preview:active .card-preview-inner {
  transform: scale(0.98);
}

.card-number {
  font-family: ui-monospace, 'SF Mono', Monaco, monospace;
  font-size: 0.625rem;
  letter-spacing: 0.15em;
  color: #52525b;
  margin-bottom: 0.75rem;
}

.card-preview-text {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 0.9375rem;
  line-height: 1.5;
  color: #e4e4e7;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.card-preview-answer {
  color: #a1a1aa;
}
</style>
