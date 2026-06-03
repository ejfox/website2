---
title: "Vulpes Browser"
date: 2026-01-20T00:00:00-05:00
draft: true
url: https://github.com/ejfox/vulpes-browser
tech: ["Swift"]
state: deployed
aiInvolvement: ai-assisted
tags:
  - tools
---

<!-- TODO (EJ): add your voice + an image. Capture: macOS app screenshot. Draft until imaged. -->

Minimalist web browser. Zig + Swift + Metal — rendered entirely on the GPU, with particle effects, link glow, and a two-pass bloom.

![The vulpes browser rendering ejfox.com](https://res.cloudinary.com/ejf/image/upload/projects/vulpes/browser.png)

![The Metal render pipeline — solid, glyph, particle, glow, and a two-pass bloom](https://res.cloudinary.com/ejf/image/upload/projects/vulpes-browser/code.png)

![The GPU image atlas — texture packing, zero-copy Metal textures, and an LRU cache for fast image rendering](https://res.cloudinary.com/ejf/image/upload/projects/vulpes-browser/atlas.png)
