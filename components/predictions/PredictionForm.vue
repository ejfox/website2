<template>
  <form @submit.prevent="submitPrediction" class="prediction-form">
    <div class="form-group">
      <label for="statement">Prediction Statement</label>
      <textarea 
        id="statement"
        v-model="prediction.statement" 
        required
        class="form-input"
        rows="3"
        placeholder="What do you predict will happen?"
      ></textarea>
    </div>
    
    <div class="form-group">
      <label for="confidence">Confidence ({{ prediction.confidence }}%)</label>
      <input 
        id="confidence"
        type="range" 
        v-model.number="prediction.confidence" 
        min="0" 
        max="100" 
        step="5"
        class="form-range"
      >
    </div>
    
    <div class="form-group">
      <label for="deadline">Deadline</label>
      <input 
        id="deadline"
        type="date" 
        v-model="prediction.deadline" 
        required
        class="form-input"
      >
    </div>
    
    <div class="form-group">
      <label for="categories">Categories (comma separated)</label>
      <input 
        id="categories"
        type="text" 
        v-model="categoriesInput"
        class="form-input"
        placeholder="tech, politics, personal"
      >
    </div>
    
    <div class="form-group">
      <label for="evidence">Evidence/Reasoning</label>
      <textarea 
        id="evidence"
        v-model="prediction.evidence"
        class="form-input"
        rows="4"
        placeholder="Why do you think this will happen?"
      ></textarea>
    </div>
    
    <div class="form-group">
      <label for="visibility">Visibility</label>
      <select id="visibility" v-model="prediction.visibility" class="form-input">
        <option value="public">Public</option>
        <option value="private">Private</option>
      </select>
    </div>
    
    <button type="submit" class="btn btn-primary">Save Prediction</button>
  </form>
</template>

<script setup>
import { ref, watch } from 'vue'

// Simple ID generation without external dependency
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

const prediction = ref({
  id: generateId(),
  statement: '',
  created: new Date(),
  confidence: 50,
  deadline: null,
  categories: [],
  visibility: 'public',
  evidence: ''
})

const categoriesInput = ref('')

// Parse categories from comma-separated input
watch(categoriesInput, (val) => {
  prediction.value.categories = val.split(',').map(cat => cat.trim()).filter(cat => cat !== '')
})

const emit = defineEmits(['save'])

const submitPrediction = () => {
  emit('save', {...prediction.value})
  // Reset form
  prediction.value = {
    id: generateId(),
    statement: '',
    created: new Date(),
    confidence: 50,
    deadline: null,
    categories: [],
    visibility: 'public',
    evidence: ''
  }
  categoriesInput.value = ''
}
</script>

<style scoped>
.prediction-form {
  @apply space-y-4 max-w-2xl;
}

.form-group {
  @apply flex flex-col space-y-2;
}

.form-group label {
  @apply font-medium text-gray-700;
}

.form-input {
  @apply border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.form-range {
  @apply w-full;
}

.btn {
  @apply px-4 py-2 rounded-md font-medium transition-colors;
}

.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}
</style>