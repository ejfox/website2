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

For presentations and livestreaming: show every key you press as large ASCII art on screen, so an audience can follow along

This is a fun "can robots make TUIs?" experiment. Answer: they can, and it's fun. The idea is to have it open in a tmux pane while I work — especially vim stuff, where people wanna know your shortcuts. The question gets answered, and that's the point.

![How it works — pynput captures keys, pyfiglet renders them as centered ASCII art](https://res.cloudinary.com/ejf/image/upload/projects/showtouch/code.png)

![showtouch displaying a keystroke as full-screen centered ASCII art](https://res.cloudinary.com/ejf/image/upload/projects/showtouch/demo.png)
