<template>
  <div class="tip-jar mt-16 pt-8 border-t border-zinc-100 dark:border-zinc-900">
    <!-- Super understated, almost like a footnote -->
    <div class="text-center text-xs text-zinc-400 dark:text-zinc-600">
      <p class="mb-4">
        <!-- Just a simple, humble message -->
        If you found value in this, consider supporting my work
      </p>

      <!-- Inline links, very subtle -->
      <div class="flex items-center justify-center gap-4">
        <a
          href="https://github.com/sponsors/ejfox"
          target="_blank"
          rel="noopener"
          class="link-underline-hover"
        >
          github
        </a>

        <span class="text-zinc-300 dark:text-zinc-700">·</span>

        <button class="link-underline-hover" @click="showCrypto = !showCrypto">
          crypto
        </button>
      </div>

      <!-- Crypto addresses - only show when clicked -->
      <div v-if="showCrypto" class="mt-4 max-w-md mx-auto text-left">
        <div
          v-for="(address, coin) in cryptoAddresses"
          :key="coin"
          class="group flex items-center justify-between py-1 font-mono gap-2"
        >
          <span class="text-zinc-400 dark:text-zinc-600"
            >{{ coin.toLowerCase() }}:</span
          >
          <button
            class="text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors break-all text-right"
            :title="address"
            @click="copyAddress(address, coin)"
          >
            {{ copied === coin ? '✓ copied' : address }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Load crypto addresses from public file
const cryptoAddresses = ref({})
const copied = ref('')
const showCrypto = ref(false)

// Parse crypto.txt format
onMounted(async () => {
  try {
    const response = await fetch('/crypto.txt')
    const text = await response.text()
    const lines = text.split('\n').filter((line) => line.includes('='))

    lines.forEach((line) => {
      const [coin, address] = line.split('=')
      if (coin && address) {
        cryptoAddresses.value[coin] = address
      }
    })
  } catch (error) {
    console.error('Failed to load crypto addresses:', error)
  }
})

// Copy to clipboard function
const copyAddress = async (address, coin) => {
  try {
    await navigator.clipboard.writeText(address)
    copied.value = coin
    setTimeout(() => {
      copied.value = ''
    }, 2000)
  } catch (error) {
    console.error('Failed to copy:', error)
  }
}
</script>

<style scoped>
/* Ultra minimal - almost invisible */
.tip-jar {
  opacity: 0.8;
  transition: opacity 0.2s;
}

.tip-jar:hover {
  opacity: 1;
}
</style>
