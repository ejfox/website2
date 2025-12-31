---
title: 'Vulpes Browser'
date: 2025-12-29T00:00:00-05:00
url: https://github.com/ejfox/vulpes-browser
tech: ['Swift', 'Zig', 'Metal', 'GLSL']
state: doing
aiInvolvement: ai-assisted
industry: ['Developer Tools', 'Experimental']
client: Personal Project
tags:
  - browser
  - experimental
  - zig
---

## The Hypothesis

What if a web browser was designed purely for reading? No JavaScript, no CSS layout, no images—just text extraction and keyboard navigation. Vim-style browsing for the reader who treats the web as a document archive.

## What I'm Building

Vulpes—a text-focused browser built from scratch. Swift for the macOS UI, Zig for text processing, Metal for GPU-accelerated rendering with custom shaders.

**Navigation:**
- `j/k` to scroll, `d/u` for half-pages
- `G/gg` for top/bottom
- `1-9` to follow numbered links
- Keyboard-first, mouse-optional

**Intentional limitations:**
- No JavaScript (SPAs show minimal content—that's the point)
- No CSS layout (text extraction only)
- No images
- No forms

## Why This Matters

Most browsers are application platforms that happen to display documents. Vulpes is a document reader that refuses to be an application platform.

It's also a learning project—building a browser from scratch teaches you how much complexity we accept as normal. The answer: too much.

## Status

Beta. Works for text-heavy sites, breaks on modern SPAs (by design). Custom GLSL shader support for visual customization.
