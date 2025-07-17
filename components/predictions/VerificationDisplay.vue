<template>
  <div class="verification-display">
    <h3 class="verification-title">
      Verification & Commitment
    </h3>
    
    <div class="verification-item">
      <span class="verification-label">SHA-256 Hash:</span>
      <code class="verification-value">{{ prediction.hash || 'Not hashed' }}</code>
    </div>
    
    <div v-if="prediction.gitCommit" class="verification-item">
      <span class="verification-label">Git Commit:</span>
      <a 
        :href="`https://github.com/ejfox/website2/commit/${prediction.gitCommit}`"
        target="_blank"
        class="verification-link"
      >
        {{ prediction.gitCommit.substring(0, 7) }}
      </a>
    </div>
    
    <div v-if="prediction.pgpSignature" class="verification-item">
      <span class="verification-label">PGP Signed:</span>
      <span class="verification-status verified">✓ Signed</span>
      <button class="verification-toggle" @click="showSignature = !showSignature">
        {{ showSignature ? 'Hide' : 'Show' }} Signature
      </button>
    </div>
    
    <div v-if="showSignature && prediction.pgpSignature" class="signature-display">
      <pre>{{ prediction.pgpSignature }}</pre>
    </div>
    
    <div v-if="prediction.blockchainAnchor" class="verification-item">
      <span class="verification-label">Blockchain Anchor:</span>
      <a 
        :href="prediction.blockchainAnchor.url"
        target="_blank"
        class="verification-link"
      >
        {{ prediction.blockchainAnchor.type }} @ {{ prediction.blockchainAnchor.height }}
      </a>
    </div>
    
    <div class="verification-item">
      <span class="verification-label">Created:</span>
      <time :datetime="prediction.created">{{ formatDate(prediction.created) }}</time>
    </div>
    
    <div v-if="prediction.signed" class="verification-item">
      <span class="verification-label">Signed:</span>
      <time :datetime="prediction.signed">{{ formatDate(prediction.signed) }}</time>
    </div>
    
    <div v-if="verificationStatus" class="verification-status-display">
      <div :class="['status-indicator', verificationStatus.valid ? 'valid' : 'invalid']">
        {{ verificationStatus.valid ? '✓ Hash Verified' : '✗ Hash Invalid' }}
      </div>
      <p v-if="verificationStatus.message" class="status-message">
        {{ verificationStatus.message }}
      </p>
    </div>
    
    <div class="verification-methods">
      <h4>Verification Methods Used</h4>
      <ul>
        <li v-if="prediction.hash">
          ✓ SHA-256 Content Hash
        </li>
        <li v-if="prediction.gitCommit">
          ✓ Git Commit Timestamp
        </li>
        <li v-if="prediction.pgpSignature">
          ✓ PGP Signature
        </li>
        <li v-if="prediction.blockchainAnchor">
          ✓ Blockchain Anchor
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed as _computed, onMounted } from 'vue'

const props = defineProps({
  prediction: {
    type: Object,
    required: true
  }
})

const showSignature = ref(false)
const verificationStatus = ref(null)

const formatDate = (date) => {
  return new Date(date).toLocaleString()
}

// Calculate SHA-256 hash in browser
async function calculateHash(content) {
  const encoder = new TextEncoder()
  const data = encoder.encode(content)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

// Verify the prediction hash
async function verifyHash() {
  if (!props.prediction.hash) return
  
  // Calculate hash of prediction content
  const content = [
    props.prediction.statement,
    props.prediction.confidence,
    props.prediction.deadline,
    props.prediction.categories.join(','),
    props.prediction.created
  ].join('|')
  
  const calculatedHash = await calculateHash(content)
  
  verificationStatus.value = {
    valid: calculatedHash === props.prediction.hash,
    message: calculatedHash === props.prediction.hash 
      ? 'Content hash matches stored hash' 
      : 'Hash mismatch - content may have been modified'
  }
}

onMounted(() => {
  if (import.meta.client && props.prediction.hash) {
    verifyHash()
  }
})
</script>

<style scoped>
.verification-display {
  @apply bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4;
}

.verification-title {
  @apply text-lg font-semibold mb-3;
}

.verification-item {
  @apply flex items-center gap-2 mb-2;
}

.verification-label {
  @apply font-medium text-gray-700;
}

.verification-value {
  @apply font-mono text-sm bg-white px-2 py-1 rounded;
}

.verification-link {
  @apply text-blue-600 hover:text-blue-800 underline;
}

.verification-status {
  @apply font-medium;
}

.verification-status.verified {
  @apply text-green-600;
}

.verification-toggle {
  @apply text-sm text-blue-600 hover:text-blue-800 underline ml-2;
}

.signature-display {
  @apply mt-2 p-3 bg-white border border-gray-300 rounded;
}

.signature-display pre {
  @apply font-mono text-xs overflow-x-auto;
}

.verification-status-display {
  @apply mt-4 pt-4 border-t border-gray-200;
}

.status-indicator {
  @apply font-medium text-lg mb-2;
}

.status-indicator.valid {
  @apply text-green-600;
}

.status-indicator.invalid {
  @apply text-red-600;
}

.status-message {
  @apply text-sm text-gray-600;
}

.verification-methods {
  @apply mt-4 pt-4 border-t border-gray-200;
}

.verification-methods h4 {
  @apply font-medium text-gray-700 mb-2;
}

.verification-methods ul {
  @apply list-none space-y-1;
}

.verification-methods li {
  @apply text-sm text-gray-600;
}
</style>