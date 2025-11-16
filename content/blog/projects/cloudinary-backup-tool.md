---
title: 'Cloudinary Backup Tool'
date: 2025-01-15T00:00:00-05:00
github: https://github.com/ejfox/cloudinary-backup-tool
tech: ['Tauri', 'Rust', 'TypeScript', 'Vite']
modified: 2025-08-13T11:58:10-04:00
tags:
  - tools
  - photography
---

I needed to backup thousands of photos from Cloudinary, and couldn't find an easy standalone tool to do so. So I built a little desktop app with Tauri. It handles batch downloads without eating all your RAM (vs an Electron app) and lets you resume if something goes wrong.

![](http://res.cloudinary.com/ejf/image/upload/v1755100480/screenshot_2025-08-13_at_11.54.28_AM.png)
