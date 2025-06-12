---
title: "Draft Assistant"
date: 2025-01-30T13:12:53-05:00
modified: 2025-04-05T16:29:15-04:00
---

![](http://res.cloudinary.com/ejf/image/upload/v1743884865/Screenshot_2025-04-05_at_4.27.31_PM.png)

I built Draft Assistant because I wanted to build a system to encourage me to finish my draft blog posts in Obsidian.

This CLI tool is deliberately retro, with a 90s hacker aesthetic that makes me nostalgic for the days when computers were mysterious and text-based. It connects to a local LLM to analyze my drafts and suggest improvement paths - kind of like having a no-nonsense editor who lives in your terminal.

The entire app is a single JavaScript file because I'm stubborn like that. It uses Blessed for the terminal UI (which is criminally underrated for building text interfaces) and deliberately avoids colors or fancy styling. The navigation is all keyboard-based - arrow keys, Enter, and single-letter commands like 'n' for next and 'z' for metadata.

My favorite feature is how it structures the writing improvement process like an old-school RPG quest: select your draft, choose an improvement path, then follow step-by-step guidance to level up your writing.