---
title: 'Vulpes Theme Lab'
date: 2025-10-24T00:00:00-04:00
url: https://github.com/ejfox/vulpes-theme-lab
tech: ['Vue 3', 'Nuxt', 'TypeScript', 'CodeMirror', 'Chroma.js']
state: deployed
aiInvolvement: ai-assisted
industry: ['Developer Tools', 'Design']
client: Open Source
tags:
  - tools
  - design
  - terminal
---

## The Problem

Terminal theme builders are everywhere, but they show you one thing: a fake terminal preview. Meanwhile, your real workflow is Neovim, Lazygit, Htop, Tmux—and each needs its own config file. Building a theme means exporting to 6+ formats and hoping the colors look right together.

## What I Built

[Vulpes Theme Lab](https://ejfox.github.io/vulpes-theme-lab/)—a theme builder that previews your colors across your *actual* tools in real-time. Pick a color, watch Neovim's LSP diagnostics update, see Lazygit's diff colors change, preview your Tmux status bar.

**Live previews for:**
- Neovim (100+ highlight groups, LSP support, Telescope)
- Lazygit (branch panels, diffs, stash views)
- Htop (system monitoring layout)
- Tmux (multi-pane layouts)
- CodeMirror (for web editors)

**Exports to:**
- Ghostty terminal config
- Neovim colorscheme
- Bat syntax highlighter
- Yazi file manager
- Lazygit theme
- Zsh (syntax highlighting, fzf, Powerlevel10k)

## Design Philosophy

Minimal variation, maximum signal. The color math uses ±7° hue offsets for consistency—just enough variation to distinguish elements, not so much that it becomes visual noise. There's even a monochrome mode for absolute clarity.

[Try it live →](https://ejfox.github.io/vulpes-theme-lab/)
