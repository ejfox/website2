---
title: NBC News Big Board
date: 2016-11-08T00:00:00-05:00
client: "NBC News"
category: "Journalism"
modified: 2025-08-13T12:24:29-04:00
tech: ["D3.js", "JavaScript", "Touch Interface", "Election Data"]
featured: true
state: deployed
ai-involvement: human-only
context: client
tags:
  - d3
  - dataviz
  - javascript
  - elections
---

It started as a prototype I made in January — a touchscreen way to explore county-level election results — that I demoed to Adam, then to Steve, then to Marc, until it got the budget and became the real thing: the "Big Board" Steve Kornacki wields on air, live, in front of ten to nineteen million people. ([NewscastStudio wrote up a later update](https://www.newscaststudio.com/2018/11/05/nbc-big-board-update/).)

Building something that gets *performed* live is the most stressful thing I've ever done — no room for error, and you hand it off to someone else on a screen you don't control. In the weeks before an election, Adam (Kornacki's producer) was texting and calling me at all hours as he did hits on Maddow and Morning Joe, and I got used to adding new scorecard filters at a moment's notice.

The workflow on election night, from my couch: edit some JSON, VPN into the NBC network, SSH into the server, `git pull` from master, `pm2 restart all`, text the producer that it's updated — then watch my change go out on air a few minutes later through Hulu. Doing that live in an emergency and seeing it on television minutes later is a pretty cool feeling.

Broadcast runs on radio frequencies, mostly silent when things go well, and you can hear things breaking all over — "the 3A wall went to black," "the rink graphics aren't loading." You keep your ears perked for your own name. You hope to god you don't hear it.

By the end it worked. A coworker told me Chuck Todd's producer said it was the first election night Chuck wasn't frustrated with the app. Steve looked amazing with it — panning, zooming, pulling up the scoreboard and the historical drawers we'd added, using motions and ways of storytelling I'd worked out months earlier, playing on TV exactly how I'd wanted them to.

The whole story — the 1AM bacon pancakes, the Montana freeze, what I learned about leading a team — is here: **[Election Night 2018 →](/blog/2022/election-night-2018)**

![The Big Board UI: 2016 Pennsylvania presidential results beside an interactive county map](https://res.cloudinary.com/ejf/image/upload/v1666630396/project-images/nbc_bigboard.png)

[2016 NBC News County-Level Election Maps](https://www.youtube.com/watch?v=p4KIMQsVkt8)

![Planning board — printed election-graphic studies and notes pinned to the wall](https://res.cloudinary.com/ejf/image/upload/v1755101296/IMG_5294_dpmmkr.jpg)

![Broadcast setup — the Big Board on a control-room monitor beside a waveform scope](https://res.cloudinary.com/ejf/image/upload/v1755101273/IMG_6264_ubgaak.jpg)

![Printed design studies for the on-air election graphics, spread across a desk](https://res.cloudinary.com/ejf/image/upload/v1755101285/IMG_5444_mn2u7z.jpg)