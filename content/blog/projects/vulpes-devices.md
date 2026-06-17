---
title: "Vulpes Devices"
date: 2026-03-15T00:00:00-04:00
draft: true
url: https://github.com/ejfox/vulpes-devices
tech: ["Flipper Zero", "OnionOS", "Theming", "JavaScript"]
state: deployed
aiInvolvement: ai-assisted
tags:
  - vulpes
  - flipper
  - hardware
  - device
  - design
---

<!-- TODO (EJ): add your voice. The boot strip is generated from the repo's frames;
     an on-device photo of a Flipper actually running the theme would be a great
     addition (it's on the Photo Day list). Draft until then. -->

The hardware arm of the **Vulpes** look — one palette, one glyph, generated out to seven device targets (Flipper Zero, OnionOS handhelds, and more). It takes the cyberpunk-neon Vulpes scheme from my editor and pushes it down onto the little screens, so my devices boot and theme in the same visual language as everything else I make.

![The Vulpes fox boot animation, generated for the Flipper Zero's 128×64 screen](https://res.cloudinary.com/ejf/image/upload/projects/vulpes-devices/boot-animation.png)

Everything derives from a single shared palette file — the same `#e60067` magenta and `#6eedf7` teal that run through the rest of the Vulpes system — so a new device target is mostly a matter of teaching the generator that platform's theme format.
