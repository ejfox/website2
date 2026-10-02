---
title: "Flipper Zero Apps"
date: 2026-09-30T00:00:00-04:00
category: "Hardware"
featured: false
draft: true
tech: ["Flipper Zero", "C", "Embedded", "ESP32-S2", "DuckyScript"]
state: deployed
ai-involvement: ai-assisted
tags:
  - flipper
  - hardware
  - device
---

Apps and payloads for the Flipper Zero and its 128×64 monochrome screen. [Flipper Generative Art](/projects/flipper-generative-art) — real-time 1-bit generative patterns on the device — has its own page.

![Dithered radial patterns generated on the Flipper Zero](https://res.cloudinary.com/ejf/image/upload/projects/flipper-generative-art/gallery-1.png)

## Flipper Space Calculators

[Flipper Space Calculators](/projects/flipper-space-calculators) is a set of minimalist space and physics calculators — relativistic time dilation, space-travel figuring, and friends — for back-of-the-napkin astrophysics in your pocket. The transfer solver works out delta-v and flight time from a celestial-body database keyed by semi-major axis.

> It's a tool for a time / space-traveler who doesn't exist, or maybe does, and makes a tool that he would find handy.

![The transfer solver — delta-v, flight time, and a celestial-body database keyed by semi-major axis](https://res.cloudinary.com/ejf/image/upload/projects/flipper-space-calculators/code2.png)

## Spectrum Synth

Spectrum Synth is a WiFi spectrum analyzer for the Flipper Zero, paired with an ESP32-S2 dev board. It sweeps the 2.4GHz band and draws channel activity as real-time spectrum bars and a waterfall on the Flipper's screen.

![The Flipper firmware — UART from the ESP32-S2 into real-time spectrum bars and a waterfall on the 128×64 screen](https://res.cloudinary.com/ejf/image/upload/projects/spectrum-synth/code.png)

## BadUSB Remote Desktop

[BadUSB Remote Desktop](https://github.com/ejfox/badusb-remote-desktop) is a set of Flipper Zero BadUSB payloads that make a fresh, keyboard-less machine reachable on the LAN for remote desktop — macOS Screen Sharing (VNC), Windows RDP, or Linux VNC. Plug in the Flipper instead of digging out a spare keyboard, mouse, and monitor just to switch on remote access.

![Badusb Remote Desktop — a real DuckyScript payload in a vulpes terminal](https://res.cloudinary.com/ejf/image/upload/projects/badusb-remote-desktop/terminal.png)
