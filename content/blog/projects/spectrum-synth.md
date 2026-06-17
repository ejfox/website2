---
title: "Spectrum Synth"
date: 2025-02-01T00:00:00-05:00
draft: true
url: https://github.com/ejfox/spectrum-synth
tech: ["Flipper Zero", "ESP32-S2", "C", "WiFi"]
state: deployed
aiInvolvement: ai-assisted
tags:
  - flipper
  - hardware
  - device
  - radio
---

<!-- TODO (EJ): add your voice + an on-device screenshot of the analyzer running
     (it's on the Photo Day list — the live 2.4GHz waterfall is the shot). Draft. -->

A WiFi spectrum analyzer for the Flipper Zero, paired with an ESP32-S2 dev board — sweep the 2.4GHz band and watch the channel activity on the Flipper's screen.

![The Flipper firmware — UART from the ESP32-S2 into real-time spectrum bars and a waterfall on the 128×64 screen](https://res.cloudinary.com/ejf/image/upload/projects/spectrum-synth/code.png)

![The render internals — screen layout, 30 FPS waterfall history, and a Bayer dither matrix for the 1-bit display](https://res.cloudinary.com/ejf/image/upload/projects/spectrum-synth/code2.png)
