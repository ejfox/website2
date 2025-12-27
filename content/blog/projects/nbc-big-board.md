---
title: NBC News Big Board
date: 2016-11-08T00:00:00-05:00
modified: 2025-08-13T12:24:29-04:00
tech: ['D3.js', 'JavaScript', 'HTML5', 'Touch Interface', 'Election Data', 'Chrome Kiosk']
featured: true
state: deployed
aiInvolvement: human-only
industry: ['Broadcast Media', 'Elections']
client: NBC News / MSNBC
tags:
  - d3
  - dataviz
  - javascript
  - elections
---

## The Challenge

NBC News needed a way for anchors to explore election results live on air—zooming into counties, comparing historical data, and explaining vote margins in real-time. The existing tools couldn't handle the speed and flexibility required for live broadcast.

## What I Built

I proposed and led development of the Big Board—the touchscreen election visualization system Steve Kornacki uses on MSNBC. Built entirely with web technologies (HTML, CSS, JavaScript, D3), which [NBC believes was an industry first](https://www.newscaststudio.com/2018/11/05/nbc-big-board-update/) for broadcast election graphics.

**Key capabilities:**
- Multi-touch zoom to view any district, no matter how small
- Historical data for any race in the past decade
- Real-time data integration with election feeds
- Smooth enough for live TV (no lag, no crashes)

## Technical Details

The system runs as an HTML5 web app in Chrome kiosk mode on a commodity gaming PC (Intel i7, ATI Radeon GPU), paired with large Planar touchscreen displays. D3.js handles all visualizations and animations.

Same codebase works on-air and embedded on NBC's web properties.

## Results

- **19M+ viewers** on election night 2018
- **Zero crashes** across multiple election cycles
- Featured in [The New York Times](https://www.nytimes.com): "A newly juiced-up model of the board that can zoom in on the most obscure House districts"
- [Vulture](https://www.vulture.com): "Kornacki, eli5-ing races with sleeves rolled up and an 82-inch vertical touchscreen... looked amazing with the board, panning and zooming"

[2016 NBC News County-Level Election Maps](https://www.youtube.com/watch?v=p4KIMQsVkt8)

![https://res.cloudinary.com/ejf/image/upload/v1755101296/IMG_5294_dpmmkr.jpg](https://res.cloudinary.com/ejf/image/upload/v1755101296/IMG_5294_dpmmkr.jpg)

![https://res.cloudinary.com/ejf/image/upload/v1755101273/IMG_6264_ubgaak.jpg](https://res.cloudinary.com/ejf/image/upload/v1755101273/IMG_6264_ubgaak.jpg)

![https://res.cloudinary.com/ejf/image/upload/v1755101285/IMG_5444_mn2u7z.jpg](https://res.cloudinary.com/ejf/image/upload/v1755101285/IMG_5444_mn2u7z.jpg)
