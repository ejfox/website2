---
title: "Scrapbook Core"
date: 2026-05-05T00:00:00-05:00
category: "Tools & Terminal"
featured: true
url: https://github.com/ejfox/scrapbook-core
tech: ["JavaScript"]
state: deployed
ai-involvement: ai-assisted
tags:
  - tools
---

I have gotten pretty good at saving interesting things that I see on the internet. Anytime I read something I think I might want to reference, show someone, or think about later, I chuck it into my bookmarks. I've done this for over 10 years now, making little notes of my favorite things while wading through the ever-expanding deluge of "content." Now I want to take a step back and map the constellations that emerge.

![A phyllotaxis of the scrap corpus — every screenshot placed by the golden angle, the way a sunflower packs its seeds](https://res.cloudinary.com/ejf/image/upload/projects/scrapbook-core/phyllotaxis.png)

All of these things — mastodon posts, pinboard bookmarks, github activity, are.na blocks — can be thought of as various scraps of paper sitting on my desk, clipped out from some source material. But first I needed to reclaim my data from the various services in which they live. Scrapbook-core is that engine: a scraper for my Pinboard bookmarks, are.na blocks, public GitHub actions, and Mastodon posts, all coordinated in an index file that handles rate limiting, sequencing, and the CLI options, landing everything in one database — the substrate everything else ([the CLI](/projects/scrapbook-cli), [the scrollers](/projects/scrapscroller)) reads from. Every bookmark gets fetched and summarized into a standalone list of facts, tagged, embedded for similarity searching and clustering, and mined for relationships — `[Person:Stewart Brand] -[:CreatedBy]-> [Publication:Whole Earth Catalog]` — that I can easily turn into nodes and edges with some lightweight regex parsing.

![Running the scraper](https://res.cloudinary.com/ejf/video/upload/q_auto/w_768/e_loop/v1722610899/Screen_Recording_2024-08-02_at_10.59.48_AM.gif)

Even though no one will likely be using this specific tool except for me, I will be practicing a bit of self care in the form of a well-crafted tool that I can find, and most importantly, figure out how to use months or years down the line. The ability to own, possess, remix, and re-explore my own data is crucial for me to make sense of the world. It's how I access my own thoughts, understand *how* I think about things, and to find creative paths forward and decide what is worth focusing on. If I gave up those responsibilities to a faceless algorithm whose goals are quite different from my own, I would be giving up quite a lot. You are what you eat.

The full story: [My Modern Scrapbook](/blog/2024/my-modern-scrapbook).
