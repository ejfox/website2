---
title: "Connectology"
date: 2026-03-01
category: "Data Visualization"
featured: true
url: https://connectology.room302.studio/
tech: ["Nuxt 3", "Vue 3", "D3", "graphology", "SQLite", "Clerk"]
state: deployed
ai-involvement: ai-assisted
context: collaborative
tags:
  - dataviz
  - network
  - web
---

Connectology is for me — a custom front-end replacement for Gephi or a raw D3 force layout: build graphs of nodes and links, then analyze the resulting structure with force-directed layout and graph metrics. The v2 rebuild adds AI-powered node generation and multiple import formats (Obsidian, Mermaid, CSV).

Here's the kind of thing it's for. The other day I had a pretty cool idea — I figured I'd put 60 minutes on the clock and give it a shot. I wanted the robot to read all of the articles and bookmarks I've made in the past 10 years — there's over 3,000 of them — and make a huge knowledge graph of the connections between all of the entities in everything I've ever read. I built a little scraper that extracts relationships from the text of an article, and made a huge database of nodes and edges: who influences who, who is associated with who, what movements and philosophies and schools of thought different people come from. That's not always explicitly stated in the text you're reading — it's part of critical thinking, keeping in your mind what a source's worldview is — and this is an attempt at capturing that in data. Then I wanted to actually *see* them, so I pulled the table into Connectology. It didn't yet have a CSV import, so I had to build one real quick, and then there it was: 600 nodes of my mental model as a big network on the screen. You can imagine sending the robot a couple degrees of that network to inform its responses. But I just wanted to see a cool graph, I'm going to be honest, and I did it in an hour.

That session is on YouTube: [Turning My Bookmarks Into A Knowledge Graph](https://www.youtube.com/watch?v=kHknnQbIoQU).

![The force layout re-distributing a funding network — scatter, settle, repeat](https://res.cloudinary.com/ejf/video/upload/projects/connectology/force-demo.mp4)

![The editor: force controls, WebGL rendering, and a network of nodes mid-layout](https://res.cloudinary.com/ejf/image/upload/projects/connectology/editor.png)

![Your networks — the home shelf with live previews of each graph](https://res.cloudinary.com/ejf/image/upload/projects/connectology/networks-home.png)
