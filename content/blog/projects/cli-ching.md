---
title: "CLI-CHING"
date: 2025-01-15T18:42:31-05:00
modified: 2025-04-05T16:26:53-04:00
---

I've always been fascinated by the I Ching (Book of Changes), so naturally, I built a terminal-based version that brings this 3,000-year-old divination system to the command line.

![](http://res.cloudinary.com/ejf/video/upload/v1743884693/ITerm2-cli-ching.mp4)

CLI-CHING doesn't try to digitize the entire process - you still need to physically toss three coins and report their results (heads/tails). This preserves the meditative ritual while letting the app handle the complex hexagram calculations and interpretations.

The technical bits were surprisingly interesting:

- Building a system to convert coin tosses into binary line types (yin/yang, changing/unchanging)
- Creating ASCII visualizations of the resulting hexagrams
- Implementing a local LLM connection to connect with [LM Studio](https://lmstudio.ai) to generate contextual interpretations

There's something delightfully contradictory about consulting an ancient oracle through a terminal prompt. My favorite feature is the consultation history that's saved to a dotfile (`.iching-throws`), which lets you track patterns in your questions and the resulting hexagrams over time. This combination of esoteric analog frameworks with the command line scratches a unique itch that I have around how I want to use computers.