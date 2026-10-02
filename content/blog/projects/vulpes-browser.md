---
title: "Vulpes Browser"
date: 2026-01-20T00:00:00-05:00
category: "Tools"
featured: false
draft: false
url: https://github.com/ejfox/vulpes-browser
tech: ["Swift"]
state: deployed
ai-involvement: ai-assisted
tags:
  - tools
---

Minimalist web browser. Zig + Swift + Metal — rendered entirely on the GPU, with particle effects, link glow, and a two-pass bloom.

I really wanted to experiment with creating a browser but making every choice myself, centered around how I use and consume the internet — from first principles, aided by a super-intelligent robot. What would a new browser made today, with speed and performance as a central tenet, look like?

Zig, Swift, Metal: barebones, non-web, performant, and they interest me.

![The vulpes browser rendering ejfox.com](https://res.cloudinary.com/ejf/image/upload/projects/vulpes/browser.png)

![The Metal render pipeline — solid, glyph, particle, glow, and a two-pass bloom](https://res.cloudinary.com/ejf/image/upload/projects/vulpes-browser/code.png)

![The GPU image atlas — texture packing, zero-copy Metal textures, and an LRU cache for fast image rendering](https://res.cloudinary.com/ejf/image/upload/projects/vulpes-browser/atlas.png)
