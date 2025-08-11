---
title: "Cloudinary Backup Tool"
date: 2025-01-15
github: https://github.com/ejfox/cloudinary-backup-tool
tech: ["Tauri", "Rust", "TypeScript", "Vite"]
---

Needed to backup thousands of photos from Cloudinary, so I built a little desktop app with Tauri. It handles batch downloads without eating all your RAM and lets you resume if something goes wrong.

![](http://res.cloudinary.com/ejf/image/upload/v1736967824/Screenshot_2025-01-15_at_3.23.17_PM.png)

The Rust backend does the heavy lifting while the web frontend keeps things simple. Added some basic credential storage with XOR encryption - nothing fancy, just enough to not leave API keys lying around in plaintext.