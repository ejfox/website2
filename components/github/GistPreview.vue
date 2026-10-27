<!--
  @file GistPreview.vue
  @description Expandable code preview with server-side syntax highlighting and theme support
    Used by pages/gists.vue, which owns the expanded state (one Set of ids) and
    passes the gist's first file. Highlighting is a POST to /api/highlight; the
    collapsed view sends only the first 10 lines.
  @props gist: Gist - Gist object with content, description, files
  @props file: GistFile - File object with filename, language, size
  @props expanded: boolean - Whether code is expanded
  @emits toggle - When expand/collapse button is clicked
-->
<script setup lang="ts">
import { formatNumber } from '~/utils/numberFormat'

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

// ── State ───────────────────────────────────────────────────
// Template refs below are bound but not read anywhere in this file.
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

// ── Highlighting ────────────────────────────────────────────
const highlightedCode = ref('')

// Plain-text fallback for v-html: the raw gist text, escaped.
const plainCode = (code: string) =>
  `<pre><code>${code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')}</code></pre>`

const updateHighlighting = async () => {
  // Highlighting runs server-side (/api/highlight), so no highlighter ships
  // in the client bundle
  if (codeToShow.value) {
    try {
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
          theme: isDark ? 'one-dark-pro' : 'github-light',
        },
      })

      highlightedCode.value =
        (response as any)?.html || plainCode(codeToShow.value)
    } catch (error) {
      console.warn('Failed to highlight code:', error)
      highlightedCode.value = plainCode(codeToShow.value)
    }
  } else {
    highlightedCode.value = plainCode(codeToShow.value || '')
  }
}

// Always true, so this runs in setup on both sides. It isn't awaited, so SSR
// renders before the fetch resolves; with the onMounted call below, the
// client highlights twice on first load.
if (import.meta.server || import.meta.client) {
  // Initialize immediately for SSR
  updateHighlighting()
}

// Re-initialize on mount for client-side hydration
onMounted(async () => {
  await updateHighlighting()
})

watch([() => props.expanded, () => props.gist.content], async () => {
  await updateHighlighting()
})

// Watch for theme changes: useDark() toggles the `dark` class on <html>, and
// the highlight theme is baked into the returned HTML, so re-request it.
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
      attributeFilter: ['class'],
    })
  })

  onUnmounted(() => {
    observer.disconnect()
  })
}

const handleToggle = () => {
  emit('toggle')
}
</script>

<template>
  <div ref="gistRef" class="gist-preview">
    <!-- Collapsed: max-height 280px clips the 10-line preview; expanded scrolls
         inside 60vh (see .code-container.expanded .code-content). -->
    <div ref="containerRef" class="code-container" :class="{ expanded }">
      <div ref="codeRef" class="code-content" v-html="highlightedCode" />

      <!-- Expand/Collapse button at bottom -->
      <div v-if="lineCount > 10" ref="overlayRef" class="gradient-fade-bottom">
        <button ref="buttonRef" class="action-button" @click="handleToggle">
          <span ref="iconRef" class="button-icon">
            {{ expanded ? '▼' : '▶' }}
          </span>
          <span>
            {{ expanded ? 'Collapse' : 'Expand' }} ({{
              formatNumber(lineCount)
            }}
            lines)
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gist-preview {
  @apply font-mono;
}

.code-container {
  @apply relative border border-zinc-200 dark:border-zinc-800 rounded-md;
  @apply bg-surface overflow-hidden transition-all duration-300;
  max-height: 280px;
}

.code-container.expanded {
  @apply max-h-none;
}

.code-content {
  @apply text-xs leading-6 overflow-auto overflow-x-hidden;
}

.code-content :deep(pre) {
  @apply !m-0 !p-4 !bg-transparent !font-mono !text-xs !leading-6;
}

.code-content :deep(code) {
  @apply !font-mono !text-xs;
}

.action-button {
  @apply flex items-center gap-0.5 px-2 py-1 text-xs;
  @apply bg-raised border shadow-sm;
  @apply border-zinc-200 dark:border-zinc-700;
  @apply rounded text-zinc-600 dark:text-zinc-400;
  @apply font-mono cursor-pointer;
  @apply hover:bg-zinc-50 dark:hover:bg-zinc-700;
  @apply hover:border-zinc-300 dark:hover:border-zinc-600;
  @apply hover:text-zinc-700 dark:hover:text-zinc-300;
  @apply hover:-translate-y-px transition-all duration-100;
}

.button-icon {
  @apply text-xs text-zinc-500 dark:text-zinc-500;
}

/* Ensure proper scrolling for expanded state */
.code-container.expanded .code-content {
  @apply max-h-[60vh] overflow-y-auto;
}

.code-content::-webkit-scrollbar {
  @apply w-2;
  height: 0;
}

.code-content::-webkit-scrollbar:horizontal {
  @apply h-0 hidden;
}

.code-content::-webkit-scrollbar-track {
  @apply bg-raised;
}

.code-content::-webkit-scrollbar-thumb {
  @apply bg-zinc-300 dark:bg-zinc-700 rounded;
}

.code-content::-webkit-scrollbar-thumb:hover {
  @apply bg-zinc-400 dark:bg-zinc-600;
}
</style>
