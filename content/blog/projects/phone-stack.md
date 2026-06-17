---
title: "phone-stack"
date: 2026-04-20T00:00:00-04:00
draft: true
url: https://github.com/ejfox/phone-stack
tech: ["JavaScript", "WebSockets", "Browser"]
state: deployed
aiInvolvement: ai-assisted
tags:
  - web
  - experiment
  - multiplayer
---

<!-- TODO (EJ): add your voice. These shots are captured from the running app; the
     DREAM hero is still a real photo of phones laid in a row playing one piece —
     grab that whenever you can and drop it on top. Draft until then. -->

Lay your phones in a row, all press-and-hold together, and a single composition plays across every screen in sync — each phone showing its slice of a wider piece. A browser-based collaborative video toy for 2–8 phones. It only works when you're together.

![phone-stack — lay your phones in a row, tap together, watch one piece flow across them](https://res.cloudinary.com/ejf/image/upload/projects/phone-stack/landing.png)

The hard part isn't the video — it's the clock. Every phone joins a room by QR code and then continuously measures its **offset, round-trip time, and drift** against the host so all the screens stay frame-aligned; the host "locks" the room once everyone's in, and the piece plays as one wide canvas sliced across the devices. The built-in simulator spins up any number of virtual phones so you can watch the sync handshake without rounding up friends.

![The simulator: virtual phones negotiating clock offset / RTT / drift, joining by QR, waiting for the host to lock the room](https://res.cloudinary.com/ejf/image/upload/projects/phone-stack/simulator.png)
