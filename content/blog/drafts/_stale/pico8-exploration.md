---
date: 2024-11-25T19:24:01-05:00
modified: 2025-08-28T18:44:49-04:00
draft: true
dek: In which we discover that creative constraints are actually creative freedom, and making games can feel more real than making websites
tags:
  - gamedev
  - creativity
  - constraints
  - pico8
---

## The Strange Magic of Making Real Tiny Video Games

There's something deeply satisfying about coding up a little game in PICO-8 and loading it onto my Miyoo Mini that I can't get from any other kind of programming. It feels like *printing* something. Like making a physical object that exists in the world, not just another ephemeral website that lives in browsers and dies when servers go down.

When I boot up that little handheld and see my game sitting there next to all the classics I played when I was eight years old—the same pixel art style, the same constrained color palette, the same immediate "press button, thing happens" feedback loop—it feels *real* in a way that deploying to Netlify never will.

I'm documenting this exploration for a few reasons:

- Because PICO-8 represents something important about creative constraints that most game development has forgotten
- To show other people with broken, overwhelmed brains how artificial limitations can actually set you free
- Because there's a specific workflow and mindset that makes this work, and I want to share the exact tools and techniques I use

### Why PICO-8 Feels Like Making Something Real

Most programming today is about managing infinite complexity. Infinite screen sizes, infinite device types, infinite frameworks, infinite deployment targets. You never know when you're done because there's always another edge case, another optimization, another platform to support.

PICO-8 is the opposite of that. It's a *fantasy console* with completely artificial limitations:

- 128x128 pixel screen
- 16 colors total
- 4-channel sound
- 32k code limit
- Built-in sprite editor, map editor, sound editor

These aren't technical limitations from 1985—they're *chosen* constraints from 2015. And somehow that makes all the difference. When you hit the code limit, you're done. When you've used all 16 colors, you're done. When the screen is 128x128, you don't have to worry about responsive design.

The limitations tell you when you're finished, which is exactly what a scattered brain like mine needs.

### The Miyoo Mini Factor: From Code to Cartridge

Here's what completes the magic: I can take that PICO-8 game, transfer it to my Miyoo Mini handheld, and suddenly it exists in the same space as Mega Man 2 and Super Mario Bros. Not metaphorically—literally sitting in the same menu, launched the same way, playing with the same physical controls.

It's like being able to print your novel and put it on the bookshelf next to Hemingway. The medium validates the work in a way that nothing else can.

The workflow is beautifully simple:

1. Code in PICO-8 (or VS Code with the PICO-8 extension)
2. Export to `.p8.png` file (yes, the game IS the image)
3. Drop it onto the Miyoo Mini's SD card
4. Boot up and play

No app stores, no certificates, no deployment pipelines. Just: make thing, play thing.

### Working Within PICO-8's Embrace

Even though you can use the VS Code extension to get modern editor features, there's something important about working *within* PICO-8's constraints rather than trying to escape them.

### The PICO-8 Development Kit I Actually Use

After trying various workflows, here's what actually works for me:

**Core tools:**
- PICO-8 itself ($15, worth every penny)
- VS Code with PICO-8 extension (syntax highlighting, better editing)
- Aseprite for more complex sprite work (though the built-in editor is often enough)

**My actual workflow:**
1. Start ideas directly in PICO-8's editors to stay constrained
2. Switch to VS Code when the code gets longer than 50 lines
3. Use PICO-8's built-in tools for all art, sound, music
4. Test constantly on the actual device—iterations are seconds, not minutes

**Miyoo Mini setup:**
- 64GB SD card with clean CFW installation
- PICO-8 games go in `/Roms/PICO` folder
- They show up automatically in the menu

### Games I've Actually Finished (And Why That Matters)

This is the crucial part: I've actually *finished* more games in PICO-8 than in any other environment. Not prototypes, not demos—complete, playable games that I'm proud to show people.

**Why finishing matters:**
- You learn what "done" feels like, whether you like it or not
- You get to partake in the full creative cycle
- You build confidence for bigger projects
- You gain respect and appreciation for the games you played as a kid
- You create something that exists independent of you

**What "finished" looks like in PICO-8:**
- Win condition and lose condition implemented
- Sound effects for all major actions
- At least 5-10 minutes of meaningful play
- Someone else can play it
- Exported as a standalone file and shared online

The constraints make finishing achievable. You can't get lost in feature creep when you literally don't have room for more features.

The goal isn't to become a game developer or make a blockbuster. The goal is to experience the joy of making something complete, constrained, and real. In a world of infinite scroll and endless updates, there's something profound about creating finite, finished things.

*If you end up making something in PICO-8, send it to me at ejfox@ejfox.com. I love seeing what people create when they embrace constraints instead of fighting them.*
