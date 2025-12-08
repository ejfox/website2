# Frontend Design Skill - Enhanced for ejfox.com

## Core Philosophy: Brutalist Minimalism + Tuftian Data Density

**Your Design Direction:** Editorial data journalism meets Swiss typographic grid system meets web brutalism. Unadorned minimalism with maximum data-ink ratio—precision over decoration, function over form.

## Design Thinking Framework

**Four Questions Before Implementation:**

1. **Purpose**: What problem does this interface solve? (Data presentation, project showcase, information hierarchy)
2. **Tone**: Brutalist minimalism with Tuftian data density (NO decoration, NO ornamentation, NO chart junk)
3. **Constraints**: Dark-first, 8px baseline grid, no anime.js, Georgia serif, maximize data-ink ratio
4. **Differentiation**: Tuftian micro-visualizations + Swiss grid precision + brutalist restraint = distinctive data-dense editorial

## Tuftian Data Density Principles

**Core Tenets:**

1. **Maximize Data-Ink Ratio** - Remove all non-data ink. Every pixel must serve information delivery.
2. **Small Multiples** - Repeated micro-visualizations reveal patterns better than single large charts
3. **Sparklines** - Intense, simple, word-sized graphics embedded in text flow
4. **Tables Over Charts** - Well-designed tables are often superior to decorative charts
5. **No Chart Junk** - Delete gridlines, backgrounds, borders, 3D effects, decorative fills

**Implementation Rules:**

- Remove backgrounds from charts (transparent or match page color)
- Eliminate unnecessary borders and boxes
- Use minimal axis labels (only what's essential)
- Embrace whitespace as data separator
- Inline data visualizations within text (sparklines, micro-bars)
- Dense information tables with careful alignment

## Typography System

**Distinctive Choices (KEEP):**

- ✅ Georgia serif for content (NOT Inter, NOT system fonts)
- ✅ SF Mono/ui-monospace for data (tabular lining figures)
- ✅ Extreme weight contrasts: 100-200 for display, 400-600 for body
- ✅ OpenType features: old-style numerals in prose, lining in data
- ✅ Optical sizing: -0.035em for large headings, 0em for body

**Enhancements to Add:**

- High-contrast display typography for featured sections
- Refined letter-spacing based on optical size
- Enhanced ligatures for editorial feel (dlig, swsh, hist)

## Color & Theme

**Current System (KEEP - Already Distinctive):**

- ✅ Dark-first zinc palette (NOT purple gradients)
- ✅ Warm near-black (#0a0a0a) vs pure black
- ✅ Minimal color, maximum typography

**Skill-Informed Enhancements:**

- Add cohesive accent colors for data visualization
- Implement CSS variables for theme consistency
- Strategic color highlights for interactive elements (NOT decorative)

## Motion & Interaction

**Current Approach:**

- ⚠️ Stagger animations disabled (flickering issues)
- ✅ Simple CSS transitions only

**Skill-Informed Motion:**

- Orchestrated page-load reveals via animation-delay (cap at 800ms)
- Scroll-triggered reveals for below-fold content
- Hover states: translateX, opacity, subtle shadows
- **USE CSS-ONLY** (no anime.js per delete-driven philosophy)

**Implementation:**

```css
/* Orchestrated reveals - capped delay */
.project-card {
  animation: fadeInSlide 0.4s cubic-bezier(0.4, 0, 0.2, 1) var(--stagger-delay)
    backwards;
}

@keyframes fadeInSlide {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## Spatial Composition

**Swiss Grid Foundation (KEEP):**

- ✅ 12-column grid system
- ✅ 8px baseline rhythm
- ✅ Asymmetric 8/4 content/meta split
- ✅ Left-aligned within max-w-screen-xl

**Skill-Informed Enhancements:**

- Intentional grid breaks for featured content
- Asymmetric alternating layouts (5/7 split)
- Diagonal flow through staggered card heights
- Embrace negative space as design element

## Visual Details: Brutalist Restraint

**Brutalist Minimalism (Your Style):**

- Raw, unadorned materials (semantic HTML, minimal CSS)
- Exposed structure (grid systems visible, not hidden)
- Function dictates form (no decoration without purpose)
- Honest materials (no skeuomorphism, no fake textures)
- Micro-visualizations as functional elements (sparklines, inline charts)

**Avoid (Chart Junk & Decoration):**

- Dramatic shadows (visual noise)
- Geometric patterns (reduces data-ink ratio)
- Custom cursors (unnecessary complexity)
- Gradients for decoration (only for data representation)
- Rounded corners without purpose
- Drop shadows without hierarchy need
- Any "polish" that doesn't serve information architecture

**Embrace (Data-Driven Elements):**

- Stark typography contrasts
- Grid-based composition (visible structure)
- Data-driven decorative elements (charts become art)
- Raw color (no gradients unless representing data)
- Monospace for tabular data alignment

## Critical Restrictions

**Anti-Patterns (From Skill):**

- ❌ Generic fonts (Inter, Roboto, Arial)
- ❌ Overused color schemes (purple gradients)
- ❌ Predictable layouts (centered everything)
- ❌ Cookie-cutter patterns

**Your Additional Restrictions:**

- ❌ Looping animations (flickering)
- ❌ Decorative complexity (delete-driven development)
- ❌ Unnecessary chrome (Tuftian data-ink ratio)

## Implementation Guidelines

**Match Complexity to Vision:**

- Elaborate code for magazine-style featured projects
- Restrained precision for archive bento grid
- Every animation must have PURPOSE (not just polish)

**Data Density Philosophy:**

- Sparklines reveal project activity
- Inline statistics show metadata elegantly
- Micro-visualizations as navigational aids

## Context-Specific Decisions

**Projects Page:**

- **Featured**: Bold asymmetric layouts, full-width images, orchestrated reveals
- **Archive**: Dense bento grid, scannable, minimal motion
- **Motion**: Staggered reveals on load, hover enhancements, scroll triggers

**Blog Posts:**

- **Typography**: Editorial Georgia with hanging punctuation
- **Layout**: Max 65ch, left-aligned, sidenotes in margin
- **Motion**: Minimal—focus on reading experience

## Data Visualization Specific Guidance

**When Creating Charts/Graphs:**

1. **Remove all backgrounds** - Let page color show through
2. **Minimal axes** - Only label what's necessary for comprehension
3. **No gridlines** - Use whitespace and alignment instead
4. **Direct labeling** - Label data points directly, not with legends
5. **Small multiples** - Multiple small charts > one large complex chart
6. **Sparklines everywhere** - Word-sized graphics in tables, lists, metadata
7. **Tables first** - Consider if a well-designed table is better than a chart

**Brutalist Data Viz:**

- Exposed data (show the numbers, not just the visualization)
- Monospace alignment for tabular data
- ASCII-style charts where appropriate
- Raw, unsmoothed data (honesty over aesthetics)
- Dense information displays (maximize useful pixels)

## Key Principles

1. **Maximize data-ink ratio** - Delete until only information remains
2. **Brutalist honesty** - Function over form, structure over decoration
3. **Data density through precision** - Tuftian small multiples, not clutter
4. **Every design choice serves information architecture**
5. **Swiss rigor + Brutalist restraint = Distinctive voice**
6. **Delete before adding** - Simplicity beats complexity
7. **Expose, don't hide** - Show structure, grids, and data relationships

---

_This skill merges Anthropic's frontend-design principles with ejfox.com's Tuftian/Brutalist design system for maximum data density, minimal decoration, and honest information architecture._
