<template>
  <div class="root-container">
    <!-- First section - Basic scroll fade -->
    <div class="spacer">
      <div class="spacer-content">
        <h2>Vue + Anime.js v4</h2>
        <p class="text-lg md:text-xl text-zinc-600 dark:text-zinc-400">Scroll-driven animations made easy</p>
      </div>
    </div>

    <div class="scroll-section">
      <div class="scroll-content">
        <h1 id="basic-scroll-animation">Basic Scroll Animation</h1>

        <div class="prose prose-lg dark:prose-invert max-w-none mb-8">
          <p>
            Integrating Anime.js v4 with Vue brings a new level of sophistication to web animations. The library's
            scroll-driven
            animations are particularly powerful, allowing us to create engaging experiences that respond naturally to
            user
            interaction. In this first example, we'll explore a simple yet effective fade-in animation triggered by
            scroll position.
          </p>
          <p>
            The magic happens through Anime.js's <code>onScroll</code> function, which provides precise control over
            when
            and how animations are triggered. By defining enter and leave points relative to the viewport, we can create
            smooth transitions that feel natural and responsive.
          </p>
        </div>

        <div class="code-example">
          <pre><code>// 1. Import the necessary functions
import { animate, onScroll } from '~/anime.esm.js'

// 2. Create a scroll-driven animation
animate('.scroll-content', {
  translateY: ['100px', '0px'],
  opacity: [0, 1],
  duration: 1000,
  ease: 'linear',
  autoplay: onScroll({
    target: '.scroll-content',
    enter: 'bottom-=50 top',
    leave: 'top+=60 bottom',
    sync: 'inOutCirc',
    debug: true
  })
})</code></pre>
        </div>
      </div>
    </div>

    <div class="spacer">
      <div class="spacer-content">
        <h3>Next: SVG Animation</h3>
      </div>
    </div>

    <!-- Second section - SVG Line Chart -->
    <div class="scroll-section dark">
      <div class="scroll-content chart-content">
        <h2 id="animated-line-chart">Animated Line Chart</h2>

        <div class="prose prose-lg dark:prose-invert max-w-none mb-8">
          <p>
            SVG animations showcase the true versatility of Anime.js. By combining Vue's reactivity system with
            Anime.js's
            powerful SVG manipulation capabilities, we can create data visualizations that come to life as users scroll.
            This line chart demonstrates a common yet captivating technique: the path-drawing animation.
          </p>
          <p>
            The animation leverages SVG's <code>strokeDasharray</code> and <code>strokeDashoffset</code> properties,
            creating the illusion of a line being drawn in real-time. When combined with scroll-triggered animations,
            this
            technique becomes particularly effective for storytelling through data.
          </p>
        </div>

        <svg ref="chartSvg" width="600" height="300" class="line-chart">
          <path ref="chartPath" class="line-path" d="M0,200 L100,100 L200,150 L300,80 L400,180 L500,60" fill="none"
            stroke="#FF6B6B" stroke-width="3" />
          <circle v-for="(point, i) in [200, 100, 150, 80, 180, 60]" :key="i" :cx="i * 100" :cy="point" r="6"
            class="data-point" fill="#FF6B6B" />
        </svg>

        <div class="code-example">
          <pre><code>// SVG Path animation with scroll sync
const pathLength = chartPath.value.getTotalLength()
chartPath.value.style.strokeDasharray = pathLength
chartPath.value.style.strokeDashoffset = pathLength

animate(chartPath.value, {
  strokeDashoffset: [pathLength, 0],
  duration: 2000,
  easing: 'easeInOutSine',
  autoplay: onScroll({
    target: '.chart-content',
    enter: 'bottom-=50 top',
    leave: 'top+=60 bottom',
    sync: 'inOutCirc'
  })
})</code></pre>
        </div>
      </div>
    </div>

    <div class="spacer">
      <div class="spacer-content">
        <h3>Finally: Timeline</h3>
      </div>
    </div>

    <!-- Third section - Timeline Animation -->
    <div class="scroll-section coral">
      <div class="scroll-content shapes-content">
        <h2 id="timeline-animation">Timeline Animation</h2>

        <div class="prose prose-lg dark:prose-invert max-w-none mb-8">
          <p>
            Timelines represent the pinnacle of animation orchestration in Anime.js. They allow us to choreograph
            complex
            sequences of animations with precise timing and control. In this example, we'll explore how to create a
            timeline
            that brings multiple shapes to life in a coordinated dance, all triggered by the user's scroll position.
          </p>
          <p>
            The beauty of timeline animations lies in their composability. Using the <code>add()</code> method, we can
            sequence animations with precise timing offsets, creating a cascade of motion that feels both natural and
            intentional. The <code>-=800</code> offset creates a slight overlap between animations, resulting in a
            more fluid and engaging experience.
          </p>
        </div>

        <div class="shapes-container">
          <div class="shape circle"></div>
          <div class="shape square"></div>
          <div class="shape triangle"></div>
        </div>

        <div class="code-example">
          <pre><code>// Timeline with scroll trigger
const timeline = createTimeline({
  defaults: {
    duration: 1000,
    easing: 'linear'  // Linear for smooth scroll sync
  },
  autoplay: onScroll({
    target: '.shapes-content',
    enter: 'bottom-=50 top',
    leave: 'top+=60 bottom',
    sync: 'inOutCirc',  // Sync with scroll position
    debug: true
  })
});

// Add animations to timeline
timeline
  .add('.shapes-container .circle', {
    translateX: ['-100%', '0%'],
    opacity: [0, 1]
  })
  .add('.shapes-container .square', {
    scale: [0, 1],
    rotate: '1turn',
    opacity: [0, 1]
  }, '-=800')
  .add('.shapes-container .triangle', {
    translateY: ['100%', '0%'],
    opacity: [0, 1]
  }, '-=800');

animations.push(timeline);</code></pre>
        </div>
      </div>
    </div>

    <div class="spacer">
      <div class="spacer-content">
        <h3>And for the finale: Animatable Performance</h3>
      </div>
    </div>

    <!-- Fourth section - Animatable Grid -->
    <div class="scroll-section gradient">
      <div class="scroll-content animatable-content">
        <h2 id="animatable-performance">Animatable Performance</h2>

        <div class="prose prose-lg dark:prose-invert max-w-none mb-8">
          <p>
            For scenarios where you need to animate many elements independently and efficiently, Anime.js v4 introduces
            the powerful Animatable API. This example demonstrates how to create smooth, performant animations for
            hundreds of elements responding to hover interactions simultaneously.
          </p>
          <p>
            Using <code>createAnimatable</code> instead of regular animations provides significant performance benefits
            when dealing with frequent value changes, such as hover effects or cursor interactions. Combined with
            d3-scale-chromatic for dynamic color generation, we can create visually stunning effects that remain
            butter-smooth even with many elements.
          </p>
        </div>

        <div class="grid-container">
          <div v-for="i in 100" :key="i" class="grid-item" @mouseover="onGridItemHover(i - 1)"
            @mouseout="onGridItemReset(i - 1)"></div>
        </div>

        <div class="code-example">
          <pre><code>// Create 100 independently animatable elements
const gridItems = Array.from({ length: 100 }).map((_, i) => {
  const item = createAnimatable('.grid-item:nth-child(' + (i + 1) + ')', {
    scale: { duration: 600, ease: 'spring(1, 80, 10, 0)' },
    opacity: { duration: 400 }
  });
  
  // Set initial state
  const el = document.querySelector('.grid-item:nth-child(' + (i + 1) + ')');
  if (el) el.style.background = getRestColor();
  
  return item;
});

// Grid interaction handlers
const onGridItemHover = (index) => {
  const el = document.querySelector('.grid-item:nth-child(' + (index + 1) + ')');
  if (!el) return;
  
  gridItems[index].scale(1.2);
  gridItems[index].opacity(0.8);
  el.style.background = getColor(index);
};

const onGridItemReset = (index) => {
  const el = document.querySelector('.grid-item:nth-child(' + (index + 1) + ')');
  if (!el) return;
  
  gridItems[index].scale(1);
  gridItems[index].opacity(1);
  el.style.background = getRestColor();
};</code></pre>
        </div>
      </div>
    </div>

    <!-- Add teleport for TOC -->
    <teleport to="#nav-toc-container" v-if="tocTarget">
      <div class="toc py-4 px-4 text-sm">
        <h3 class="text-base font-medium mb-4 font-sans tracking-tight">Table of Contents</h3>
        <ul class="space-y-4">
          <li v-for="section in sections" :key="section.id"
            class="transition-colors duration-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 rounded line-clamp-1">
            <a :href="`#${section.id}`"
              class="block px-1 py-0.5 rounded transition-colors font-sans text-sm tracking-tight" :class="[
                activeSection === section.id
                  ? 'text-zinc-900 dark:text-zinc-100 bg-zinc-200/50 dark:bg-zinc-700/50 font-medium'
                  : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-200'
              ]">
              {{ section.text }}
            </a>
          </li>
        </ul>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { animate, createTimeline, onScroll, stagger, createAnimatable } from '~/anime.esm.js';
import { useWindowSize } from '@vueuse/core';
import { interpolateTurbo } from 'd3';

const chartSvg = ref(null);
const chartPath = ref(null);
let animations = [];

// TOC related refs and computed properties
const tocTarget = ref(null);
const headings = ref([]);
const activeSection = ref('');
const { width } = useWindowSize();
const isMobile = computed(() => width.value < 768);

// Sections for the TOC
const sections = [
  { id: 'basic-scroll-animation', text: 'Basic Scroll Animation' },
  { id: 'animated-line-chart', text: 'Animated Line Chart' },
  { id: 'timeline-animation', text: 'Timeline Animation' },
  { id: 'animatable-performance', text: 'Animatable Performance' }
];

// Grid animatables
let gridItems = [];

// Get color for an index between 0-99
const getColor = (index) => {
  const normalizedIndex = index / 99;
  return interpolateTurbo(normalizedIndex);
};

// Get dark or light rest color based on theme
const getRestColor = () => {
  const isDark = document.documentElement.classList.contains('dark');
  return isDark ? '#1e3a8a' : '#3b82f6'; // dark blue in dark mode, lighter blue in light mode
};

onMounted(() => {
  // Initialize TOC target
  tocTarget.value = document.querySelector('#nav-toc-container');

  // Set up intersection observer for headings
  const headingObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activeSection.value = entry.target.id;
        }
      });
    },
    { rootMargin: '-10% 0px -80% 0px', threshold: 0 }
  );

  // Observe all section headings
  nextTick(() => {
    sections.forEach(section => {
      const heading = document.getElementById(section.id);
      if (heading) {
        headingObserver.observe(heading);
      }
    });
  });

  // First section - Basic fade in
  animations.push(
    animate('.scroll-content', {
      translateY: ['100px', '0px'],
      opacity: [0, 1],
      duration: 1000,
      ease: 'linear',
      autoplay: onScroll({
        target: '.scroll-content',
        enter: 'bottom-=50 top',
        leave: 'top+=60 bottom',
        sync: 'inOutCirc',
        // debug: true
      })
    })
  );

  // Second section - SVG Line drawing
  const pathLength = chartPath.value.getTotalLength();
  chartPath.value.style.strokeDasharray = pathLength;
  chartPath.value.style.strokeDashoffset = pathLength;

  animations.push(
    animate(chartPath.value, {
      strokeDashoffset: [pathLength, 0],
      duration: 2000,
      easing: 'easeInOutSine',
      autoplay: onScroll({
        target: '.chart-content',
        enter: 'bottom-=50 top',
        leave: 'top+=60 bottom',
        sync: 'inOutCirc',
        // debug: true
      })
    })
  );

  animations.push(
    animate('.data-point', {
      scale: [0, 1],
      opacity: [0, 1],
      duration: 800,
      delay: stagger(200),
      autoplay: onScroll({
        target: '.chart-content',
        enter: 'bottom-=50 top',
        leave: 'top+=60 bottom',
        sync: 'inOutCirc'
      })
    })
  );

  // Third section - Timeline animation
  const timeline = createTimeline({
    defaults: {
      duration: 1000,
      easing: 'linear'  // Linear for smooth scroll sync
    },
    autoplay: onScroll({
      target: '.shapes-content',
      enter: 'bottom-=50 top',
      leave: 'top+=60 bottom',
      sync: 'inOutCirc',  // Sync with scroll position
      // debug: true
    })
  });

  // Add animations to timeline
  timeline
    .add('.shapes-container .circle', {
      translateX: ['-100%', '0%'],
      opacity: [0, 1]
    })
    .add('.shapes-container .square', {
      scale: [0, 1],
      rotate: '1turn',
      opacity: [0, 1]
    }, '-=800')
    .add('.shapes-container .triangle', {
      translateY: ['100%', '0%'],
      opacity: [0, 1]
    }, '-=800');

  animations.push(timeline);

  // Initialize grid animatables
  gridItems = Array.from({ length: 100 }).map((_, i) => {
    const item = createAnimatable('.grid-item:nth-child(' + (i + 1) + ')', {
      scale: { duration: 600, ease: 'spring(1, 80, 10, 0)' },
      opacity: { duration: 400 }
    });

    // Set initial state
    const el = document.querySelector('.grid-item:nth-child(' + (i + 1) + ')');
    if (el) el.style.background = getRestColor();

    return item;
  });
});

// Grid interaction handlers
const onGridItemHover = (index) => {
  const el = document.querySelector('.grid-item:nth-child(' + (index + 1) + ')');
  if (!el) return;

  gridItems[index].scale(1.2);
  gridItems[index].opacity(0.8);
  el.style.background = getColor(index);
};

const onGridItemReset = (index) => {
  const el = document.querySelector('.grid-item:nth-child(' + (index + 1) + ')');
  if (!el) return;

  gridItems[index].scale(1);
  gridItems[index].opacity(1);
  el.style.background = getRestColor();
};

onUnmounted(() => {
  animations.forEach(anim => anim?.revert());
  gridItems.forEach(item => item?.revert());
});
</script>

<style scoped>
.root-container {
  min-height: 500vh;
  width: 100%;
}

.spacer {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spacer-content {
  text-align: center;
  opacity: 0.5;
}

.scroll-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  padding: 2rem 0;
}

.scroll-section.dark {
  background: #2a2a2a;
  color: white;
}

.scroll-section.coral {
  background: #FF6B6B;
  color: white;
}

.scroll-section.gradient {
  background: linear-gradient(135deg, #FF6B6B, #4ECDC4);
  color: white;
}

.scroll-content {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 2em;
  background: white;
  transform: translateY(100px);
  opacity: 0;
  text-align: left;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.chart-content {
  background: rgba(255, 255, 255, 0.05);
  color: white;
}

.shapes-content {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.animatable-content {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.line-chart {
  margin: 2em auto;
  display: block;
  max-width: 100%;
  height: auto;
}

.shapes-container {
  display: flex;
  gap: 2em;
  margin: 2em;
  justify-content: center;
}

.shape {
  width: 60px;
  height: 60px;
  background: white;
}

.circle {
  border-radius: 50%;
}

.square {
  border-radius: 4px;
}

.triangle {
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
}

.data-point {
  opacity: 0;
  transform-origin: center;
  transform: scale(0);
}

.code-example {
  margin-top: 2em;
  text-align: left;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 8px;
  overflow: hidden;
}

.code-example pre {
  margin: 0;
  padding: 1.5em;
  overflow-x: auto;
  font-size: 0.9em;
  line-height: 1.5;
}

.code-example code {
  font-family: 'SF Mono', Menlo, Monaco, Consolas, monospace;
  color: #e4e4e4;
}

.dark .code-example {
  background: rgba(0, 0, 0, 0.5);
}

.coral .code-example {
  background: rgba(0, 0, 0, 0.2);
}

/* Prose Styles */
.prose {
  font-size: 1.125rem;
  line-height: 1.75;
}

.prose code {
  background: rgba(0, 0, 0, 0.1);
  padding: 0.2em 0.4em;
  border-radius: 0.25em;
  font-size: 0.875em;
  font-weight: 500;
}

.dark .prose code {
  background: rgba(255, 255, 255, 0.1);
}

/* TOC Styles */
.toc {
  @apply py-4 px-4;
}

.toc h3 {
  @apply text-zinc-800 dark:text-zinc-200 font-medium mb-4;
}

.toc ul {
  @apply pl-0 space-y-4;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .scroll-content {
    margin: 1rem;
    padding: 1.5rem;
  }

  .prose {
    font-size: 1rem;
  }

  .shapes-container {
    gap: 1em;
  }

  .shape {
    width: 40px;
    height: 40px;
  }

  .grid-container {
    grid-template-columns: repeat(auto-fit, minmax(30px, 1fr));
    gap: 4px;
    padding: 1em;
  }
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(40px, 1fr));
  gap: 8px;
  padding: 2em;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  max-width: 600px;
  margin: 2em auto;
}

.grid-item {
  aspect-ratio: 1;
  border-radius: 4px;
  cursor: pointer;
  will-change: transform, opacity, background;
}
</style>