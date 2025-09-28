<template>
  <div class="layout-with-sidebar">
    <!-- Main content area -->
    <div class="main-content">
      <slot />
    </div>

    <!-- Sidebar teleport portal -->
    <div id="sidebar-portal" class="sidebar-portal" />

    <!-- Global debug grid -->
    <ClientOnly>
      <DebugGrid />
    </ClientOnly>
  </div>
</template>

<script setup>
// Layout provides the teleport target
// Pages teleport their sidebar content here
</script>

<style>
.layout-with-sidebar {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: calc(var(--baseline, 8px) * 4);
  max-width: 1440px;
  margin: 0 auto;
  padding: calc(var(--baseline, 8px) * 3);
  position: relative;
}

.main-content {
  min-width: 0; /* Prevent overflow */
}

.sidebar-portal {
  position: sticky;
  top: calc(var(--baseline, 8px) * 3);
  height: fit-content;
  max-height: calc(100vh - var(--baseline, 8px) * 6);
  overflow-y: auto;
}

/* Hide sidebar on mobile */
@media (max-width: 1024px) {
  .layout-with-sidebar {
    grid-template-columns: 1fr;
  }

  .sidebar-portal {
    display: none;
  }
}

/* Ensure content aligns to baseline grid */
.layout-with-sidebar * {
  margin-top: 0;
  margin-bottom: 0;
}

.layout-with-sidebar p,
.layout-with-sidebar ul,
.layout-with-sidebar ol,
.layout-with-sidebar figure {
  margin-bottom: calc(var(--baseline, 8px) * 3);
}

.layout-with-sidebar h1 {
  font-size: 3rem;
  line-height: calc(var(--baseline, 8px) * 7);
  margin-bottom: calc(var(--baseline, 8px) * 4);
}

.layout-with-sidebar h2 {
  font-size: 2rem;
  line-height: calc(var(--baseline, 8px) * 5);
  margin-top: calc(var(--baseline, 8px) * 5);
  margin-bottom: calc(var(--baseline, 8px) * 3);
}

.layout-with-sidebar h3 {
  font-size: 1.5rem;
  line-height: calc(var(--baseline, 8px) * 4);
  margin-top: calc(var(--baseline, 8px) * 4);
  margin-bottom: calc(var(--baseline, 8px) * 2);
}
</style>
