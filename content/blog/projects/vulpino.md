---
title: "Vulpino"
date: 2026-01-10T00:00:00-05:00
category: "Tools"
featured: false
url: https://github.com/ejfox/vulpino
tech: ["Swift"]
state: deployed
ai-involvement: ai-assisted
tags:
  - tools
---

Any JSON endpoint into a home-screen iOS widget, no code, in about a minute

I have data scattered across a dozen endpoints — analytics, servers, side projects, my own life. Vulpino is the fox that eats all of it and puts one clean number on my home screen. You paste a URL, it fetches the JSON and shows you the whole tree, you tap the values you care about, you pick a template, and you're done. Five taps: URL, data, template, customize, deploy. The whole thing is native SwiftUI and it works at all three widget sizes.

The part I care most about is what it *doesn't* let you do. There's no font picker, no color wheel, no padding slider. You get seven typographic templates — Mono Stat for a single hero number, Dual Stat to compare two, Stat Stack for a little dashboard, plus Headline, List, Grid, and Timestamp — and every one of them is already designed. That's the whole idea behind the vulpes family: the constraint is the product. Vulpino dice no to customization theater, and the widgets look good because I made the decisions instead of pushing them onto you at 11pm when you just want to see your visitor count.

It's real infrastructure too, not a toy. API keys and auth headers live in the Keychain, not in some plist. Data is cached offline so the widget still shows the last good value with a stale indicator when the network's down, and tapping a widget deep-links straight into whatever URL you set or back into the app to edit it. Built with a lot of AI pairing — I was the one saying no to features, the model helped me build the ones that survived.

![The widget editor — a SwiftUI step flow from URL to data to template to customize](https://res.cloudinary.com/ejf/image/upload/projects/vulpino/code.png)

![The typographic design system behind the widgets — opinionated, minimal, restrained](https://res.cloudinary.com/ejf/image/upload/projects/vulpino/code2.png)

Running on device: the widget list, pasting a live JSON endpoint, and the tree Vulpino builds from the response so you can tap the values you want.

![The app's home — your widgets live here; a new one is sixty seconds away](https://res.cloudinary.com/ejf/image/upload/projects/vulpino/app-home.png)

![Paste any endpoint and Vulpino validates it live before it fetches](https://res.cloudinary.com/ejf/image/upload/projects/vulpino/app-fetch.png)

![Vulpino fetches the JSON and lays the whole response out as a tree — tap the values you care about](https://res.cloudinary.com/ejf/image/upload/projects/vulpino/app-tree.png)
