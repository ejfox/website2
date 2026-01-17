<!--
  @file SupportLinks.vue
  @description Compact support/sponsor links for sidebars - GitHub Sponsors + crypto toggle
  @props variant: 'sidebar' | 'inline' - display style (default: sidebar)
-->
<template>
  <div :class="containerClasses">
    <h3 v-if="variant === 'sidebar'" class="label-uppercase-mono text-xs mb-3">
      Support
    </h3>

    <div :class="linksClasses">
      <a
        href="https://github.com/sponsors/ejfox"
        target="_blank"
        rel="noopener"
        class="support-link"
      >
        <svg
          class="w-4 h-4"
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"
          />
        </svg>
        <span>Sponsor</span>
      </a>

      <button class="support-link" @click="showCrypto = !showCrypto">
        <svg
          class="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v12M6 12h12" />
        </svg>
        <span>Crypto</span>
      </button>
    </div>

    <!-- Crypto addresses dropdown -->
    <div v-if="showCrypto" class="mt-3 space-y-1">
      <div
        v-for="(address, coin) in cryptoAddresses"
        :key="coin"
        class="crypto-row"
      >
        <span class="crypto-label">{{ coin }}</span>
        <button
          class="crypto-address"
          :title="address"
          @click="copyAddress(address, coin)"
        >
          {{ copied === coin ? 'copied!' : truncate(address) }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'sidebar',
    validator: (v) => ['sidebar', 'inline'].includes(v),
  },
})

const containerClasses = computed(() => {
  if (props.variant === 'sidebar') {
    return 'pt-6 border-t border-zinc-200 dark:border-zinc-800'
  }
  return 'inline-flex items-center gap-3'
})

const linksClasses = computed(() => {
  return 'flex items-center gap-3'
})

const cryptoAddresses = ref({})
const copied = ref('')
const showCrypto = ref(false)

const truncate = (addr) => {
  if (!addr || addr.length < 16) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

onMounted(async () => {
  try {
    const response = await fetch('/crypto.txt')
    const text = await response.text()
    const lines = text.split('\n').filter((line) => line.includes('='))

    lines.forEach((line) => {
      const [coin, address] = line.split('=')
      if (coin && address) {
        cryptoAddresses.value[coin] = address.trim()
      }
    })
  } catch {
    // Silent fail - crypto addresses are optional
  }
})

const copyAddress = async (address, coin) => {
  try {
    await navigator.clipboard.writeText(address)
    copied.value = coin
    setTimeout(() => {
      copied.value = ''
    }, 2000)
  } catch {
    // Silent fail
  }
}
</script>

<style scoped>
.support-link {
  @apply flex items-center gap-1.5 text-xs;
  @apply text-zinc-500 dark:text-zinc-500;
  @apply hover:text-zinc-900 dark:hover:text-zinc-100;
  @apply transition-colors duration-150;
}

.crypto-row {
  @apply flex items-center justify-between text-xs font-mono;
}

.crypto-label {
  @apply text-zinc-400 dark:text-zinc-600 lowercase;
}

.crypto-address {
  @apply text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300;
  @apply transition-colors duration-150;
}
</style>
