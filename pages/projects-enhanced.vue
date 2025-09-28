<template>
  <div class="projects-page">
    <!-- Debug grid overlay (Cmd+G to toggle) -->
    <DebugGrid />

    <!-- Main content -->
    <main class="projects-content">
      <article
        v-for="project in projects"
        :key="project.slug"
        :id="project.slug"
        class="project-section"
      >
        <!-- Inline rhythm sparklines -->
        <header class="project-header">
          <h2>{{ project.title }}</h2>
          <RhythmicSparklines
            :data="project.commits || randomData()"
            variant="header"
          />
        </header>

        <!-- Margin sparkline for file counts -->
        <RhythmicSparklines
          v-if="project.files"
          :data="project.files"
          variant="margin"
        />

        <div v-html="project.content" />

        <!-- Paragraph-end visualization -->
        <RhythmicSparklines
          v-if="project.metrics"
          :data="project.metrics"
          variant="paragraph"
          :caption="`${project.metrics.length} metrics tracked`"
        />
      </article>
    </main>

    <!-- Teleport sidebar content -->
    <Teleport to="#sidebar-portal" v-if="mounted">
      <SmartSidebar type="projects" :items="projectsWithMeta" />
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Mock data - replace with actual
const projects = ref([
  {
    slug: 'coach-artie',
    title: 'Coach Artie',
    year: 2023,
    wordCount: 2500,
    content: '<p>AI coaching system...</p>',
    commits: [12, 45, 23, 67, 34, 89, 45],
    files: [10, 20, 15, 25, 30],
    metrics: [100, 200, 150, 300, 250, 400]
  },
  {
    slug: 'morning-radio',
    title: 'Morning Radio',
    year: 2024,
    wordCount: 1800,
    content: '<p>Automated radio show...</p>',
    commits: [5, 10, 8, 12, 15, 20],
    files: [5, 8, 10, 12],
    metrics: [50, 75, 100, 125, 150]
  }
])

const projectsWithMeta = computed(() =>
  projects.value.map((p) => ({
    ...p,
    sparkData: p.commits || []
  }))
)

const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})

// Helper for demo data
const randomData = () => Array.from({ length: 7 }, () => Math.random() * 100)
</script>

<style scoped>
.projects-page {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 2rem;
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
}

@media (max-width: 1024px) {
  .projects-page {
    grid-template-columns: 1fr;
  }
}

.project-section {
  margin-bottom: calc(var(--baseline, 8px) * 8);
  scroll-margin-top: calc(var(--baseline, 8px) * 4);
}

.project-header {
  margin-bottom: calc(var(--baseline, 8px) * 3);
}

.project-header h2 {
  font-size: 2rem;
  line-height: calc(var(--baseline, 8px) * 5);
  margin: 0;
}
</style>
