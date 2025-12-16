<!--
  @file CommitCard.vue
  @description Git commit display card with repository, hash, message, and timestamp
  @props sha: string - Git commit hash (short form)
  @props message: string - Commit message
  @props repo: string - Repository name
  @props date: string - Commit timestamp (optional)
-->
<template>
  <article class="commit-card group">
    <div class="flex gap-3">
      <!-- Git icon -->
      <div
        class="flex-shrink-0 w-10 h-10 rounded-full flex bg-green-50 dark:bg-green-950 items-center justify-center"
      >
        <svg
          class="w-5 h-5 text-green-600 dark:text-green-400"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
          />
        </svg>
      </div>

      <div class="flex-grow min-w-0">
        <!-- Header -->
        <div class="flex items-center gap-2 mb-2">
          <span class="font-medium text-zinc-900 dark:text-zinc-100 text-sm">
            {{ repo }}
          </span>
          <span class="text-zinc-300 dark:text-zinc-700">·</span>
          <code class="text-xs font-mono text-zinc-400 dark:text-zinc-500">
            {{ sha }}
          </code>
        </div>

        <!-- Commit message -->
        <p
          class="text-zinc-700 dark:text-zinc-300 text-[15px] leading-relaxed font-mono"
        >
          {{ message }}
        </p>

        <!-- Footer -->
        <div
          class="flex items-center gap-4 mt-2 text-xs text-zinc-400 dark:text-zinc-500"
        >
          <time v-if="date" :datetime="date">{{ formattedDate }}</time>
          <a
            v-if="sha && repo"
            :href="`https://github.com/ejfox/${repo}/commit/${sha}`"
            target="_blank"
            rel="noopener"
            class="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
interface Props {
  sha: string
  message: string
  repo: string
  date?: string
}

const props = defineProps<Props>()

const formattedDate = computed(() => {
  if (!props.date) return ''
  try {
    const d = new Date(props.date)
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
})
</script>

<style scoped>
.commit-card {
  @apply p-4 bg-white dark:bg-zinc-950 border rounded-xl;
  @apply border-zinc-100 dark:border-zinc-900;
}
</style>
