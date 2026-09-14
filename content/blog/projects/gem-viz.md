---
title: "Global Energy Ownership Tracker"
date: 2026-05-01T00:00:00-04:00
category: "Dataviz"
featured: true
draft: true
tech: ["D3.js", "Network Analysis", "Data Visualization"]
state: deployed
ai-involvement: ai-assisted
context: client
url: https://globalenergymonitor.org/projects/global-energy-ownership-tracker
tags:
  - dataviz
  - network
  - energy
  - climate
---

[Global Energy Monitor's Ownership Tracker](https://globalenergymonitor.org/projects/global-energy-ownership-tracker) is a giant network: thousands of owners — governments, corporations, private equity firms, and the intermediaries between them — connected to tens of thousands of energy-related assets around the world. It's a rich dataset that had been genuinely hard to explore, so we built a set of tools to open it up. You can trace the full ownership chain behind a single project (down to the stakes held by the likes of BlackRock and EDF), see the whole energy-asset portfolio connected to one owner, and screen owners by what they actually own — coal-based steel plants, proposed mines in BRICS countries, captive gas plants for data centers.

It's built for the digging: investigating a corporation's clean-energy claims, following investment patterns, or tracing who ultimately owns a piece of the world's energy infrastructure. The ownership chain is where a lot of the truth is.

I collaborated on viz prototyping and front-end development, working with Stephen Osserman and Anna Mowat at Global Energy Monitor, Third Bear Solutions on the underlying data pipeline, and Nadieh Bremer on vis design.

![The live tool — the whole Global Energy Monitor database, 50,223 assets across 194 countries](https://res.cloudinary.com/ejf/image/upload/projects/gem-viz/live-map.png)

![Owners of the Sines power station, traced live: the coal plant up through EDP to China Three Gorges (22.2%), BlackRock (8.4%), and the Vanguard Group — pie-nodes colored by headquarters country](https://res.cloudinary.com/ejf/image/upload/projects/gem-viz/owners-live.png)

![The screener — pick an asset class (coal plants, captive gas plants for data centers, proposed mines in BRICS countries) and find exactly who owns it](https://res.cloudinary.com/ejf/image/upload/projects/gem-viz/screener.png)

![Ownership network for the Sines power station](https://res.cloudinary.com/ejf/image/upload/projects/gem-viz/sines.png)

![Every energy asset in the Global Energy Monitor database, mapped](https://res.cloudinary.com/ejf/image/upload/projects/gem-viz/worldmap.png)

![Tracing a power station up to Bank of America](https://res.cloudinary.com/ejf/image/upload/projects/gem-viz/drax.png)

![An asset's corporate ownership graph](https://res.cloudinary.com/ejf/image/upload/projects/gem-viz/network.png)

![Drilling into the owners of a binational pipeline](https://res.cloudinary.com/ejf/image/upload/projects/gem-viz/owners.png)
