<script setup lang="ts">
import { ref, onMounted } from 'vue'

export interface UnlockedPost {
  html: string
  toc?: unknown[]
  metadata?: Record<string, unknown>
}

const props = defineProps<{
  slug: string
  postTitle?: string
}>()

const emit = defineEmits<{
  unlocked: [post: UnlockedPost]
}>()

const enteredPassword = ref('')
const error = ref('')
const checking = ref(false)

// The password is verified server-side and the post body only exists in the
// response to a correct one — the content is never in the page for a visitor
// who hasn't unlocked it, so there is nothing to bypass client-side.
function unlock(password: string): Promise<UnlockedPost> {
  return $fetch<UnlockedPost>('/api/posts/unlock', {
    method: 'POST',
    body: { slug: props.slug, password },
  })
}

function sessionKey() {
  return `unlocked-post:${props.slug}`
}

async function checkPassword() {
  const password = enteredPassword.value.trim()
  if (!password) {
    error.value = 'Please enter a password'
    return
  }

  checking.value = true
  error.value = ''

  try {
    const post = await unlock(password)
    // Remember the password, not the content: a reload re-fetches from the
    // server, so a stale body can't outlive the post itself.
    try {
      sessionStorage.setItem(sessionKey(), password)
    } catch {
      /* private browsing — unlock still works for this view */
    }
    emit('unlocked', post)
  } catch (e: unknown) {
    const status = (e as { statusCode?: number })?.statusCode
    if (status === 429) {
      error.value = 'Too many attempts. Try again in a few minutes.'
    } else if (status === 401) {
      error.value = 'Incorrect password'
      enteredPassword.value = ''
    } else {
      error.value = 'Could not check the password. Try again.'
    }
  }

  checking.value = false
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    checkPassword()
  }
}

// Re-unlock silently if this session already got in.
onMounted(async () => {
  let saved: string | null = null
  try {
    saved = sessionStorage.getItem(sessionKey())
  } catch {
    return
  }
  if (!saved) return
  try {
    emit('unlocked', await unlock(saved))
  } catch {
    // Password changed or post no longer protected — fall through to the form.
    try {
      sessionStorage.removeItem(sessionKey())
    } catch {
      /* ignore */
    }
  }
})
</script>

<template>
  <div class="password-gate">
    <div class="gate-content">
      <div class="lock-icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>

      <h2 class="gate-title">This post is password-protected</h2>
      <p v-if="postTitle" class="gate-subtitle">{{ postTitle }}</p>

      <div class="input-group">
        <input
          v-model="enteredPassword"
          type="password"
          placeholder="Enter password..."
          aria-label="Password"
          class="password-input"
          :disabled="checking"
          @keydown="handleKeydown"
        />
        <button
          class="submit-btn"
          :disabled="checking || !enteredPassword.trim()"
          @click="checkPassword"
        >
          {{ checking ? '...' : 'View Post' }}
        </button>
      </div>

      <p v-if="error" class="error-message">{{ error }}</p>
    </div>
  </div>
</template>

<style scoped>
.password-gate {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.gate-content {
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.lock-icon {
  color: #71717a;
  margin-bottom: 1.5rem;
}

.gate-title {
  font-size: 1.25rem;
  font-weight: 500;
  color: #18181b;
  margin: 0 0 0.5rem 0;
}

@media (prefers-color-scheme: dark) {
  .gate-title {
    color: #fafafa;
  }
}

.gate-subtitle {
  font-size: 0.875rem;
  color: #71717a;
  margin: 0 0 2rem 0;
  font-style: italic;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.password-input {
  width: 100%;
  padding: 0.875rem 1rem;
  font-size: 1rem;
  border: 1px solid #e4e4e7;
  border-radius: 0.5rem;
  background: #fff;
  color: #18181b;
  text-align: center;
}

.password-input:focus {
  outline: none;
  border-color: #a1a1aa;
  box-shadow: 0 0 0 3px rgba(161, 161, 170, 0.1);
}

@media (prefers-color-scheme: dark) {
  .password-input {
    background: #27272a;
    border-color: #3f3f46;
    color: #fafafa;
  }

  .password-input:focus {
    border-color: #52525b;
    box-shadow: 0 0 0 3px rgba(82, 82, 91, 0.2);
  }
}

.password-input::placeholder {
  color: #a1a1aa;
}

.submit-btn {
  padding: 0.875rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  background: #18181b;
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.15s ease;
}

.submit-btn:hover:not(:disabled) {
  background: #27272a;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (prefers-color-scheme: dark) {
  .submit-btn {
    background: #fafafa;
    color: #18181b;
  }

  .submit-btn:hover:not(:disabled) {
    background: #e4e4e7;
  }
}

.error-message {
  margin-top: 1rem;
  font-size: 0.875rem;
  color: #ef4444;
}
</style>
