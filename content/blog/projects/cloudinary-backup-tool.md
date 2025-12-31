---
title: 'Cloudinary Backup Tool'
date: 2025-01-15T00:00:00-05:00
github: https://github.com/ejfox/cloudinary-backup-tool
tech: ['Tauri', 'Rust', 'TypeScript', 'Vite']
modified: 2025-08-13T11:58:10-04:00
industry: ['Developer Tools', 'Photography']
client: Open Source
tags:
  - tools
  - photography
---

## The Problem

Cloudinary's admin panel lets you download files one at a time. I had 15,000+ photos stored there. The CLI tools exist but require setup. I just wanted to click a button and get my photos back.

## What I Built

A desktop app built with Tauri (Rust backend, web frontend) that downloads your entire Cloudinary library to a local folder.

![](http://res.cloudinary.com/ejf/image/upload/v1755100480/screenshot_2025-08-13_at_11.54.28_AM.png)

**Features:**
- Resume interrupted downloads
- Batch processing without memory bloat (unlike Electron)
- Progress tracking and error handling
- Cross-platform (macOS, Windows, Linux)

## Why Tauri?

Electron apps are memory hogs. Tauri gives you native performance with a web UI. For a tool that might run for hours downloading thousands of files, that matters.
