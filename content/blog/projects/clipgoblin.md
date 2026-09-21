---
title: "Clipgoblin"
draft: true
date: 2026-04-29T00:00:00-05:00
category: "Tools"
featured: false
tech: ["Swift"]
state: deployed
ai-involvement: ai-assisted
tags:
  - tools
---

![Clipgoblin running in a vulpes-themed terminal](https://res.cloudinary.com/ejf/image/upload/projects/clipgoblin/terminal.png)

clipgoblin came out of a real editing problem. I was buried in a corpus of long recorded talks and lectures — hours of it — that I needed to actually navigate for a research project, and scrubbing Final Cut timelines to find the one moment someone said the thing was breaking me. So I built a tool that reads the transcript and drops a marker at every concept-relevant moment straight into the Final Cut timeline. Now I move through hours of footage by hitting `Ctrl+'` instead of scrubbing.

![The CLI — generating concept-tagged FCPXML markers from a words.json transcript](https://res.cloudinary.com/ejf/image/upload/projects/clipgoblin/code2.png)

Under the hood it shells out to Whisper for word-level transcription, then generates concept-tagged FCPXML markers from the resulting `words.json` — so each marker lands on the exact word, not a rough guess. It's the difference between an archive you dread opening and one you can move through at the speed of thought.

![Resolving and shelling out to whisper for word-level transcription](https://res.cloudinary.com/ejf/image/upload/projects/clipgoblin/code.png)
