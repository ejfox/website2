<script setup>
/**
 * Dev-only "what changed" HUD. Fixed right-side rail listing every changed
 * content route (vs the working tree, or vs `main`), with status badges, line
 * counts, and an expandable diff preview. Click a row to jump to that route.
 *
 * Mounted from layouts/default.vue behind `import.meta.dev`, so it never ships.
 * Backed by GET /api/_dev/changes.
 *
 * Hotkey: backtick (`) toggles the rail open/closed.
 */
import { useStorage, useEventListener } from '@vueuse/core'

const route = useRoute()

const base = useStorage('dev-changes-base', 'session') // 'session' | 'branch'
const open = useStorage('dev-changes-open', true)
const highlight = useStorage('dev-changes-highlight', true)
const expanded = ref(new Set())

const files = ref([])
const routableCount = ref(0)
const loading = ref(false)
const error = ref(null)

async function refresh() {
  loading.value = true
  error.value = null
  try {
    const data = await $fetch('/api/_dev/changes', { query: { base: base.value } })
    files.value = data.files || []
    routableCount.value = data.routableCount || 0
  } catch (e) {
    error.value = e?.message || 'failed to load changes'
    files.value = []
  } finally {
    loading.value = false
  }
}

onMounted(refresh)
watch(base, refresh)

// Re-check when you navigate (you may have just saved a file) and run the
// in-page highlight for the route you landed on.
watch(
  () => route.path,
  () => {
    refresh()
    if (highlight.value) nextTick(() => highlightCurrent())
  }
)

const routableFiles = computed(() => files.value.filter((f) => f.route))
const otherFiles = computed(() => files.value.filter((f) => !f.route))

function isCurrent(f) {
  return f.route && f.route === route.path
}

function label(f) {
  return f.title || f.file.split('/').pop().replace(/\.\w+$/, '')
}

function toggleExpand(file) {
  const next = new Set(expanded.value)
  next.has(file) ? next.delete(file) : next.add(file)
  expanded.value = next
}

useEventListener(window, 'keydown', (e) => {
  // ignore while typing in a field
  const t = e.target
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
  if (e.key === '`') {
    e.preventDefault()
    open.value = !open.value
  }
})

// Best-effort: find the first added snippet from the current route's diff in the
// rendered content and scroll to it with a temporary flash. Defensive — only
// acts on an exact substring match, so it silently no-ops when markdown source
// doesn't map cleanly to the DOM.
function highlightCurrent() {
  const f = routableFiles.value.find(isCurrent)
  if (!f || !f.addedSnippets?.length) return
  const container = document.querySelector('.blog-post-content, main')
  if (!container) return

  for (const snippet of f.addedSnippets) {
    const needle = snippet.replace(/[#*_>`\[\]]/g, '').trim()
    if (needle.length < 8) continue
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
    let node
    while ((node = walker.nextNode())) {
      if (node.nodeValue && node.nodeValue.includes(needle.slice(0, 40))) {
        const el = node.parentElement
        if (!el) continue
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.classList.add('dev-changed-flash')
        setTimeout(() => el.classList.remove('dev-changed-flash'), 2400)
        return
      }
    }
  }
}
</script>

<template>
  <div class="dev-hud font-mono" :class="{ 'dev-hud--closed': !open }">
    <button
      class="dev-hud__tab"
      :title="open ? 'Hide changes (`)' : 'Show changes (`)'"
      @click="open = !open"
    >
      <span v-if="open">›</span>
      <span v-else>‹ {{ routableCount }}</span>
    </button>

    <div v-if="open" class="dev-hud__panel">
      <header class="dev-hud__head">
        <span class="dev-hud__title">CHANGED</span>
        <div class="dev-hud__modes">
          <button :class="{ on: base === 'session' }" @click="base = 'session'">session</button>
          <button :class="{ on: base === 'branch' }" @click="base = 'branch'">vs main</button>
        </div>
        <button class="dev-hud__refresh" :disabled="loading" title="Refresh" @click="refresh">
          {{ loading ? '…' : '↻' }}
        </button>
      </header>

      <p v-if="error" class="dev-hud__error">{{ error }}</p>
      <p v-else-if="!files.length && !loading" class="dev-hud__empty">
        nothing changed {{ base === 'branch' ? 'vs main' : 'in working tree' }}
      </p>

      <ul class="dev-hud__list">
        <li v-for="f in routableFiles" :key="f.file" :class="{ current: isCurrent(f) }">
          <div class="dev-hud__row">
            <span class="dev-hud__badge" :data-s="f.status">{{ f.status }}</span>
            <NuxtLink :to="f.route" class="dev-hud__link">{{ label(f) }}</NuxtLink>
            <span class="dev-hud__stat">
              <span v-if="f.additions" class="add">+{{ f.additions }}</span>
              <span v-if="f.deletions" class="del">−{{ f.deletions }}</span>
            </span>
            <button
              v-if="f.addedSnippets?.length"
              class="dev-hud__caret"
              @click="toggleExpand(f.file)"
            >
              {{ expanded.has(f.file) ? '▾' : '▸' }}
            </button>
          </div>
          <pre v-if="expanded.has(f.file)" class="dev-hud__diff"><span
            v-for="(s, i) in f.addedSnippets"
            :key="i"
            class="add"
          >+ {{ s }}
</span></pre>
        </li>
      </ul>

      <template v-if="otherFiles.length">
        <div class="dev-hud__section">other files</div>
        <ul class="dev-hud__list dev-hud__list--muted">
          <li v-for="f in otherFiles" :key="f.file">
            <div class="dev-hud__row">
              <span class="dev-hud__badge" :data-s="f.status">{{ f.status }}</span>
              <span class="dev-hud__link" :title="f.file">{{ f.file }}</span>
              <span class="dev-hud__stat">
                <span v-if="f.additions" class="add">+{{ f.additions }}</span>
                <span v-if="f.deletions" class="del">−{{ f.deletions }}</span>
              </span>
            </div>
          </li>
        </ul>
      </template>

      <footer class="dev-hud__foot">
        <label>
          <input v-model="highlight" type="checkbox" />
          flash edits on load
        </label>
        <span>` to toggle</span>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.dev-hud {
  position: fixed;
  top: 64px;
  right: 0;
  z-index: 9998;
  font-size: 11px;
  line-height: 1.4;
  color: #d4d4d8;
}
@media print { .dev-hud { display: none; } }
.dev-hud__tab {
  position: absolute;
  top: 0;
  right: 100%;
  padding: 4px 6px;
  background: #18181b;
  border: 1px solid #3f3f46;
  border-right: none;
  color: #a1a1aa;
  cursor: pointer;
  border-radius: 3px 0 0 3px;
}
.dev-hud__tab:hover { color: #fafafa; }
.dev-hud__panel {
  width: 280px;
  max-height: calc(100vh - 96px);
  overflow-y: auto;
  background: #0a0a0acc;
  backdrop-filter: blur(6px);
  border: 1px solid #27272a;
  border-right: none;
  border-radius: 4px 0 0 4px;
}
.dev-hud__head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-bottom: 1px solid #27272a;
  position: sticky;
  top: 0;
  background: #0a0a0a;
}
.dev-hud__title { color: #71717a; letter-spacing: 0.08em; font-size: 10px; }
.dev-hud__modes { display: flex; gap: 2px; margin-left: auto; }
.dev-hud__modes button {
  padding: 2px 5px;
  background: transparent;
  border: 1px solid #27272a;
  color: #71717a;
  cursor: pointer;
  font-size: 10px;
}
.dev-hud__modes button.on { color: #fafafa; border-color: #52525b; background: #27272a; }
.dev-hud__refresh {
  background: transparent;
  border: none;
  color: #71717a;
  cursor: pointer;
  font-size: 13px;
}
.dev-hud__refresh:hover { color: #fafafa; }
.dev-hud__error { padding: 8px; color: #f87171; }
.dev-hud__empty { padding: 8px; color: #52525b; }
.dev-hud__list { list-style: none; margin: 0; padding: 2px 0; }
.dev-hud__list li { padding: 1px 4px; }
.dev-hud__list li.current {
  background: #1e3a5f33;
  border-left: 2px solid #3b82f6;
}
.dev-hud__row { display: flex; align-items: center; gap: 5px; }
.dev-hud__badge {
  width: 12px;
  text-align: center;
  font-size: 9px;
  border-radius: 2px;
  color: #18181b;
  flex: none;
}
.dev-hud__badge[data-s='M'] { background: #eab308; }
.dev-hud__badge[data-s='A'] { background: #22c55e; }
.dev-hud__badge[data-s='?'] { background: #22c55e; }
.dev-hud__badge[data-s='D'] { background: #ef4444; }
.dev-hud__badge[data-s='R'] { background: #06b6d4; }
.dev-hud__link {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #d4d4d8;
  text-decoration: none;
}
a.dev-hud__link:hover { color: #fafafa; text-decoration: underline; }
.dev-hud__stat { flex: none; font-size: 10px; }
.dev-hud__stat .add { color: #22c55e; margin-right: 3px; }
.dev-hud__stat .del { color: #ef4444; }
.dev-hud__caret {
  background: transparent;
  border: none;
  color: #52525b;
  cursor: pointer;
  padding: 0 2px;
  flex: none;
}
.dev-hud__diff {
  margin: 2px 0 4px 17px;
  padding: 4px 6px;
  background: #09090b;
  border-left: 1px solid #27272a;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 10px;
  color: #a1a1aa;
}
.dev-hud__diff .add { color: #4ade80; }
.dev-hud__section {
  padding: 6px 8px 2px;
  color: #52525b;
  font-size: 9px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.dev-hud__list--muted .dev-hud__link { color: #71717a; font-size: 10px; }
.dev-hud__foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  border-top: 1px solid #27272a;
  color: #52525b;
  font-size: 10px;
}
.dev-hud__foot label { display: flex; align-items: center; gap: 4px; cursor: pointer; }
</style>

<style>
/* Global (not scoped) so it can target rendered content nodes. */
.dev-changed-flash {
  animation: dev-changed-flash 2.4s ease-out;
  border-radius: 2px;
}
@keyframes dev-changed-flash {
  0% { background: #fde04766; box-shadow: 0 0 0 4px #fde04733; }
  100% { background: transparent; box-shadow: 0 0 0 4px transparent; }
}
</style>
