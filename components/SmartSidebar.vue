<template>
  <aside class="smart-sidebar" :class="{ collapsed, floating }">
    <!-- Toggle button -->
    <button
      class="sidebar-toggle"
      :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      @click="collapsed = !collapsed"
    >
      {{ collapsed ? '→' : '←' }}
    </button>

    <!-- Sidebar content -->
    <div class="sidebar-content">
      <!-- Project list -->
      <nav v-if="type === 'projects'" class="project-nav">
        <h3 class="sidebar-title">PROJECTS</h3>
        <div class="nav-sparkline">
          <RhythmicSparklines
            :data="projectSizes"
            variant="header"
            :baseline="8"
          />
        </div>
        <ul class="project-list">
          <li
            v-for="project in projects"
            :key="project.slug"
            class="project-item"
            :class="{ active: activeId === project.slug }"
          >
            <a
              :href="`#${project.slug}`"
              class="project-link"
              @click="scrollToProject(project.slug)"
            >
              <span class="project-indicator">
                <svg width="16" height="8" class="project-spark">
                  <rect
                    v-for="i in Math.ceil(project.wordCount / 500)"
                    :key="i"
                    :x="i * 3"
                    y="2"
                    width="2"
                    height="4"
                    fill="currentColor"
                    :opacity="0.3 + i * 0.1"
                  />
                </svg>
              </span>
              <span class="project-name">{{ project.title }}</span>
              <span class="project-meta">{{ project.year }}</span>
            </a>
          </li>
        </ul>
      </nav>

      <!-- Table of Contents -->
      <nav v-else-if="type === 'toc'" class="toc-nav">
        <h3 class="sidebar-title">CONTENTS</h3>
        <ul class="toc-list">
          <li
            v-for="item in toc"
            :key="item.slug"
            :class="[`toc-${item.level}`, { active: activeId === item.slug }]"
          >
            <a
              :href="`#${item.slug}`"
              class="toc-link"
              @click="scrollToHeading(item.slug)"
            >
              <span
                class="toc-progress"
                :style="{ width: `${item.progress}%` }"
              />
              <span class="toc-text">{{ item.text }}</span>
            </a>
          </li>
        </ul>
      </nav>

      <!-- Stats summary -->
      <div v-else-if="type === 'stats'" class="stats-sidebar">
        <h3 class="sidebar-title">PAGE METRICS</h3>
        <div class="stat-grid">
          <div class="stat-item">
            <RhythmicSparklines
              :data="wordDistribution"
              variant="paragraph"
              :baseline="4"
              caption="Word density"
            />
          </div>
          <div class="stat-item">
            <span class="stat-label">WORDS</span>
            <span class="stat-value">{{ stats.words }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">IMAGES</span>
            <span class="stat-value">{{ stats.images }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">LINKS</span>
            <span class="stat-value">{{ stats.links }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">READ TIME</span>
            <span class="stat-value">{{ stats.readTime }}m</span>
          </div>
        </div>
      </div>

      <!-- Sidenotes preview -->
      <div v-else-if="type === 'sidenotes'" class="sidenotes-sidebar">
        <h3 class="sidebar-title">NOTES</h3>
        <div
          v-for="(note, i) in sidenotes"
          :key="i"
          class="sidenote-preview"
          @click="scrollToNote(note.ref)"
        >
          <sup>{{ i + 1 }}</sup>
          <span>{{ note.preview }}</span>
        </div>
      </div>

      <!-- Default slot for custom content -->
      <slot v-else />
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
  type: {
    type: String,
    default: 'toc',
    validator: (v) =>
      ['projects', 'toc', 'stats', 'sidenotes', 'custom'].includes(v)
  },
  items: {
    type: Array,
    default: () => []
  },
  stats: {
    type: Object,
    default: () => ({})
  },
  floating: {
    type: Boolean,
    default: false
  }
})

const collapsed = ref(false)
const activeId = ref(null)
const scrollProgress = ref({})

// Projects specific
const projects = computed(() => {
  if (props.type !== 'projects') return []
  return props.items.map((p) => ({
    ...p,
    wordCount: p.wordCount || Math.random() * 3000
  }))
})

const projectSizes = computed(() => projects.value.map((p) => p.wordCount))

// TOC specific
const toc = computed(() => {
  if (props.type !== 'toc') return []
  return props.items.map((item) => ({
    ...item,
    progress: scrollProgress.value[item.slug] || 0
  }))
})

// Stats specific
const wordDistribution = computed(() => {
  if (props.type !== 'stats') return []
  // Mock distribution - replace with actual paragraph word counts
  return d3.range(16).map(() => Math.random() * 100 + 50)
})

// Sidenotes specific
const sidenotes = computed(() => {
  if (props.type !== 'sidenotes') return []
  return props.items.map((note) => ({
    ...note,
    preview: note.content.slice(0, 50) + '...'
  }))
})

// Smooth scroll to element
const scrollToElement = (id) => {
  const el = document.getElementById(id)
  if (!el) return

  el.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  })

  activeId.value = id
}

const scrollToProject = (slug) => scrollToElement(slug)
const scrollToHeading = (slug) => scrollToElement(slug)
const scrollToNote = (ref) => scrollToElement(ref)

// Track scroll progress for TOC
const updateScrollProgress = () => {
  if (props.type !== 'toc') return

  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
  const progress = {}

  headings.forEach((heading) => {
    const rect = heading.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const scrolled = Math.max(
      0,
      Math.min(1, (viewportHeight - rect.top) / viewportHeight)
    )
    progress[heading.id] = scrolled * 100
  })

  scrollProgress.value = progress
}

// Intersection observer for active section
let observer

onMounted(() => {
  if (props.type === 'toc' || props.type === 'projects') {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            activeId.value = entry.target.id
          }
        })
      },
      {
        rootMargin: '-20% 0px -70% 0px'
      }
    )

    // Observe all headings or project sections
    const targets =
      props.type === 'toc'
        ? document.querySelectorAll('h1, h2, h3, h4, h5, h6')
        : document.querySelectorAll('.project-section')

    targets.forEach((target) => observer.observe(target))
  }

  // Scroll tracking
  if (props.type === 'toc') {
    window.addEventListener('scroll', updateScrollProgress, { passive: true })
    updateScrollProgress()
  }
})

onUnmounted(() => {
  if (observer) observer.disconnect()
  window.removeEventListener('scroll', updateScrollProgress)
})
</script>

<style scoped>
.smart-sidebar {
  position: sticky;
  top: calc(var(--baseline, 8px) * 3);
  height: calc(100vh - var(--baseline, 8px) * 6);
  width: 240px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.smart-sidebar.collapsed {
  width: 40px;
}

.smart-sidebar.floating {
  position: fixed;
  right: 20px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #e4e4e7;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dark .smart-sidebar.floating {
  background: rgba(0, 0, 0, 0.95);
  border-color: #3f3f46;
}

.sidebar-toggle {
  position: absolute;
  left: -20px;
  top: 0;
  width: 20px;
  height: 32px;
  background: currentColor;
  color: white;
  border: none;
  cursor: pointer;
  font-family: monospace;
  opacity: 0.15;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 0 2px 2px 0;
}

.sidebar-toggle:hover {
  opacity: 0.3;
  transform: scale(1.05);
}

.sidebar-content {
  padding: calc(var(--baseline, 8px) * 2);
  overflow-y: auto;
  height: 100%;
  opacity: 1;
  transition: opacity 0.3s;
}

.collapsed .sidebar-content {
  opacity: 0;
  pointer-events: none;
}

/* Typography aligned to grid */
.sidebar-title {
  font-size: 10px;
  line-height: var(--baseline, 8px);
  letter-spacing: 0.2em;
  color: #71717a;
  margin-bottom: var(--baseline, 8px);
  font-weight: 500;
}

/* Project navigation */
.project-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.project-item {
  margin-bottom: var(--baseline, 8px);
}

.project-link {
  display: grid;
  grid-template-columns: 20px 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  color: #71717a;
  text-decoration: none;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 2px;
}

.project-link:hover {
  color: #18181b;
  transform: translateX(3px) scale(1.02);
  background-color: rgba(0, 0, 0, 0.02);
}

.dark .project-link:hover {
  color: #fafafa;
  background-color: rgba(255, 255, 255, 0.03);
}

.project-item.active .project-link {
  color: #52525b;
  background-color: rgba(0, 0, 0, 0.04);
  transform: translateX(2px);
}

.dark .project-item.active .project-link {
  color: #a1a1aa;
  background-color: rgba(255, 255, 255, 0.06);
}

.project-spark {
  vertical-align: middle;
}

.project-name {
  font-size: 12px;
  line-height: var(--baseline, 8px);
}

.project-meta {
  font-size: 10px;
  opacity: 0.5;
  font-variant-numeric: tabular-nums;
}

/* Table of contents */
.toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.toc-h1 {
  padding-left: 0;
}
.toc-h2 {
  padding-left: calc(var(--baseline, 8px) * 2);
}
.toc-h3 {
  padding-left: calc(var(--baseline, 8px) * 4);
}

.toc-link {
  display: block;
  position: relative;
  padding: 6px 8px 6px 0;
  color: #71717a;
  text-decoration: none;
  font-size: 12px;
  line-height: calc(var(--baseline, 8px) * 2);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 2px;
}

.toc-link:hover {
  color: #18181b;
  transform: translateX(2px);
  background-color: rgba(0, 0, 0, 0.02);
}

.dark .toc-link:hover {
  color: #fafafa;
  background-color: rgba(255, 255, 255, 0.03);
}

.toc-progress {
  position: absolute;
  left: -6px;
  top: 0;
  bottom: 0;
  width: 0;
  background: #71717a;
  opacity: 0;
  transition: all 0.2s ease;
}

.active .toc-progress {
  width: 2px;
  opacity: 0.4;
}

.dark .toc-progress {
  background: #a1a1aa;
}

.active .toc-link {
  color: #52525b;
  background-color: rgba(0, 0, 0, 0.03);
}

.dark .active .toc-link {
  color: #a1a1aa;
  background-color: rgba(255, 255, 255, 0.05);
}

/* Stats grid */
.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: calc(var(--baseline, 8px) * 2);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 9px;
  letter-spacing: 0.15em;
  color: #71717a;
}

.stat-value {
  font-size: 16px;
  font-variant-numeric: tabular-nums;
  font-weight: 300;
}

/* Sidenotes preview */
.sidenote-preview {
  margin-bottom: calc(var(--baseline, 8px) * 2);
  padding: 6px 4px;
  cursor: pointer;
  font-size: 11px;
  line-height: calc(var(--baseline, 8px) * 2);
  color: #71717a;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 2px;
}

.sidenote-preview:hover {
  background: rgba(0, 0, 0, 0.03);
  transform: translateX(2px) scale(1.01);
  color: #52525b;
}

.dark .sidenote-preview:hover {
  background: rgba(255, 255, 255, 0.04);
  color: #a1a1aa;
}

.sidenote-preview sup {
  color: #71717a;
  margin-right: 4px;
  font-weight: 500;
  transition: color 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidenote-preview:hover sup {
  color: #52525b;
}

.dark .sidenote-preview:hover sup {
  color: #a1a1aa;
}

/* Rhythm sparkline integration */
.nav-sparkline {
  margin: calc(var(--baseline, 8px) * 2) 0;
  opacity: 0.5;
}
</style>
