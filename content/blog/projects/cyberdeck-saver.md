---
title: "cyberdeck-saver"
date: 2026-04-20T00:00:00-04:00
draft: true
url: https://github.com/ejfox/cyberdeck-saver
tech: ["Swift", "Metal", "macOS", "OSINT"]
state: deployed
aiInvolvement: ai-assisted
tags:
  - macos
  - osint
  - design
---

<!-- TODO (EJ): add your voice. NEEDS A HERO — a screen recording of the
     screensaver running would be spectacular. Draft until captured. -->

A native macOS screensaver (`.saver`) in Swift + Metal: a 5×5 grid of terminal panels typing out real-time data from your personal APIs and OSINT feeds, run through a CRT shader chain in the vulpes palette. A cyberpunk command center on your idle screen — and no fake data.

![The Metal fragment shader behind the screensaver's CRT look](https://res.cloudinary.com/ejf/image/upload/projects/cyberdeck-saver/code.png)

![The data streams — each terminal panel fetches and parses its own feed; here, haversine math for scrapbook distances](https://res.cloudinary.com/ejf/image/upload/projects/cyberdeck-saver/streams.png)
