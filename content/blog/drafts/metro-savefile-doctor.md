---
date: 2026-01-17T16:45:00-05:00
dek: Reverse engineering game save files and building a TUI editor with crackintro aesthetics
tags:
  - programming
  - gamedev
  - reverse-engineering
  - tui
  - tools
inprogress: true
---

# Metro Savefile Doctor

## The Idea

A beautiful TUI tool for editing Subway Builder save files, featuring a crackintro aesthetic and automatic backup.

## Outline

### The Problem
- Subway Builder saves are binary blobs
- Want to edit money, trains, game time
- No official editor exists

### Reverse Engineering the Format
- `.metro` files: 4KB header + compressed data + metadata
- Also supports plain JSON saves
- How I figured out the structure

### The Features
- 💰 Edit Money
- ⏱️ Edit Game Time
- 🚆 Edit Train Count
- 🎫 Edit Transit Cost
- 💾 Auto Backup (before every modification)

### The Crackintro Aesthetic
- Why TUIs are cool again
- Retro vibes with modern tooling
- Ink (React for CLIs) + Chalk

### Building the TUI

```bash
./cli.js my-save.metro
```

**Controls:**
- Arrow keys to navigate
- Enter to edit
- `s` to save
- `q` to quit

### Cross-Platform Desktop App
- Tauri wrapper
- Drag & drop support
- Analysis reports

### Technical Details
- Node.js 18+
- Ink for React-style TUI
- Binary format parsing
- Automatic backup system

## Screenshots

[Add TUI screenshots]

## What I Learned
- Binary file format reverse engineering
- Building delightful CLI experiences
- The joy of crackintro aesthetics

## Links

- GitHub releases for desktop app
- macOS, Windows, Linux support

