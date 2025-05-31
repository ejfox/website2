<template>
  <div class="commitment-log">
    <h2 class="log-title">Public Commitment Log</h2>
    <p class="log-description">
      All predictions are cryptographically hashed and timestamped through Git commits.
      This public log provides an immutable record preventing post-hoc modifications.
    </p>
    
    <div class="log-info">
      <div class="info-item">
        <span class="info-label">Repository:</span>
        <a href="https://github.com/ejfox/website2" target="_blank" class="info-link">
          github.com/ejfox/website2
        </a>
      </div>
      <div class="info-item">
        <span class="info-label">Predictions Directory:</span>
        <a href="https://github.com/ejfox/website2/tree/main/content/predictions" target="_blank" class="info-link">
          /content/predictions
        </a>
      </div>
    </div>
    
    <div v-if="commitments.length > 0" class="commitments-table">
      <h3>Recent Commitments</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Statement</th>
            <th>Hash</th>
            <th>Commit</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="commitment in recentCommitments" :key="commitment.hash">
            <td>{{ formatDate(commitment.signed) }}</td>
            <td class="statement-cell">{{ commitment.statement }}</td>
            <td>
              <code>{{ commitment.hash.substring(0, 8) }}...</code>
            </td>
            <td>
              <a 
                v-if="commitment.gitCommit"
                :href="`https://github.com/ejfox/website2/commit/${commitment.gitCommit}`"
                target="_blank"
                class="commit-link"
              >
                {{ commitment.gitCommit.substring(0, 7) }}
              </a>
              <span v-else>—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="verification-notice">
      <h3>How to Verify</h3>
      <ol>
        <li>Each prediction's content is hashed using SHA-256</li>
        <li>The hash is stored in the prediction's frontmatter</li>
        <li>Predictions are committed to Git for timestamping</li>
        <li>Optionally, predictions can be signed with my PGP key</li>
      </ol>
      <p class="pgp-info">
        PGP Key: <a href="/pgp.txt" target="_blank">{{ pgpFingerprint }}</a>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

const commitments = ref([])
const pgpFingerprint = '5D30A33E08E35B8915B4C7E2E2078E653FE389CD'

const recentCommitments = computed(() => {
  return commitments.value.slice(0, 10)
})

const formatDate = (date) => {
  return new Date(date).toLocaleDateString()
}

onMounted(async () => {
  try {
    const response = await $fetch('/data/prediction-commitments.json')
    commitments.value = response.reverse() // Show most recent first
  } catch (error) {
    console.error('Failed to load commitment log:', error)
  }
})
</script>

<style scoped>
.commitment-log {
  @apply bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8;
}

.log-title {
  @apply text-2xl font-bold mb-4;
}

.log-description {
  @apply text-gray-600 mb-6;
}

.log-info {
  @apply mb-6 p-4 bg-white rounded border border-gray-200;
}

.info-item {
  @apply flex items-center gap-2 mb-2 last:mb-0;
}

.info-label {
  @apply font-medium text-gray-700;
}

.info-link {
  @apply text-blue-600 hover:text-blue-800 underline;
}

.commitments-table {
  @apply mb-6;
}

.commitments-table h3 {
  @apply text-lg font-semibold mb-3;
}

.commitments-table table {
  @apply w-full bg-white border border-gray-200 rounded;
}

.commitments-table th {
  @apply text-left p-3 font-medium text-gray-700 border-b border-gray-200 bg-gray-50;
}

.commitments-table td {
  @apply p-3 border-b border-gray-200;
}

.commitments-table tr:last-child td {
  @apply border-b-0;
}

.statement-cell {
  @apply max-w-xs truncate;
}

.commitments-table code {
  @apply font-mono text-sm bg-gray-100 px-1 py-0.5 rounded;
}

.commit-link {
  @apply text-blue-600 hover:text-blue-800 underline font-mono text-sm;
}

.verification-notice {
  @apply bg-white p-4 rounded border border-gray-200;
}

.verification-notice h3 {
  @apply text-lg font-semibold mb-3;
}

.verification-notice ol {
  @apply list-decimal list-inside space-y-2 mb-4;
}

.pgp-info {
  @apply text-sm text-gray-600;
}

.pgp-info a {
  @apply text-blue-600 hover:text-blue-800 underline;
}
</style>