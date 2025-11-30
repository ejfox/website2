<template>
  <div ref="gistRef" class="gist-preview">
    <div ref="containerRef" class="code-container" :class="{ expanded }">
      <div ref="codeRef" class="code-content" v-html="highlightedCode" />

      <!-- Expand/Collapse button at bottom -->
      <div v-if="lineCount > 10" ref="overlayRef" class="gradient-fade-bottom">
        <button ref="buttonRef" class="action-button" @click="handleToggle">
          <span ref="iconRef" class="button-icon">{{
            expanded ? '▼' : '▶'
          }}</span>
          <span
            >{{ expanded ? 'Collapse' : 'Expand' }} ({{
              formatNumber(lineCount)
            }}
            lines)</span
          >
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatNumber } from '~/composables/useNumberFormat'

interface GistFile {
  filename: string
  type: string
  language: string
  raw_url: string
  size: number
}

interface Gist {
  id: string
  description: string
  created_at: string
  updated_at: string
  files: Record<string, GistFile>
  html_url: string
  content?: string
}

interface Props {
  gist: Gist
  file: GistFile
  expanded: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  toggle: []
}>()

// Animation refs
const gistRef = ref<HTMLElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)
const codeRef = ref<HTMLElement | null>(null)
const overlayRef = ref<HTMLElement | null>(null)
const buttonRef = ref<HTMLElement | null>(null)
const iconRef = ref<HTMLElement | null>(null)

const lineCount = computed(() => {
  return (props.gist.content || '').split('\n').length
})

const codeToShow = computed(() => {
  const content = props.gist.content || ''
  return props.expanded ? content : content.split('\n').slice(0, 10).join('\n')
})

const highlightedCode = ref('')

const updateHighlighting = async () => {
  // SERVER-SIDE HIGHLIGHTING - Pre-baked like the low side
  // No client bundlin', Zeus almighty style
  if (codeToShow.value) {
    try {
      // Enhanced theme detection
      let isDark = false
      if (import.meta.client) {
        // Check multiple methods for dark mode detection
        isDark =
          document.documentElement.classList.contains('dark') ||
          document.documentElement.getAttribute('data-theme') === 'dark' ||
          window.matchMedia('(prefers-color-scheme: dark)').matches
      }

      const response = await $fetch('/api/highlight', {
        method: 'POST',
        body: {
          code: codeToShow.value,
          language: props.file.language?.toLowerCase() || 'text',
          theme: isDark ? 'one-dark-pro' : 'github-light'
        }
      })

      highlightedCode.value =
        (response as any)?.html || `<pre><code>${codeToShow.value}</code></pre>`
    } catch (error) {
      console.warn('Failed to highlight code:', error)
      highlightedCode.value = `<pre><code>${codeToShow.value}</code></pre>`
    }
  } else {
    highlightedCode.value = `<pre><code>${codeToShow.value || ''}</code></pre>`
  }
}

// Initialize on server and client
if (import.meta.server || import.meta.client) {
  // Initialize immediately for SSR
  updateHighlighting()
}

// Re-initialize on mount for client-side hydration
onMounted(async () => {
  await updateHighlighting()
  // Component mounted
})

// Watch for changes in expanded state, content, or theme
watch([() => props.expanded, () => props.gist.content], async () => {
  await updateHighlighting()
})

// Watch for theme changes
if (import.meta.client) {
  const observer = new MutationObserver(async (mutations) => {
    for (const mutation of mutations) {
      if (
        mutation.type === 'attributes' &&
        mutation.attributeName === 'class'
      ) {
        await updateHighlighting()
        break
      }
    }
  })

  onMounted(() => {
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
  })

  onUnmounted(() => {
    observer.disconnect()
  })
}

// Handle toggle with animation
const handleToggle = () => {
  emit('toggle')
}

// No animations needed - handled by CSS transitions
</script>

<style scoped>
.gist-preview {
  @apply font-mono;
}

.code-container {
  @apply relative border border-zinc-200 dark:border-zinc-800 rounded-md;
  @apply bg-white dark:bg-zinc-900 overflow-hidden transition-all;
  max-height: 280px;
}

.code-container.expanded {
  @apply max-h-none;
}

.code-content {
  @apply text-xs leading-relaxed overflow-auto overflow-x-hidden;
}

.code-content :deep(pre) {
  @apply !m-0 !p-4 !bg-transparent !font-mono !text-xs !leading-relaxed;
}

.code-content :deep(code) {
  @apply !font-mono !text-xs;
}

.action-button {
  @apply flex items-center gap-1 px-2 py-1 text-xs;
  @apply bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700;
  @apply rounded text-zinc-600 dark:text-zinc-400 font-mono cursor-pointer shadow-sm;
  @apply hover:bg-zinc-50 dark:hover:bg-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600;
  @apply hover:text-zinc-700 dark:hover:text-zinc-300 hover:-translate-y-px transition-all;
}

.button-icon {
  @apply text-xs text-zinc-500 dark:text-zinc-500;
}

/* Ensure proper scrolling for expanded state */
.code-container.expanded .code-content {
  @apply max-h-[60vh] overflow-y-auto;
}

/* Custom scrollbar */
.code-content::-webkit-scrollbar {
  @apply w-2;
  height: 0;
}

.code-content::-webkit-scrollbar:horizontal {
  @apply h-0 hidden;
}

.code-content::-webkit-scrollbar-track {
  @apply bg-zinc-100 dark:bg-zinc-800;
}

.code-content::-webkit-scrollbar-thumb {
  @apply bg-zinc-300 dark:bg-zinc-700 rounded;
}

.code-content::-webkit-scrollbar-thumb:hover {
  @apply bg-zinc-400 dark:bg-zinc-600;
}
</style>
