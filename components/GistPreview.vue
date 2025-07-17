<template>
  <div class="gist-preview">
    <div class="code-container" :class="{ expanded: expanded }">
      <div v-html="highlightedCode" class="code-content" />

      <!-- Expand/Collapse button at bottom -->
      <div v-if="lineCount > 10" class="action-overlay">
        <button @click="$emit('toggle')" class="action-button">
          <span class="button-icon">{{ expanded ? '▼' : '▶' }}</span>
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
defineEmits<{
  toggle: []
}>()

const lineCount = computed(() => {
  return (props.gist.content || '').split('\n').length
})

const codeToShow = computed(() => {
  const content = props.gist.content || ''
  return props.expanded ? content : content.split('\n').slice(0, 10).join('\n')
})

const highlightedCode = ref('')

// Initialize syntax highlighting
onMounted(async () => {
  await updateHighlighting()
})

// Watch for changes in expanded state, content, or theme
watch([() => props.expanded, () => props.gist.content], async () => {
  await updateHighlighting()
})

// Watch for theme changes
if (process.client) {
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

const updateHighlighting = async () => {
  if (process.client && props.gist.content) {
    try {
      const { createHighlighter } = await import('shiki')
      const highlighter = await createHighlighter({
        themes: ['github-dark', 'github-light'],
        langs: [
          'javascript',
          'typescript',
          'json',
          'html',
          'css',
          'markdown',
          'bash',
          'python',
          'go',
          'rust',
          'java',
          'cpp',
          'vue',
          'jsx',
          'tsx'
        ]
      })

      const language = props.file.language?.toLowerCase() || 'text'

      // Detect current theme
      const isDark = document.documentElement.classList.contains('dark')
      const theme = isDark ? 'github-dark' : 'github-light'

      highlightedCode.value = highlighter.codeToHtml(codeToShow.value, {
        lang: language,
        theme: theme
      })
    } catch (error) {
      console.warn('Failed to highlight code:', error)
      highlightedCode.value = `<pre><code>${codeToShow.value}</code></pre>`
    }
  } else {
    highlightedCode.value = `<pre><code>${codeToShow.value}</code></pre>`
  }
}
</script>

<style scoped>
.gist-preview {
  font-family: 'Red Hat Mono', 'Consolas', 'Monaco', 'Courier New', monospace;
}

.code-container {
  position: relative;
  border: 1px solid rgb(228 228 231);
  border-radius: 6px;
  background: rgb(255 255 255);
  overflow: hidden;
  max-height: 280px;
  transition: max-height 0.3s ease;
}

/* Dark mode */
:global(.dark) .code-container {
  border-color: rgb(39 39 42);
  background: rgb(9 9 11);
}

.code-container.expanded {
  max-height: none;
}

.code-content {
  font-size: 11px;
  line-height: 1.4;
  overflow: auto;
}

.code-content :deep(pre) {
  margin: 0 !important;
  padding: 12px !important;
  background: transparent !important;
  font-family: 'Red Hat Mono', 'Consolas', 'Monaco', 'Courier New', monospace !important;
  font-size: 11px !important;
  line-height: 1.4 !important;
}

.code-content :deep(code) {
  font-family: 'Red Hat Mono', 'Consolas', 'Monaco', 'Courier New', monospace !important;
  font-size: 11px !important;
}

.action-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: linear-gradient(transparent, rgba(255, 255, 255, 0.95));
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 8px;
}

:global(.dark) .action-overlay {
  background: linear-gradient(transparent, rgba(9, 9, 11, 0.95));
}

.action-button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: 10px;
  background: rgb(255 255 255);
  border: 1px solid rgb(228 228 231);
  border-radius: 4px;
  color: rgb(82 82 91);
  transition: all 0.2s ease;
  font-family: 'Red Hat Mono', monospace;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

:global(.dark) .action-button {
  background: rgb(24 24 27);
  border-color: rgb(39 39 42);
  color: rgb(161 161 170);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.action-button:hover {
  background: rgb(244 244 245);
  border-color: rgb(212 212 216);
  color: rgb(63 63 70);
  transform: translateY(-1px);
}

:global(.dark) .action-button:hover {
  background: rgb(39 39 42);
  border-color: rgb(63 63 70);
  color: rgb(212 212 216);
  transform: translateY(-1px);
}

.button-icon {
  font-size: 8px;
  color: rgb(113 113 122);
}

:global(.dark) .button-icon {
  color: rgb(113 113 122);
}

/* Ensure proper scrolling for expanded state */
.code-container.expanded .code-content {
  max-height: 60vh;
  overflow-y: auto;
}

/* Custom scrollbar - vertical only */
.code-content::-webkit-scrollbar {
  width: 8px;
  height: 0; /* Hide horizontal scrollbar */
}

.code-content::-webkit-scrollbar:horizontal {
  height: 0;
  display: none;
}

.code-content::-webkit-scrollbar-track {
  background: rgb(244 244 245);
}

:global(.dark) .code-content::-webkit-scrollbar-track {
  background: rgb(24 24 27);
}

.code-content::-webkit-scrollbar-thumb {
  background: rgb(212 212 216);
  border-radius: 4px;
}

:global(.dark) .code-content::-webkit-scrollbar-thumb {
  background: rgb(63 63 70);
}

.code-content::-webkit-scrollbar-thumb:hover {
  background: rgb(161 161 170);
}

:global(.dark) .code-content::-webkit-scrollbar-thumb:hover {
  background: rgb(82 82 91);
}

/* Also hide overflow-x to prevent horizontal scrolling entirely */
.code-content {
  overflow-x: hidden;
}
</style>
