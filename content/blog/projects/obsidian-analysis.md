---
title: "Obsidian Analysis"
date: 2024-06-01T00:00:00-04:00
draft: true
url: https://github.com/ejfox/obsidian-analysis
tech: ["Python", "Embeddings", "UMAP", "LM Studio"]
state: deployed
aiInvolvement: ai-collaborative
tags:
  - data
  - visualization
  - ai
---

<!-- TODO (EJ): add your voice — factual stub, not your words. Draft until ready. -->

Embed an entire Obsidian vault — ~2,000 notes — with local Nomic embeddings via LM Studio, then explore the whole thing as a semantic map. Every note is a point; nearby points are related thoughts. You can search in natural language and re-color by semantics, recency, size, or link density.

![~2,000 notes embedded into a single semantic map — search and filter by SEMANTIC / TEMPORAL / SIZE / LINKS](https://res.cloudinary.com/ejf/image/upload/projects/obsidian-analysis/map.png)

UMAP has a lot of knobs, so I also built a grid that runs 64 parameter combinations side by side — a way to *see* how `n_neighbors` and `min_dist` reshape the same data.

![A 64-combination UMAP parameter grid — the same vault laid out 64 different ways](https://res.cloudinary.com/ejf/image/upload/projects/obsidian-analysis/grid.png)
