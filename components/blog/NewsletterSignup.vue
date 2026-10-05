<!--
  @file NewsletterSignup.vue
  @description Email signup for EJ's self-hosted listmonk (list.tools.ejfox.com).
  A plain HTML form, no JS: it POSTs straight to listmonk's public subscription
  endpoint, which shows its own (on-brand) confirmation page and sends a
  double-opt-in email. Nothing is stored on ejfox.com.
  @props listId?: string - listmonk list UUID (defaults to the "ejfox.com" list)
  @props location?: string - Umami `newsletter-signup` prop (post-footer, dispatch-footer…)
-->
<script setup lang="ts">
withDefaults(defineProps<{ listId?: string; location?: string }>(), {
  listId: 'c2f33988-852d-4e8d-bb66-060afc3df187',
  location: 'post-footer',
})
</script>

<template>
  <section
    class="newsletter-signup my-12 max-w-prose border-t border-zinc-200 dark:border-zinc-800 pt-6"
  >
    <h2 class="text-lg mb-1">Get the next one</h2>
    <p class="font-serif text-sm text-zinc-600 dark:text-zinc-400 mb-4">
      Charts, data and the occasional essay. One email a week, at most.
      Unsubscribe anytime.
    </p>
    <form
      action="https://list.tools.ejfox.com/subscription/form"
      method="post"
      class="flex flex-col sm:flex-row gap-2"
    >
      <label for="newsletter-email" class="sr-only">Email address</label>
      <input
        id="newsletter-email"
        name="email"
        type="email"
        required
        autocomplete="email"
        placeholder="you@example.com"
        class="flex-1 font-mono text-sm px-3 py-2 bg-sunken border border-zinc-300 dark:border-zinc-700 rounded focus:outline-none focus:border-zinc-500"
      />
      <input type="hidden" name="l" :value="listId" />
      <!-- listmonk honeypot: must stay empty (bots filling it get dropped) -->
      <input
        name="nonce"
        value=""
        tabindex="-1"
        autocomplete="off"
        aria-hidden="true"
        class="hidden"
      />
      <button
        type="submit"
        data-umami-event="newsletter-signup"
        :data-umami-event-location="location"
        class="font-mono text-xs uppercase tracking-wider px-4 py-2 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-80 transition-opacity"
      >
        Subscribe
      </button>
    </form>
  </section>
</template>
