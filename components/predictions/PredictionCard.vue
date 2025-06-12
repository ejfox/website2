<template>
  <div class="prediction-card" :class="cardClass">
    <div class="prediction-header">
      <span class="prediction-date">{{ formatDate(prediction.created) }}</span>
      <span class="prediction-confidence">{{ prediction.confidence }}% confident</span>
    </div>
    
    <div class="prediction-body">
      <p class="prediction-statement">{{ prediction.statement }}</p>
      
      <div v-if="prediction.evidence" class="prediction-evidence">
        <details>
          <summary>Evidence/Reasoning</summary>
          <div v-html="markdownToHtml(prediction.evidence)"></div>
        </details>
      </div>
    </div>
    
    <div class="prediction-footer">
      <div class="prediction-deadline">
        Resolves by: {{ formatDate(prediction.deadline) }}
      </div>
      
      <div class="prediction-categories">
        <span v-for="category in prediction.categories" :key="category" class="category-tag">
          {{ category }}
        </span>
      </div>
      
      <div v-if="prediction.resolved" class="prediction-outcome">
        <span :class="prediction.resolved.correct ? 'outcome-correct' : 'outcome-incorrect'">
          {{ prediction.resolved.correct ? '✓ Correct' : '✗ Incorrect' }}
        </span>
        <p v-if="prediction.resolved.explanation" class="outcome-notes">{{ prediction.resolved.explanation }}</p>
      </div>
      
      <div v-else-if="isPastDeadline" class="prediction-actions">
        <button @click="showResolutionModal = true" class="btn btn-sm btn-secondary">
          Resolve
        </button>
      </div>
    </div>
    
    <!-- Verification Details -->
    <div v-if="showVerification" class="verification-section">
      <VerificationDisplay :prediction="prediction" />
    </div>
    
    <div class="card-actions">
      <button @click="showVerification = !showVerification" class="btn btn-sm btn-secondary">
        {{ showVerification ? 'Hide' : 'Show' }} Verification
      </button>
    </div>
    
    <!-- Resolution Modal -->
    <teleport to="body">
      <div v-if="showResolutionModal" class="modal-overlay" @click="showResolutionModal = false">
        <div class="modal-content" @click.stop>
          <h3>Resolve Prediction</h3>
          <p>{{ prediction.statement }}</p>
          
          <div class="resolution-buttons">
            <button @click="resolve(true)" class="btn btn-success">Correct</button>
            <button @click="resolve(false)" class="btn btn-danger">Incorrect</button>
          </div>
          
          <div class="resolution-notes">
            <label>Notes (optional)</label>
            <textarea v-model="resolutionNotes" rows="3" class="form-input"></textarea>
          </div>
          
          <div class="modal-actions">
            <button @click="showResolutionModal = false" class="btn btn-secondary">Cancel</button>
            <button @click="submitResolution" class="btn btn-primary">Submit</button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { marked } from 'marked'
import VerificationDisplay from './VerificationDisplay.vue'

const props = defineProps({
  prediction: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['resolve'])

const showResolutionModal = ref(false)
const showVerification = ref(false)
const resolutionCorrect = ref(null)
const resolutionNotes = ref('')

const formatDate = (date) => {
  return new Date(date).toLocaleDateString()
}

const markdownToHtml = (text) => {
  return marked(text)
}

const isPastDeadline = computed(() => {
  return new Date() > new Date(props.prediction.deadline)
})

const cardClass = computed(() => {
  if (!props.prediction.resolved) {
    return isPastDeadline.value ? 'deadline-passed' : 'pending'
  }
  return props.prediction.resolved.correct ? 'prediction-correct' : 'prediction-incorrect'
})

const resolve = (correct) => {
  resolutionCorrect.value = correct
}

const submitResolution = () => {
  emit('resolve', {
    id: props.prediction.id,
    correct: resolutionCorrect.value,
    explanation: resolutionNotes.value
  })
  showResolutionModal.value = false
  resolutionNotes.value = ''
}
</script>

<style scoped>
.prediction-card {
  @apply border rounded-lg p-4 mb-4 transition-all;
}

.prediction-card.pending {
  @apply border-gray-300 bg-white;
}

.prediction-card.deadline-passed {
  @apply border-yellow-500 bg-yellow-50;
}

.prediction-card.prediction-correct {
  @apply border-green-500 bg-green-50;
}

.prediction-card.prediction-incorrect {
  @apply border-red-500 bg-red-50;
}

.prediction-header {
  @apply flex justify-between text-sm text-gray-500 mb-2;
}

.prediction-confidence {
  @apply font-medium;
}

.prediction-body {
  @apply mb-4;
}

.prediction-statement {
  @apply text-lg font-medium text-gray-800 mb-2;
}

.prediction-evidence {
  @apply mt-3;
}

.prediction-evidence summary {
  @apply cursor-pointer text-sm text-gray-600 hover:text-gray-800;
}

.prediction-footer {
  @apply space-y-2;
}

.prediction-deadline {
  @apply text-sm text-gray-600;
}

.prediction-categories {
  @apply flex flex-wrap gap-2;
}

.category-tag {
  @apply px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full;
}

.prediction-outcome {
  @apply mt-2;
}

.outcome-correct {
  @apply text-green-600 font-medium;
}

.outcome-incorrect {
  @apply text-red-600 font-medium;
}

.outcome-notes {
  @apply text-sm text-gray-600 mt-1;
}

.prediction-actions {
  @apply mt-2;
}

.verification-section {
  @apply mt-4 pt-4 border-t border-gray-200;
}

.card-actions {
  @apply mt-3;
}

.btn-sm {
  @apply px-3 py-1 text-sm;
}

.btn-secondary {
  @apply bg-gray-600 text-white hover:bg-gray-700;
}

.btn-success {
  @apply bg-green-600 text-white hover:bg-green-700;
}

.btn-danger {
  @apply bg-red-600 text-white hover:bg-red-700;
}

.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center;
}

.modal-content {
  @apply bg-white rounded-lg p-6 max-w-md w-full;
}

.modal-content h3 {
  @apply text-lg font-semibold mb-4;
}

.resolution-buttons {
  @apply flex gap-4 my-4;
}

.resolution-notes {
  @apply mb-4;
}

.resolution-notes label {
  @apply block text-sm font-medium text-gray-700 mb-1;
}

.modal-actions {
  @apply flex justify-end gap-2;
}
</style>