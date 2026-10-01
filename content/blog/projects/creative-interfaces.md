---
title: "Hand-Tracking & Generative Art"
date: 2024-07-01T00:00:00-04:00
category: "Art"
featured: false
modified: 2025-08-13T11:46:54-04:00
tech: ["Computer Vision", "MIDI", "WebGL", "Hand Tracking", "Generative Art", "Interactive Media"]
state: deployed
ai-involvement: ai-assisted
tags:
  - creativity
  - interfaces
---

These are my attempts to make computers that respond to the way humans actually move and gesture—exploring the design space between human intuition and machine capability. Each project pushes beyond traditional HCI constraints to find new interaction models. Some of these work better than others, but they all represent steps toward interfaces that feel more like extensions of thought than barriers to it.

The other day I had this idea to try and control a modular synth using computer vision. I loaded YOLOv4 into a python script and had it detect objects in an episode of Atlanta I had lying around, sending the X and Y positions of every object as control voltage to the oscillators. It makes this weird, haunting, sort of robotic sound — but I kind of really like it. Then I had a fun idea to run it through the webcam, and I couldn't figure out why it wasn't working — I kept seeing the chair as an object. Then I figured it out: the chair is the instrument. Why did I make a chair an instrument? I don't know. I ended up running dance videos from Sherrie Silver, the This Is America choreographer, through it instead — not just the X and Y positions but the distances between the objects — and it comes up with some really cool, interesting generative effects. I don't really know how I use this right now, or what it's for exactly. That's kind of how I know it's art.

That session: [Using Computer Vision As A MIDI Controller](https://www.youtube.com/watch?v=k2u--wFhcS4).

The other end of the spectrum: no camera, no screen at all. I've been using Talon to control my computer, so I tried to do the dishes and code at the same time — talking to Claude while my hands were in the sink, having it answer everything out loud. There are some sharp edges — a couple times it didn't pick up everything I said — but the fact that you can detach from looking at a screen and still engage in the mechanical task of writing code and making things with a computer is completely radical. It's unlike anything I've ever experienced in my life.

That one's on video too: [Coding While I Do The Dishes](https://www.youtube.com/watch?v=381Wq9jYOGk).

## Projects

1. [hand-midi-controller](https://github.com/ejfox/hand-midi-controller): Professional hand tracking MIDI controller with TouchDesigner integration. Converts hand movements to MIDI with detailed performance timing breakdowns and memory analysis for creative interface exploration.
2. [handtrack-websockets](https://github.com/ejfox/handtrack-websockets): Real-time gesture streaming pushing the boundaries of browser-based interaction.
3. [flipper-generative-art](https://github.com/ejfox/flipper-generative-art): Real-time generative art and animated patterns for Flipper Zero with 10 gradient types, Floyd-Steinberg dithering, and smooth 30 FPS animations. Finding art within the constraints of 64KB RAM.
4. [ps5-tmux](https://github.com/ejfox/ps5-tmux) is a little tool to make it easier to vibe-code; just move between panes with your PS5 controller and accept changes with the X button, or hit the middle button to enter dictation mode.

![Dithered generative noise pattern from flipper-generative-art, rendered for the Flipper Zero display](https://res.cloudinary.com/ejf/image/upload/v1785421904/projects/creative-interfaces/flipper-dither-noise.png)

![Floyd-Steinberg dithered gradient field from flipper-generative-art](https://res.cloudinary.com/ejf/image/upload/v1785421834/projects/creative-interfaces/flipper-dither-field.png)

## Hand-tracking & gesture

### Hand MIDI Controller

![Hand MIDI Controller — MediaPipe hand landmarks mapped to MIDI CC](https://res.cloudinary.com/ejf/image/upload/projects/hand-midi-controller/diagram.png)

[Hand MIDI Controller](https://github.com/ejfox/hand-midi-controller) is a real-time hand-tracking MIDI controller built on MediaPipe and OpenCV, turning hand movements into MIDI control signals for music production, VJing, and performance. It includes TouchDesigner integration.

### Handtrack WebSockets

[Handtrack WebSockets](https://github.com/ejfox/handtrack-websockets) does real-time 3D hand tracking with MediaPipe, OpenCV, and FastAPI, streaming hand position and rotation over WebSockets. It includes a cyberpunk visualization layer that renders the tracked hand.

### OpenCV MIDI Controller

![OpenCV MIDI Controller — OpenCV object tracking driving MIDI CC](https://res.cloudinary.com/ejf/image/upload/projects/opencv-midi-controller/diagram.png)

[OpenCV MIDI Controller](https://github.com/ejfox/opencv-midi-controller) is an experiment in sending MIDI signals based on OpenCV object detection.

### Speech Echoes

![Live speech rendered as decaying typographic echoes](https://res.cloudinary.com/ejf/image/upload/projects/opencv-talk-typography/echo-1.png)

Speech Echoes is a Vue app that captures live speech and renders it as decaying typographic "echoes," with a font and weight captured per utterance. It's built with p5, MediaPipe, and d3-force.

### Glasses HUD

![The two lenses you compose a HUD across](https://res.cloudinary.com/ejf/image/upload/projects/glasses-hud/lenses.png)

[Glasses HUD](https://ejfox.github.io/glasses-hud/) is a tool for quickly prototyping AR lens visualizations and HUDs. Drag data widgets onto the left and right lenses to compose a heads-up display from live bio, motion, location, environment, and device signals.
