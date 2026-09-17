---
title: "cyberdeck-saver"
date: 2026-04-20T00:00:00-04:00
category: "Tools"
featured: false
url: https://github.com/ejfox/cyberdeck-saver
tech: ["Swift", "Metal", "macOS", "OSINT"]
state: deployed
ai-involvement: ai-assisted
tags:
  - macos
  - osint
  - design
---

Most cyberpunk desktops are set dressing — fake terminals scrolling gibberish for the vibe. This one is real. cyberdeck-saver is a native macOS screensaver, written in Swift and Metal, that turns your idle screen into an actual command center: a 5×5 grid of 25 terminal panels, each typing itself out with live data and post-processed through a CRT shader chain in the vulpes palette.

The rule behind it is one line from the README — *no fake data; every byte on screen comes from a real API or a system call.* So the panels are wired to things that are actually happening: aircraft crossing the airspace over the Hudson Valley on live ADS-B, earthquakes above magnitude 2.5 in the last day, the planetary K-index off NOAA's space-weather feed, the ISS's current distance from wherever you're sitting. Next to those runs your own telemetry — Apple Health, system thermals, GitHub commits, chess ratings, what's playing on Last.fm — and your scrapbook's extracted knowledge, down to the claim-triples and the entities trending across your last fifty saves.

![The data streams — each terminal panel fetches and parses its own feed; here, haversine math for scrapbook distances](https://res.cloudinary.com/ejf/image/upload/projects/cyberdeck-saver/streams.png)

Every panel is config-driven, the grid auto-scales to however many you switch on, and they share a single process-wide cache so twenty-five live feeds never hammer a source. The result is the whole world you actually pay attention to — the sky, the ground, the orbit, and your own life — rendered as the thing your Mac shows when you walk away from it.

![The Metal fragment shader behind the screensaver's CRT look](https://res.cloudinary.com/ejf/image/upload/projects/cyberdeck-saver/code.png)
