# Rhythm-Preserving Microvisualizations Guide

## Core Principle: Everything Aligns to the 8px Baseline Grid

### Visual Debug Grid (Cmd+G to toggle)
Shows:
- 8px baseline grid (horizontal blue lines)
- 12-column layout (vertical green)
- Modular scale markers (purple)

### Where Microvisualizations Naturally Fit

#### 1. **Inline Sparklines** (within text flow)
```vue
The project grew <RhythmicSparklines :data="[10,20,45,89]" variant="inline" /> over time.
```
- Height: exactly 8px (1 baseline)
- Sits on text baseline
- No margin disruption

#### 2. **Margin Sparklines** (float right)
```vue
<RhythmicSparklines :data="commits" variant="margin" />
```
- Aligns to x-height of adjacent text
- Width: 60px (7.5 baselines)
- Floats without breaking flow

#### 3. **Header Sparklines** (between title and content)
```vue
<h2>{{ title }}</h2>
<RhythmicSparklines :data="metrics" variant="header" />
```
- Height: 24px (3 baselines)
- Margin: 16px top/bottom (2 baselines)
- Shows grid overlay for alignment verification

#### 4. **Paragraph-End Grids** (full-width break)
```vue
<RhythmicSparklines :data="paragraphWords" variant="paragraph" caption="Word distribution" />
```
- Square grid aligned to baseline
- Caption on baseline below
- Total height: multiple of 8px

#### 5. **List Item Indicators**
```vue
<li>
  <RhythmicSparklines :data="[val]" variant="list" />
  {{ item.text }}
</li>
```
- Replaces/enhances bullet point
- Height: 8px
- Perfect baseline alignment

## Sidebar Teleportation Pattern

### In Your Page Component:
```vue
<template>
  <div>
    <!-- Your content -->

    <!-- Teleport sidebar content -->
    <Teleport to="#sidebar-portal" v-if="mounted">
      <SmartSidebar
        type="projects"
        :items="projects"
      />
    </Teleport>
  </div>
</template>

<script setup>
const mounted = ref(false)
onMounted(() => mounted.value = true)
</script>
```

### In Your Layout:
```vue
<template>
  <div class="layout-with-sidebar">
    <slot /> <!-- Page content -->
    <div id="sidebar-portal" /> <!-- Teleport target -->
  </div>
</template>
```

## Sidebar Types

### Projects List
```vue
<SmartSidebar type="projects" :items="projects" />
```
Shows:
- Project titles
- Year
- Tiny word count sparkline
- Active highlighting on scroll

### Table of Contents
```vue
<SmartSidebar type="toc" :items="headings" />
```
Shows:
- Nested heading hierarchy
- Reading progress bars
- Active section highlighting

### Stats Summary
```vue
<SmartSidebar type="stats" :stats="pageStats" />
```
Shows:
- Word count grid
- Image/link counts
- Reading time
- All aligned to baseline

### Sidenotes Preview
```vue
<SmartSidebar type="sidenotes" :items="footnotes" />
```
Shows:
- All sidenotes in order
- Click to jump
- Preview text

## D3 Scale Integration

### Typography Scales
```js
const fontSize = d3.scalePow()
  .exponent(1.333)  // Perfect fourth
  .domain([0, 8])
  .range([12, 96])

const lineHeight = d3.scaleLinear()
  .domain([12, 96])
  .range([1.8, 1.1])  // Inverse relationship
```

### Sparkline Scales
```js
const colorScale = d3.scaleQuantize()
  .domain([0, maxValue])
  .range(['#dbeafe', '#3b82f6', '#1e40af'])

const sizeScale = d3.scaleSqrt()  // For area perception
  .domain([0, maxValue])
  .range([2, 8])
```

## The Rules

1. **Every element height** = multiple of 8px
2. **Every margin** = multiple of 8px
3. **Sparklines never break text flow**
4. **Sidebars stick to viewport** with `position: sticky`
5. **Teleports render after mount** to avoid SSR issues
6. **Debug grid confirms alignment** (Cmd+G)

## Common Patterns

### Blog Post with Everything
```vue
<template>
  <article>
    <!-- Title -->
    <h1>{{ post.title }}</h1>

    <!-- Header metrics -->
    <RhythmicSparklines
      :data="post.commits"
      variant="header"
    />

    <!-- Content with inline sparklines -->
    <div v-html="post.content" />

    <!-- End-of-post visualization -->
    <RhythmicSparklines
      :data="post.paragraphLengths"
      variant="paragraph"
      caption="Paragraph rhythm"
    />

    <!-- Sidebar -->
    <Teleport to="#sidebar-portal">
      <SmartSidebar type="toc" :items="post.headings" />
    </Teleport>
  </article>
</template>
```

### Project Gallery
```vue
<template>
  <div class="projects">
    <div
      v-for="project in projects"
      :id="project.slug"
      class="project"
    >
      <!-- Sparkline in header -->
      <h2>{{ project.title }}</h2>
      <RhythmicSparklines
        :data="project.activity"
        variant="header"
      />
    </div>

    <!-- Projects list in sidebar -->
    <Teleport to="#sidebar-portal">
      <SmartSidebar type="projects" :items="projects" />
    </Teleport>
  </div>
</template>
```

## Testing Rhythm

1. Press `Cmd+G` to show debug grid
2. Check all text sits on blue baseline lines
3. Verify sparklines align to grid
4. Ensure margins are multiples of 8px
5. Confirm sidebar items align to baseline

## Performance Notes

- Sparklines use SVG (not canvas) for crisp rendering
- D3 only for math, not DOM manipulation
- Teleports prevent unnecessary re-renders
- Sticky positioning is GPU-accelerated
- Grid alignment uses CSS Grid (not flexbox)