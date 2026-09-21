---
title: "Vulpes Devices"
date: 2026-03-15T00:00:00-04:00
category: "Hardware"
featured: false
draft: true
tech: ["Flipper Zero", "OnionOS", "Theming", "JavaScript"]
state: deployed
ai-involvement: ai-assisted
tags:
  - vulpes
  - flipper
  - hardware
  - device
  - design
---

The hardware arm of the **Vulpes** look — one palette, one glyph, generated out to seven device targets: Flipper Zero, OnionOS handhelds, the TD-H3 radio, Meshtastic nodes, a PortaPack, plus iPhone and iMac wallpapers. It takes the cyberpunk-neon Vulpes scheme from my editor and pushes it down onto the little screens, so my devices boot and theme in the same visual language as everything else I make.

![One look, many targets — the Vulpes glyph and palette generated across Flipper, OnionOS, TD-H3, Meshtastic, PortaPack, and the desktop](https://res.cloudinary.com/ejf/image/upload/projects/vulpes-devices/devices.png)

Everything derives from a single shared palette file — the same `#e60067` magenta and `#6eedf7` teal that run through the rest of the Vulpes system — so a new device target is mostly a matter of teaching the generator that platform's theme format. The scheme itself is open: it grew out of [vulpes.nvim](https://github.com/ejfox/vulpes.nvim), and [vulpes-theme-lab](https://github.com/ejfox/vulpes-theme-lab) is a live builder for spinning up your own variant.

![The Flipper Zero boot animation, generated straight from the palette — the fox, on a 128×64 monochrome screen](https://res.cloudinary.com/ejf/image/upload/projects/vulpes-devices/boot.gif)
