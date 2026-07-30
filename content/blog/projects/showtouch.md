---
title: "showtouch"
date: 2024-10-01T00:00:00-04:00
category: "Tools"
featured: false
url: https://github.com/ejfox/showtouch
tech: ["Python", "ASCII Art", "Terminal"]
state: prototype
ai-involvement: ai-assisted
tags:
  - cli
  - terminal
  - programming
---

For presentations and livestreaming: show every key you press as large ASCII art on screen, so an audience can follow along.

This was a fun "can robots make TUIs?" experiment. Answer: they can, and it's fun. The idea was to have it open in a tmux pane while I work — especially vim stuff, where people wanna know your shortcuts — but I clearly don't use it; I have like 250 GitHub repos now. The question got answered, and that was the point.

![showtouch displaying a keystroke as full-screen centered ASCII art](https://res.cloudinary.com/ejf/image/upload/projects/showtouch/demo.png)

![How it works — pynput captures keys, pyfiglet renders them as centered ASCII art](https://res.cloudinary.com/ejf/image/upload/projects/showtouch/code.png)
