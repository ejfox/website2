---
title: "Dispatch"
date: 2026-01-15T00:00:00-05:00
draft: true
url: https://github.com/ejfox/website-dispatch
tech: ["Tauri", "Rust", "Vue", "Obsidian"]
state: evolved
aiInvolvement: ai-assisted
tags:
  - tools
  - obsidian
  - web
---

<!-- TODO (EJ): you work on this constantly — definitely your voice here, not
     mine. Factual stub only. Draft until ready. -->

A Tauri desktop app for publishing Obsidian notes straight to ejfox.com — keyboard-driven, fast, and built around the exact markdown pipeline this site uses. Scans the vault for `blog/` and `drafts/`, tracks LIVE / MODIFIED / draft status by content diff, previews with the real website renderer, and publishes with a one-click git commit + push. Supports scheduled publishing (`publish_at`) and visibility controls (public / unlisted / password-protected).

![Dispatch — keyboard-driven Obsidian-to-website publishing app](https://res.cloudinary.com/ejf/image/upload/v1780065760/projects/website-dispatch/1.png)
