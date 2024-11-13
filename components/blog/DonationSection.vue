<script setup>
const config = useRuntimeConfig()
const { crypto, github } = config.public.donations

const amount = ref(5)
const loading = ref(false)
const isDark = useDark()

// Add clipboard functionality
const { copy, copied } = useClipboard()

// Track which address was last copied
const lastCopied = ref('')

// Function to copy and show feedback
async function copyAddress(address, currency) {
  await copy(address)
  lastCopied.value = currency
  // Reset the "copied" state after 2 seconds
  setTimeout(() => {
    if (lastCopied.value === currency) {
      lastCopied.value = ''
    }
  }, 2000)
}

const formatAmount = computed(() => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount.value)
})

async function handleDonation() {
  loading.value = true
  try {
    const response = await $fetch('/api/create-checkout-session', {
      method: 'POST',
      body: {
        amount: amount.value * 100 // Convert to cents for Stripe
      }
    })

    if (response.url) {
      window.location.href = response.url
    } else {
      throw new Error('No checkout URL received')
    }
  } catch (error) {
    console.error('Error creating checkout session:', error)
  } finally {
    loading.value = false
  }
}

const donationLevels = [
  { min: 1, max: 2, label: "No contribution is too small. I really appreciate it!" },
  { min: 3, max: 5, label: "Every bit matters. Thank you!" },
  { min: 6, max: 10, label: "Keeping the lights on, one contribution at a time. Your support is felt." },
  { min: 11, max: 20, label: "A meaningful nudge forward. Thank you for backing the work that goes into this." },
  { min: 21, max: 30, label: "You're a real ally to this journey. This level of support makes a tangible impact." },
  { min: 31, max: 50, label: "Thank you deeply for helping sustain this. Your support directly impacts me making more work like this." },
  { min: 51, max: 75, label: "A real investment in my work and acknowledgement of the time it takes to make this. Thank you." },
  { min: 76, max: 98, label: "Incredible. You've made a real investment in my work and process—your generosity is humbling." },
  { min: 99, max: 100, label: "Incredible. You've made a real investment in this—your generosity is humbling. Please let me know if there's anything specific you'd like to see!" }
]

// Add a computed property to get the current donation level message
const currentDonationMessage = computed(() => {
  const level = donationLevels.find(
    level => amount.value >= level.min && amount.value <= level.max
  )
  return level?.label || ''
})

</script>

<template>
  <section class="donation-section mt-16 mb-8 font-mono">
    <div class="max-w-3xl mx-auto">
      <div class="text-center mb-12">
        <UText class="text-2xl font-light tracking-wider mb-3">Support This Work</UText>
        <div class="w-16 h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent mx-auto"></div>
      </div>

      <div class="grid md:grid-cols-2 gap-8">
        <!-- Stripe Payment -->
        <UCard>
          <template #header>
            <h4 class="text-lg font-light">One-time Support</h4>
          </template>

          <div class="space-y-6">
            <div>
              <div class="flex justify-between mb-2">
                <UText class="text-sm text-gray-500">Amount</UText>
                <UBadge :color="isDark ? 'white' : 'gray'" size="lg">{{ formatAmount }}</UBadge>
              </div>

              <div class="mb-2">
                <URange v-model="amount" :min="1" :max="100" :step="1" class="w-full" />
                <div class="flex justify-between text-xs text-gray-500 mt-1">
                  <span>$1</span>
                  <span>$100</span>
                </div>
              </div>

              <UButton @click="handleDonation" :loading="loading" :disabled="loading" color="blue" variant="solid" block
                icon="i-material-symbols-payments-outline">
                {{ loading ? 'Processing...' : 'Support via Stripe' }}
              </UButton>

              <div class="mt-4 flex items-center justify-center min-h-[2rem]">

                <p :key="currentDonationMessage" class="text-[0.7rem] text-gray-400 dark:text-gray-500 italic px-4">
                  {{ currentDonationMessage }}
                </p>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Updated Crypto Section -->
        <UCard>
          <template #header>
            <h4 class="text-lg font-light">Cryptocurrency</h4>
          </template>

          <div class="space-y-4">
            <template v-for="(address, currency) in crypto" :key="currency">
              <div class="crypto-address group">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <Icon :name="`i-simple-icons-${currency.toLowerCase()}`" class="text-lg" />
                    <span class="font-medium">{{ currency }}</span>
                  </div>
                  <UButton size="xs" :color="lastCopied === currency ? 'green' : 'gray'" variant="ghost"
                    @click="copyAddress(address, currency)"
                    :icon="lastCopied === currency ? 'i-heroicons-check' : 'i-heroicons-clipboard'">
                    {{ lastCopied === currency ? 'Copied!' : 'Copy' }}
                  </UButton>
                </div>
                <div class="p-2 bg-gray-100 dark:bg-gray-800 rounded cursor-pointer group transition-colors"
                  @click="copyAddress(address, currency)">
                  <UText class="font-mono text-xs break-all">{{ address }}</UText>
                </div>
              </div>
            </template>
          </div>
        </UCard>
      </div>

      <!-- GitHub Sponsors -->
      <div class="text-center mt-8">
        <UButton :to="`https://github.com/sponsors/${github}`" target="_blank" rel="noopener" color="pink"
          variant="ghost" icon="i-mdi-github">
          Also available on GitHub Sponsors
        </UButton>
      </div>
    </div>
  </section>
</template>

<style scoped>
.donation-section::before {
  content: '';
  @apply absolute left-0 top-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent;
}

.crypto-address {
  @apply transition-all duration-200;
}

.crypto-address .address-container {
  @apply relative overflow-hidden;
}

.crypto-address:hover .copy-overlay {
  @apply opacity-100;
}
</style>