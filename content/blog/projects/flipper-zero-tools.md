---
title: "Flipper Zero Tools"
date: 2025-01-15T00:00:00-05:00
category: "Hardware"
featured: true
url: https://github.com/ejfox/flipper-space-calculators
tech: ["Flipper Zero", "C", "Embedded", "Floyd–Steinberg Dithering"]
state: deployed
ai-involvement: ai-assisted
tags:
  - flipper
  - hardware
  - device
  - science
  - generative
  - art
---

Two small apps for the same tiny, useless-but-perfect screen: [flipper-space-calculators](https://github.com/ejfox/flipper-space-calculators) and [flipper-generative-art](https://github.com/ejfox/flipper-generative-art).

## Space Calculators

A set of minimalist space- and physics calculators for the Flipper Zero — relativistic time dilation, space-travel figuring, and friends, all on the 128×64 screen for back-of-the-napkin astrophysics in your pocket.

I think I like it because it's so useless but still utilitarian — cyberpunk and gestural. It's a tool for a time / space-traveler who doesn't exist, or maybe does, and makes a tool that he would find handy.

It's also an experiment in pushing what small Flipper apps can do, and imagining utilities that would make sense within its capabilities — using the limits as a method of inspiration. This is what came from that.

![The orbital-mechanics constants and transfer math, in C on the Flipper Zero](https://res.cloudinary.com/ejf/image/upload/projects/flipper-space-calculators/code.png)

![The transfer solver — delta-v, flight time, and a celestial-body database keyed by semi-major axis](https://res.cloudinary.com/ejf/image/upload/projects/flipper-space-calculators/code2.png)

## Generative Art

I often just leave the Flipper on my desk below my monitor, and my feeling was: why not have it show me little evolving art pieces instead of just the time? What would that look and feel like? Is generative art even possible within the constraints of the Flipper's screen and processor? What does 1-bit generative art *feel* like? How can it evolve over the course of a day?

This is the answer: a Flipper Zero app that generates animated patterns in real time on the device's **128×64 monochrome screen**. It runs ten gradient families — horizontal, vertical, radial, diagonal, sine waves, interference, checkerboard, noise, spiral — and converts each to crisp 1-bit graphics with **Floyd–Steinberg dithering**, evolving the parameters every second at ~30fps.

![More real-time generative patterns](https://res.cloudinary.com/ejf/image/upload/projects/flipper-generative-art/gallery-5.png)

![Dithered radial patterns generated on the Flipper Zero](https://res.cloudinary.com/ejf/image/upload/projects/flipper-generative-art/gallery-1.png)

![Checkerboard and noise fields](https://res.cloudinary.com/ejf/image/upload/projects/flipper-generative-art/gallery-2.png)

![Interference and sine-wave fields, 1-bit dithered](https://res.cloudinary.com/ejf/image/upload/projects/flipper-generative-art/gallery-3.png)

![Diagonal gradients and spirals](https://res.cloudinary.com/ejf/image/upload/projects/flipper-generative-art/gallery-4.png)

Making something genuinely *generative* look good in 1-bit on a tiny embedded display is the whole challenge — the dithering is what turns smooth math gradients into something the Flipper's screen can actually render without looking like mud.
