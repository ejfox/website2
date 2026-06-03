---
title: "Climate TRACE Exploration"
date: 2024-01-01
draft: true
tech: ["SQLite", "Datasette", "SpatiaLite"]
state: deployed
aiInvolvement: human-only
tags:
  - data
  - climate
  - dataviz
---

<!-- TODO (EJ): add your voice — factual stub, not your words. Draft until ready. -->

Loaded every Climate TRACE industry emissions CSV into a single SQLite/Datasette instance with SpatiaLite. This enables arbitrary geospatial SQL, including bounding-box polygon queries across all emission assets, that the public API can't do.

![A prototype visualization built on the Climate TRACE emissions data](https://res.cloudinary.com/ejf/image/upload/projects/climate-trace/prototype.png)
