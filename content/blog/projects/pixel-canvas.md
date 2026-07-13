---
title: "Pixel Canvas"
date: 2026-05-27T00:00:00-04:00
category: "Hardware & Radio"
featured: true
draft: false
url: https://github.com/ejfox/pixel-canvas
tech: ["ESP32-S3", "Arduino", "LovyanGFX", "Bash", "REST API"]
state: doing
ai-involvement: ai-assisted
tags:
  - hardware
  - device
  - dataviz
  - quantified-self
---

I spend all day looking at screens that want something from me. Pixel Canvas is a screen that doesn't — a networked **320×240 display that sits on my desk** and quietly shows me my own life in the Vulpes palette.

It's an ESP32-S3-BOX-3B running a little Arduino REST API, driven by a bash CLI that rotates through "scenes" every fifteen minutes. Each scene is a tiny self-contained script that fetches from some corner of my data and draws it with primitives over HTTP — the weather, the last film I watched with my rating, the book I'm in the middle of, my best typing speed, a random card from the gear closet, a line from my journal.

![A day of the display's rotation, compressed — all fourteen scenes as the device cycles them](https://res.cloudinary.com/ejf/video/upload/projects/pixel-canvas/scene-rotation.mp4)

![Today's weather as a desk-display scene](https://res.cloudinary.com/ejf/image/upload/projects/pixel-canvas/weather.png)

![The last film I watched, with my rating](https://res.cloudinary.com/ejf/image/upload/projects/pixel-canvas/last-film.png)

The whole thing is the opposite of a notification feed. Nothing on it is urgent, nothing is trying to pull me back in. It's ambient — you glance at it the way you glance out a window, and mostly you just let it cycle in the corner of your eye while you work.

That's the part I actually care about. I've been tracking myself for years across a dozen systems, and the usual pitch for all that data is optimization: quantify yourself, find the inefficiency, grind it down. I've never been interested in that. I wanted to turn the panopticon inward and just *look* — not "how do I do more," but "what does a day of mine actually look like when it's reflected back and I'm not the one narrating it"

![A random gear card](https://res.cloudinary.com/ejf/image/upload/projects/pixel-canvas/gear.png)

![Best WPM, pulled from my typing stats](https://res.cloudinary.com/ejf/image/upload/projects/pixel-canvas/wpm.png)

![The book I'm currently reading](https://res.cloudinary.com/ejf/image/upload/projects/pixel-canvas/reading.png)

![Morning greeting](https://res.cloudinary.com/ejf/image/upload/projects/pixel-canvas/greeting.png)

## How it works

- **Firmware** — an Arduino sketch (LovyanGFX on the ESP32-S3-BOX-3B) exposes a small drawing REST API: `/pixel`, `/rect`, `/circle`, `/text`, plus a browser drawing UI served at `/`. The device knows nothing about my life; it just knows how to draw.
- **CLI** — `pixel <scene>` pings the device, then runs the scene script. Every draw command is also logged, so a companion renderer (`pixel-render`) can snapshot exactly what's on the glass to a PNG — which is where every image on this page came from.
- **Rotation** — a launchd job picks a scene every fifteen minutes, so it keeps cycling through my data on its own, no input from me.

![A todo scene](https://res.cloudinary.com/ejf/image/upload/projects/pixel-canvas/todos.png)

![Clock](https://res.cloudinary.com/ejf/image/upload/projects/pixel-canvas/clock.png)

By now there's a scene for nearly every corner of the archive — a random old tweet, a draft note yanked out of Obsidian, this week's intelligence-summary wiki page, the day's site analytics, a line of cipher text, and when there's genuinely nothing to say, a quiet field of ambient dots.

![A random tweet from the archive](https://res.cloudinary.com/ejf/image/upload/projects/pixel-canvas/tweet.png)

![A draft note pulled from Obsidian](https://res.cloudinary.com/ejf/image/upload/projects/pixel-canvas/draft.png)

![This week's intelligence-summary wiki page](https://res.cloudinary.com/ejf/image/upload/projects/pixel-canvas/wiki.png)

![Today's site analytics](https://res.cloudinary.com/ejf/image/upload/projects/pixel-canvas/umami.png)

![A line of cipher text](https://res.cloudinary.com/ejf/image/upload/projects/pixel-canvas/cipher.png)

![Ambient dots](https://res.cloudinary.com/ejf/image/upload/projects/pixel-canvas/ambient-dots.png)

The scenes I like best are the ones that catch me off guard — a tweet from a version of me I'd half-forgotten, a book I keep meaning to finish. A small calm machine for remembering there's a life on this side of the screen too.
