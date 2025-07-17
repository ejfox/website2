<template>
  <div class="root-container">
    <!-- Subtle animated background element -->
    <div class="background-gradient"></div>

    <!-- First section - Basic scroll fade -->
    <div class="spacer">
      <div class="spacer-content">
        <h2>Vue + Anime.js v4</h2>
        <p class="text-lg md:text-xl text-zinc-600 dark:text-zinc-400">
          Unleashing the Power of Modern Web Animation
        </p>
        <p class="mt-4 text-base text-zinc-500 dark:text-zinc-500">
          A deep dive into creating fluid, responsive
          animations that bring your Vue applications to life
        </p>
      </div>
    </div>

    <div class="scroll-section">
      <div class="scroll-content">
        <h1 id="basic-scroll-animation">
          Basic Scroll Animation
        </h1>

        <div class="prose prose-lg dark:prose-invert max-w-none mb-8">
          <div class="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 class="text-lg font-semibold mb-2">
              🎯 What you'll learn
            </h3>
            <ul class="list-disc list-inside space-y-1">
              <li>How to seamlessly integrate Anime.js v4 with Vue's reactivity system</li>
              <li>Creating scroll-driven animations that respond naturally to user interaction</li>
              <li>Mastering the powerful <code>onScroll</code> API for precise animation control</li>
            </ul>
          </div>

          <p class="text-lg leading-relaxed">
            The marriage of Vue and Anime.js v4 opens up a world of possibilities for creating engaging web experiences.
            In this guide, we'll explore how to craft animations that feel natural, responsive, and delightful to use.
          </p>

          <div class="my-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <h4 class="font-semibold mb-2">
              💡 Key Concept: Scroll-Driven Animation
            </h4>
            <p>
              Anime.js's <code>onScroll</code> function is your gateway to creating scroll-responsive animations.
              It provides granular control over:
            </p>
            <ul class="mt-2 list-disc list-inside space-y-1">
              <li><code>enter</code>: When the animation should start</li>
              <li><code>leave</code>: When the animation should reverse</li>
              <li><code>sync</code>: How the animation should progress with scroll position</li>
            </ul>
          </div>

          <p>
            Let's start with a simple yet powerful example: a fade-in animation that responds to scroll position.
            This pattern forms the foundation for more complex scroll-driven experiences.
          </p>
        </div>

        <div class="code-example">
          <div class="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
            <span class="text-sm font-medium">Basic Scroll Animation</span>
          </div>
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
    enter: 'bottom-=50 top',    // Start when element bottom is 50px from viewport top
    leave: 'top+=60 bottom',    // Reverse when element top is 60px from viewport bottom
    sync: 'inOutCirc',          // Smooth easing for scroll sync
    debug: true                 // Helpful for visualizing trigger points
  })
})</code></pre>
          <div class="p-4 bg-green-50 dark:bg-green-900/20 text-sm">
            <p class="font-medium">
              🚀 Try This:
            </p>
            <p class="mt-1">
              Experiment with different <code>enter</code> and <code>leave</code> points to create various
              scroll effects:
            </p>
            <ul class="mt-2 list-disc list-inside space-y-1">
              <li>Use <code>center center</code> for center-aligned triggers</li>
              <li>Add offsets like <code>top+=100</code> for earlier/later activation</li>
              <li>Combine with Vue refs for dynamic targeting</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div class="spacer">
      <div class="spacer-content">
        <h3>Next: Bringing Data to Life</h3>
        <p class="mt-2 text-sm text-zinc-500">
          Discover how to animate SVG charts for engaging data visualization
        </p>
      </div>
    </div>

    <!-- Second section - SVG Line Chart -->
    <div class="scroll-section dark">
      <div class="scroll-content chart-content">
        <h2 id="animated-line-chart">
          Animated Line Chart
        </h2>

        <div class="prose prose-lg dark:prose-invert max-w-none mb-8">
          <div class="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 class="text-lg font-semibold mb-2">
              🎨 Animation + Data Visualization
            </h3>
            <p class="mb-2">
              Discover how to combine Vue's reactivity with Anime.js's SVG capabilities to create
              engaging data visualizations that tell a story through motion.
            </p>
            <ul class="list-disc list-inside space-y-1">
              <li>Master SVG path animations for line charts</li>
              <li>Synchronize animations with scroll position</li>
              <li>Add delightful data point reveals</li>
            </ul>
          </div>

          <div class="my-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <h4 class="font-semibold mb-2">
              💡 Key Technique: The Line Drawing Effect
            </h4>
            <p>
              The magic behind the line drawing animation lies in two powerful SVG properties:
            </p>
            <ul class="mt-2 space-y-2">
              <li>
                <code>strokeDasharray</code>: Defines the pattern of dashes and gaps
                <div class="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Set to the total path length to create a continuous line
                </div>
              </li>
              <li>
                <code>strokeDashoffset</code>: Controls the starting point of the dash pattern
                <div class="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Animate from path length to 0 to create the drawing effect
                </div>
              </li>
            </ul>
          </div>

          <p class="text-lg leading-relaxed">
            Below, we'll create a line chart that draws itself as the user scrolls, with data points that
            fade in sequentially. This technique is perfect for presenting data in an engaging,
            story-driven way.
          </p>
        </div>

        <svg ref="chartSvg" width="600" height="500" class="line-chart">
          <path
            ref="chartPath" class="line-path" d="M0,350 L100,175 L200,250 L300,130 L400,300 L500,100" fill="none"
            stroke="#FF6B6B" stroke-width="3"
          />
          <circle
            v-for="(point, i) in [350, 175, 250, 130, 300, 100]" :key="i" :cx="i * 100" :cy="point" r="6"
            class="data-point" fill="#FF6B6B"
          />
        </svg>

        <div class="code-example">
          <div class="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
            <span class="text-sm font-medium">SVG Path Animation with Scroll Sync</span>
          </div>
          <pre><code>// 1. Calculate the total path length
const pathLength = chartPath.value.getTotalLength()

// 2. Set up the initial state
chartPath.value.style.strokeDasharray = pathLength   // Creates a dash the size of the path
chartPath.value.style.strokeDashoffset = pathLength  // Offsets the dash to hide the line

// 3. Create the drawing animation
animate(chartPath.value, {
  strokeDashoffset: [pathLength, 0],    // Animate from hidden to fully drawn
  duration: 2000,
  easing: 'easeInOutSine',             // Smooth easing for natural motion
  autoplay: onScroll({
    target: '.chart-content',
    enter: 'bottom-=50 top',           // Start drawing before fully in view
    leave: 'top+=60 bottom',           // Reverse when scrolling out
    sync: 'inOutCirc'                  // Smooth scroll synchronization
  })
})</code></pre>
          <div class="p-4 bg-green-50 dark:bg-green-900/20 text-sm">
            <p class="font-medium">
              🚀 Enhancement Ideas:
            </p>
            <ul class="mt-2 list-disc list-inside space-y-1">
              <li>Add tooltips that appear as each data point is revealed</li>
              <li>Animate the line color or thickness based on data values</li>
              <li>Create multiple lines with staggered animations</li>
              <li>Add axis labels that fade in after the line completes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div class="spacer">
      <div class="spacer-content">
        <h3>Next: High-Performance Grid Animations</h3>
        <p class="mt-2 text-sm text-zinc-500">
          Learn how to animate hundreds of elements smoothly with the Animatable API
        </p>
      </div>
    </div>

    <!-- Fourth section - Animatable Grid -->
    <div class="scroll-section gradient">
      <div class="scroll-content animatable-content">
        <h2 id="animatable-performance">
          Animatable Performance
        </h2>

        <div class="prose prose-lg dark:prose-invert max-w-none mb-8">
          <p>
            For scenarios where you need to animate many elements independently and efficiently, Anime.js v4 introduces
            the powerful Animatable API. This example demonstrates how to create smooth, performant animations for
            elements responding to hover interactions.
          </p>
          <p>
            Using <code>createAnimatable</code> instead of regular animations provides significant performance benefits
            when dealing with frequent value changes, such as hover effects or cursor interactions.
          </p>
        </div>

        <div class="grid-container">
          <div
            v-for="i in 25" :key="i" class="grid-item" @mouseover="onGridItemHover(i - 1)"
            @mouseout="onGridItemReset(i - 1)"
          ></div>
        </div>

        <div class="code-example">
          <pre><code>// Create 25 independently animatable elements
const gridItems = Array.from({ length: 25 }).map((_, i) => {
  const selector = `.grid-item:nth-child(${i + 1})`;
  
  // Create animatable with optimized properties
  const item = createAnimatable(selector, {
    scale: { 
      duration: 400,
      ease: 'spring(1, 80, 10, 0)'  // Natural spring motion
    },
    backgroundColor: {
      duration: 600,
      ease: 'easeOutQuad'
    }
  });

  // Set initial state
  const el = document.querySelector(selector);
  if (el) {
    el.style.backgroundColor = '#e2e8f0';  // Light gray
    el.style.transform = 'scale(1)';
  }

  return item;
});

// Simple hover handlers
const onGridItemHover = (index) => {
  if (index &lt; 0 || index &gt;= gridItems.length || !gridItems[index]) return;
  
  gridItems[index].scale(1.2);  // Scale up
  gridItems[index].backgroundColor('#60a5fa');  // Bright blue
};

const onGridItemReset = (index) => {
  if (index &lt; 0 || index &gt;= gridItems.length || !gridItems[index]) return;
  
  gridItems[index].scale(1);  // Reset scale
  gridItems[index].backgroundColor('#e2e8f0');  // Reset color
};</code></pre>
        </div>
      </div>
    </div>

    <div class="spacer">
      <div class="spacer-content">
        <h3>3D Parallax Scrolling</h3>
      </div>
    </div>

    <!-- Fifth section - 3D Parallax -->
    <div class="scroll-section dark-blue">
      <div class="scroll-content parallax-content">
        <h2 id="parallax-3d">
          3D Parallax Scrolling
        </h2>

        <div class="prose prose-lg dark:prose-invert max-w-none mb-8">
          <p>
            3D parallax effects create an immersive depth perception as users scroll. By combining Anime.js's scroll
            features with CSS 3D transforms, we can create layered elements that move at different speeds, creating
            a rich spatial experience that responds to user interaction.
          </p>
          <p>
            The key to convincing parallax is varying the speed and direction of movement across multiple layers.
            Elements further "back" should move slower than those in the foreground, mimicking real-world physics.
            Adding subtle rotations enhances the three-dimensional effect.
          </p>
        </div>

        <div class="parallax-scene">
          <div class="parallax-layer back"></div>
          <div class="parallax-layer middle"></div>
          <div class="parallax-layer front"></div>
        </div>

        <div class="code-example">
          <pre><code>// 3D Parallax with scroll sync
animate('.parallax-layer.back', {
  translateY: [-20, 20],
  rotateX: [-2, 2],
  autoplay: onScroll({
    target: '.parallax-content',
    enter: 'bottom top',
    leave: 'top bottom',
    sync: 'inOutSine'
  })
})

animate('.parallax-layer.middle', {
  translateY: [-40, 40],
  translateX: [-10, 10],
  rotateZ: [-1, 1],
  autoplay: onScroll({
    target: '.parallax-content',
    enter: 'bottom top',
    leave: 'top bottom',
    sync: 'inOutSine'
  })
})

animate('.parallax-layer.front', {
  translateY: [-60, 60],
  translateX: [-20, 20],
  rotateY: [-3, 3],
  scale: [0.95, 1.05],
  autoplay: onScroll({
    target: '.parallax-content',
    enter: 'bottom top',
    leave: 'top bottom',
    sync: 'inOutSine'
  })
})</code></pre>
        </div>
      </div>
    </div>

    <div class="spacer">
      <div class="spacer-content">
        <h3>Interactive 3D Card</h3>
      </div>
    </div>

    <!-- Sixth section - 3D Card -->
    <div class="scroll-section dark-green">
      <div class="scroll-content card3d-content">
        <h2 id="3d-card">
          Interactive 3D Card
        </h2>

        <div class="prose prose-lg dark:prose-invert max-w-none mb-8">
          <p>
            Interactive 3D cards create a tactile feel to web interfaces. Using CSS 3D transforms with mouse tracking,
            we can create elements that respond to cursor movement with realistic perspective shifts. The effect
            creates a sense that users are manipulating a physical object in 3D space.
          </p>
          <p>
            The magic happens through event listeners tracking the cursor's position over the card. These coordinates
            are then transformed into rotation values, creating a tilt effect that follows the user's mouse. The subtle
            parallax movement of inner elements enhances the depth perception.
          </p>
        </div>

        <div class="card3d-container">
          <div ref="card3dEl" class="card3d">
            <div class="card3d-content">
              <div class="card3d-title">
                3D PERSPECTIVE
              </div>
              <div class="card3d-shine"></div>
              <div class="card3d-badge">
                CSS3 + ANIME.JS
              </div>
            </div>
          </div>
        </div>

        <div class="code-example">
          <pre><code>// Interactive 3D Card with mouse tracking
const card3dEl = ref(null)
let card3dAnimatable = null

onMounted(() => {
  // Create animatable for smooth value updates
  card3dAnimatable = createAnimatable(card3dEl.value, {
    rotateX: { duration: 400, ease: 'spring(0.8, 90, 10, 0)' },
    rotateY: { duration: 400, ease: 'spring(0.8, 90, 10, 0)' },
    translateZ: { duration: 400, ease: 'spring(1, 90, 8, 0)' }
  })
  
  // Default state
  card3dAnimatable.rotateX(0)
  card3dAnimatable.rotateY(0)
  card3dAnimatable.translateZ(0)
})

// Track mouse position and update card rotation
const handleCardMove = (e) => {
  if (!card3dEl.value || !card3dAnimatable) return
  
  const rect = card3dEl.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  // Convert position to rotation degrees (-15 to 15)
  const rotX = 15 - (y / rect.height * 30)
  const rotY = (x / rect.width * 30) - 15
  
  card3dAnimatable.rotateX(rotX)
  card3dAnimatable.rotateY(rotY)
  card3dAnimatable.translateZ(10)
}

const handleCardLeave = () => {
  if (!card3dAnimatable) return
  
  card3dAnimatable.rotateX(0)
  card3dAnimatable.rotateY(0)
  card3dAnimatable.translateZ(0)
}</code></pre>
        </div>
      </div>
    </div>

    <!-- Add teleport for TOC -->
    <teleport v-if="tocTarget" to="#nav-toc-container">
      <div class="toc py-4 px-4 text-sm">
        <h3 class="text-base font-medium mb-4 sans-serif tracking-tight">
          Table of Contents
        </h3>
        <ul class="space-y-4">
          <li
            v-for="section in sections" :key="section.id"
            class="transition-colors duration-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 rounded line-clamp-1"
          >
            <a
              :href="`#${section.id}`"
              class="block px-1 py-0.5 rounded transition-colors sans-serif text-sm tracking-tight" :class="[
                activeSection === section.id
                  ? 'text-zinc-900 dark:text-zinc-100 bg-zinc-200/50 dark:bg-zinc-700/50 font-medium'
                  : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-200'
              ]"
            >
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
import { interpolateTurbo } from 'd3-scale-chromatic';
import { interpolateHslLong } from 'd3-interpolate';

// Master list for cleanup
const animations = [];
let headingObserver = null;
let gridItems = []; // For animatable grid elements
let card3dAnimatable = null; // For 3D card interaction

// --- Refs ---
const chartSvg = ref(null);
const chartPath = ref(null);
const card3dEl = ref(null); // Ref for the 3D card element

// --- Reactive State ---
const activeSection = ref('');
const tocTarget = ref(null);
const { width } = useWindowSize();
const isMobile = computed(() => width.value < 768);

// --- Static Data ---
const sections = [
  { id: 'basic-scroll-animation', text: 'Basic Scroll Animation' },
  { id: 'animated-line-chart', text: 'Animated Line Chart' },
  { id: 'animatable-performance', text: 'Animatable Performance' },
  { id: 'parallax-3d', text: '3D Parallax Scrolling' },
  { id: '3d-card', text: 'Interactive 3D Card' },
  { id: 'text-effects', text: 'Text Scramble Effect' },
  { id: 'springy-scroll', text: 'Springy Scroll Animation' }
];

// --- Setup Functions ---

function setupTableOfContentsObserver() {
  headingObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activeSection.value = entry.target.id;
        }
      });
    },
    { rootMargin: '-10% 0px -80% 0px', threshold: 0 }
  );

  sections.forEach(section => {
    const heading = document.getElementById(section.id);
    if (heading) {
      headingObserver.observe(heading);
    }
  });
}

function setupBasicScrollAnimation() {
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
}

function setupSVGChartAnimation() {
  if (!chartPath.value) return; // Guard against missing element

  // Setup the drawing animation
  animations.push(
    animate(chartPath.value, {
      strokeDashoffset: [1000, 0],
      duration: 2000,
      easing: 'easeInOutSine',
      autoplay: onScroll({
        target: '.chart-content',
        enter: 'bottom-=50 top',
        leave: 'top+=60 bottom',
        sync: 'inOutCirc'
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
}

function setupAnimatableGrid() {
  gridItems = Array.from({ length: 25 }).map((_, i) => {
    const selector = `.grid-item:nth-child(${i + 1})`;

    // Create animatable with optimized properties
    const item = createAnimatable(selector, {
      scale: {
        duration: 400,
        ease: 'spring(1, 80, 10, 0)'  // Natural spring motion
      },
      backgroundColor: {
        duration: 600,
        ease: 'easeOutQuad'
      }
    });

    // Set initial state
    const el = document.querySelector(selector);
    if (el) {
      el.style.backgroundColor = '#e2e8f0';  // Light gray
      el.style.transform = 'scale(1)';
    }

    animations.push(item);
    return item;
  });

  // Simple hover handlers
  const onGridItemHover = (index) => {
    if (index < 0 || index >= gridItems.length || !gridItems[index]) return;

    gridItems[index].scale(1.2);  // Scale up
    gridItems[index].backgroundColor('#60a5fa');  // Bright blue
  };

  const onGridItemReset = (index) => {
    if (index < 0 || index >= gridItems.length || !gridItems[index]) return;

    gridItems[index].scale(1);  // Reset scale
    gridItems[index].backgroundColor('#e2e8f0');  // Reset color
  };
}

function setupParallaxAnimation() {
  animations.push(
    animate('.parallax-layer.back', {
      translateY: [-20, 20],
      rotateX: [-2, 2],
      autoplay: onScroll({
        target: '.parallax-content',
        enter: 'bottom top',
        leave: 'top bottom',
        sync: 'inOutSine'
      })
    })
  );

  animations.push(
    animate('.parallax-layer.middle', {
      translateY: [-40, 40],
      translateX: [-10, 10],
      rotateZ: [-1, 1],
      autoplay: onScroll({
        target: '.parallax-content',
        enter: 'bottom top',
        leave: 'top bottom',
        sync: 'inOutSine'
      })
    })
  );

  animations.push(
    animate('.parallax-layer.front', {
      translateY: [-60, 60],
      translateX: [-20, 20],
      rotateY: [-3, 3],
      scale: [0.95, 1.05],
      autoplay: onScroll({
        target: '.parallax-content',
        enter: 'bottom top',
        leave: 'top bottom',
        sync: 'inOutSine'
      })
    })
  );
}

function setup3DCardInteraction() {
  if (!card3dEl.value) return; // Guard if element not found

  card3dAnimatable = createAnimatable(card3dEl.value, {
    rotateX: { duration: 400, ease: 'spring(0.8, 90, 10, 0)' },
    rotateY: { duration: 400, ease: 'spring(0.8, 90, 10, 0)' },
    translateZ: { duration: 400, ease: 'spring(1, 90, 8, 0)' }
  });
  animations.push(card3dAnimatable); // Add for cleanup

  // Default state
  card3dAnimatable.rotateX(0);
  card3dAnimatable.rotateY(0);
  card3dAnimatable.translateZ(0);

  // Define actual handlers
  handleCardMove = (e) => {
    if (!card3dEl.value || !card3dAnimatable) return;

    const rect = card3dEl.value.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rotX = 15 - (y / rect.height * 30);
    const rotY = (x / rect.width * 30) - 15;

    card3dAnimatable.rotateX(rotX);
    card3dAnimatable.rotateY(rotY);
    card3dAnimatable.translateZ(10);
  };

  handleCardLeave = () => {
    if (!card3dAnimatable) return;

    card3dAnimatable.rotateX(0);
    card3dAnimatable.rotateY(0);
    card3dAnimatable.translateZ(0);
  };

  // Add event listeners - managed in onMounted/onUnmounted
}

// --- New Scroll-Driven Background Setup ---
const backgroundKeyframes = [
  { colors: ['hsl(200, 70%, 80%)', 'hsl(220, 70%, 85%)'] }, // Start (light blue)
  { colors: ['hsl(30, 90%, 70%)', 'hsl(340, 90%, 75%)'] },  // Timeline section (orange to pink)
  { colors: ['hsl(100, 80%, 60%)', 'hsl(180, 80%, 70%)'] }, // 3D Card (lime to cyan)
  { colors: ['hsl(240, 95%, 75%)', 'hsl(60, 95%, 70%)'] }   // End (deep blue to yellow)
];

function setupScrollDrivenBackground() {
  const bgElement = document.querySelector('.background-gradient');
  if (!bgElement) return;

  const animation = animate(bgElement, {
    opacity: [0.5, 1],
    duration: 1000,
    autoplay: onScroll({
      target: document.documentElement
    })
  });

  animations.push(animation);
}

function setupSpringyScrollAnimation() {
  const springTargets = '.spring-item';

  // Ensure elements exist before trying to animate
  if (!document.querySelector(springTargets)) return;

  animations.push(
    animate(springTargets, {
      translateY: ['100px', '0px'],
      scale: [0.5, 1],
      opacity: [0, 1],
      delay: stagger(100),
      duration: 1500, // Approximate duration for spring
      autoplay: onScroll({
        target: '.springy-content',
        enter: 'bottom-=100 top', // Trigger slightly before fully visible
        leave: 'top+=100 bottom',
        // Dynamically set spring easing per element
        easing: (el, i) => {
          const mass = 1;
          const stiffness = 80 + i * 10; // Slightly different stiffness
          const damping = 10 + i * 2;   // Slightly different damping
          const velocity = 0;
          return `spring(${mass}, ${stiffness}, ${damping}, ${velocity})`;
        },
        once: true // Play animation only once when element enters
      })
    })
  );
}

// --- Lifecycle Hooks ---
onMounted(async () => {
  // Wait for DOM elements to be available
  await nextTick();

  // Initialize TOC target element
  tocTarget.value = document.querySelector('#nav-toc-container');

  // Setup Intersection Observer for TOC highlighting
  if (tocTarget.value) {
    setupTableOfContentsObserver();
  }

  // Setup all animations and interactions
  setupBasicScrollAnimation();
  setupSVGChartAnimation();
  setupAnimatableGrid();
  setupParallaxAnimation();
  setup3DCardInteraction();
  setupSpringyScrollAnimation();
  setupScrollDrivenBackground();

  // Add event listeners for 3D card
  if (card3dEl.value) {
    card3dEl.value.addEventListener('mousemove', handleCardMove);
    card3dEl.value.addEventListener('mouseleave', handleCardLeave);
  }
});

onUnmounted(() => {
  // Revert all animations and animatables
  animations.forEach(anim => anim?.revert());
  // Animatable instances are already in the 'animations' array via setupAnimatableGrid

  // Disconnect Intersection Observer
  if (headingObserver) {
    headingObserver.disconnect();
    headingObserver = null;
  }

  // Cleanup for scroll-driven background listener (added via animations.push)

  // Remove event listeners for 3D card
  if (card3dEl.value) {
    card3dEl.value.removeEventListener('mousemove', handleCardMove);
    card3dEl.value.removeEventListener('mouseleave', handleCardLeave);
  }

  // Clear arrays/refs just in case
  animations.length = 0;
  gridItems.length = 0;
  card3dAnimatable = null;
});

// --- Component Methods/Event Handlers (exposed to template) ---
// Grid handlers are now defined within setupAnimatableGrid and assigned to top-level lets
// Card handlers are now defined within setup3DCardInteraction and assigned to top-level lets
// Text scramble handler is now defined within setupTextScrambleAnimation and assigned to top-level let

// Make sure handlers needed by the template are available
// (They are defined via let and assigned in onMounted after calling setup functions)
let onGridItemHover = () => { }; // Placeholder, will be assigned in setupAnimatableGrid
let onGridItemReset = () => { }; // Placeholder, will be assigned in setupAnimatableGrid
let handleCardMove = () => { }; // Placeholder, will be assigned in setup3DCardInteraction
let handleCardLeave = () => { }; // Placeholder, will be assigned in setup3DCardInteraction

// --- Color utility functions, moved up here so they're accessible from setupAnimatableGrid ---
const getColor = (index) => {
  const normalizedIndex = index / 99; // Normalize to 0-1 range
  return interpolateTurbo(normalizedIndex); // Using d3 color scale
};

const getRestColor = () => {
  // Handle dark/light mode
  const isDark = document.documentElement.classList.contains('dark');
  return isDark ? '#1e293b' : '#e2e8f0';
};
</script>

<style scoped>
.root-container {
  @apply min-h-[500vh] w-full relative overflow-x-hidden;
}

.background-gradient {
  @apply fixed top-0 left-0 w-full h-screen -z-10 transition-all duration-100 will-change-[background];
}

.spacer {
  @apply h-[30vh] flex items-center justify-center relative z-10 opacity-70;
}

.spacer-content {
  text-align: center;
  opacity: 0.5;
}

.scroll-section {
  @apply min-h-[80vh] flex items-center justify-center py-8 overflow-hidden;
}

/* Remove all the background-specific section classes */
.scroll-section.dark,
.scroll-section.coral,
.scroll-section.gradient,
.scroll-section.purple,
.scroll-section.dark-blue,
.scroll-section.teal,
.scroll-section.dark-green,
.scroll-section.orange,
.scroll-section.springy {
  background: transparent;
  color: inherit;
}

.scroll-content {
  @apply w-full mx-auto p-8 translate-y-[100px] opacity-0 text-left relative z-10;
}

.chart-content,
.shapes-content,
.animatable-content,
.springy-content {
  background: transparent;
  color: inherit;
}

/* Clean up code examples */
.code-example {
  @apply mt-8 text-left bg-black/5 rounded-lg overflow-hidden;
}

.code-example pre {
  @apply m-0 p-6 overflow-x-auto overflow-y-hidden text-sm leading-relaxed;
}

.code-example code {
  @apply font-mono text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words;
}

.dark .code-example {
  background: rgba(0, 0, 0, 0.5);
}

/* Update grid container */
.grid-container {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  /* 5x5 grid */
  gap: 8px;
  padding: 2em;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  max-width: 400px;
  margin: 2em auto;
}

.line-chart {
  @apply my-8 mx-auto block w-full h-auto max-w-4xl;
  aspect-ratio: 1.2 / 1;
}

.data-point {
  @apply opacity-0 origin-center scale-0;
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
@screen md {
  .scroll-content {
    @apply mx-4 p-6;
  }

  .grid-container {
    @apply grid-cols-6 gap-1 p-4;
  }

  .parallax-scene {
    @apply h-[200px];
  }

  .card3d-container {
    @apply max-w-[250px] h-[160px];
  }

  .card3d-title {
    @apply text-2xl;
  }

  .scramble-text {
    @apply text-2xl;
  }

  .spring-container {
    @apply py-8 px-2;
  }

  .spring-item {
    @apply w-[40px] h-[40px];
  }

  .line-chart {
    aspect-ratio: 1.5 / 1;
  }
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  /* 5x5 grid */
  gap: 8px;
  padding: 2em;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  max-width: 400px;
  margin: 2em auto;
}

.grid-item {
  aspect-ratio: 1;
  border-radius: 4px;
  cursor: pointer;
  will-change: transform, background-color;
  background-color: #e2e8f0;
  transition: box-shadow 0.3s ease;
}

.grid-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.parallax-scene {
  position: relative;
  height: 300px;
  width: 100%;
  overflow: hidden;
  border-radius: 8px;
  perspective: 1000px;
  margin: 2em auto;
}

.parallax-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  will-change: transform;
  transform-style: preserve-3d;
}

.parallax-layer.back {
  background-image: linear-gradient(135deg, #4299E1, #3182CE);
  z-index: 1;
}

.parallax-layer.middle {
  background-image: linear-gradient(135deg, #63B3ED, #4299E1);
  clip-path: polygon(20% 20%, 80% 20%, 80% 80%, 20% 80%);
  z-index: 2;
}

.parallax-layer.front {
  background-image: linear-gradient(135deg, #90CDF4, #63B3ED);
  clip-path: polygon(35% 35%, 65% 35%, 65% 65%, 35% 65%);
  z-index: 3;
}

.card3d-container {
  margin: 2em auto;
  width: 100%;
  max-width: 300px;
  height: 200px;
  perspective: 1000px;
}

.card3d {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  will-change: transform;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.card3d-content {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transform-style: preserve-3d;
}

.card3d-title {
  @apply text-4xl font-bold text-center text-zinc-800 dark:text-zinc-200 shadow-md [transform:translateZ(40px)];
}

.card3d-shine {
  @apply absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none;
}

.card3d-badge {
  @apply absolute bottom-5 bg-black/20 text-white px-2.5 py-1.5 rounded text-sm [transform:translateZ(20px)];
}

.text-fx-container {
  margin: 2em auto;
  text-align: center;
}

.scramble-text {
  @apply text-4xl font-bold mb-4 tracking-wider text-zinc-800 dark:text-zinc-200;
}

.text-fx-btn {
  @apply px-6 py-2 bg-black/10 hover:bg-black/20 rounded font-medium cursor-pointer transition-all;
}

.spring-container {
  @apply flex justify-around items-center py-12 px-4 min-h-[150px];
}

.spring-item {
  @apply w-[60px] h-[60px] rounded-lg bg-black/10 opacity-0 shadow-lg [transform:translateY(100px)_scale(0.5)];
}

/* Different base colors (optional) */
.spring-item.item-1 {
  background-color: #FF6B6B;
}

.spring-item.item-2 {
  background-color: #FFD166;
}

.spring-item.item-3 {
  background-color: #06D6A0;
}

.spring-item.item-4 {
  background-color: #118AB2;
}
</style>