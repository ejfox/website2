# Frontend Design Skill - Enhanced for ejfox.com

## Core Philosophy: Intentional Minimalism + Swiss Rigor

**Your Design Direction:** Editorial data journalism meets Swiss typographic grid system. Refined minimalism with Tuftian data density—precision over intensity.

## Design Thinking Framework

**Four Questions Before Implementation:**
1. **Purpose**: What problem does this interface solve? (Data presentation, project showcase, information hierarchy)
2. **Tone**: Refined minimalism with journalistic clarity (NOT brutalist, NOT maximalist)
3. **Constraints**: Dark-first, 8px baseline grid, no anime.js, Georgia serif
4. **Differentiation**: Tuftian micro-visualizations + Swiss grid precision = distinctive data-dense editorial

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
  animation: fadeInSlide 0.4s cubic-bezier(0.4, 0, 0.2, 1) var(--stagger-delay) backwards;
}

@keyframes fadeInSlide {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
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

## Visual Details

**Minimal Approach (Your Style):**
- Atmospheric depth through SUBTLE gradients
- No decorative patterns (data is the decoration)
- Micro-visualizations (sparklines, inline charts)

**Avoid:**
- Dramatic shadows (too heavy)
- Geometric patterns (visual noise)
- Custom cursors (unnecessary complexity)

**Embrace:**
- Layered transparencies for depth
- Data-driven decorative elements (charts become art)
- Subtle texture for tactile feel

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

## Key Principles

1. **Bold minimalism beats timid decoration**
2. **Data density through precision, not clutter**
3. **Every design choice serves information architecture**
4. **Swiss rigor + Editorial warmth = Distinctive voice**
5. **Delete before adding—simplicity beats complexity**

---

*This skill merges Anthropic's frontend-design principles with ejfox.com's Swiss/Tuftian design system for intentional, distinctive, production-grade interfaces.*
