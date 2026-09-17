---
title: "paperclip"
draft: true
date: 2025-11-01T00:00:00-05:00
category: "Apps"
featured: false
tech: ["Swift", "SwiftUI", "Kotlin", "Jetpack Compose", "Supabase"]
state: deployed
ai-involvement: ai-assisted
tags:
  - ios
  - android
  - app
  - social
---

No chat. Just vibes.

paperclip is a friends-only presence app: you broadcast your vibe with a single emoji and that's the whole thing. There's no feed to scroll, no chat thread, no likes or follower counts or read receipts — none of the machinery that turns "how are my friends doing" into a job. You pick an emoji, your friends see it, and when theirs changes you can get a quiet notification. That's it. I wanted the ambient warmth of knowing what your people are feeling without any of the pressure to perform or respond.

It's built native on both platforms — SwiftUI on iOS, Jetpack Compose on Android — over a shared Supabase backend that syncs in real time, so an emoji you set on your iPhone shows up on your friend's Android in seconds. It's monochrome on purpose: the only color on the screen is the emoji itself, which is exactly where I want your eye to go. Friends join by invite code, there's no public anything, and I built the boring-but-real parts too — push notifications with mute and quiet hours, block/report and account deletion for the App Store, a Cloudflare Worker proxy, even a Discord bot that mirrors your friends' emoji board into a server and Siri Shortcuts so you can set your vibe by voice.

I built it with AI help (Claude), which is how one person ships two native apps and a backend at all — but the shape of it, the ruthless subtraction, the decision that the anti-social-network should feel like a piece of paper and not a dashboard, that's mine. Deliberately styled to lean Apple, not startup. Just pushing it steadily forward like a boss.

![paperclip — one-emoji friends-only presence](https://res.cloudinary.com/ejf/image/upload/v1780065877/projects/paperclip/promo.png)

![A friend's contact card — pinned emoji, notifications, and a scrolling emoji history](https://res.cloudinary.com/ejf/image/upload/projects/paperclip/contact.png)
