<template>
  <div class="predictions-page">
    <h1 class="page-title">
      Future Predictions
    </h1>
    
    <div class="page-info mb-6">
      <p class="text-gray-600">
        These are my predictions about the future. I track them to improve calibration and accountability.
      </p>
    </div>
    
    <div class="page-controls">
      <div class="filter-controls">
        <select v-model="filter" class="form-input">
          <option value="all">
            All Predictions
          </option>
          <option value="pending">
            Pending
          </option>
          <option value="resolved">
            Resolved
          </option>
          <option value="correct">
            Correct
          </option>
          <option value="incorrect">
            Incorrect
          </option>
        </select>
        
        <select v-model="categoryFilter" class="form-input">
          <option value="">
            All Categories
          </option>
          <option v-for="category in uniqueCategories" :key="category" :value="category">
            {{ category }}
          </option>
        </select>
        
        <select v-model="sortBy" class="form-input">
          <option value="created-desc">
            Newest First
          </option>
          <option value="created-asc">
            Oldest First
          </option>
          <option value="deadline-asc">
            Soonest Deadline
          </option>
          <option value="confidence-desc">
            Highest Confidence
          </option>
          <option value="confidence-asc">
            Lowest Confidence
          </option>
        </select>
      </div>
    </div>
    
    <CommitmentLog />
    
    <PredictionDashboard :predictions="predictions" />
    
    <div class="predictions-list">
      <TransitionGroup name="list">
        <PredictionCard 
          v-for="prediction in filteredPredictions" 
          :key="prediction.id"
          :prediction="prediction"
          @resolve="resolvePrediction"
        />
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PredictionCard from '~/components/predictions/PredictionCard.vue'
import PredictionDashboard from '~/components/predictions/PredictionDashboard.vue'
import CommitmentLog from '~/components/predictions/CommitmentLog.vue'

useHead({
  title: 'Future Predictions | ejfox',
  meta: [
    { name: 'description', content: 'Track predictions about the future and measure their accuracy over time.' }
  ]
})

const predictions = ref([])
const filter = ref('all')
const categoryFilter = ref('')
const sortBy = ref('created-desc')

onMounted(async () => {
  try {
    predictions.value = await $fetch('/api/predictions')
  } catch (error) {
    console.error('Failed to load predictions:', error)
    predictions.value = []
  }
})

const resolvePrediction = async (resolution) => {
  try {
    await $fetch(`/api/predictions/${resolution.id}`, {
      method: 'PATCH',
      body: { outcome: resolution.outcome }
    })
    
    // Update the prediction in our local state
    const index = predictions.value.findIndex(p => p.id === resolution.id)
    if (index !== -1) {
      predictions.value[index] = {
        ...predictions.value[index],
        outcome: resolution.outcome
      }
    }
  } catch (error) {
    console.error('Failed to resolve prediction:', error)
  }
}

const filteredPredictions = computed(() => {
  let result = [...predictions.value]
  
  // Apply status filter
  if (filter.value === 'pending') {
    result = result.filter(p => !p.outcome)
  } else if (filter.value === 'resolved') {
    result = result.filter(p => p.outcome)
  } else if (filter.value === 'correct') {
    result = result.filter(p => p.outcome && p.outcome.correct)
  } else if (filter.value === 'incorrect') {
    result = result.filter(p => p.outcome && !p.outcome.correct)
  }
  
  // Apply category filter
  if (categoryFilter.value) {
    result = result.filter(p => p.categories.includes(categoryFilter.value))
  }
  
  // Apply sorting
  if (sortBy.value === 'created-desc') {
    result.sort((a, b) => new Date(b.created) - new Date(a.created))
  } else if (sortBy.value === 'created-asc') {
    result.sort((a, b) => new Date(a.created) - new Date(b.created))
  } else if (sortBy.value === 'deadline-asc') {
    result.sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
  } else if (sortBy.value === 'confidence-desc') {
    result.sort((a, b) => b.confidence - a.confidence)
  } else if (sortBy.value === 'confidence-asc') {
    result.sort((a, b) => a.confidence - b.confidence)
  }
  
  return result
})

const uniqueCategories = computed(() => {
  const categories = new Set()
  predictions.value.forEach(p => {
    p.categories.forEach(c => categories.add(c))
  })
  return Array.from(categories)
})
</script>

<style scoped>
.predictions-page {
  @apply max-w-6xl mx-auto px-4 py-8;
}

.page-title {
  @apply text-3xl font-bold mb-4;
}

.page-info {
  @apply mb-6;
}

.page-controls {
  @apply mb-6 flex justify-between items-center;
}

.filter-controls {
  @apply flex gap-2 flex-wrap;
}

.predictions-list {
  @apply space-y-4;
}

/* Form input styles */
.form-input {
  @apply border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

/* Animations */
.list-enter-active, .list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from, .list-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

.list-move {
  transition: transform 0.5s ease;
}

/* Global button styles if not already defined */
.btn {
  @apply px-4 py-2 rounded-md font-medium transition-colors cursor-pointer;
}

.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}
</style>