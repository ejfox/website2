<template>
  <div class="prediction-verification border-l-4 border-gray-300 dark:border-gray-700 pl-4 space-y-3">
    <div v-if="verification.hash" class="flex items-start gap-3">
      <Icon name="material-symbols:shield-check" class="text-green-600 flex-shrink-0 mt-1" />
      <div class="flex-1">
        <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Content Hash (SHA-256)</p>
        <p class="text-xs font-mono text-gray-600 dark:text-gray-400 break-all">
          {{ verification.hash }}
        </p>
      </div>
    </div>

    <div v-if="verification.gitCommit" class="flex items-start gap-3">
      <Icon name="material-symbols:commit" class="text-blue-600 flex-shrink-0 mt-1" />
      <div class="flex-1">
        <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Git Commit</p>
        <a 
          :href="`https://github.com/ejfox/website2/commit/${verification.gitCommit}`"
          target="_blank"
          class="text-xs font-mono text-blue-600 hover:underline"
        >
          {{ verification.gitCommit.slice(0, 8) }}
        </a>
        <span v-if="verification.gitDate" class="text-xs text-gray-500 ml-2">
          {{ formatDate(verification.gitDate) }}
        </span>
      </div>
    </div>

    <div v-if="verification.signature" class="flex items-start gap-3">
      <Icon name="material-symbols:lock" class="text-purple-600 flex-shrink-0 mt-1" />
      <div class="flex-1">
        <p class="text-sm font-medium text-gray-700 dark:text-gray-300">PGP Signature</p>
        <details class="text-xs">
          <summary class="cursor-pointer text-blue-600 hover:underline">View signature</summary>
          <pre class="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-x-auto font-mono text-xs">{{ verification.signature }}</pre>
        </details>
      </div>
    </div>

    <div v-if="verification.timestamp" class="flex items-start gap-3">
      <Icon name="material-symbols:schedule" class="text-gray-600 flex-shrink-0 mt-1" />
      <div class="flex-1">
        <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Created</p>
        <p class="text-xs text-gray-600 dark:text-gray-400">
          {{ formatTimestamp(verification.timestamp) }}
        </p>
      </div>
    </div>

    <div v-if="verification.blockchainAnchor" class="flex items-start gap-3">
      <Icon name="material-symbols:link" class="text-indigo-600 flex-shrink-0 mt-1" />
      <div class="flex-1">
        <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Blockchain Anchor</p>
        <a
          :href="verification.blockchainAnchor.url"
          target="_blank" 
          class="text-xs font-mono text-blue-600 hover:underline"
        >
          {{ verification.blockchainAnchor.hash.slice(0, 16) }}...
        </a>
        <span class="text-xs text-gray-500 ml-2">
          Block {{ verification.blockchainAnchor.block }}
        </span>
      </div>
    </div>

    <div class="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
      <Icon name="material-symbols:verified" 
        :class="isVerified ? 'text-green-600' : 'text-gray-400'" 
      />
      <span class="text-sm font-medium" :class="isVerified ? 'text-green-700 dark:text-green-400' : 'text-gray-500'">
        {{ isVerified ? 'Cryptographically Verified' : 'Unverified' }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

interface Verification {
  hash?: string
  signature?: string
  timestamp?: string
  gitCommit?: string
  gitDate?: string
  blockchainAnchor?: {
    hash: string
    block: number
    url: string
  }
}

const props = defineProps<{
  verification: Verification
}>()

const isVerified = computed(() => {
  return Boolean(props.verification.hash && props.verification.gitCommit)
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatTimestamp = (timestamp: string) => {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short'
  })
}
</script>
