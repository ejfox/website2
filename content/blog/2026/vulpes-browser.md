---
date: 2026-01-17T16:45:00-05:00
dek: Building a keyboard-first, JavaScript-free browser from scratch with Zig, Swift, and Metal
tags:
  - programming
  - zig
  - swift
  - metal
  - browsers
  - tools
inprogress: true
modified: 2026-01-24T17:36:40-05:00
---

## Building Vulpes Browser

### The Idea

A minimalist browser that renders the web as clean, readable text. Vim keybindings. GPU-accelerated. Focused on rendering HTML elements with simplicity and minimalism, and rewarding semantic web practices in 2026.

### Outline

#### Why build a browser?
- The modern web is hostile to reading
- Most pages are 90% cruft, 10% content
- What if we just… didn't render the cruft?

#### The tech stack
- **Zig** for the core logic - why Zig?
- **Swift** for macOS integration
- **Metal** for GPU-accelerated text rendering with glyph atlas
- GLSL shaders for visual effects (Ghostty/Shadertoy compatible)

#### Vim-style navigation
- `j`/`k` scroll, `d`/`u` half-page
- Numbers 1-9 follow links
- `/` or `Cmd+L` for URL bar
- Why keyboard-first matters

#### What it doesn't do (intentionally)
- No JavaScript (SPAs show minimal content)
- No CSS layout (text extraction only)
- No images
- No forms
- This is a feature, not a limitation

#### The rendering pipeline
- Fetch HTML
- Extract text content
- Render with Metal glyph atlas
- Apply optional shaders (bloom, CRT effects)

#### Page transitions
- Visual effects when navigating
- Making reading feel intentional

### Screenshots/Demo

[Add screenshots from the app]

### What I learned

[Reflect on the process]

### Links

- GitHub: <https://github.com/ejfox/vulpes-browser>

