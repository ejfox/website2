---
title: "TownTuner"
date: "2025-08-16"
featured: false
tags: ["ios", "swift", "podcasts", "harmontown", "gamification"]
---

# TownTuner

A dedicated podcast player for all 360 episodes of Harmontown, designed specifically for nightly sleep listening with gamification elements.

## Key Features

- **Prestige System**: Complete all 360 episodes chronologically to earn prestige levels
- **Brutalist Design**: Monochrome aesthetic with no colors, gradients, or unnecessary animations
- **Sleep-Optimized**: Designed for half-asleep operation with thumb-first navigation
- **Episode Tracking**: 85% completion rule with persistent progress tracking
- **Smart Shuffle**: Randomize only unplayed episodes from current prestige level

## Core Mechanics

### The Prestige System
- Start at Episode 1, work through all 360 episodes chronologically
- Episodes marked complete at 85% playback
- Completing all episodes = 1 Prestige level
- Prestige counter permanently displayed
- Episodes reset to unplayed upon prestiging

### UI/UX Principles
- **Brutalist Aesthetic**: Black background, white text, system fonts only
- **Thumb-First Design**: All primary actions reachable with right thumb
- **Information Hierarchy**: Episode number > Date > Comptroller
- **Minimal Animations**: Nothing over 0.2 seconds duration

## Technical Stack

- **Platform**: iOS (Swift/SwiftUI)
- **Audio**: AVFoundation with background playback support
- **Storage**: Core Data for play history and progress tracking
- **Integrations**: Transcript search API, global stats tracking

## Unique Features

- **Vodka Bottle Clicker**: Cookie-clicker style mini-game in credits
- **TownTuner Wrapped**: Annual stats with both legitimate and satirical metrics
- **Guest Search**: Quick access to episodes by frequent guests
- **Lifetime History**: Every play session logged with timestamps

The app embodies the philosophy of "would I use this at 2 AM with a cat on my chest?" - optimizing for barely conscious operation while maintaining meaningful engagement through the prestige system.