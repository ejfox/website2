# Project Metadata Guide

## New Frontmatter Fields

### Project State (`state`)
Tracks the "preparation vs doing" philosophy from your videos:

```yaml
state: preparation  # Research/learning phase
state: doing       # Active development
state: deployed    # Live and working (default)
state: evolved     # Grown beyond original concept
```

**Visual Indicators:**
- 🔬 `preparation` - Research phase
- ⚡ `doing` - Active development  
- ✨ `deployed` - Live and working
- 🌱 `evolved` - Grown beyond original concept

### AI Involvement (`aiInvolvement`)
Shows the human-AI collaboration level:

```yaml
aiInvolvement: human-only      # No AI used (auto-applied to pre-2022 projects)
aiInvolvement: ai-assisted     # AI helped with specific tasks
aiInvolvement: ai-collaborative # AI as creative partner
aiInvolvement: ai-enhanced     # AI deeply integrated
```

**Visual Indicators:**
- 👤 `human-only` - Human-crafted (emerald)
- 🤝 `ai-assisted` - AI-assisted (blue)  
- 🔄 `ai-collaborative` - AI-collaborative (purple)
- 🚀 `ai-enhanced` - AI-enhanced (orange)

### Featured Projects (`featured`)
```yaml
featured: true  # Prominent display with larger fonts and high contrast
# (no featured field = regular project with smaller fonts and reduced contrast)
```

## Example Project Frontmatter

```yaml
---
title: "Digital Memory Palace"
date: "2024-03-15"
featured: true
state: doing
aiInvolvement: ai-collaborative
tech: ["Unity", "C#", "AI", "VR"]
github: "https://github.com/ejfox/memory-palace"
description: "Spatializing thoughts and information using Unity physics"
---
```

## Auto-Applied Rules

1. **Pre-2022 projects** automatically get `aiInvolvement: human-only`
2. **Missing state** defaults to `deployed`
3. **Missing featured** field means regular project styling
4. **Missing aiInvolvement** on post-2022 projects shows no indicator

## Philosophy Integration

These indicators embody concepts from your video essays:

- **"Preparation vs Doing"** - Honest about what stage projects are in
- **"True Names"** - Precise terminology for project states
- **"AI as Tool"** - Transparent about AI involvement levels
- **"Intentionality"** - Deliberate choices about human-AI collaboration

The visual design stays minimal and tasteful, showing these insights without overwhelming the clean project layout.