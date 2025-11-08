---
dek: >-
  In which we make the elements of our page twirl and dance in order to spark
  joy.
inprogress: true
date: 2023-11-08T14:37:45-05:00
modified: 2024-09-20T00:22:14-04:00
tags:
  - vue
  - javascript
hidden: true
draft: true
---
## Scroll Animations in Nuxt

I like adding subtle animations that respond to scroll. Not the overdone parallax stuff, just gentle movements that make pages feel alive.

### The Simple Approach: Intersection Observer

Most scroll animations just need to trigger when elements come into view:

```vue
<script setup>
const target = ref(null)
const { stop } = useIntersectionObserver(target, ([{ isIntersecting }]) => {
  if (isIntersecting) {
    // Add animation class
    target.value.classList.add('animate-in')
  }
})
</script>

<template>
  <div ref="target" class="opacity-0 translate-y-8 transition-all duration-700 ease-out">
    <p>This fades in when scrolled into view</p>
  </div>
</template>

<style>
.animate-in {
  opacity: 1;
  transform: translateY(0);
}
</style>
```

### For More Complex Stuff: useScroll

VueUse's `useScroll` gives you scroll position as reactive values:

```vue
<script setup>
const { y } = useScroll(window)
const parallaxOffset = computed(() => y.value * 0.5)
</script>

<template>
  <div :style="{ transform: `translateY(${parallaxOffset}px)` }">
    Background moves slower than scroll
  </div>
</template>
```

### When You Need More Control: anime.js

For complex animations, anime.js works well with Vue's reactivity:

```javascript
import anime from 'animejs/lib/anime.es.js'

const animateOnScroll = () => {
  anime({
    targets: '.stagger-item',
    translateY: [50, 0],
    opacity: [0, 1],
    delay: anime.stagger(100),
    duration: 800,
    easing: 'easeOutExpo'
  })
}
```

### What Actually Works

- **Fade in on scroll**: Always looks good
- **Staggered animations**: Nice for lists
- **Subtle parallax**: Background elements moving slightly slower
- **Progress indicators**: Show scroll progress in nav

### What Doesn't

- **Heavy parallax**: Janky on mobile, distracting
- **Too many animating elements**: Performance killer
- **Long animations**: People scroll fast, keep them quick
- **Animating on scroll position**: Usually feels laggy

### Performance Tips

Use `transform` and `opacity` - they're cheap to animate. Avoid changing `width`, `height`, or anything that triggers layout.

Add `will-change: transform` to elements that will animate, but remove it when done.

### Library Tradeoffs

**Vanilla Intersection Observer + CSS**
- **Pros**: Native browser API, best performance, no bundle size
- **Cons**: More boilerplate, no complex sequencing
- **Use when**: Simple fade-ins, basic scroll triggers

**VueUse (useIntersectionObserver, useScroll)**  
- **Pros**: Vue-optimized, composition API, reactive values
- **Cons**: Extra dependency, less control than vanilla
- **Use when**: Vue 3 projects, need reactive scroll values

**anime.js**
- **Pros**: Powerful sequencing, 60fps animations, small size (~14kb)
- **Cons**: Another dependency, overkill for simple effects  
- **Use when**: Complex choreography, timeline animations

**Scrollama**
- **Pros**: Built for scrollytelling, handles complex step-based interactions
- **Cons**: Specific use case, larger bundle (~20kb)
- **Use when**: Story-driven pages, step-by-step reveals

**GSAP ScrollTrigger**
- **Pros**: Industry standard, handles everything, professional features
- **Cons**: Large bundle (~100kb), overkill for most sites
- **Use when**: Complex commercial sites, heavy animation needs

### Performance Reality Check

Intersection Observer beats scroll events by ~90% in performance tests. It runs async and doesn't block the main thread.

CSS transforms are ~10x faster than animating layout properties. Stick to `transform`, `opacity`, and `filter`.

### Scroll-Driven Primitives Taxonomy

Beyond basic fade-ins, there's a whole vocabulary of scroll-driven interactions for data visualization and storytelling:

#### **Progressive Disclosure**
- **Data Drawing In**: Charts animate from empty state as you scroll (bars grow, lines draw, points appear)
- **SVG Path Animation**: Lines/paths draw stroke-by-stroke using `stroke-dashoffset` 
- **Generative Art Ticks**: Algorithmic art that generates one element per scroll increment
- **Typewriter Effects**: Text appears letter-by-letter or word-by-word tied to scroll position
- **Layered Reveals**: Start with simple chart, add complexity layer by layer
- **Guided Focus**: Highlight specific data points in sequence
- **Annotation Stepping**: Show explanatory text/arrows tied to scroll position

#### **Scale & Perspective Shifts**
- **Zoom Transitions**: Start zoomed out (world map), scroll to zoom in (city level)  
- **Scale Updates**: Scatterplot axes rescale at scroll breakpoints to show different relationships
- **Time Scrubbing**: Scroll controls time slider in animated charts
- **Video Frame Scrubbing**: Each scroll pixel = one video frame (like Apple product demos)
- **Dimensional Shifts**: 2D chart transforms to 3D, or vice versa

#### **Narrative Sequences**
- **Before/After States**: Scroll between two versions of same data (pre/post policy change)
- **Scenario Branching**: User scroll choice determines which data path to explore
- **Comparative Reveals**: Multiple charts appear/disappear to show relationships
- **Process Visualization**: Manufacturing pipeline, data flow diagrams that animate through stages

#### **Interactive Data Exploration**
- **Scroll-Controlled Filters**: Scroll position determines which data subset is visible
- **Progressive Aggregation**: Start with individual points, scroll to see grouped/summarized views  
- **Threshold Animations**: Data points highlight/hide as you scroll past certain values
- **Category Cycling**: Scroll through different data categories in same chart space

#### **Spatial Metaphors**
- **Journey Maps**: Scroll follows a path through geographic or conceptual space
- **Depth Scrolling**: Parallax that feels like moving through 3D data landscape
- **Microscope Effect**: Scroll "zooms into" increasingly detailed data views
- **Timeline Traversal**: Horizontal timeline controlled by vertical scroll

#### **Award-Winning Techniques**
- **Morphing Visualizations**: One chart type transforms into another (NYT election needles → bar charts)
- **Sticky Element Choreography**: Fixed elements that update content as background scrolls (Bloomberg scrollytelling)
- **Particle System Control**: Scroll drives physics simulations (falling leaves, data points clustering)
- **Audio Sync**: Scroll position controls music/sound progression (interactive documentaries)
- **3D Scene Navigation**: Scroll moves through 3D environments (architectural walkthroughs, product demos)
- **Multi-Panel Coordination**: Multiple visualizations update simultaneously based on scroll (Pudding stories)
- **Perspective Shifts**: Same data shown from different viewpoints as you scroll (individual → aggregate)
- **Conditional Branching**: Scroll speed/direction changes animation behavior
- **Scroll Velocity Physics**: Fast scrolling triggers different animations than slow scrolling

#### **Performance Considerations**
- **Static Keyframes**: Pre-calculate animation states, interpolate between them
- **Canvas vs SVG**: Canvas for many elements, SVG for interactive precision
- **Throttled Updates**: Don't recalculate on every scroll event
- **Intersection-Triggered**: Use viewport entry/exit rather than continuous scroll position

The key is matching the scroll interaction to your data story. Simple progressions work for most cases. Complex choreography should earn its cognitive load.

Most scroll animations just need intersection observer + CSS transitions. Save the complex stuff for when you actually need it.
