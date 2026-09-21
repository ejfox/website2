---
title: "TV Station"
draft: true
date: 2026-05-01T00:00:00-04:00
category: "Art"
featured: false
url: https://tv.tools.ejfox.com
tech: ["TypeScript", "Deno", "Smallweb"]
state: deployed
ai-involvement: ai-assisted
tags:
  - web
  - experiment
---

On-demand broke the one good thing about cable: everybody watching the same thing at the same second — no pausing, nobody skipping ahead, no algorithm picking for you. So I built my own channel. Everyone who tunes in to [tv.tools.ejfox.com](https://tv.tools.ejfox.com) lands on the exact same frame, because the playhead is computed deterministically from a fixed epoch and the running sum of every video's duration. No database, no per-client state to keep in sync — just a single-file Deno app on smallweb. There's a live "N other viewers" counter too, so you can feel whether it's just you or a whole room.

The room I built it for is a little Discord community — people learning things together. Everyone can tune in and out and comment on what's happening at the same time, even though underneath it's just a playlist looping.

![The station mid-loop — everyone watching the same frame of the 224-hour broadcast](https://res.cloudinary.com/ejf/video/upload/projects/tv-station/demo.mp4)

What's actually playing is my own YouTube "Watch Later" list — 507 saved links, enriched down to the 475 that are still alive, about 224 hours of runtime looping around. So tuning in is really watching over my shoulder through the backlog I never got around to. It's a whole cable channel, and it's also just... my saved videos.

![The TV station landing — tuned to the channel](https://res.cloudinary.com/ejf/image/upload/projects/tv-station/landing.png)

![tv.tools.ejfox.com live](https://res.cloudinary.com/ejf/image/upload/projects/tv-station/web-0.png)

I also wrote up a Pi 5 kiosk recipe so it runs full-screen on the wall TV — an actual television, tuned to my channel.

The whole thing is [open source](https://github.com/ejfox/tv-station), and the point is that it's *yours*, not mine. It's one ~140-line Deno file plus a small Python recipe that eats a Watch Later export, an Obsidian or Notion vault, or a plain CSV and builds the playlist for you. Point it at your own backlog, drop it on smallweb behind any reverse proxy, and you've got your own public-access channel in an afternoon — no database to run, no state to babysit.
