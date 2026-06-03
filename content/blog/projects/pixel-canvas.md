---
title: "Pixel Canvas"
date: 2026-05-27T00:00:00-04:00
draft: true
url: https://github.com/ejfox/pixel-canvas
tech: ["ESP32-S3", "Arduino", "LovyanGFX", "Bash", "REST API"]
state: doing
aiInvolvement: ai-assisted
tags:
  - hardware
  - device
  - dataviz
  - quantified-self
---

<!-- TODO (EJ): add your voice. These are the device's own rendered frames; the DREAM
     hero is a real photo of the 320×240 display glowing on your desk (it's on the
     Photo Day list). Draft until then. -->

A networked **320×240 pixel display that sits on my desk** and shows me my own life in the Vulpes palette. It's an ESP32-S3-BOX-3B running an Arduino REST API, driven by a little bash CLI that rotates through "scenes" pulled from my personal data — gear, films, books, weather, typing speed, drafts, the wiki, todos — every 15 minutes.

![Today's weather as a desk-display scene](https://res.cloudinary.com/ejf/image/upload/projects/pixel-canvas/weather.png)
![The last film I watched, with my rating](https://res.cloudinary.com/ejf/image/upload/projects/pixel-canvas/last-film.png)

Each scene is a tiny self-contained script that fetches from a data source and draws with primitives (`pixel`, `rect`, `circle`, `text`) over HTTP. A morning greeting; the current temperature; the book I'm reading; my best typing speed; a random gear card; a line from my journal. The whole thing is a calm, glanceable ambient display — the opposite of a notification feed.

![A random gear card](https://res.cloudinary.com/ejf/image/upload/projects/pixel-canvas/gear.png)
![Best WPM, pulled from my typing stats](https://res.cloudinary.com/ejf/image/upload/projects/pixel-canvas/wpm.png)
![The book I'm currently reading](https://res.cloudinary.com/ejf/image/upload/projects/pixel-canvas/reading.png)
![Morning greeting](https://res.cloudinary.com/ejf/image/upload/projects/pixel-canvas/greeting.png)

## How it works

- **Firmware** — an Arduino sketch (LovyanGFX on the ESP32-S3-BOX-3B) exposes a small drawing REST API: `/pixel`, `/rect`, `/circle`, `/text`, plus a browser drawing UI served at `/`.
- **CLI** — `pixel <scene>` pings the device, then runs the scene script; every draw command is also logged so a companion renderer (`pixel-render`) can snapshot exactly what's on the screen to a PNG. (The images on this page are those snapshots.)
- **Rotation** — a launchd job picks a scene every 15 minutes, so the display keeps cycling through my data on its own.

![A todo scene](https://res.cloudinary.com/ejf/image/upload/projects/pixel-canvas/todos.png)
![Clock](https://res.cloudinary.com/ejf/image/upload/projects/pixel-canvas/clock.png)

There are scenes for nearly every corner of my data — a random old tweet, a draft note pulled from Obsidian, this week's intelligence-summary wiki page, today's site analytics, a line of cipher text, and a quiet field of ambient dots when there's nothing to say.

![A random tweet from the archive](https://res.cloudinary.com/ejf/image/upload/projects/pixel-canvas/tweet.png)
![A draft note pulled from Obsidian](https://res.cloudinary.com/ejf/image/upload/projects/pixel-canvas/draft.png)
![This week's intelligence-summary wiki page](https://res.cloudinary.com/ejf/image/upload/projects/pixel-canvas/wiki.png)
![Today's site analytics](https://res.cloudinary.com/ejf/image/upload/projects/pixel-canvas/umami.png)
![A line of cipher text](https://res.cloudinary.com/ejf/image/upload/projects/pixel-canvas/cipher.png)
![Ambient dots](https://res.cloudinary.com/ejf/image/upload/projects/pixel-canvas/ambient-dots.png)
