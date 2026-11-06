<script setup lang="ts">
// /ping: anyone can buzz EJ's phone with a short note (server/api/ping.post.ts,
// rate-limited in server/utils/pingLimit.ts).
const MAX = 200
const message = ref('')
const from = ref('')
const website = ref('') // honeypot
const status = ref<'idle' | 'sending' | 'sent'>('idle')
const error = ref('')
let openedAt = 0
onMounted(() => {
  openedAt = Date.now()
})

async function send() {
  error.value = ''
  if (!message.value.trim()) return (error.value = 'Write a message first')
  status.value = 'sending'
  try {
    await $fetch('/api/ping', {
      method: 'POST',
      body: {
        message: message.value,
        from: from.value,
        website: website.value,
        elapsed_ms: Date.now() - openedAt,
      },
    })
    status.value = 'sent'
  } catch (e: any) {
    status.value = 'idle'
    error.value =
      e?.data?.statusMessage ||
      e?.statusMessage ||
      "That didn't go through. Try again later"
  }
}

// Not for search engines; it's a direct line, and crawlers only bring spam.
useHead({ meta: [{ name: 'robots', content: 'noindex' }] })

usePageSeo({
  title: 'Ping · EJ Fox',
  description: 'Send a short note straight to my phone.',
  type: 'website',
  section: 'Meta',
  tags: ['Contact'],
})
</script>

<template>
  <div class="max-w-screen-xl mx-auto px-4 md:px-8 xl:px-16 pt-8 pb-16">
    <div class="max-w-prose font-serif">
      <header class="mb-8">
        <h1 class="font-serif text-2xl mb-2">Ping</h1>
        <p class="text-zinc-600 dark:text-zinc-400">
          This sends a notification to my phone. Keep it short. If you want a
          reply, put your email in it or write to
          <a href="mailto:ejfox@ejfox.com" class="underline">ejfox@ejfox.com</a
          >.
        </p>
      </header>

      <p v-if="status === 'sent'" class="font-mono text-sm" role="status">
        Sent.
      </p>

      <form v-else class="space-y-4" novalidate @submit.prevent="send">
        <div>
          <label
            for="ping-message"
            class="block font-mono text-xs uppercase tracking-wider text-zinc-500 mb-1"
            >Message</label
          >
          <textarea
            id="ping-message"
            v-model="message"
            :maxlength="MAX"
            rows="3"
            required
            class="w-full bg-transparent border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-base focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-200"
            @keydown.meta.enter.prevent="send"
            @keydown.ctrl.enter.prevent="send"
          ></textarea>
          <p class="font-mono text-2xs text-zinc-500 text-right">
            {{ message.length }}/{{ MAX }}
          </p>
        </div>
        <div>
          <label
            for="ping-from"
            class="block font-mono text-xs uppercase tracking-wider text-zinc-500 mb-1"
            >From
            <span class="normal-case tracking-normal">(optional)</span></label
          >
          <input
            id="ping-from"
            v-model="from"
            maxlength="60"
            autocomplete="name"
            class="w-full bg-transparent border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-base focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-200"
          />
        </div>
        <!-- Honeypot: hidden from people and screen readers; bots fill it in. -->
        <div class="sr-only" aria-hidden="true">
          <label for="ping-website">Website</label>
          <input
            id="ping-website"
            v-model="website"
            tabindex="-1"
            autocomplete="off"
          />
        </div>
        <p
          v-if="error"
          class="font-mono text-sm text-red-600 dark:text-red-400"
          role="alert"
        >
          {{ error }}
        </p>
        <button
          type="submit"
          :disabled="status === 'sending'"
          data-umami-event="ping-send"
          class="font-mono text-sm uppercase tracking-wider px-5 py-2.5 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black disabled:opacity-50"
        >
          {{ status === 'sending' ? 'Sending' : 'Send' }}
        </button>
      </form>

      <p class="mt-10 font-mono text-2xs text-zinc-500">
        One ping per person every 10 minutes, a few a day.
      </p>
    </div>
  </div>
</template>
