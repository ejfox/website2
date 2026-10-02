---
title: "Outlast"
date: 2026-05-29T00:00:00-05:00
category: "Dataviz"
featured: false
draft: true
url: https://outlastmap.com
tech: ["Nuxt 3", "DuckDB-WASM", "deck.gl", "MapLibre"]
state: deployed
ai-involvement: ai-assisted
context: client
tags:
  - tools
---

<!-- HOLD (2026-10-02): outlastmap.com is a login-gated internal client preview
     ("Credentials shared separately"); the book is due 2027. Copy below is verified
     against the repo — publish only once EJ/Eric say the site is public. -->

The companion website for Eric Markowitz's book *Outlast*: a map and database of nearly 2,000 businesses that have been operating for 100 years or more. The oldest, the Japanese temple builder Kongō Gumi, traces back to the year 578; Zildjian has been making cymbals since 1623.

The front page is a spinning globe with every business plotted. You can browse by country, founding year and ownership, or explore a semantic map that clusters businesses by what they do. Each business has its own page with related and nearby survivors, and a trip planner builds multi-day itineraries around visiting them. The whole dataset is queried right in the browser with DuckDB-WASM.

![Outlast — businesses operating for 100+ years](https://res.cloudinary.com/ejf/image/upload/projects/outlast/landing.png)

[Visit outlastmap.com →](https://outlastmap.com)
