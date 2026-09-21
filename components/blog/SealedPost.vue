<script setup>
/**
 * Opens a sealed post using the key in the URL fragment (`#k=…`). Fragments are
 * never sent to a server, so the key stays in this tab.
 *
 * Needs JS; sealed posts are not server-rendered. Design + threat model:
 * docs/SEALED-POSTS.md
 */
import { unsealPost } from '~/utils/postSeal.mjs'

const props = defineProps({
  envelope: { type: Object, required: true },
  slug: { type: String, required: true },
})

const emit = defineEmits(['unsealed'])

const state = ref('opening') // opening | failed
const reason = ref(null)

/**
 * Read the key and immediately remove it from the address bar via
 * replaceState, so the post can be reloaded from history without the key
 * lingering in a screenshot, a shoulder-surf, or a "copy current URL" that
 * gets pasted somewhere public. The key is already in memory by then, so the
 * page keeps working; a hard reload needs the original link again.
 */
function takeKeyFromFragment() {
  const hash = window.location.hash.replace(/^#/, '')
  const key = new URLSearchParams(hash).get('k')
  if (key) {
    window.history.replaceState(null, '', window.location.pathname)
  }
  return key
}

onMounted(async () => {
  const key = takeKeyFromFragment()
  if (!key) {
    state.value = 'failed'
    reason.value = 'no-key'
    return
  }

  const { payload, reason: why } = await unsealPost(
    props.envelope,
    key,
    props.slug
  )

  if (!payload) {
    state.value = 'failed'
    reason.value = why
    return
  }

  emit('unsealed', payload)
})

const message = computed(() => {
  switch (reason.value) {
    case 'no-key':
      return 'This post is sealed. Open it with the full link you were sent — the part after the # is the key, and without it there is nothing here to read.'
    case 'auth-failed':
    case 'malformed-key':
    case 'bad-iv':
      return 'That key does not open this post. The link may have been truncated — they are long, and mail clients and chat apps like to wrap them. Try copying it again.'
    case 'unknown-version':
      return 'This post was sealed in a format this page does not know how to open. That is a bug on my end, not a problem with your link.'
    default:
      return 'This post could not be opened.'
  }
})
</script>

<template>
  <div class="sealed-post">
    <div v-if="state === 'opening'" class="sealed-post__status">
      <span class="sealed-post__lock" aria-hidden="true">🔒</span>
      <p>Opening…</p>
    </div>

    <div v-else class="sealed-post__status">
      <span class="sealed-post__lock" aria-hidden="true">🔒</span>
      <p class="sealed-post__message">{{ message }}</p>
      <p class="sealed-post__note">
        Nothing is stored on the server that could open this — the key only ever
        exists in the link.
      </p>
    </div>
  </div>
</template>

<style scoped>
.sealed-post {
  @apply w-full px-4 py-24 md:px-8;
}

.sealed-post__status {
  @apply max-w-prose;
}

.sealed-post__lock {
  @apply block mb-4 text-2xl;
}

.sealed-post__message {
  @apply font-serif text-base text-zinc-800 dark:text-zinc-200;
}

.sealed-post__note {
  @apply mt-4 font-mono text-2xs text-zinc-500 dark:text-zinc-400;
}
</style>
