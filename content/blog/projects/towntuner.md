---
title: 'TownTuner'
date: 2025-08-16T00:00:00-04:00
url: https://github.com/ejfox/towntuner
tech: ['SwiftUI', 'iOS', 'CloudKit', 'AVFoundation', 'CarPlay']
state: doing
aiInvolvement: ai-assisted
industry: ['Consumer Apps', 'Audio']
client: Personal Project
tags:
  - ios
  - audio
  - app
---

## The Problem

Harmontown ran for 360 episodes over 7 years. I've been falling asleep to it for a decade. But podcast apps are designed for "catching up" - skip around, mark as played, move on. I needed the opposite: a completionist system that tracked *actually* listening to every episode, in order, while half-asleep.

## What I'm Building

TownTuner - a podcast player built for one show and one use case: falling asleep to Harmontown, night after night, until you've genuinely heard all 360 episodes.

**The prestige system:**
- Episodes only count at 85% completion
- Must complete all 360 chronologically to prestige
- Smart shuffle plays only unplayed episodes
- Sleep timer with automatic fade-out

**Designed for half-asleep operation:**
- Thumb-first navigation (one-handed, eyes closed)
- Liquid glass UI with minimal cognitive load
- Resume exactly where you fell asleep

## Technical Details

SwiftUI with AVFoundation for audio, CloudKit for cross-device sync. Full CarPlay and AirPlay support. Lock screen controls that actually work. Offline-first so your bedtime routine doesn't depend on WiFi.

## Why This Exists

Every podcast app assumes you want to finish and move on. TownTuner assumes you want to live inside one show forever. Different product for a different relationship with audio.
