---
dek: In which the author rescues his most precious digital media from a server that he does not own or control
inprogress: true
tags:
  - data
  - photos
  - tauri
  - photography
  - personal
date: 2025-08-28T16:05:43-04:00
modified: 2025-08-28T16:12:25-04:00
---

## Panic-Driven Development: Building A Tool To Back Up My Photos From Cloudinary

“Your cloudinary account is due for cancellation” the email said. “That’s bad,” I thought, sipping my morning espresso, about to head off for vacation. I’ve spent the past year orchestrating a series of systems to store my photographs, screenshots, and media through Cloudinary. But what I hadn’t done, I suddenly realized, was build a way to back up my photos from Cloudinary onto an external hard drive. I always knew I could, that it was *technically* possible, but I hadn’t actually, you know, done it.

The paranoia hit immediately. A year of digital memories, screenshots of brilliant tweets, photos of questionable life choices—all sitting in someone else’s data center, about to vanish like the brilliant insights of last night’s trip.

So it was time to [../robots/building-tools-for-yourself|whip up a little ap](../robots/building-tools-for-yourself|whip-up-a-little-ap)p]]. Fast.

### The Stack

No time for my usual Vue/Nuxt comfort zone. This beast needed filesystem muscles and the kind of parallel processing that makes CPUs sweat. No time for slow-ass Electron. I went with Tauri—Rust backend, web frontend, no Chrome bloat. I’d used it before to generate EXIF-annotated jpegs for low-cost physical printing (I like to edit and organize my photos analog), so at least some of the learning curve was dulled, and of course Claude Code was writing most of it anyway.

The requirements were simple:

- Rip everything from Cloudinary’s API
- Handle their rate limits without exploding
- Handle hiccups in network connections and resume incomplete downloads
- Actually work while I’m three spliffs in on a beach

### Racing the Clock (And Rate Limits)

The scope of this endeavor hit me like a bug at sixty: I had over 3,000 photos in my library. With Cloudinary’s rate limits, this wasn’t a quick script—this was an hour-plus operation that could die at any moment.

Our main problem: resumability. When my download crashes at photo 2,847, I don’t want to start from zero. I needed to cache the initial scan from the Clouindary API—that precious JSON manifest of every filename Cloudinary was willing to admit existed. Cache the list, track what’s downloaded, resume from where we left off. Great.

### Owning my own data

What happens when AWS decides your use case isn’t profitable? When Google kills another service? When some startup gets acqui-hired and your data becomes “legacy”? When you can't afford to pay $100 this month to host your photos?

The backup tool worked—my anxiety laid to rest, digital life preserved. But it was a wake-up call. I am glad how easy it was to conjure my backups into existence. But it was *almost* too late.

### The Aftermath: A Digital Hymn

And there they sit now, inside a drive humming silently on my desk, warm to the touch, containing the [../robots/quantified-self-as-archaeology|digital archaeolog](../robots/quantified-self-as-archaeology|digital-archaeolog)y]] of my existence. Three thousand plus images: screenshots of conversations that made me laugh, photos of sunsets that stopped me mid-stride, documentation of code that actually worked on the first try.

Cloudinary, bless their well-documented souls, made this possible with an API that didn’t fight me. Clean endpoints, sensible rate limits, pagination that actually works. In a world of hostile APIs and developer contempt, they built something that works. For this small mercy, I am grateful.

My drive now contains everything: the accidental art of UI glitches, debugging sessions, error messages that taught me something new. Each file a breadcrumb in the trail of becoming the person I am today.

Pay attention to your digital life, friends. Notice what you’re creating, cherish what you’re recording, and always—always—know where your most treasured bytes live when the lights go out.