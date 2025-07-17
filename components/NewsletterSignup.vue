<template>
  <div ref="signupContainer" class="newsletter-signup">
    <!-- Form -->
    <form class="flex items-center gap-1.5 relative" @submit.prevent="submitForm">
      <div class="flex-1 flex items-center gap-1.5 min-w-0">
        <input 
          v-model="email" 
          type="email" 
          placeholder="your@email.com" 
          required 
          class="w-full min-w-0 py-1 px-2 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded
              text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 
              text-zinc-600 dark:text-zinc-400 placeholder-zinc-400 dark:placeholder-zinc-600
              transition-all duration-200"
          :disabled="state.loading" 
          @input="revealNameFields"
        />
        
        <!-- Name fields that slide out -->
        <div 
          ref="nameFieldsContainer"
          class="flex gap-1.5 overflow-hidden transition-all duration-300 ease-out shrink-0"
          :class="{'w-0 opacity-0': !showNameFields, 'w-auto opacity-100': showNameFields}"
        >
          <input 
            v-model="firstName" 
            type="text" 
            placeholder="First" 
            class="w-[4.5rem] py-1 px-2 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded
                text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600
                text-zinc-600 dark:text-zinc-400 placeholder-zinc-400 dark:placeholder-zinc-600
                transition-all duration-200" 
            :disabled="state.loading" 
          />
          <input 
            v-model="lastName" 
            type="text" 
            placeholder="Last" 
            class="w-[4.5rem] py-1 px-2 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded
                text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600
                text-zinc-600 dark:text-zinc-400 placeholder-zinc-400 dark:placeholder-zinc-600
                transition-all duration-200" 
            :disabled="state.loading" 
          />
        </div>
      </div>
      
      <button 
        type="submit" 
        class="shrink-0 py-1 px-2.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 rounded
             hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300
             focus:outline-none focus:ring-1 focus:ring-zinc-400
             text-sm transition-all duration-200 flex items-center justify-center whitespace-nowrap" 
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
        class="absolute left-0 right-0 mt-1.5 text-xs"
        :class="{
          'text-green-600 dark:text-green-400': state.success,
          'text-red-600 dark:text-red-400': state.error
        }"
      >
        {{ state.message }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { animate } from '~/anime.esm.js'

const email = ref('')
const firstName = ref('')
const lastName = ref('')
const signupContainer = ref(null)
const nameFieldsContainer = ref(null)
const showNameFields = ref(false)

const state = reactive({
  loading: false,
  success: false,
  error: false,
  message: ''
})

const revealNameFields = () => {
  if (email.value.length > 0 && !showNameFields.value) {
    showNameFields.value = true
    
    // Animate the name fields sliding in
    if (nameFieldsContainer.value) {
      const targetWidth = nameFieldsContainer.value.scrollWidth
      animate(nameFieldsContainer.value, {
        width: [0, targetWidth],
        opacity: [0, 1],
        duration: 300,
        easing: 'easeOutQuad'
      })
    }
  } else if (email.value.length === 0 && showNameFields.value) {
    // Hide name fields when email is cleared
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
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        email: email.value,
        firstName: firstName.value,
        lastName: lastName.value
      })
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
  }
}
</script>

<style scoped>
.loading-dots {
  display: flex;
  align-items: center;
  justify-center: center;
  height: 18px;
}

.dot {
  width: 3px;
  height: 3px;
  margin: 0 1px;
  background-color: currentColor;
  border-radius: 50%;
  display: inline-block;
  animation: dot-flashing 1s infinite alternate;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dot-flashing {
  0% { opacity: 0.2; }
  100% { opacity: 1; }
}
</style>