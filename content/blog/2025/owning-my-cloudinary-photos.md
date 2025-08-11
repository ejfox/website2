---
dek: In which the author rescues his most precious digital media from a server that he does not own or control
inprogress: true
tags:
  - data
  - photos
  - tauri
date: 2025-07-20T20:49:19-04:00
modified: 2025-07-28T08:57:34-04:00
---

## Panic-Driven Development: When Cloudinary Tried to Delete My Life

“Your cloudinary account is due for cancellation” the email said. “That’s bad,” I thought, sipping my morning espresso, about to head off for vacation. I’ve spent the past year orchestrating a series of systems to store my photographs, screenshots, and media through Cloudinary. But what I hadn’t done, I suddenly realized, was build a way to back up my photos from Cloudinary onto an external hard drive. I always knew I could, that it was *technically* possible, but I hadn’t actually, you know, done it.

The paranoia hit immediately. A year of digital memories, screenshots of brilliant tweets, photos of questionable life choices—all sitting in someone else’s data center, about to vanish like the brilliant insights of last night’s trip.

So it was time to whip up a little app. Fast.

### The Stack

No time for my usual Vue/Nuxt comfort zone. This beast needed filesystem muscles, API wrestling, and the kind of parallel processing that makes CPUs sweat. Enter Tauri—Rust backend, web frontend, no Chrome bloat. I’d used it before to generate EXIF-laden jpegs for CVS printing (I like to edit and organize my photos analog), so at least the learning curve wouldn’t kill me.

The requirements were simple:

- Rip everything from Cloudinary’s API
- Handle their rate limits without exploding
- Handle hiccups in network connections and resume incomplete downloads
- Actually work while I’m three spliffs in on a beach

### Racing the Clock (And Rate Limits)

The scope of my photo library hit me like a bug at sixty on the motorcycle: I had over 3,000 photos in my library. With Cloudinary’s rate limits, this wasn’t a quick script—this was an hour-plus operation that could die at any moment. The kind of job that makes you paranoid about power outages and WiFi hiccups.

First problem: resumability. When your download crashes at photo 2,847, you don’t want to start from zero. I needed to cache the initial scan—that precious JSON manifest of every filename Cloudinary was willing to admit existed. Cache the list, track what’s downloaded, resume from where you left off. Great.

Second problem: I’m lazy and Claude Code exists. Why write learn Rust when an AI can hallucinate it into existence? More than half this app was pair-programmed with a robot, which feels appropriately cyberpunk for a data liberation tool.

### Owning my own data

This wasn’t really just about Cloudinary. This was about the slow-motion car crash of my cloud dependence. We’ve all been sleepwalking into digital feudalism, trading ownership for convenience, betting our memories on the business models of Silicon Valley.

What happens when AWS decides your use case isn’t profitable? When Google kills another service? When some startup gets acqui-hired and your data becomes “legacy”?

The backup tool worked—vacation saved, digital life preserved. But it was really a wake-up call wrapped in a Rust binary. I am glad how easy it was to conjure my backups into existence. But it was almost too late.

### The Aftermath: A Digital Hymn

And there it sits now, humming quietly on my desk—a small black external drive, warm to the touch, containing the digital archaeology of my existence. Three thousand plus images: screenshots of conversations that made me laugh until I cried, photos of sunsets that stopped me mid-stride, documentation of code that actually worked on the first try.

Cloudinary, bless their well-documented souls, made this possible with an API that didn’t fight me. Clean endpoints, sensible rate limits, pagination that actually works. In a world of hostile APIs and developer contempt, they built something that works. For this small mercy, I am grateful.

My drive now contains everything: the accidental art of UI glitches, debugging sessions, error messages that taught me something new. Each file a breadcrumb in the trail of becoming the person I am today.

Pay attention to your digital life, friends. Notice what you’re creating, cherish what you’re recording, and always—always—know where your most treasured bytes live when the lights go out.