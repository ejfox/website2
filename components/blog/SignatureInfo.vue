<script setup>
const props = defineProps({
  path: String // The blog post path like "2024/my-modern-scrapbook.md"
})

const showCommand = ref(false)
const command = computed(() => {
  return `curl -s https://raw.githubusercontent.com/ejfox/website2/main/content/blog/${props.path} | gpg --verify`
})

const copyCommand = async () => {
  await navigator.clipboard.writeText(command.value)
}
</script>

<template>
  <div class="relative group">
    <button @click="showCommand = !showCommand"
      class="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors flex items-center space-x-1">
      <UIcon name="i-heroicons-shield-check" class="w-4 h-4" />
      <span>Signed with PGP</span>
    </button>

    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100" leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform scale-100 opacity-100" leave-to-class="transform scale-95 opacity-0">
      <div v-if="showCommand"
        class="absolute bottom-full mb-2 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg shadow-lg text-sm">
        <p class="mb-2 text-zinc-600 dark:text-zinc-400">Verify this post's signature:</p>
        <div class="font-mono bg-zinc-200 dark:bg-zinc-900 p-2 rounded flex items-center justify-between">
          <code class="text-xs">{{ command }}</code>
          <button @click="copyCommand" class="ml-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
            <UIcon name="i-heroicons-clipboard" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>