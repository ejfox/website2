---
title: "Flipper Generative Art"
date: 2025-01-15T00:00:00-05:00
draft: true
url: https://github.com/ejfox/flipper-generative-art
tech: ["Flipper Zero", "C", "Floyd–Steinberg Dithering", "Embedded"]
state: deployed
aiInvolvement: ai-assisted
tags:
  - flipper
  - hardware
  - device
  - generative
  - art
---

<!-- TODO (EJ): add your voice. These are the app's own gallery captures from the
     128×64 screen; an on-device shot of it running live would be even better
     (it's on the Photo Day list). Draft until then. -->

A Flipper Zero app that generates animated patterns in real time on the device's **128×64 monochrome screen**. It runs ten gradient families — horizontal, vertical, radial, diagonal, sine waves, interference, checkerboard, noise, spiral — and converts each to crisp 1-bit graphics with **Floyd–Steinberg dithering**, evolving the parameters every second at ~30fps.

![Dithered radial patterns generated on the Flipper Zero](https://res.cloudinary.com/ejf/image/upload/projects/flipper-generative-art/gallery-1.png)
![Checkerboard and noise fields](https://res.cloudinary.com/ejf/image/upload/projects/flipper-generative-art/gallery-2.png)
![Interference and sine-wave fields, 1-bit dithered](https://res.cloudinary.com/ejf/image/upload/projects/flipper-generative-art/gallery-3.png)
![Diagonal gradients and spirals](https://res.cloudinary.com/ejf/image/upload/projects/flipper-generative-art/gallery-4.png)
![More real-time generative patterns](https://res.cloudinary.com/ejf/image/upload/projects/flipper-generative-art/gallery-5.png)

Making something genuinely *generative* look good in 1-bit on a tiny embedded display is the whole challenge — the dithering is what turns smooth math gradients into something the Flipper's screen can actually render without looking like mud.
