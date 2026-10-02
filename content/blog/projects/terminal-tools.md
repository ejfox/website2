---
title: "Terminal Tools"
date: 2026-09-30T00:00:00-04:00
category: "Tools"
featured: false
draft: false
tech: ["Rust", "Go", "Python", "Node.js", "Shell", "tmux"]
state: deployed
ai-involvement: ai-assisted
tags:
  - cli
  - terminal
  - tools
---

Fourteen small programs for the terminal: utilities for working inside tmux, a few input and display experiments, and some games and toys. Each name links to its code.

## Utilities

### git-status-dash

![git-status-dash showing multiple repositories at once](https://res.cloudinary.com/ejf/image/upload/v1743884042/Screenshot_2025-04-05_at_4.13.46_PM.png)

[git-status-dash](https://github.com/ejfox/git-status-dash) shows the status of every repository in a folder at a glance — one terminal dashboard for all your work in progress. It's written in Go, with commands for config, themes, and status.

### GitHub Sloth

![The PR rollup logic in Rust — status glyphs and age coloring](https://res.cloudinary.com/ejf/image/upload/projects/github-sloth/code.png)

[GitHub Sloth](https://github.com/ejfox/github-sloth) is a minimalist amber-on-black terminal UI for GitHub PRs, reviews, and checks, written in Rust. It's designed to complement lazygit.

### tmux-link-grab

![tmux-link-grab in action](https://res.cloudinary.com/ejf/image/upload/projects/tmux-link-grab/demo.gif)

[tmux-link-grab](https://github.com/ejfox/tmux-link-grab) grabs and opens the links scattered across your terminal panes. No mouse, no scrollback hunting.

### Music CLI

![The command reference — track management, a radio scheduler, and setup/watcher commands](https://res.cloudinary.com/ejf/image/upload/projects/music-cli/cli.png)

[Music CLI](https://github.com/ejfox/music-cli) manages the audio that powers music.tools.ejfox.com and the radio — list, move, upload, convert, and tag tracks straight from the shell. Reads hit Cloudflare R2 directly; writes go through wrangler.

### Robots

![Robots running in a vulpes-themed terminal](https://res.cloudinary.com/ejf/image/upload/projects/robots/terminal.png)

[Robots](https://github.com/ejfox/robots) is a live cockpit for every Claude Code agent on the machine, written in Rust. It needs zero instrumentation and works retroactively on sessions that are already running.

## Input and display

### PS5 Tmux

![PS5 Tmux running in a vulpes-themed terminal](https://res.cloudinary.com/ejf/image/upload/projects/ps5-tmux/terminal.png)

[PS5 Tmux](https://github.com/ejfox/ps5-tmux) controls tmux with a PS5 DualSense controller. Move between panes with the controller, accept changes with the X button, or hit the middle button to enter dictation mode.

### Talon Sketchybar

![Talon Sketchybar running in a vulpes-themed terminal](https://res.cloudinary.com/ejf/image/upload/projects/talon-sketchybar/terminal.png)

[Talon Sketchybar](https://github.com/ejfox/talon-sketchybar) pushes Talon Voice state into sketchybar — event-driven, zero polling, about 60 lines of Python. It includes a Karabiner double-shift integration.

### showtouch

![showtouch displaying a keystroke as full-screen centered ASCII art](https://res.cloudinary.com/ejf/image/upload/projects/showtouch/demo.png)

[showtouch](/projects/showtouch) shows every key you press as large ASCII art on screen, so an audience can follow along during presentations and livestreams. pynput captures the keys and pyfiglet renders them.

### ascii_webcam

![ascii_webcam turning a live scene into terminal ASCII](https://res.cloudinary.com/ejf/image/upload/projects/ascii_webcam/demo.png)

[ascii_webcam](https://github.com/ejfox/ascii_webcam) shows your webcam as ASCII art in the terminal. It supports customizable cyberpunk 3D scenes, gradient palettes, and Floyd–Steinberg dithering.

## Games and toys

### CLI Ching

![cli-ching — the I Ching oracle in the terminal, with throw history and the coin-toss prompt](https://res.cloudinary.com/ejf/image/upload/projects/cli-ching/reading.png)

[CLI Ching](https://github.com/ejfox/cli-ching) walks you through six coin tosses, builds your I Ching hexagram, and interprets the reading. It keeps a history of past throws.

### CLI Conway

![CLI Conway running in a vulpes-themed terminal](https://res.cloudinary.com/ejf/image/upload/projects/cli-conway/terminal.png)

[CLI Conway](https://github.com/ejfox/cli-conway) runs Conway's Game of Life in the terminal. The cells are drawn in braille unicode characters.

### CLI Delta Dojo

![CLI Delta Dojo title screen](https://res.cloudinary.com/ejf/image/upload/projects/cli-delta-dojo/title.png)

[CLI Delta Dojo](https://github.com/ejfox/cli-delta-dojo) is a terminal reflex game for training your eye to spot differences. Two values flash up and you call them *Different* or *Same* as fast as you can, against the clock.

### CLI Ascii 3D

![CLI Ascii 3D running in a vulpes-themed terminal](https://res.cloudinary.com/ejf/image/upload/projects/cli-ascii-3d/terminal.png)

[CLI Ascii 3D](https://github.com/ejfox/cli-ascii-3d) renders 3D shapes as ASCII art in the command line.

### CLI AI Chat

![CLI AI Chat running in a vulpes-themed terminal](https://res.cloudinary.com/ejf/image/upload/projects/cli-ai-chat/terminal.png)

[CLI AI Chat](https://github.com/ejfox/cli-ai-chat) is an IRC-style terminal interface for LLM conversations, in the same channel-and-buffer idiom as an IRC client. Vim-style modes and keybindings handle navigation between threads.
