<script setup>
import { animate, stagger as _stagger, createTimeline } from '~/anime.esm.js'
import { useAnimations } from '~/composables/useAnimations'

const config = useRuntimeConfig()
const { crypto, github } = config.public.donations
const { timing, easing } = useAnimations()

const amount = ref(5)
const loading = ref(false)
const _isDark = useDark()

// Add clipboard functionality
const { copy } = useClipboard()

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
    const response = await $fetch('/api/checkout-session', {
      method: 'POST',
      body: {
        amount: amount.value * 100 // Convert to cents for Stripe
      }
    })

    if (response.body?.url) {
      window.location.href = response.body.url
    } else if (response.url) {
      // Fallback for direct response format
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
  {
    min: 1,
    max: 2,
    label: 'No contribution is too small. I really appreciate it!'
  },
  { min: 3, max: 5, label: 'Every bit matters. Thank you!' },
  {
    min: 6,
    max: 10,
    label:
      'Keeping the lights on, one contribution at a time. Your support is felt.'
  },
  {
    min: 11,
    max: 20,
    label:
      'A meaningful nudge forward. Thank you for backing the work that goes into this.'
  },
  {
    min: 21,
    max: 30,
    label:
      "You're a real ally to this journey. This level of support makes a tangible impact."
  },
  {
    min: 31,
    max: 50,
    label:
      'Thank you deeply for helping sustain this. Your support directly impacts me making more work like this.'
  },
  {
    min: 51,
    max: 75,
    label:
      'A real investment in my work and acknowledgement of the time it takes to make this. Thank you.'
  },
  {
    min: 76,
    max: 98,
    label:
      "Incredible. You've made a real investment in my work and process—your generosity is humbling."
  },
  {
    min: 99,
    max: 100,
    label:
      "Incredible. You've made a real investment in this—your generosity is humbling. Please let me know if there's anything specific you'd like to see!"
  }
]

// Add a computed property to get the current donation level message
const currentDonationMessage = computed(() => {
  const level = donationLevels.find(
    (level) => amount.value >= level.min && amount.value <= level.max
  )
  return level?.label || ''
})

// Animation refs
const sectionRef = ref(null)
const headerRef = ref(null)
const titleRef = ref(null)
const dividerRef = ref(null)
const gridRef = ref(null)
const stripeCardRef = ref(null)
const cryptoCardRef = ref(null)
const sponsorsRef = ref(null)

// Epic donation section reveal with proper timeline
const animateDonationReveal = async () => {
  if (process.server) return
  
  await nextTick()
  
  const timeline = createTimeline()
  
  // Stage 1: Section container emergence
  if (sectionRef.value) {
    timeline.add({
      targets: sectionRef.value,
      opacity: [0, 1],
      scale: [0.95, 1.02, 1],
      filter: ['blur(1px)', 'blur(0px)'],
      duration: timing.slow,
      ease: easing.bounce
    })
  }
  
  // Stage 2: Header dramatic entrance
  if (titleRef.value) {
    timeline.add({
      targets: titleRef.value,
      keyframes: [
        { opacity: 0, scale: 0.7, rotateZ: -5, filter: 'blur(1px)' },
        { opacity: 0.8, scale: 1.1, rotateZ: 2, filter: 'blur(0.3px)' },
        { opacity: 1, scale: 1, rotateZ: 0, filter: 'blur(0px)' }
      ],
      duration: timing.expressive,
      ease: easing.bounce
    }, '-=600')
  }
  
  // Stage 3: Divider line expansion
  if (dividerRef.value) {
    timeline.add({
      targets: dividerRef.value,
      scaleX: [0, 1.1, 1],
      opacity: [0, 1],
      duration: timing.slow,
      ease: easing.bounce
    }, '-=200')
  }
  
  // Stage 4: Cards flip entrance
  const cards = [stripeCardRef.value, cryptoCardRef.value].filter(Boolean)
  if (cards.length) {
    timeline.add({
      targets: cards,
      keyframes: [
        { opacity: 0, scale: 0.8, rotateY: -45, filter: 'blur(1px)' },
        { opacity: 0.8, scale: 1.05, rotateY: 10, filter: 'blur(0.3px)' },
        { opacity: 1, scale: 1, rotateY: 0, filter: 'blur(0px)' }
      ],
      duration: 700,
      delay: _stagger(150),
      ease: 'outBack(1.7)'
    }, '-=300')
  }
  
  // Stage 5: Sponsors link subtle reveal
  if (sponsorsRef.value) {
    timeline.add({
      targets: sponsorsRef.value,
      opacity: [0, 1],
      translateY: [20, 0],
      scale: [0.9, 1],
      duration: timing.slow,
      ease: easing.standard
    }, '+=200')
  }
}

// Watch amount changes for message animation
watch(amount, () => {
  const messageEl = document.querySelector('.donation-message')
  if (messageEl) {
    animate(messageEl, {
      scale: [1, 1.05, 1],
      opacity: [0.7, 1],
      duration: timing.normal,
      ease: easing.bounce
    })
  }
})

onMounted(() => {
  animateDonationReveal()
})
</script>

<template>
  <section ref="sectionRef" class="donation-section mt-16 mb-8 font-mono">
    <div class="max-w-3xl mx-auto">
      <div ref="headerRef" class="text-center mb-12">
        <h2 ref="titleRef" class="text-2xl font-light tracking-wider mb-3">
          Support This Work
        </h2>
        <div
          ref="dividerRef"
          class="w-16 h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent mx-auto"
        ></div>
      </div>

      <div ref="gridRef" class="grid md:grid-cols-2 gap-8">
        <!-- Stripe Payment -->
        <div ref="stripeCardRef" class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
          <h4 class="text-lg font-light mb-6">
            One-time Support
          </h4>

          <div class="space-y-6">
            <div>
              <div class="flex justify-between mb-2">
                <span class="text-sm text-gray-500">
                  Amount
                </span>
                <span class="px-3 py-2 text-sm font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded">{{
                  formatAmount
                }}</span>
              </div>

              <div class="mb-2">
                <input
                  v-model="amount"
                  type="range"
                  :min="1"
                  :max="100"
                  :step="1"
                  class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <div class="flex justify-between text-xs text-gray-500 mt-1">
                  <span>$1</span>
                  <span>$100</span>
                </div>
              </div>

              <button
                :disabled="loading"
                class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                @click="handleDonation"
              >
                <Icon name="material-symbols:payments-outline" class="w-4 h-4" />
                {{ loading ? 'Processing...' : 'Support via Stripe' }}
              </button>

              <div class="mt-4 flex items-center justify-center min-h-[2rem]">
                <p
                  :key="currentDonationMessage"
                  class="donation-message text-[0.7rem] text-gray-400 dark:text-gray-500 italic px-4"
                >
                  {{ currentDonationMessage }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Updated Crypto Section -->
        <div ref="cryptoCardRef" class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
          <h4 class="text-lg font-light mb-6">
            Cryptocurrency
          </h4>

          <div class="space-y-4">
            <template v-for="(address, currency) in crypto" :key="currency">
              <div class="crypto-address group">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <Icon
                      :name="`i-simple-icons-${currency.toLowerCase()}`"
                      class="text-lg"
                    />
                    <span class="font-medium">{{ currency }}</span>
                  </div>
                  <button
                    class="flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors"
                    :class="lastCopied === currency ? 'text-green-600 bg-green-100 dark:bg-green-900/20' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'"
                    @click="copyAddress(address, currency)"
                  >
                    <Icon
                      :name="lastCopied === currency ? 'heroicons:check' : 'heroicons:clipboard'"
                      class="w-3 h-3"
                    />
                    {{ lastCopied === currency ? 'Copied!' : 'Copy' }}
                  </button>
                </div>
                <div
                  class="p-2 bg-gray-100 dark:bg-gray-800 rounded cursor-pointer group transition-colors"
                  @click="copyAddress(address, currency)"
                >
                  <span class="font-mono text-xs break-all">
                    {{
                      address
                    }}
                  </span>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- GitHub Sponsors -->
      <div ref="sponsorsRef" class="text-center mt-8">
        <a
          :href="`https://github.com/sponsors/${github}`"
          target="_blank"
          rel="noopener"
          class="inline-flex items-center gap-2 px-4 py-2 text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300 transition-colors"
        >
          <Icon name="mdi:github" class="w-4 h-4" />
          Also available on GitHub Sponsors
        </a>
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
