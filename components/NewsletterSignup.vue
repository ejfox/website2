<template>
  <div ref="signupContainer" class="newsletter-signup">
    <!-- Form -->
    <form
      ref="formRef"
      class="flex items-center gap-0.5.5 relative"
      @submit.prevent="submitForm"
    >
      <div class="flex-1 flex items-center gap-0.5.5 min-w-0">
        <input
          ref="emailInputRef"
          v-model="email"
          type="email"
          placeholder="your@email.com"
          required
          class="input-full"
          :disabled="state.loading"
          @input="revealNameFields"
        />

        <!-- Name fields that slide out -->
        <div
          ref="nameFieldsContainer"
          :class="[
            'flex gap-0.5.5 overflow-hidden transition-all duration-300',
            'ease-out shrink-0',
            showNameFields ? 'w-auto opacity-100' : 'w-0 opacity-0',
          ]"
        >
          <input
            v-model="firstName"
            type="text"
            placeholder="First"
            class="input-numeric"
            :disabled="state.loading"
          />
          <input
            v-model="lastName"
            type="text"
            placeholder="Last"
            class="input-numeric"
            :disabled="state.loading"
          />
        </div>
      </div>

      <button
        ref="buttonRef"
        type="submit"
        class="btn-filter"
        :disabled="state.loading"
      >
        <span v-if="!state.loading">Subscribe →</span>
        <span v-else class="loading-dots">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </span>
      </button>
    </form>

    <!-- Success/Error messages that slide down -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="transform -translate-y-1 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform -translate-y-1 opacity-0"
    >
      <div
        v-if="state.success || state.error"
        class="absolute left-0 right-0 mt-2.5 text-xs"
        :class="{
          'text-green-600 dark:text-green-400': state.success,
          'text-red-600 dark:text-red-400': state.error,
        }"
      >
        {{ state.message }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
// import { animate, stagger as _stagger } from '~/anime.esm.js'
// import { useAnimations } from '~/composables/useAnimations'

const email = ref('')
const firstName = ref('')
const lastName = ref('')
const signupContainer = ref(null)
const formRef = ref(null)
const emailInputRef = ref(null)
const buttonRef = ref(null)
const nameFieldsContainer = ref(null)
const showNameFields = ref(false)

const state = reactive({
  loading: false,
  success: false,
  error: false,
  message: '',
})

// NUKED: Animation composable usage obliterated
// const { timing, easing, staggers } = useAnimations()

const revealNameFields = () => {
  if (email.value.length > 0 && !showNameFields.value) {
    showNameFields.value = true

    // Epic name fields reveal
    if (nameFieldsContainer.value) {
      // Animation code deleted following delete-driven development
      setTimeout(() => {
        const inputs = nameFieldsContainer.value?.querySelectorAll('input')
        if (inputs?.length) {
          // Simple opacity transition without anime.js
          inputs.forEach((input) => {
            input.style.opacity = '1'
          })
        }
      }, 200)
    }
  } else if (email.value.length === 0 && showNameFields.value) {
    showNameFields.value = false
  }
}

const submitForm = async () => {
  state.loading = true
  state.error = false
  state.success = false

  try {
    const response = await fetch('/api/newsletter-signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.value,
        firstName: firstName.value,
        lastName: lastName.value,
      }),
    })

    const result = await response.json()

    if (result.success) {
      state.success = true
      state.message = result.message
      email.value = ''
      firstName.value = ''
      lastName.value = ''
      showNameFields.value = false
    } else {
      state.error = true
      state.message = result.message
    }
  } catch (error) {
    state.error = true
    state.message = 'Something went wrong. Please try again later.'
    console.error('Newsletter signup error:', error)
  } finally {
    state.loading = false

    // Animate button state change (placeholder for future animation)
    if (buttonRef.value) {
      // Animation will go here
    }
  }
}

// Newsletter shows immediately without animation

onMounted(() => {
  // No animations - just show content immediately
})
</script>

<style scoped>
.loading-dots {
  @apply flex items-center justify-center h-[18px];
}

.dot {
  @apply w-[3px] h-[3px] mx-px bg-current rounded-full inline-block;
  animation: dot-flashing 0.6s infinite alternate;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dot-flashing {
  0% {
    opacity: 0.2;
  }
  100% {
    opacity: 1;
  }
}
</style>
