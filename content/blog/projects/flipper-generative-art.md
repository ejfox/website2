---
title: "Flipper Generative Art"
date: 2025-01-15T00:00:00-05:00
category: "Hardware"
featured: true
url: https://github.com/ejfox/flipper-generative-art
tech: ["Flipper Zero", "C", "Floyd–Steinberg Dithering", "Embedded"]
state: deployed
ai-involvement: ai-assisted
tags:
  - flipper
  - hardware
  - device
  - generative
  - art
---

<!-- TODO (EJ): tonight's desk take — footage of patterns running on-device
     (real camera or phone), shoot flipper-space-calculators in the same
     session. -->

I often just leave the Flipper on my desk below my monitor, and my feeling was: why not have it show me little evolving art pieces instead of just the time? What would that look and feel like? Is generative art even possible within the constraints of the Flipper's screen and processor? What does 1-bit generative art *feel* like? How can it evolve over the course of a day?

This is the answer: a Flipper Zero app that generates animated patterns in real time on the device's **128×64 monochrome screen**. It runs ten gradient families — horizontal, vertical, radial, diagonal, sine waves, interference, checkerboard, noise, spiral — and converts each to crisp 1-bit graphics with **Floyd–Steinberg dithering**, evolving the parameters every second at ~30fps.

![More real-time generative patterns](https://res.cloudinary.com/ejf/image/upload/projects/flipper-generative-art/gallery-5.png)

![Dithered radial patterns generated on the Flipper Zero](https://res.cloudinary.com/ejf/image/upload/projects/flipper-generative-art/gallery-1.png)

![Checkerboard and noise fields](https://res.cloudinary.com/ejf/image/upload/projects/flipper-generative-art/gallery-2.png)

![Interference and sine-wave fields, 1-bit dithered](https://res.cloudinary.com/ejf/image/upload/projects/flipper-generative-art/gallery-3.png)

![Diagonal gradients and spirals](https://res.cloudinary.com/ejf/image/upload/projects/flipper-generative-art/gallery-4.png)

Making something genuinely *generative* look good in 1-bit on a tiny embedded display is the whole challenge — the dithering is what turns smooth math gradients into something the Flipper's screen can actually render without looking like mud.
