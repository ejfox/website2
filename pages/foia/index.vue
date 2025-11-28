<template>
  <div class="px-4 md:px-8 max-w-prose py-8 md:py-16">
    <!-- Header -->
    <header class="mb-8">
      <div
        class="font-mono text-xs text-zinc-500 mb-3 uppercase tracking-wider"
      >
        FOIA Requests
      </div>
      <h1 class="font-serif text-3xl font-normal mb-2">Public Records</h1>
      <p class="font-serif text-base text-zinc-600 dark:text-zinc-400">
        Freedom of Information Act requests filed and their status.
      </p>
    </header>

    <!-- Loading -->
    <div v-if="pending" class="space-y-4">
      <div v-for="i in 3" :key="i" class="animate-pulse">
        <div class="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4 mb-2"></div>
        <div class="h-3 bg-zinc-100 dark:bg-zinc-900 rounded w-1/2"></div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-8">
      <p class="text-red-600 dark:text-red-400">{{ error }}</p>
    </div>

    <!-- Results -->
    <div v-else class="space-y-8">
      <!-- Open Requests -->
      <section v-if="data?.open?.length">
        <h2
          class="font-mono text-xs uppercase tracking-wider text-zinc-500 mb-4"
        >
          Open ({{ data.open.length }})
        </h2>
        <div class="space-y-4">
          <a
            v-for="req in data.open"
            :key="req.id"
            :href="req.url"
            target="_blank"
            rel="noopener"
            class="block group"
          >
            <div class="foia-open-title">
              {{ req.title }}
            </div>
            <div class="foia-meta">
              <span>{{ formatDate(req.filed) }}</span>
              <span class="text-zinc-400">·</span>
              <span class="capitalize">{{ req.status }}</span>
            </div>
          </a>
        </div>
      </section>

      <!-- Completed Requests -->
      <section v-if="data?.completed?.length">
        <h2
          class="font-mono text-xs uppercase tracking-wider text-zinc-500 mb-4 mt-8"
        >
          Completed ({{ data.completed.length }})
        </h2>
        <div class="space-y-4">
          <a
            v-for="req in data.completed"
            :key="req.id"
            :href="req.url"
            target="_blank"
            rel="noopener"
            class="block group opacity-75 hover:opacity-100 transition-opacity"
          >
            <div class="foia-completed-title">
              {{ req.title }}
            </div>
            <div class="foia-meta-completed">
              {{ formatDate(req.filed) }} →
              {{ formatDate(req.completed) }}
            </div>
          </a>
        </div>
      </section>

      <!-- Empty State -->
      <div v-if="!data?.open?.length && !data?.completed?.length">
        <p class="text-zinc-500 dark:text-zinc-400">No requests found.</p>
      </div>
    </div>

    <!-- Footer -->
    <footer class="mt-12 pt-6 border-t border-zinc-200 dark:border-zinc-800">
      <p class="font-serif text-sm text-zinc-500 dark:text-zinc-500 italic">
        Data from
        <a
          href="https://www.muckrock.com/accounts/users/ejfox/"
          target="_blank"
          rel="noopener"
          class="underline hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          MuckRock
        </a>
      </p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { format, parseISO } from 'date-fns'

const { data, pending, error } = await useFetch('/api/muckrock')

function formatDate(dateStr: string) {
  if (!dateStr) return 'N/A'
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy')
  } catch {
    return dateStr
  }
}

useHead({
  title: 'FOIA Requests - EJ Fox',
  meta: [
    {
      name: 'description',
      content: 'Freedom of Information Act requests filed by EJ Fox'
    }
  ]
})
</script>

<style scoped>
.foia-open-title {
  @apply font-serif text-lg text-zinc-900 dark:text-zinc-100;
  @apply group-hover:text-zinc-600 dark:group-hover:text-zinc-400;
  @apply transition-colors;
}

.foia-completed-title {
  @apply font-serif text-base text-zinc-700 dark:text-zinc-300;
}

.foia-meta {
  @apply font-mono text-xs text-zinc-500 dark:text-zinc-400 mt-1 space-x-2;
}

.foia-meta-completed {
  @apply font-mono text-xs text-zinc-500 dark:text-zinc-400 mt-1;
}
</style>
